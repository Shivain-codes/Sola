# Deploy Sola

Two pieces: the **Lambda** (backend, Bedrock) and **Amplify Hosting** (frontend,
auto-deploy on push). Do the Lambda first so you have the Function URL to feed
into Amplify.

Prereqs: AWS account with Bedrock **Nova Lite** (`amazon.nova-lite-v1:0`) access
enabled, AWS CLI logged in (`aws sts get-caller-identity` works), a GitHub repo.

---

## 1. Deploy the Lambda + Function URL

### 1a. Create the function (Node 20)

```bash
cd lambda/generatePlan
npm ci --omit=dev            # installs @aws-sdk/client-bedrock-runtime
zip -r ../generatePlan.zip index.mjs package.json node_modules
```

Create an execution role that can invoke Bedrock, then the function:

```bash
# role (once)
aws iam create-role --role-name sola-generatePlan-role \
  --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"lambda.amazonaws.com"},"Action":"sts:AssumeRole"}]}'

aws iam attach-role-policy --role-name sola-generatePlan-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

aws iam put-role-policy --role-name sola-generatePlan-role \
  --policy-name bedrock-invoke \
  --policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Action":"bedrock:InvokeModel","Resource":"arn:aws:bedrock:*::foundation-model/amazon.nova-lite-v1:0"}]}'

# function (use a region where you have Nova Lite access, e.g. us-east-1)
ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
aws lambda create-function \
  --function-name sola-generatePlan \
  --runtime nodejs20.x \
  --handler index.handler \
  --timeout 20 \
  --memory-size 256 \
  --role arn:aws:iam::$ACCOUNT:role/sola-generatePlan-role \
  --zip-file fileb://../generatePlan.zip \
  --region us-east-1
```

### 1b. Add a Function URL with open CORS

```bash
aws lambda create-function-url-config \
  --function-name sola-generatePlan \
  --auth-type NONE \
  --cors '{"AllowOrigins":["*"],"AllowMethods":["POST","OPTIONS"],"AllowHeaders":["content-type"]}' \
  --region us-east-1

aws lambda add-permission \
  --function-name sola-generatePlan \
  --statement-id FunctionURLAllowPublicAccess \
  --action lambda:InvokeFunctionUrl \
  --principal "*" \
  --function-url-auth-type NONE \
  --region us-east-1

# grab the URL — this is your VITE_PLAN_URL
aws lambda get-function-url-config --function-name sola-generatePlan \
  --region us-east-1 --query FunctionUrl --output text
```

### 1c. Smoke-test the deployed URL

```bash
curl -s -X POST "<FUNCTION_URL>" -H "Content-Type: application/json" -d '{
  "city":"Delhi","jobType":"Construction worker","shiftStart":"09:00","shiftEnd":"17:00",
  "hourly":[{"hour":12,"tempC":36,"humidity":45,"heatIndexC":43,"band":"Danger"}]
}'
# expect: {"plan":{...},"source":"ai"}
```

To redeploy after a code change: re-zip and
`aws lambda update-function-code --function-name sola-generatePlan --zip-file fileb://../generatePlan.zip --region us-east-1`.

---

## 2. Amplify Hosting (auto-deploy on push)

1. Push this repo to GitHub (public):
   ```bash
   git init && git add . && git commit -m "Sola"
   git branch -M main
   git remote add origin https://github.com/<you>/sola.git
   git push -u origin main
   ```
2. AWS Console → **Amplify** → **New app → Host web app** → **GitHub** →
   authorize → pick the `sola` repo and `main` branch.
3. Amplify auto-detects `amplify.yml` (app root `web/`, build `npm run build`,
   artifacts `dist`). Accept it.
4. **Environment variables** → add
   `VITE_PLAN_URL = <FUNCTION_URL from step 1b>`.
   (Vite inlines `VITE_*` vars at build time, so this must be set before the build.)
5. Save and deploy. Every `git push` to `main` now auto-deploys.

The live URL looks like `https://main.xxxxxxxx.amplifyapp.com`.

### Verify (the acceptance test)

Open the Amplify URL on a phone-width viewport, enter a city + shift, tap
**Get my safety plan**. Confirm in DevTools → Network that the POST goes to the
`*.execute-api.us-east-1.amazonaws.com` endpoint (not localhost) and returns a plan.

---

## Deployed resources (account 606163771924, us-east-1)

Created and verified by the CLI deploy:

| Resource         | Value                                                                     |
| ---------------- | ------------------------------------------------------------------------- |
| Lambda           | `sola-generatePlan` (nodejs20.x, 256MB, 20s) — **Active**                 |
| Role             | `sola-generatePlan-role` (+ `bedrock-invoke` inline, basic-exec)          |
| **Public API**   | **`https://3xtaakxjv1.execute-api.us-east-1.amazonaws.com`** ← VITE_PLAN_URL |
| (unused) Fn URL  | `https://n2zxccywjvfgpbdtcq23ti6imu0pmwsr.lambda-url.us-east-1.on.aws/` (403, see below) |

**The public endpoint to use is the API Gateway URL above.** A browser POST to it
returns a real Bedrock Nova Lite plan (`200`, `source: "ai"`), with CORS
preflight (OPTIONS → 204). Verified end-to-end from a real browser.

### Why API Gateway instead of the Lambda Function URL

The Lambda works, but its **Function URL returns 403** on public POST — an
account-level guardrail blocks unauthenticated (`AuthType: NONE`) Function URLs
in this account (no Org/SCP, no permissions boundary; requests never reach the
function). The fix was to front the same Lambda with an **HTTP API** (public by
default), which was created via CLI:

```bash
# HTTP API with Lambda proxy + CORS (quick-create)
aws apigatewayv2 create-api --name sola-plan-api --protocol-type HTTP \
  --target "arn:aws:lambda:us-east-1:606163771924:function:sola-generatePlan" \
  --cors-configuration AllowOrigins="*",AllowMethods="POST,OPTIONS",AllowHeaders="content-type" \
  --region us-east-1
# grant invoke permission (ApiId from the output above)
aws lambda add-permission --function-name sola-generatePlan \
  --statement-id apigw-sola-plan-api --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:us-east-1:606163771924:<ApiId>/*/*" \
  --region us-east-1
```

Set `VITE_PLAN_URL` to the API endpoint in Amplify and deploy the frontend
(step 2).

## Notes

- Backend = Lambda + API Gateway HTTP API. No auth, no DB.
- If Bedrock is throttled or access isn't enabled, the Lambda returns a
  deterministic fallback plan (`source: "fallback"`) so the UI never breaks.
- `web/.env.local` (gitignored) is for local dev only; production uses the
  Amplify env var.
