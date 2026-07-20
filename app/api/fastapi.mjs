const DEFAULT_FASTAPI_BASE_URL = "http://localhost:8000";

export function resolveFastApiBaseUrl(env = process.env) {
  const configuredUrl =
    env.FASTAPI_BASE_URL || env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_FASTAPI_BASE_URL;

  return configuredUrl.replace(/\/+$/, "");
}
