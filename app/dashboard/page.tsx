"use client";

import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/Card";
import { useToast } from "@/components/ToastContext";
import { useRouter } from "next/navigation";
import { getWithAuth } from "@/lib/utils/api";
import { MetricsRadarChart, MetricsData } from "@/components/MetricsRadarChart";
import { TimelineSummary } from "@/components/TimelineSummary";
import { MetricsComparisonCard } from "@/components/MetricsComparisonCard";

interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface Analysis {
  id: string;
  sessionId: string;
  topic: string;
  subject: string;
  language: string;
  createdAt: string;
  clarityScore: number;
  confidenceScore: number;
  engagementScore: number;
  technicalDepth: number;
  interactionIndex?: number;
  topicRelevanceScore?: number;
}

export default function DashboardPage() {
  const { showToast } = useToast();
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  useEffect(() => {
    const token = localStorage.getItem("shikshanetra_token");
    const loggedIn = localStorage.getItem("shikshanetra_logged_in") === "true";
    
    if (!token && !loggedIn) {
      showToast("Please login to access dashboard");
      router.push("/login");
      return;
    }

    const userData = localStorage.getItem("shikshanetra_user");
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    } else {
      // Create demo user if not exists
      setUser({
        id: "demo",
        email: "demo@example.com",
        name: "Demo User",
        role: "mentor",
      });
    }
    
    fetchAnalysisHistory();
  }, []);

  const fetchAnalysisHistory = async () => {
    try {
      const response = await getWithAuth(`/api/analyze/history?limit=100`);

      if (!response.ok) {
        throw new Error("Failed to fetch analysis history");
      }

      const data = await response.json();
      setAnalyses(data.analyses || []);
    } catch (error) {
      console.error("Error fetching analyses:", error);
      showToast("Failed to load analysis history");
    } finally {
      setLoading(false);
    }
  };

  // Filter analyses based on filters
  const filteredAnalyses = useMemo(() => {
    let filtered = [...analyses];

    if (subjectFilter !== "all") {
      filtered = filtered.filter((a) => a.subject === subjectFilter);
    }

    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      filtered = filtered.filter((a) => new Date(a.createdAt) >= fromDate);
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((a) => new Date(a.createdAt) <= toDate);
    }

    return filtered;
  }, [analyses, subjectFilter, dateFrom, dateTo]);

  // Get unique subjects for filter
  const uniqueSubjects = useMemo(() => {
    const subjects = new Set(analyses.map((a) => a.subject));
    return Array.from(subjects).sort();
  }, [analyses]);

  // Calculate average metrics for radar chart
  const averageMetrics: MetricsData = useMemo(() => {
    if (filteredAnalyses.length === 0) {
      return {
        clarity: 0,
        confidence: 0,
        engagement: 0,
        technicalDepth: 0,
        interaction: 0,
        topicRelevance: 0,
      };
    }

    const totals = filteredAnalyses.reduce(
      (acc, a) => ({
        clarity: acc.clarity + a.clarityScore,
        confidence: acc.confidence + a.confidenceScore,
        engagement: acc.engagement + a.engagementScore,
        technicalDepth: acc.technicalDepth + a.technicalDepth,
        interaction: acc.interaction + (a.interactionIndex || 0) * 10,
        topicRelevance: acc.topicRelevance + (a.topicRelevanceScore || 0),
      }),
      {
        clarity: 0,
        confidence: 0,
        engagement: 0,
        technicalDepth: 0,
        interaction: 0,
        topicRelevance: 0,
      }
    );

    const count = filteredAnalyses.length;
    return {
      clarity: totals.clarity / count,
      confidence: totals.confidence / count,
      engagement: totals.engagement / count,
      technicalDepth: totals.technicalDepth / count,
      interaction: totals.interaction / count,
      topicRelevance: totals.topicRelevance / count,
    };
  }, [filteredAnalyses]);

  // Get timeline data
  const timelineData = useMemo(() => {
    return filteredAnalyses.map((a) => ({
      date: a.createdAt,
      clarity: a.clarityScore,
      engagement: a.engagementScore,
      confidence: a.confidenceScore,
    }));
  }, [filteredAnalyses]);

  // Get latest two sessions for comparison
  const comparisonData = useMemo(() => {
    const sorted = [...filteredAnalyses].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    if (sorted.length < 2) return null;

    const curr = sorted[0];
    const prev = sorted[1];

    return {
      prev: {
        engagement: prev.engagementScore,
        clarity: prev.clarityScore,
        interaction: (prev.interactionIndex || 0) * 10,
      },
      curr: {
        engagement: curr.engagementScore,
        clarity: curr.clarityScore,
        interaction: (curr.interactionIndex || 0) * 10,
      },
    };
  }, [filteredAnalyses]);


  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case "mentor":
        return "bg-primary-100 text-primary-700";
      case "coordinator":
        return "bg-blue-100 text-blue-700";
      case "institution_admin":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const formatRole = (role: string) => {
    return role
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-primary-50/20 py-8">
      <div className="mx-auto max-w-7xl px-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-2 text-slate-600">Welcome back, {user.name}</p>
        </div>

        {/* Filters */}
        <Card className="mb-6 p-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700">
                Subject
              </label>
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              >
                <option value="all">All Subjects</option>
                {uniqueSubjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700">
                Date From
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700">
                Date To
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              />
            </div>
          </div>
        </Card>

        {/* Stats Cards */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Total Sessions
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {filteredAnalyses.length}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Avg Clarity
            </p>
            <p className="mt-2 text-3xl font-bold text-primary-600">
              {averageMetrics.clarity.toFixed(1)}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Avg Engagement
            </p>
            <p className="mt-2 text-3xl font-bold text-emerald-600">
              {averageMetrics.engagement.toFixed(1)}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Avg Confidence
            </p>
            <p className="mt-2 text-3xl font-bold text-amber-600">
              {averageMetrics.confidence.toFixed(1)}
            </p>
          </Card>
        </div>

        {/* Radar Chart and Timeline */}
        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              Metrics Overview
            </h2>
            {loading ? (
              <div className="flex h-96 items-center justify-center">
                <p className="text-sm text-slate-500">Loading...</p>
              </div>
            ) : (
              <MetricsRadarChart data={averageMetrics} label="Average Metrics" />
            )}
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              Performance Timeline
            </h2>
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <p className="text-sm text-slate-500">Loading...</p>
              </div>
            ) : (
              <TimelineSummary data={timelineData} />
            )}
          </Card>
        </div>

        {/* Session Comparison */}
        {comparisonData && (
          <div className="mb-6">
            <MetricsComparisonCard
              prev={comparisonData.prev}
              curr={comparisonData.curr}
              title="Latest Session Comparison"
            />
          </div>
        )}

        {/* Session History Table */}
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Session History
          </h2>

          {loading ? (
            <div className="py-8 text-center text-slate-600">
              Loading session history...
            </div>
          ) : filteredAnalyses.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-slate-600">No sessions found</p>
              <p className="mt-2 text-sm text-slate-500">
                {subjectFilter !== "all" || dateFrom || dateTo
                  ? "Try adjusting your filters"
                  : "Upload a video to get started"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 text-left">
                    <th className="pb-3 text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Date
                    </th>
                    <th className="pb-3 text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Topic
                    </th>
                    <th className="pb-3 text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Subject
                    </th>
                    <th className="pb-3 text-xs font-medium text-slate-500 uppercase tracking-wide text-right">
                      Clarity
                    </th>
                    <th className="pb-3 text-xs font-medium text-slate-500 uppercase tracking-wide text-right">
                      Engagement
                    </th>
                    <th className="pb-3 text-xs font-medium text-slate-500 uppercase tracking-wide text-right">
                      Confidence
                    </th>
                    <th className="pb-3 text-xs font-medium text-slate-500 uppercase tracking-wide text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAnalyses.map((analysis) => (
                    <tr
                      key={analysis.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="py-3 text-sm text-slate-600">
                        {formatDate(analysis.createdAt)}
                      </td>
                      <td className="py-3 text-sm font-medium text-slate-900">
                        {analysis.topic}
                      </td>
                      <td className="py-3 text-sm text-slate-600">
                        {analysis.subject}
                      </td>
                      <td className="py-3 text-right text-sm font-medium text-slate-900">
                        {analysis.clarityScore.toFixed(1)}
                      </td>
                      <td className="py-3 text-right text-sm font-medium text-slate-900">
                        {analysis.engagementScore.toFixed(1)}
                      </td>
                      <td className="py-3 text-right text-sm font-medium text-slate-900">
                        {analysis.confidenceScore.toFixed(1)}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => router.push(`/report/${analysis.id}`)}
                          className="inline-flex items-center rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-primary-700"
                        >
                          View Report
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
