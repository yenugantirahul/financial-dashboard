const DEFAULT_API_BASE = "http://localhost:5000";

function firstNonEmpty(...values: Array<string | undefined>) {
  return values.find((value) => typeof value === "string" && value.trim().length > 0);
}

export function getApiBaseUrl() {
  const rawBase =
    firstNonEmpty(
      process.env.NEXT_PUBLIC_BACKEND_URL,
      process.env.NEXT_PUBLIC_API_URL
    ) ?? DEFAULT_API_BASE;

  return rawBase.replace(/\/+$/, "");
}