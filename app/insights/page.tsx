"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { useToast } from "@/components/ToastContext";

export default function InsightsPage() {
  const { showToast } = useToast();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("shikshanetra_token");
    const loggedIn = localStorage.getItem("shikshanetra_logged_in") === "true";
    
    if (!token && !loggedIn) {
      showToast("Please login to view insights");
      router.push("/login");
      return;
    }
    
    setIsAuthenticated(true);
    setLoading(false);
  }, [router, showToast]);

  if (loading || !isAuthenticated) {
    return (
      <div className="mx-auto max-w-6xl px-4 pb-12 pt-8 sm:pt-10">
        <PageHeader
          title="Insights & Analytics"
          subtitle="Loading your insights..."
        />
        <div className="flex items-center justify-center py-12">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-12 pt-8 sm:pt-10">
      <PageHeader
        title="Insights & Analytics"
        subtitle="High-level overview of your teaching performance and trends"
      />

      {/* Overview Section */}
      <section className="mb-8">
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Performance Overview
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Overall Performance
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                Coming Soon
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Aggregate metrics across all sessions
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Trend Analysis
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                Coming Soon
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Performance trends over time
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Key Insights
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                Coming Soon
              </p>
              <p className="mt-1 text-xs text-slate-600">
                AI-generated insights and recommendations
              </p>
            </div>
          </div>
        </Card>
      </section>

      {/* Charts Section */}
      <section className="mb-8 grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Performance Trends
          </h2>
          <div className="flex h-64 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
            <p className="text-sm text-slate-500">
              Chart visualization coming soon
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Metric Distribution
          </h2>
          <div className="flex h-64 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
            <p className="text-sm text-slate-500">
              Chart visualization coming soon
            </p>
          </div>
        </Card>
      </section>

      {/* Recommendations Section */}
      <section>
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Recommendations
          </h2>
          <div className="space-y-3">
            <div className="rounded-lg border border-primary-200 bg-primary-50 p-4">
              <p className="text-sm font-medium text-primary-900">
                Analysis in progress
              </p>
              <p className="mt-1 text-xs text-primary-700">
                Detailed insights and recommendations will be available here once you have analyzed multiple sessions.
              </p>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
