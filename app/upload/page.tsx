"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { useToast } from "@/components/ToastContext";
import { getWithAuth, postWithAuth } from "@/lib/utils/api";

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

export default function UploadPage() {
  const { showToast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState("Data Structures");
  const [language, setLanguage] = useState("English – Indian");
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileObject, setFileObject] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem("shikshanetra_token");
    const loggedIn = localStorage.getItem("shikshanetra_logged_in") === "true";
    if (!token && !loggedIn) {
      showToast("Please login to upload videos");
      router.push("/login");
      return;
    }
    setIsAuthenticated(true);
  }, [router, showToast]);

  const handleRunAnalysis = async () => {
    if (loading) return;
    
    if (!fileObject) {
      showToast("Please select a video file first.");
      return;
    }

    setLoading(true);
    
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

      // Fetch the saved analysis details
      const analysisResponse = await getWithAuth(`/api/analyze/${result.analysisId}`);

      if (analysisResponse.ok) {
        const analysisData = await analysisResponse.json();
        setAnalysisResult(analysisData.analysis);
        showToast("Analysis completed successfully! Redirecting to report...");
        setTimeout(() => {
          router.push(`/report/${result.analysisId}`);
        }, 2000);
      } else {
        throw new Error("Failed to fetch analysis results");
      }
    } catch (error) {
      console.error("Error during analysis:", error);
      showToast(error instanceof Error ? error.message : "Error during analysis. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setFileObject(file);
      setAnalysisResult(null);
    }
  };

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-12 pt-8 sm:pt-10">
      <PageHeader
        title="Upload Video for Analysis"
        subtitle="Upload your teaching session video to receive comprehensive AI-powered analysis and feedback."
      />

      <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
        {/* Upload Panel */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-slate-900">
            Video Upload
          </h2>
          <p className="mt-1 text-xs text-slate-600 sm:text-sm">
            Upload a teaching session video for AI analysis.
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
              Drop your lecture video here or click to upload.
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
              onClick={handleRunAnalysis}
              disabled={loading || !fileObject}
              className="btn-primary px-5 py-2 text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Analyzing Video…" : "Start Analysis"}
            </button>
            <p className="text-[11px] text-slate-500">
              Analysis may take a few minutes to complete.
            </p>
          </div>
        </Card>

        {/* Info Panel */}
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">
              What You'll Get
            </h3>
            <ul className="space-y-2 text-xs text-slate-700">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-0.5">✓</span>
                <span>Comprehensive analysis of clarity, engagement, and confidence</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-0.5">✓</span>
                <span>AI-generated feedback with strengths and improvement areas</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-0.5">✓</span>
                <span>Detailed performance metrics and scores</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-0.5">✓</span>
                <span>Actionable suggestions for improvement</span>
              </li>
            </ul>
          </Card>

          {analysisResult && (
            <Card className="p-5 bg-emerald-50 border-emerald-200">
              <h3 className="text-sm font-semibold text-emerald-900 mb-2">
                Analysis Started
              </h3>
              <p className="text-xs text-emerald-700">
                Your video is being analyzed. You'll be redirected to the detailed report shortly.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

