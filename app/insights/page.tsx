"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getWithAuth } from "@/lib/utils/api";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { useToast } from "@/components/ToastContext";
import { MemoryInsights } from "@/components/MemoryInsights";
import type { MemoryResponse, WeaknessField } from "@/lib/types/memory";

export const dynamic = "force-dynamic";

export default function InsightsPage() {
  const { showToast } = useToast();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [memory, setMemory] = useState<MemoryResponse | null>(null);
  const [memoryLoading, setMemoryLoading] = useState(false);

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
    
    // Fetch memory data
    fetchMemory();
  }, [router, showToast]);

  const fetchMemory = async () => {
    setMemoryLoading(true);
    try {
      const response = await getWithAuth("/api/memory/my-summary");

      if (!response.ok) {
        console.error("Failed to fetch memory");
        setMemoryLoading(false);
        return;
      }

      const data = await response.json();
      if (data.success && data.memory) {
        setMemory(data.memory);
      }
    } catch (error) {
      console.error("Error fetching memory:", error);
    } finally {
      setMemoryLoading(false);
    }
  };

  const getMetricColor = (score: number): string => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-blue-600";
    if (score >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  const getMetricBgColor = (score: number): string => {
    if (score >= 80) return "bg-green-50";
    if (score >= 60) return "bg-blue-50";
    if (score >= 40) return "bg-yellow-50";
    return "bg-red-50";
  };

  const renderMetricCard = (label: string, metric: any) => (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-bold ${getMetricColor(metric.mean)}`}>
        {metric.mean.toFixed(1)}
      </p>
      <div className="mt-2 space-y-1 text-xs text-slate-600">
        <p>Latest: {metric.latest.toFixed(1)}</p>
        <p>Range: {metric.min.toFixed(1)} - {metric.max.toFixed(1)}</p>
        <p className={metric.trend > 0 ? "text-green-600" : metric.trend < 0 ? "text-red-600" : ""}>
          Trend: {metric.trend > 0 ? "↑" : metric.trend < 0 ? "↓" : "→"} {Math.abs(metric.trend).toFixed(1)}
        </p>
      </div>
    </div>
  );

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

  if (!memory) {
    return (
      <div className="mx-auto max-w-6xl px-4 pb-12 pt-8 sm:pt-10">
        <PageHeader
          title="Insights & Analytics"
          subtitle="High-level overview of your teaching performance and trends"
        />
        
        <MemoryInsights memory={null} loading={false} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-12 pt-8 sm:pt-10">
      <PageHeader
        title="Insights & Analytics"
        subtitle={`Your teaching profile from ${memory.totalSessions} session${memory.totalSessions !== 1 ? "s" : ""}`}
      />

      <MemoryInsights memory={memory} loading={false} />
    </div>
  );
}
