/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Lambda Function URL for the generatePlan endpoint. */
  readonly VITE_PLAN_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
