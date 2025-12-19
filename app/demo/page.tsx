"use client";

import { useState, useEffect, useRef } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { useToast } from "@/components/ToastContext";
import { getWithAuth, postWithAuth } from "@/lib/utils/api";

type Metric = {
  name: string;
  score: number;
  source: string;
};

type AnalysisResult = {
  id: string;
  clarityScore: number;
  confidenceScore: number;
  engagementScore: number;
  technicalDepth: number;
  interactionIndex: number;
  dominantEmotion: string;
  topic: string;
  transcript: string;
  coachFeedbackError?: string;
  coachSuggestions?: string[];
  coachStrengths?: string[];
  videoMetadata: {
    fileName: string;
  };
  createdAt?: string;
};

type CoordinatorAnalysis = {
  _id: string;
  topic: string;
  clarityScore: number;
  confidenceScore: number;
  engagementScore: number;
  technicalDepth: number;
  interactionIndex: number;
  createdAt: string;
};

export default function DemoPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<"mentor" | "coordinator">("mentor");
  const [loading, setLoading] = useState(false);
  const [evaluated, setEvaluated] = useState(false);
  const [subject, setSubject] = useState("Data Structures");
  const [language, setLanguage] = useState("English – Indian");
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileObject, setFileObject] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const pollTimerRef = useRef<number | null>(null);
  const [coordinatorAnalyses, setCoordinatorAnalyses] = useState<CoordinatorAnalysis[]>([]);
  const [coordinatorLoading, setCoordinatorLoading] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("shikshanetra_token");
    setIsLoggedIn(!!token);

    if (token && activeTab === "coordinator") {
      fetchCoordinatorAnalyses();
    }
  }, [activeTab]);

  const fetchCoordinatorAnalyses = async () => {
    setCoordinatorLoading(true);
    try {
      const response = await getWithAuth("/api/analyze/history?limit=20");

      if (!response.ok) {
        throw new Error("Failed to fetch analyses");
      }

      const data = await response.json();
      setCoordinatorAnalyses(data.analyses || []);
    } catch (error) {
      console.error("Error fetching coordinator analyses:", error);
      showToast("Failed to load analysis data");
    } finally {
      setCoordinatorLoading(false);
    }
  };

  const handleRunDemo = async () => {
    if (loading) return;
    
    if (!fileObject) {
      showToast("Please select a video file first.");
      return;
    }

    if (!isLoggedIn) {
      showToast("Please login to analyze videos.");
      return;
    }

    setLoading(true);
    let scheduledJobId: string | null = null;
    
    try {
      const formData = new FormData();
      formData.append("file", fileObject);
      formData.append("subject", subject);
      formData.append("language", language);

      const response = await postWithAuth("/api/analyze", formData, "multipart/form-data");

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Analysis failed");
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || "Analysis failed");
      }

      const jobId: string | undefined = result.job?.id;
      if (!jobId) {
        throw new Error("Job was not returned from server");
      }

      scheduledJobId = jobId;

      setActiveJobId(jobId);
      setEvaluated(false);
      showToast("Job scheduled. Waiting for completion…");

      // Poll job status until completed, then fetch the analysis
      const poll = async () => {
        const jobRes = await getWithAuth(`/api/jobs/${jobId}`);
        if (!jobRes.ok) return;
        const jobData = await jobRes.json();
        const job = jobData.job;
        if (!job) return;

        if (job.status === "failed") {
          throw new Error(job.error || "Analysis failed");
        }

        if (job.status === "completed" && job.analysisId) {
          const analysisResponse = await getWithAuth(`/api/analyze/${job.analysisId}`);
          if (!analysisResponse.ok) {
            throw new Error("Failed to fetch analysis results");
          }
          const analysisData = await analysisResponse.json();
          setAnalysisResult(analysisData.analysis);
          setEvaluated(true);
          showToast("Analysis completed successfully!");
          setLoading(false);
          if (pollTimerRef.current) {
            window.clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
          }
        }
      };

      // Clear any existing poll timer and start a new one
      if (pollTimerRef.current) {
        window.clearInterval(pollTimerRef.current);
      }
      pollTimerRef.current = window.setInterval(() => {
        poll().catch((e) => {
          console.error("Job polling error:", e);
          showToast(e instanceof Error ? e.message : "Job polling failed");
          setLoading(false);
          if (pollTimerRef.current) {
            window.clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
          }
        });
      }, 2500);

      // Run an immediate poll so UI updates faster
      await poll();
    } catch (error) {
      console.error("Error during analysis:", error);
      showToast(error instanceof Error ? error.message : "Error during analysis. Please try again.");
      setLoading(false);
    } finally {
      // If scheduling failed, stop loading here. If a job was scheduled,
      // polling/completion will stop loading.
      if (!scheduledJobId) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        window.clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setFileObject(file);
    }
  };

  const trendIcon = (trend: string) => {
    if (trend === "up") return "▲";
    if (trend === "down") return "▼";
    return "▬";
  };

  const getOverallScore = () => {
    if (!analysisResult) return 0;
    const avg = (
      analysisResult.clarityScore +
      analysisResult.confidenceScore +
      analysisResult.engagementScore +
      (analysisResult.technicalDepth * 10) +
      (analysisResult.interactionIndex / 10)
    ) / 5;
    return Math.round(avg);
  };

  const getOverallScoreFromData = (analysis: CoordinatorAnalysis) => {
    const avg = (
      analysis.clarityScore +
      analysis.confidenceScore +
      analysis.engagementScore +
      (analysis.technicalDepth * 10) +
      (analysis.interactionIndex / 10)
    ) / 5;
    return Math.round(avg);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
  };

  const metrics: Metric[] = analysisResult ? [
    { name: "Clarity", score: analysisResult.clarityScore / 10, source: "Audio" },
    { name: "Confidence", score: analysisResult.confidenceScore / 10, source: "Audio" },
    { name: "Engagement", score: analysisResult.engagementScore / 10, source: "Video" },
    { name: "Technical Depth", score: analysisResult.technicalDepth, source: "Text" },
    { name: "Interaction", score: analysisResult.interactionIndex / 10, source: "Text" }
  ] : [
    { name: "Clarity", score: 0, source: "Audio" },
    { name: "Confidence", score: 0, source: "Audio" },
    { name: "Engagement", score: 0, source: "Video" },
    { name: "Technical Depth", score: 0, source: "Text" },
    { name: "Interaction", score: 0, source: "Text" }
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 pb-12 pt-8 sm:pt-10">
      <PageHeader
        title="Live Demo – Mentor Evaluation"
        subtitle="Simulated end-to-end flow: upload a teaching session, run AI analysis, and view results."
        badge={<span className="badge-pill">Interactive prototype</span>}
      />

      {/* Tabs */}
      <div className="mb-6 inline-flex rounded-full border border-slate-200 bg-slate-100 p-1 text-xs font-medium">
        <button
          type="button"
          onClick={() => setActiveTab("mentor")}
          className={`rounded-full px-4 py-2 transition ${
            activeTab === "mentor"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Mentor View
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("coordinator")}
          className={`rounded-full px-4 py-2 transition ${
            activeTab === "coordinator"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Coordinator View
        </button>
      </div>

      {activeTab === "mentor" ? (
        <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
          {/* Mentor Panel */}
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-slate-900">
              Analyze Your Session (Demo)
            </h2>
            <p className="mt-1 text-xs text-slate-600 sm:text-sm">
              Upload a sample teaching video and run a simulated AI evaluation.
            </p>

            {/* Upload */}
            <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500 transition hover:border-primary-300 hover:bg-primary-50/60 sm:text-sm">
              <input
                type="file"
                className="hidden"
                accept="video/*"
                onChange={handleFileChange}
              />
              <span className="mb-1 font-medium text-slate-700">
                Drop your lecture video here or click to upload (demo only).
              </span>
              <span className="text-[11px]">
                MP4, MKV, or WebM — 5–60 minutes, classroom or virtual sessions.
              </span>
              {fileName && (
                <span className="mt-2 rounded-full bg-white px-3 py-1 text-[11px] text-primary-700">
                  Selected: {fileName}
                </span>
              )}
            </label>

            {/* Form */}
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 text-xs sm:text-sm">
                <label className="block text-xs font-medium text-slate-700">
                  Subject
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 shadow-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100 sm:text-sm"
                >
                  <option>Data Structures</option>
                  <option>AI</option>
                  <option>DBMS</option>
                  <option>OS</option>
                  <option>Algorithms</option>
                </select>
              </div>
              <div className="space-y-1.5 text-xs sm:text-sm">
                <label className="block text-xs font-medium text-slate-700">
                  Language / Accent
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 shadow-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100 sm:text-sm"
                >
                  <option>English – Indian</option>
                  <option>English – Neutral</option>
                  <option>English – US</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleRunDemo}
                disabled={loading || !fileObject || !isLoggedIn}
                className="btn-primary px-5 py-2 text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Running AI Evaluation…" : "Run AI Evaluation"}
              </button>
              {!isLoggedIn && (
                <p className="text-[11px] text-rose-600">
                  Please login to analyze videos
                </p>
              )}
              {isLoggedIn && (
                <p className="text-[11px] text-slate-500">
                  Upload and analyze your teaching session
                </p>
              )}
            </div>
          </Card>

          {/* Results */}
          <div className="space-y-4">
            <Card className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Overall Mentor Score
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">
                    {evaluated ? `${getOverallScore()}/100` : "--/100"}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Based on {evaluated ? analysisResult?.videoMetadata.fileName : "last uploaded session"} ({subject}, {language}).
                  </p>
                </div>
                <div className="flex flex-col items-end text-[11px]">
                  <span className={`rounded-full px-3 py-1 font-medium ${
                    evaluated 
                      ? "bg-emerald-50 text-emerald-700" 
                      : "bg-slate-50 text-slate-500"
                  }`}>
                    {evaluated ? "Completed" : "Waiting for analysis"}
                  </span>
                  {evaluated && analysisResult && (
                    <span className="mt-1 text-slate-500">
                      Emotion: {analysisResult.dominantEmotion}
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {metrics.map((metric) => {
                  const percentage = evaluated ? (metric.score / 10) * 100 : 0;
                  return (
                    <div
                      key={metric.name}
                      className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-800">
                          {metric.name}
                        </span>
                        <span className="text-[11px] font-semibold text-primary-700">
                          {evaluated ? metric.score.toFixed(1) : "-"}/10
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                        <div className="mr-2 h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-primary-400 to-accent-400 transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] text-slate-500">
                          {metric.source}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="text-sm font-semibold text-slate-900">
                AI Feedback Summary
              </h3>
              <p className="mt-1 text-xs text-slate-600">
                {evaluated ? "Generated feedback based on your session analysis" : "Upload and analyze a video to see feedback"}
              </p>
              {evaluated && analysisResult && !analysisResult.coachFeedbackError ? (
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                      Strengths
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-700">
                      {analysisResult.coachStrengths && analysisResult.coachStrengths.length > 0 ? (
                        analysisResult.coachStrengths.map((strength, idx) => (
                          <li key={idx}>{strength}</li>
                        ))
                      ) : (
                        <>
                          <li>High engagement score of {analysisResult.engagementScore.toFixed(1)}%</li>
                          <li>Clear audio with clarity score of {analysisResult.clarityScore.toFixed(1)}</li>
                          <li>Good technical depth in content delivery</li>
                        </>
                      )}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-accent-700">
                      Suggestions
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-700">
                      {analysisResult.coachSuggestions && analysisResult.coachSuggestions.length > 0 ? (
                        analysisResult.coachSuggestions.map((suggestion, idx) => (
                          <li key={idx}>{suggestion}</li>
                        ))
                      ) : (
                        <>
                          <li>Consider adding more interactive elements to boost engagement</li>
                          <li>Maintain consistent pace throughout the session</li>
                          <li>Add visual aids to complement verbal explanations</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              ) : evaluated && analysisResult?.coachFeedbackError ? (
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs text-amber-800">
                    <strong>Note:</strong> AI feedback generation is temporarily unavailable. Your analysis scores are available above.
                  </p>
                </div>
              ) : (
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                      Strengths
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-400">
                      <li>Analysis results will appear here</li>
                      <li>Showing your teaching strengths</li>
                      <li>Based on AI evaluation</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-accent-700">
                      Suggestions
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-400">
                      <li>Personalized improvement tips</li>
                      <li>Actionable recommendations</li>
                      <li>Best practices for teaching</li>
                    </ul>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      ) : (
        <Card className="p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Cohort Snapshot (Demo)
              </h2>
              <p className="mt-1 text-xs text-slate-600 sm:text-sm">
                View a simulated overview of mentor performance across subjects and batches.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-xs sm:text-sm">
              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-slate-600">
                  Subject
                </label>
                <select className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 shadow-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100">
                  <option>All</option>
                  <option>Data Structures</option>
                  <option>AI</option>
                  <option>DBMS</option>
                  <option>OS</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-slate-600">
                  Batch / Department
                </label>
                <select className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 shadow-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100">
                  <option>All</option>
                  <option>CSE 2025</option>
                  <option>ECE 2025</option>
                  <option>AIML 2025</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-xs sm:text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">
                    Date
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">
                    Topic
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">
                    Overall Score
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">
                    Key Metrics
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {coordinatorLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      Loading analyses...
                    </td>
                  </tr>
                ) : coordinatorAnalyses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      No analyses found. Start analyzing videos to see them here.
                    </td>
                  </tr>
                ) : (
                  coordinatorAnalyses.slice(0, 10).map((analysis, idx) => (
                    <tr key={analysis._id} className="hover:bg-slate-50/80">
                      <td className="whitespace-nowrap px-4 py-2 text-slate-700">
                        {formatDate(analysis.createdAt)}
                      </td>
                      <td className="px-4 py-2 text-slate-800">
                        {analysis.topic}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-slate-800">
                        <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700">
                          {getOverallScoreFromData(analysis)}/100
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-slate-600">
                        <span className="text-xs">
                          C: {(analysis.clarityScore / 10).toFixed(1)} | 
                          E: {(analysis.engagementScore / 10).toFixed(1)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-slate-600">
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] bg-emerald-50 text-emerald-700">
                          Completed
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {coordinatorAnalyses.length > 0 && (
            <p className="mt-3 text-[11px] text-slate-500">
              Showing {Math.min(10, coordinatorAnalyses.length)} of {coordinatorAnalyses.length} total analyses. 
              Scores shown: C=Clarity, E=Engagement.
            </p>
          )}
        </Card>
      )}
    </div>
  );
}


