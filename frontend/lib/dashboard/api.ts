import { getApiBaseUrl } from "@/lib/api-base";

const BACKEND_BASE = getApiBaseUrl();

export type RecordsQuery = {
  type?: "INCOME" | "EXPENSE";
  category?: string;
  search?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
};

export type UpdateRecordInput = {
  amount?: string;
  type?: "INCOME" | "EXPENSE";
  category?: string;
  date?: string;
  notes?: string;
};

export async function apiRequest<T>(
  path: string,
  token: string,
  options?: RequestInit
): Promise<T> {
  const headers = new Headers(options?.headers ?? {});
  if (!headers.has("Content-Type") && options?.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token.trim()) {
    headers.set("Authorization", `Bearer ${token.trim()}`);
  }

  const response = await fetch(`${BACKEND_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers,
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      typeof data?.message === "string"
        ? data.message
        : `Request failed (${response.status})`;
    throw new Error(message);
  }

  return data as T;
}

export async function getRecords<T>(token: string, query?: RecordsQuery): Promise<T> {
  const params = new URLSearchParams();
  if (query?.type) {
    params.set("type", query.type);
  }
  if (query?.category?.trim()) {
    params.set("category", query.category.trim());
  }
  if (query?.search?.trim()) {
    params.set("search", query.search.trim());
  }
  if (query?.from?.trim()) {
    params.set("from", query.from.trim());
  }
  if (query?.to?.trim()) {
    params.set("to", query.to.trim());
  }
  if (typeof query?.page === "number") {
    params.set("page", String(query.page));
  }
  if (typeof query?.limit === "number") {
    params.set("limit", String(query.limit));
  }

  const suffix = params.toString() ? `?${params.toString()}` : "";
  return apiRequest<T>(`/api/records${suffix}`, token);
}

export async function updateRecord<T>(
  token: string,
  recordId: string,
  payload: UpdateRecordInput
): Promise<T> {
  return apiRequest<T>(`/api/records/${recordId}`, token, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteRecord<T>(token: string, recordId: string): Promise<T> {
  return apiRequest<T>(`/api/records/${recordId}`, token, {
    method: "DELETE",
  });
}
