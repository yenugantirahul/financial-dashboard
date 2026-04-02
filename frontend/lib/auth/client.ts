import { createAuthClient } from "better-auth/client";

const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000";

export const authClient = createAuthClient({
  baseURL: `${BACKEND_BASE}/api/auth`,
  fetchOptions: {
    credentials: "include",
  },
});
