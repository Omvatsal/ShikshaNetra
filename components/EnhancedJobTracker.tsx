"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "./Card";

type JobStatus = "created" | "uploading" | "uploaded" | "analyzing" | "analysis_done" | "generating_feedback" | "completed" | "failed";

interface JobItem {
  id: string;
  status: JobStatus;
  progress: number;
  analysisId?: string;
  error?: string;
  videoMetadata?: { fileName?: string };
  subject?: string;
  language?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface EnhancedJobTrackerProps {
  jobs: JobItem[];
  expandedJobIds: Record<string, boolean>;
  onToggleExpand: (jobId: string) => void;
  messageTick?: number;
  getRotatingMessage?: (job: JobItem) => string;
}

const statusConfig: Record<JobStatus, { icon: string; label: string; color: string; bgColor: string }> = {
  created: { icon: "📋", label: "Created", color: "text-blue-600", bgColor: "bg-blue-100" },
  uploading: { icon: "⬆️", label: "Uploading", color: "text-blue-600", bgColor: "bg-blue-100" },
  uploaded: { icon: "✅", label: "Uploaded", color: "text-green-600", bgColor: "bg-green-100" },
  analyzing: { icon: "🔍", label: "Analyzing", color: "text-purple-600", bgColor: "bg-purple-100" },
  analysis_done: { icon: "📊", label: "Analysis Done", color: "text-purple-600", bgColor: "bg-purple-100" },
  generating_feedback: { icon: "🤖", label: "Generating Feedback", color: "text-indigo-600", bgColor: "bg-indigo-100" },
  completed: { icon: "🎉", label: "Completed", color: "text-green-600", bgColor: "bg-green-100" },
  failed: { icon: "❌", label: "Failed", color: "text-red-600", bgColor: "bg-red-100" },
};

const getProgressMessage = (status: JobStatus, progress: number): string => {
  const messages: Record<JobStatus, string> = {
    created: "Preparing your video...",
    uploading: `Uploading to cloud storage... ${progress}%`,
    uploaded: "Upload complete! Starting analysis...",
    analyzing: `AI is analyzing your video... ${progress}%`,
    analysis_done: "Analysis complete! Generating personalized feedback...",
    generating_feedback: `Creating coach feedback... ${progress}%`,
    completed: "All done! Your analysis is ready!",
    failed: "Something went wrong. Please try again.",
  };
  return messages[status] || "Processing...";
};

export function EnhancedJobTracker({
  jobs,
  expandedJobIds,
  onToggleExpand,
  messageTick = 0,
  getRotatingMessage,
}: EnhancedJobTrackerProps) {
  if (jobs.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-slate-50 to-slate-100 p-8 text-center">
        <p className="text-lg font-semibold text-slate-600">📁 No uploads yet</p>
        <p className="mt-2 text-slate-500">Upload a video to get started with AI analysis</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-slate-900">📋 Your Analysis Jobs</h3>

      {jobs.map((job) => {
        const config = statusConfig[job.status];
        const isExpanded = expandedJobIds[job.id];
        const isCompleted = job.status === "completed";
        const isFailed = job.status === "failed";
        const isProcessing = !isCompleted && !isFailed;

        return (
          <div
            key={job.id}
            className={`overflow-hidden rounded-lg border-2 transition-all ${
              isFailed
                ? "border-red-200 bg-red-50"
                : isCompleted
                  ? "border-green-200 bg-green-50"
                  : "border-blue-200 bg-blue-50"
            }`}
          >
            {/* Main Job Card */}
            <button
              onClick={() => onToggleExpand(job.id)}
              className="w-full px-4 py-4 text-left hover:opacity-80 transition-opacity"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  {/* Status Icon */}
                  <div className={`${config.bgColor} rounded-full p-3 text-2xl`}>{config.icon}</div>

                  {/* Job Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900">{job.videoMetadata?.fileName || "Video Analysis"}</p>
                      <span className={`inline-block rounded-full px-2 py-1 text-xs font-bold ${config.color} ${config.bgColor}`}>
                        {config.label}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    {isProcessing && (
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-300">
                        <div
                          className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-300"
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                    )}

                    {/* Status Message */}
                    <p className="mt-1 text-sm text-slate-600">
                      {getRotatingMessage ? getRotatingMessage(job) : getProgressMessage(job.status, job.progress)}
                    </p>

                    {/* Subject & Language */}
                    <div className="mt-2 flex gap-3 text-xs text-slate-500">
                      {job.subject && <span>📚 {job.subject}</span>}
                      {job.language && <span>🌐 {job.language}</span>}
                      {job.createdAt && <span>⏱️ {new Date(job.createdAt).toLocaleDateString()}</span>}
                    </div>
                  </div>

                  {/* Progress Percentage */}
                  {isProcessing && (
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">{job.progress}%</p>
                      <p className="text-xs text-slate-500">Complete</p>
                    </div>
                  )}

                  {/* Expand Arrow */}
                  <div className="text-2xl text-slate-400">
                    {isExpanded ? "▼" : "▶"}
                  </div>
                </div>
              </div>
            </button>

            {/* Expanded Details */}
            {isExpanded && (
              <div className="border-t-2 border-slate-200 bg-white p-4">
                {/* Job ID */}
                <div className="mb-4 space-y-2 rounded-lg bg-slate-100 p-3">
                  <p className="text-xs font-bold text-slate-600">JOB ID</p>
                  <p className="break-all font-mono text-sm text-slate-900">{job.id}</p>
                </div>

                {/* Status Timeline */}
                <div className="mb-4">
                  <p className="mb-3 text-sm font-bold text-slate-700">📍 Processing Timeline</p>
                  <div className="space-y-2">
                    {[
                      { step: "Queued", icon: "📋", done: job.status !== "created" },
                      { step: "Uploading", icon: "⬆️", done: ["uploaded", "analyzing", "analysis_done", "generating_feedback", "completed"].includes(job.status) },
                      { step: "Analyzing", icon: "🔍", done: ["analysis_done", "generating_feedback", "completed"].includes(job.status) },
                      { step: "Feedback", icon: "🤖", done: ["completed"].includes(job.status) },
                      { step: "Done", icon: "✅", done: job.status === "completed" },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className={`text-2xl ${item.done ? "opacity-100" : "opacity-40"}`}>{item.icon}</div>
                        <span className={`text-sm font-medium ${item.done ? "text-green-600" : "text-slate-500"}`}>
                          {item.step}
                        </span>
                        {item.done && <span className="text-green-600">✓</span>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Error Message */}
                {isFailed && job.error && (
                  <div className="mb-4 rounded-lg border-l-4 border-red-500 bg-red-50 p-3">
                    <p className="text-sm font-bold text-red-700">Error</p>
                    <p className="mt-1 text-sm text-red-600">{job.error}</p>
                  </div>
                )}

                {/* Success Actions */}
                {isCompleted && job.analysisId && (
                  <div className="space-y-3">
                    <p className="text-sm font-bold text-green-700">✅ Analysis Complete!</p>
                    <div className="flex gap-3">
                      <Link
                        href={`/report/${job.analysisId}`}
                        className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-center font-semibold text-white hover:bg-green-700 transition-colors"
                      >
                        📊 View Report
                      </Link>
                      <Link
                        href="/insights"
                        className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-center font-semibold text-white hover:bg-blue-700 transition-colors"
                      >
                        📈 View Insights
                      </Link>
                    </div>
                  </div>
                )}

                {/* Processing Info */}
                {isProcessing && (
                  <div className="mt-4 rounded-lg bg-blue-50 p-3">
                    <p className="text-xs text-blue-700">
                      <strong>💡 Tip:</strong> You can close this page. We'll notify you when your analysis is complete.
                    </p>
                  </div>
                )}

                {/* Timestamps */}
                <div className="mt-4 border-t border-slate-200 pt-3 text-xs text-slate-500">
                  {job.createdAt && <p>Created: {new Date(job.createdAt).toLocaleString()}</p>}
                  {job.updatedAt && <p>Last Updated: {new Date(job.updatedAt).toLocaleString()}</p>}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
