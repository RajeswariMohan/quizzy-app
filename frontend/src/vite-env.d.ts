/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_SUPPORT_EMAIL?: string;
  readonly VITE_SUPPORT_URL?: string;
  readonly VITE_TERMS_URL?: string;
  readonly VITE_PRIVACY_URL?: string;
  readonly VITE_DEMO_VIDEO_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
