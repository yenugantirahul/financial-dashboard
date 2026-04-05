"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { getStoredSession, setStoredSession } from "@/lib/auth/session";
import { Role, Status } from "@/lib/dashboard/types";

type Mode = "login" | "signup";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Sign in to continue");

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  const [signupForm, setSignupForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "VIEWER" as Role,
    status: "ACTIVE" as Status,
  });

  useEffect(() => {
    const session = getStoredSession();
    if (session?.token) {
      router.replace("/dashboard");
    }
  }, [router]);

  const onLogin = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setStatus("Signing in....");
    try {
      const response = await authClient.signIn.email({
        email: loginForm.email,
        password: loginForm.password,
      });

      if (response.error) {
        throw new Error(response.error.message ?? "Login failed");
      }

      if (!response.data?.user) {
        throw new Error("Authentication response missing user data.");
      }

      const user = response.data.user;
      setStoredSession({
        token: response.data.token ?? "__cookie_session__",
        user: {
          id: String(user.id),
          name: String(user.name ?? ""),
          email: String(user.email),
          role: (user.role ?? "VIEWER") as Role,
          status: (user.status ?? "ACTIVE") as Status,
        },
      });
      setStatus("Login successful, redirecting...");
      router.replace("/dashboard");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to login");
    } finally {
      setLoading(false);
    }
  };

  const onSignup = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setStatus("Creating account...");
    try {
      const response = await authClient.signUp.email({
        name: signupForm.name,
        email: signupForm.email,
        password: signupForm.password,
        role: signupForm.role,
        status: signupForm.status,
      });

      if (response.error) {
        throw new Error(response.error.message ?? "Signup failed");
      }

      if (!response.data?.user) {
        throw new Error("Authentication response missing user data.");
      }

      const user = response.data.user;
      setStoredSession({
        token: response.data.token ?? "__cookie_session__",
        user: {
          id: String(user.id),
          name: String(user.name ?? ""),
          email: String(user.email),
          role: (user.role ?? "VIEWER") as Role,
          status: (user.status ?? "ACTIVE") as Status,
        },
      });
      setStatus("Signup successful, redirecting...");
      router.replace("/dashboard");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to signup");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 items-center p-4 md:p-8">
      <section className="glass grid w-full overflow-hidden md:grid-cols-2">
        <aside className="relative p-6 md:p-8">
          <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-(--accent)/20 blur-2xl" />
          <p className="text-xs font-mono uppercase tracking-[0.24em] muted">
            Zorvyn Finance
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Secure Access Portal</h1>
          <p className="mt-3 muted">
            Create your account or login before entering the operational
            dashboard.
          </p>
          <div className="mt-8 flex gap-2">
            <button
              className={`btn ${mode === "login" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setMode("login")}
              type="button"
            >
              Login
            </button>
            <button
              className={`btn ${mode === "signup" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setMode("signup")}
              type="button"
            >
              Signup
            </button>
          </div>
          <p className="mt-4 text-sm muted">{status}</p>
        </aside>

        <div className="border-l border-black/10 p-6 md:p-8">
          {mode === "login" ? (
            <form className="space-y-3" onSubmit={onLogin}>
              <h2 className="text-xl font-semibold">Login</h2>
              <input
                className="field w-full"
                type="email"
                placeholder="Email"
                value={loginForm.email}
                onChange={(e) =>
                  setLoginForm((prev) => ({ ...prev, email: e.target.value }))
                }
                required
              />
              <input
                className="field w-full"
                type="password"
                placeholder="Password"
                minLength={8}
                value={loginForm.password}
                onChange={(e) =>
                  setLoginForm((prev) => ({
                    ...prev,
                    password: e.target.value,
                  }))
                }
                required
              />
              <button className="btn btn-primary w-full" disabled={loading}>
                Login and Continue
              </button>
            </form>
          ) : (
            <form className="space-y-3" onSubmit={onSignup}>
              <h2 className="text-xl font-semibold">Signup</h2>
              <input
                className="field w-full"
                placeholder="Full Name"
                value={signupForm.name}
                onChange={(e) =>
                  setSignupForm((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />
              <input
                className="field w-full"
                type="email"
                placeholder="Email"
                value={signupForm.email}
                onChange={(e) =>
                  setSignupForm((prev) => ({ ...prev, email: e.target.value }))
                }
                required
              />
              <input
                className="field w-full"
                type="password"
                placeholder="Password"
                minLength={8}
                value={signupForm.password}
                onChange={(e) =>
                  setSignupForm((prev) => ({
                    ...prev,
                    password: e.target.value,
                  }))
                }
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  className="field"
                  value={signupForm.role}
                  onChange={(e) =>
                    setSignupForm((prev) => ({
                      ...prev,
                      role: e.target.value as Role,
                    }))
                  }
                >
                  <option value="ADMIN">ADMIN</option>
                  <option value="ANALYST">ANALYST</option>
                  <option value="VIEWER">VIEWER</option>
                </select>
                <select
                  className="field"
                  value={signupForm.status}
                  onChange={(e) =>
                    setSignupForm((prev) => ({
                      ...prev,
                      status: e.target.value as Status,
                    }))
                  }
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
              <button className="btn btn-accent w-full" disabled={loading}>
                Signup and Continue
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
