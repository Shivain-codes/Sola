// Local dev server for the generatePlan Lambda — NOT deployed. Lets the web app
// hit the real handler at http://localhost:8787 during development/testing.
// Set SOLA_FORCE_FALLBACK=1 to simulate Bedrock being unreachable.
import { createServer } from "node:http";
import { handler } from "./index.mjs";

if (process.env.SOLA_FORCE_FALLBACK === "1") {
  // Break Bedrock so the handler's catch path runs the fallback.
  process.env.AWS_REGION = "us-gov-west-1";
  process.env.AWS_ACCESS_KEY_ID = "bogus";
  process.env.AWS_SECRET_ACCESS_KEY = "bogus";
}

const PORT = Number(process.env.PORT || 8787);

createServer(async (req, res) => {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const body = Buffer.concat(chunks).toString("utf8");

  const event = {
    requestContext: { http: { method: req.method } },
    body,
  };
  const result = await handler(event);
  res.writeHead(result.statusCode, result.headers);
  res.end(result.body);
}).listen(PORT, () => {
  console.log(`generatePlan local server on http://localhost:${PORT}`);
});
