"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { useToast } from "@/components/ToastContext";
import { getWithAuth, postWithAuth } from "@/lib/utils/api";
import { VideoUploadZone } from "@/components/VideoUploadZone";
import { EnhancedJobTracker } from "@/components/EnhancedJobTracker";

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
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  type JobStatus =
    | "created"
    | "uploading"
    | "uploaded"
    | "analyzing"
    | "analysis_done"
    | "generating_feedback"
    | "completed"
    | "failed";

  type JobItem = {
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
  };

  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const prevJobsRef = useRef<Map<string, JobStatus>>(new Map());
  const [expandedJobIds, setExpandedJobIds] = useState<Record<string, boolean>>({});
  const [messageTick, setMessageTick] = useState(0);

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

  const refreshJobs = async (silent: boolean = true) => {
    if (!isAuthenticated) return;
    if (!silent) setJobsLoading(true);
    try {
      const res = await getWithAuth("/api/jobs?limit=5");
      if (!res.ok) return;
      const data = await res.json();
      const nextJobs: JobItem[] = (data.jobs || []) as JobItem[];

      // Detect newly completed jobs
      const prev = prevJobsRef.current;
      for (const job of nextJobs) {
        const prevStatus = prev.get(job.id);
        if (prevStatus && prevStatus !== "completed" && job.status === "completed") {
          showToast("Job completed! You can open the report.");
        }
        prev.set(job.id, job.status);
      }

      setJobs(nextJobs);
    } catch {
      // ignore polling errors
    } finally {
      if (!silent) setJobsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    refreshJobs(false);
    const id = window.setInterval(() => {
      refreshJobs(true);
    }, 3000);

    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const pendingJobs = useMemo(
    () => jobs.filter((j) => j.status !== "completed" && j.status !== "failed"),
    [jobs]
  );

  const completedJobs = useMemo(
    () => jobs.filter((j) => j.status === "completed"),
    [jobs]
  );

  const failedJobs = useMemo(
    () => jobs.filter((j) => j.status === "failed"),
    [jobs]
  );

  const hasExpandedPending = useMemo(
    () => pendingJobs.some((j) => expandedJobIds[j.id]),
    [pendingJobs, expandedJobIds]
  );

  useEffect(() => {
    if (!hasExpandedPending) return;
    const id = window.setInterval(() => {
      setMessageTick((t) => t + 1);
    }, 1800);
    return () => window.clearInterval(id);
  }, [hasExpandedPending]);

  const toggleJobExpanded = (jobId: string) => {
    setExpandedJobIds((prev) => ({
      ...prev,
      [jobId]: !prev[jobId],
    }));
  };

  const getRotatingMessage = (job: JobItem) => {
    const status = job.status;

    const messagesByStatus: Record<JobStatus, string[]> = {
      created: [
        "Job created. Preparing uploads…",
        "Warming up the pipeline…",
      ],
      uploading: [
        "Upload started. Sending your video securely…",
        "Uploading video to storage…",
        "Optimizing upload—this may take a moment…",
      ],
      uploaded: [
        "Upload complete. Preparing analysis…",
        "Video received. Initializing model…",
      ],
      analyzing: [
        "Analysis running. Processing video signals…",
        "Analyzing audio clarity and confidence…",
        "Analyzing text / transcript features…",
        "Computing classroom engagement metrics…",
      ],
      analysis_done: [
        "Core analysis complete. Finalizing outputs…",
        "Scoring complete. Preparing feedback…",
      ],
      generating_feedback: [
        "Generating coach feedback…",
        "Drafting strengths and improvement areas…",
        "Packaging your report—almost there…",
      ],
      completed: ["Completed."],
      failed: ["Failed."],
    };

    const messages = messagesByStatus[status] || ["Working…"]; 

    // Spread message selection across jobs so they don't all change to the same line at once
    const salt = job.id
      .split("")
      .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const idx = Math.abs(messageTick + salt) % messages.length;
    return messages[idx];
  };

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

      const job: JobItem | undefined = result.job;
      if (!job?.id) {
        throw new Error("Job was not returned from server");
      }

      showToast("Job scheduled. You can upload another video.");
      setJobs((prev) => [job, ...prev]);

      // Reset upload controls so user can schedule multiple jobs
      setFileObject(null);
      setFileName(null);
      setAnalysisResult(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Kick a refresh so sidebar gets latest status quickly
      refreshJobs(true);
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
        <VideoUploadZone 
          fileName={fileName}
          subject={subject}
          language={language}
          loading={loading}
          onFileSelect={(file) => {
            setFileName(file.name);
            setFileObject(file);
            setAnalysisResult(null);
          }}
          onSubjectChange={(value) => setSubject(value)}
          onLanguageChange={(value) => setLanguage(value)}
          onUpload={handleRunAnalysis}
          onRemoveFile={() => {
            setFileObject(null);
            setFileName(null);
            setAnalysisResult(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
          }}
        />

        {/* Info Panel */}
        <div className="space-y-4">
          <EnhancedJobTracker 
            jobs={jobs}
            expandedJobIds={expandedJobIds}
            onToggleExpand={toggleJobExpanded}
            messageTick={messageTick}
            getRotatingMessage={getRotatingMessage}
          />

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
        </div>
      </div>
    </div>
  );
}

