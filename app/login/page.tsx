"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/Card";
import { useToast } from "@/components/ToastContext";

export default function LoginPage() {
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [apiError, setApiError] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");
    const nextErrors: typeof errors = {};
    if (!email) nextErrors.email = "Email is required.";
    if (!password) nextErrors.password = "Password is required.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || "Login failed. Please try again.";
        setApiError(errorMessage);
        showToast(errorMessage);
        setLoading(false);
        return;
      }
      
      setApiError("");

      // Store access token and user info
      localStorage.setItem("shikshanetra_token", data.accessToken);
      localStorage.setItem("shikshanetra_user", JSON.stringify(data.user));
      localStorage.setItem("shikshanetra_logged_in", "true");

      showToast("Login successful! Redirecting...");
      
      // Redirect to dashboard page
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
    } catch (error) {
      console.error("Login error:", error);
      showToast("❌ An error occurred during login");
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-140px)] max-w-md items-center px-4 py-10">
      <div className="w-full">
        <div className="flex items-center justify-center">
          <Card className="relative w-full overflow-hidden border-slate-200 bg-gradient-to-br from-white to-primary-50/20 p-8 shadow-xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(20,184,166,0.05),transparent_70%)]" />
            <div className="relative">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
                <p className="mt-2 text-sm text-slate-600">
                  Log in to access your dashboard
                </p>
              </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {apiError && (
                <div className="rounded-lg border-2 border-red-300 bg-red-50 p-3">
                  <p className="text-sm font-semibold text-red-800">{apiError}</p>
                </div>
              )}
              <div className="space-y-1.5 text-sm">
                <label className="block text-xs font-medium text-slate-700">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                />
                {errors.email && (
                  <p className="text-[11px] font-medium text-red-700">{errors.email}</p>
                )}
              </div>
              <div className="space-y-1.5 text-sm">
                <label className="block text-xs font-medium text-slate-700">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                />
                {errors.password && (
                  <p className="text-[11px] font-medium text-red-700">{errors.password}</p>
                )}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-600">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span>Remember me</span>
                </label>
              </div>
              <button 
                type="submit" 
                className="btn-primary w-full text-sm" 
                disabled={loading}
              >
                {loading ? "Logging in..." : "Log In"}
              </button>
            </form>
            <p className="mt-6 text-center text-xs text-slate-600">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="font-semibold text-primary-700 hover:underline">
                Sign up
              </Link>
            </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}


