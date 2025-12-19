"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { useToast } from "@/components/ToastContext";
import { getWithAuth } from "@/lib/utils/api";

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
}

export default function HistoryPage() {
  const { showToast } = useToast();
  const router = useRouter();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  useEffect(() => {
    const token = localStorage.getItem("shikshanetra_token");
    if (!token) {
      showToast("Please login to view history");
      router.push("/login");
      return;
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

    return filtered.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [analyses, subjectFilter, dateFrom, dateTo]);

  // Get unique subjects for filter
  const uniqueSubjects = useMemo(() => {
    const subjects = new Set(analyses.map((a) => a.subject));
    return Array.from(subjects).sort();
  }, [analyses]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Calculate overall growth/decline from last session
  const getGrowthTag = (index: number) => {
    if (index === 0) return null; // First session, no comparison
    
    const current = filteredAnalyses[index];
    const previous = filteredAnalyses[index - 1];
    
    const currentScore = (current.clarityScore + current.confidenceScore + current.engagementScore) / 3;
    const previousScore = (previous.clarityScore + previous.confidenceScore + previous.engagementScore) / 3;

    if (previousScore <= 0) {
      return { label: "→ --%", color: "bg-slate-100 text-slate-700", tooltip: "Baseline established" };
    }
    
    const diff = currentScore - previousScore;
    const percentChange = ((diff / previousScore) * 100).toFixed(1);
    
    if (diff > 2) {
      return { label: `📈 +${percentChange}%`, color: "bg-green-100 text-green-700", tooltip: "Strong growth" };
    } else if (diff > 0) {
      return { label: `↗️ +${percentChange}%`, color: "bg-blue-100 text-blue-700", tooltip: "Slight improvement" };
    } else if (diff < -2) {
      return { label: `📉 ${percentChange}%`, color: "bg-red-100 text-red-700", tooltip: "Decline detected" };
    } else {
      return { label: `→ ${percentChange}%`, color: "bg-slate-100 text-slate-700", tooltip: "Stable" };
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 pb-12 pt-8 sm:pt-10">
        <PageHeader
          title="Session History"
          subtitle="View all your analyzed teaching sessions"
        />
        <div className="flex items-center justify-center py-12">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-12 pt-8 sm:pt-10">
      <PageHeader
        title="Session History"
        subtitle="View and manage all your analyzed teaching sessions"
      />

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

      {/* Session History Table */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            All Sessions ({filteredAnalyses.length})
          </h2>
        </div>

        {filteredAnalyses.length === 0 ? (
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
                {filteredAnalyses.map((analysis, index) => {
                  const growthTag = getGrowthTag(index);
                  return (
                  <tr
                    key={analysis.id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="py-3 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <span>{formatDate(analysis.createdAt)}</span>
                        {growthTag && (
                          <span 
                            title={growthTag.tooltip}
                            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${growthTag.color}`}
                          >
                            {`${growthTag.label} from last session`}
                          </span>
                        )}
                      </div>
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

