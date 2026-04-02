import { AuthResponse } from "@/lib/auth/types";
import { authClient } from "@/lib/auth/client";

const normalizeUser = (user: any): AuthResponse["user"] => ({
  id: String(user.id),
  name: String(user.name ?? ""),
  email: String(user.email),
  role: (user.role ?? "VIEWER") as AuthResponse["user"]["role"],
  status: (user.status ?? "ACTIVE") as AuthResponse["user"]["status"],
});

export function signUpEmail(input: {
  name: string;
  email: string;
  password: string;
  role: "ADMIN" | "ANALYST" | "VIEWER";
  status: "ACTIVE" | "INACTIVE";
}): Promise<AuthResponse> {
  return authClient.signUp
    .email(input)
    .then((response: any) => {
      if (response?.error) {
        throw new Error(response.error.message ?? "Signup failed");
      }

      if (!response?.data?.user) {
        throw new Error("Authentication response missing user");
      }

      return {
        token: response.data.token ?? "__cookie_session__",
        user: normalizeUser(response.data.user),
      };
    });
}

export function signInEmail(input: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  return authClient.signIn
    .email(input)
    .then((response: any) => {
      if (response?.error) {
        throw new Error(response.error.message ?? "Login failed");
      }

      if (!response?.data?.user) {
        throw new Error("Authentication response missing user");
      }

      return {
        token: response.data.token ?? "__cookie_session__",
        user: normalizeUser(response.data.user),
      };
    });
}
