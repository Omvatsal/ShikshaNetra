"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/Card";
import { useToast } from "@/components/ToastContext";

export default function SignupPage() {
  const { showToast } = useToast();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Mentor");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    role?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [apiError, setApiError] = useState<string>("");

  useEffect(() => {
    // Redirect if already logged in
    const token = localStorage.getItem("shikshanetra_token");
    const loggedIn = localStorage.getItem("shikshanetra_logged_in") === "true";
    if (token || loggedIn) {
      router.push("/dashboard");
    }
  }, [router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");
    const nextErrors: typeof errors = {};
    if (!fullName) nextErrors.fullName = "Full name is required.";
    if (!email) nextErrors.email = "Email is required.";
    if (!role) nextErrors.role = "Role is required.";
    if (!password) nextErrors.password = "Password is required.";
    if (!confirmPassword) nextErrors.confirmPassword = "Confirm your password.";
    if (password && confirmPassword && password !== confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    // TODO: Replace demo signup with real signup API call and persistence
    localStorage.setItem("shikshanetra_logged_in", "true");
    localStorage.setItem("shikshanetra_token", "demo_token");
    showToast("Account created successfully! Redirecting...");
    setTimeout(() => {
      router.push("/dashboard");
    }, 1000);
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-140px)] max-w-md items-center px-4 py-10">
      <div className="w-full">
        <div className="flex items-center justify-center">
          <Card className="relative w-full overflow-hidden border-slate-200 bg-gradient-to-br from-white to-primary-50/20 p-8 shadow-xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(20,184,166,0.05),transparent_70%)]" />
            <div className="relative">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-slate-900">
                  Create your account
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                  Get started with ShikshaNetra today
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
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                />
                {errors.fullName && (
                  <p className="text-[11px] font-medium text-red-700">{errors.fullName}</p>
                )}
              </div>

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
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                >
                  <option>Mentor</option>
                  <option>Coordinator</option>
                  <option>Institution Admin</option>
                  <option>Other</option>
                </select>
                {errors.role && (
                  <p className="text-[11px] font-medium text-red-700">{errors.role}</p>
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

              <div className="space-y-1.5 text-sm">
                <label className="block text-xs font-medium text-slate-700">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                />
                {errors.confirmPassword && (
                  <p className="text-[11px] font-medium text-red-700">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              <button type="submit" className="btn-primary w-full text-sm">
                Create Account
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-slate-600">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-primary-700 hover:underline">
                Log in
              </Link>
            </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}


