const DEFAULT_API_BASE = "http://localhost:5000";

export function getApiBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_BACKEND_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    DEFAULT_API_BASE
  );
}