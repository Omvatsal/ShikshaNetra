"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/Card";
import { useToast } from "@/components/ToastContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getWithAuth } from "@/lib/utils/api";
import { TimeSegments, TimeSegment } from "@/components/TimeSegments";
import { MinuteWiseAnalytics } from "@/components/MinuteWiseAnalytics";

interface Analysis {
  id: string;
  sessionId: string;
  topic: string;
  subject: string;
  language: string;
  transcript: string;
  createdAt: string;
  clarityScore: number;
  confidenceScore: number;
  audioPerMinute?: Array<{
    minute: number;
    start_sec: number;
    end_sec: number;
    clarity_score: number;
    confidence_score: number;
  }>;
  engagementScore: number;
  gestureIndex: number;
  dominantEmotion: string;
  videoConfidenceScore?: number;
  videoPerMinute?: Array<{
    minute: number;
    start_sec: number;
    end_sec: number;
    engagement_score: number;
    gesture_index: number;
    dominant_emotion: string;
    confidence_score: number;
  }>;
  technicalDepth: number;
  interactionIndex: number;
  topicRelevanceScore: number;
  coachFeedback?: {
    performance_summary?: string;
    teaching_style?: { style: string; explanation: string };
    strengths?: string[];
    weaknesses?: string[];
    factual_accuracy_audit?: string[];
    content_metadata?: { titles: string[]; hashtags: string[] };
  };
  videoMetadata: {
    fileName: string;
    storagePath?: string;
  };
}

export default function ReportPage({ params }: { params: { id: string } }) {
  const { showToast } = useToast();
  const router = useRouter();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loadingVideo, setLoadingVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("shikshanetra_token");
    const loggedIn = localStorage.getItem("shikshanetra_logged_in") === "true";
    if (!token && !loggedIn) {
      showToast("Please login to view reports");
      router.push("/login");
      return;
    }

    fetchAnalysisReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const fetchAnalysisReport = async () => {
    try {
      const response = await getWithAuth(`/api/analyze/${params.id}`);

      if (!response.ok) {
        throw new Error("Failed to fetch analysis report");
      }

      const data = await response.json();
      setAnalysis(data.analysis);
    } catch (error) {
      console.error("Error fetching analysis:", error);
      showToast("Failed to load analysis report");
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const loadVideo = async () => {
    if (!analysis?.videoMetadata?.storagePath) {
      showToast("Video not available");
      return;
    }

    setLoadingVideo(true);
    try {
      const response = await getWithAuth(
        `/api/video/signed-url?path=${encodeURIComponent(analysis.videoMetadata.storagePath)}`
      );

      if (!response.ok) {
        throw new Error("Failed to generate video URL");
      }

      const data = await response.json();
      setVideoUrl(data.signedUrl);
    } catch (error) {
      console.error("Error loading video:", error);
      showToast("Failed to load video");
    } finally {
      setLoadingVideo(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-rose-600";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-100";
    if (score >= 60) return "bg-yellow-100";
    return "bg-rose-100";
  };

  // Generate summary text based on scores
  const generateSummary = () => {
    if (!analysis) return "";
    
    const avgScore = (
      analysis.clarityScore +
      analysis.confidenceScore +
      analysis.engagementScore +
      analysis.technicalDepth
    ) / 4;

    let summary = `This teaching session on "${analysis.topic}" demonstrates `;
    
    if (avgScore >= 80) {
      summary += "strong overall performance with excellent clarity, engagement, and technical depth. ";
    } else if (avgScore >= 60) {
      summary += "solid performance with room for improvement in certain areas. ";
    } else {
      summary += "areas that need attention, particularly in engagement and clarity. ";
    }

    if (analysis.coachFeedback?.strengths && analysis.coachFeedback.strengths.length > 0) {
      summary += `Key strengths include ${analysis.coachFeedback.strengths[0].toLowerCase()}. `;
    }

    if (analysis.coachFeedback?.weaknesses && analysis.coachFeedback.weaknesses.length > 0) {
      summary += `Focus areas for improvement: ${analysis.coachFeedback.weaknesses[0].toLowerCase()}.`;
    }

    return summary;
  };

  // Generate time segments from analysis data
  // In a real app, this would come from the API
  const generateTimeSegments = (): TimeSegment[] => {
    if (!analysis) return [];

    const segments: TimeSegment[] = [];

    // Example: Highlight segments based on engagement scores
    // In production, this would come from time-series data
    if (analysis.engagementScore >= 80) {
      segments.push({
        startTime: 0,
        endTime: 120,
        label: "High Engagement Opening",
        type: "highlight",
        description: "Strong student engagement and interaction during introduction",
      });
    }

    if (analysis.clarityScore < 70) {
      segments.push({
        startTime: 300,
        endTime: 420,
        label: "Clarity Issue Detected",
        type: "warning",
        description: "Reduced clarity in explanation - consider slowing pace",
      });
    }

    if (analysis.interactionIndex < 5) {
      segments.push({
        startTime: 600,
        endTime: 720,
        label: "Low Interaction Period",
        type: "issue",
        description: "Minimal student interaction - consider adding questions or activities",
      });
    }

    return segments;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-slate-600">Loading report...</div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-slate-600">Report not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-primary-50/20 py-8">
      <div className="mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link
              href="/dashboard"
              className="mb-2 inline-flex items-center text-sm text-slate-600 hover:text-primary-600"
            >
              ← Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-slate-900">Analysis Report</h1>
            <p className="mt-1 text-sm text-slate-600">
              {formatDate(analysis.createdAt)}
            </p>
          </div>
        </div>

        {/* Summary Text */}
        <Card className="mb-6 p-6 bg-gradient-to-br from-primary-50/50 to-accent-50/30 border-primary-200/50">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">
            Executive Summary
          </h2>
          <p className="text-sm leading-relaxed text-slate-700">
            {generateSummary()}
          </p>
        </Card>

        {/* Key Metrics */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-5 border-2 border-slate-200">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
              Clarity Score
            </p>
            <div className="flex items-baseline gap-2">
              <p className={`text-4xl font-bold ${getScoreColor(analysis.clarityScore)}`}>
                {analysis.clarityScore.toFixed(1)}
              </p>
              <span className="text-sm text-slate-500">/ 100</span>
            </div>
            <div className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-medium ${getScoreBgColor(analysis.clarityScore)} ${getScoreColor(analysis.clarityScore)}`}>
              {analysis.clarityScore >= 80 ? "Excellent" : analysis.clarityScore >= 60 ? "Good" : "Needs Improvement"}
            </div>
          </Card>
          <Card className="p-5 border-2 border-slate-200">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
              Engagement Score
            </p>
            <div className="flex items-baseline gap-2">
              <p className={`text-4xl font-bold ${getScoreColor(analysis.engagementScore)}`}>
                {analysis.engagementScore.toFixed(1)}
              </p>
              <span className="text-sm text-slate-500">/ 100</span>
            </div>
            <div className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-medium ${getScoreBgColor(analysis.engagementScore)} ${getScoreColor(analysis.engagementScore)}`}>
              {analysis.engagementScore >= 80 ? "Excellent" : analysis.engagementScore >= 60 ? "Good" : "Needs Improvement"}
            </div>
          </Card>
          <Card className="p-5 border-2 border-slate-200">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
              Confidence Score
            </p>
            <div className="flex items-baseline gap-2">
              <p className={`text-4xl font-bold ${getScoreColor(analysis.confidenceScore)}`}>
                {analysis.confidenceScore.toFixed(1)}
              </p>
              <span className="text-sm text-slate-500">/ 100</span>
            </div>
            <div className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-medium ${getScoreBgColor(analysis.confidenceScore)} ${getScoreColor(analysis.confidenceScore)}`}>
              {analysis.confidenceScore >= 80 ? "Excellent" : analysis.confidenceScore >= 60 ? "Good" : "Needs Improvement"}
            </div>
          </Card>
          <Card className="p-5 border-2 border-slate-200">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
              Technical Depth
            </p>
            <div className="flex items-baseline gap-2">
              <p className={`text-4xl font-bold ${getScoreColor(analysis.technicalDepth)}`}>
                {analysis.technicalDepth.toFixed(1)}
              </p>
              <span className="text-sm text-slate-500">/ 100</span>
            </div>
            <div className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-medium ${getScoreBgColor(analysis.technicalDepth)} ${getScoreColor(analysis.technicalDepth)}`}>
              {analysis.technicalDepth >= 80 ? "Excellent" : analysis.technicalDepth >= 60 ? "Good" : "Needs Improvement"}
            </div>
          </Card>
        </div>

        {/* Session Info */}
        <Card className="mb-6 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            Session Information
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Topic
              </p>
              <p className="mt-1 text-sm text-slate-900 font-medium">{analysis.topic}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Subject
              </p>
              <p className="mt-1 text-sm text-slate-900">{analysis.subject}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Language
              </p>
              <p className="mt-1 text-sm text-slate-900">{analysis.language}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Session ID
              </p>
              <p className="mt-1 text-xs text-slate-900 font-mono">
                {analysis.sessionId}
              </p>
            </div>
          </div>
        </Card>

        {/* Video Player and Time Segments */}
        <div className="mb-6 grid gap-6 lg:grid-cols-[2fr,1fr]">
          {analysis.videoMetadata?.storagePath && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                Session Recording
              </h2>
              {videoUrl ? (
                <video
                  ref={videoRef}
                  controls
                  className="w-full rounded-lg shadow-lg"
                  src={videoUrl}
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 bg-slate-50 rounded-lg">
                  <p className="text-slate-600 mb-4">Click to load video</p>
                  <button
                    onClick={loadVideo}
                    disabled={loadingVideo}
                    className="btn-primary"
                  >
                    {loadingVideo ? "Loading..." : "Load Video"}
                  </button>
                </div>
              )}
            </Card>
          )}

          {/* Highlighted Time Segments */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              Key Time Segments
            </h2>
            <TimeSegments
              segments={generateTimeSegments()}
              videoRef={videoRef}
            />
          </Card>
        </div>

        {/* Minute-wise Analytics */}
        <div className="mb-6">
          <MinuteWiseAnalytics 
            audioPerMinute={analysis.audioPerMinute}
            videoPerMinute={analysis.videoPerMinute}
            previousMetrics={{
              avgClarityScore: analysis.clarityScore,
              avgConfidenceScore: analysis.confidenceScore,
              avgEngagementScore: analysis.engagementScore,
            }}
          />
        </div>


        {/* Additional Metrics */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <Card className="p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Gesture Index
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {analysis.gestureIndex.toFixed(1)}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Interaction Index
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {analysis.interactionIndex.toFixed(1)}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Dominant Emotion
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900 capitalize">
              {analysis.dominantEmotion}
            </p>
          </Card>
        </div>

        {/* Transcript */}
        {analysis.transcript && (
          <Card className="mb-6 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              Transcript
            </h2>
            <div className="prose prose-sm max-w-none">
              <p className="text-slate-700 whitespace-pre-wrap">{analysis.transcript}</p>
            </div>
          </Card>
        )}

        {/* Coach Feedback */}
        {analysis.coachFeedback && (
          <div className="space-y-6 mb-6">
            {/* Performance Summary */}
            {analysis.coachFeedback.performance_summary && (
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-6">
                <h2 className="text-xl font-semibold text-slate-900 mb-3">
                  💡 Performance Summary
                </h2>
                <p className="text-slate-700 leading-relaxed">
                  {analysis.coachFeedback.performance_summary}
                </p>
              </Card>
            )}

            {/* Teaching Style */}
            {analysis.coachFeedback.teaching_style && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-slate-900 mb-3">
                  🎓 Teaching Style
                </h2>
                <div className="space-y-2">
                  <p className="text-sm font-bold text-purple-600">
                    {analysis.coachFeedback.teaching_style.style}
                  </p>
                  <p className="text-slate-700">
                    {analysis.coachFeedback.teaching_style.explanation}
                  </p>
                </div>
              </Card>
            )}

            {/* Strengths & Weaknesses Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
              {analysis.coachFeedback.strengths && analysis.coachFeedback.strengths.length > 0 && (
                <Card className="border-l-4 border-green-500 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    ✨ Strengths
                  </h3>
                  <ul className="space-y-3">
                    {analysis.coachFeedback.strengths.map((strength, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="text-green-600 text-lg mt-0.5">✓</span>
                        <span className="text-slate-700">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
              {analysis.coachFeedback.weaknesses && analysis.coachFeedback.weaknesses.length > 0 && (
                <Card className="border-l-4 border-orange-500 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    🎯 Areas to Improve
                  </h3>
                  <ul className="space-y-3">
                    {analysis.coachFeedback.weaknesses.map((weakness, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="text-orange-600 text-lg mt-0.5">→</span>
                        <span className="text-slate-700">{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </div>

            {/* Factual Accuracy Audit */}
            {analysis.coachFeedback.factual_accuracy_audit && analysis.coachFeedback.factual_accuracy_audit.length > 0 && (
              <Card className="border-l-4 border-blue-500 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  🔍 Factual Accuracy Audit
                </h3>
                <ul className="space-y-2">
                  {analysis.coachFeedback.factual_accuracy_audit.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-slate-700">
                      <span className="text-blue-600 mt-0.5">→</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Content Metadata */}
            {analysis.coachFeedback.content_metadata && (
              <div className="grid gap-6 lg:grid-cols-2">
                {analysis.coachFeedback.content_metadata.titles && analysis.coachFeedback.content_metadata.titles.length > 0 && (
                  <Card className="bg-purple-50 p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">
                      📺 Video Titles
                    </h3>
                    <ul className="space-y-2">
                      {analysis.coachFeedback.content_metadata.titles.map((title, index) => (
                        <li key={index} className="rounded-lg bg-white p-3 text-sm text-slate-700">
                          {index + 1}. {title}
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}
                {analysis.coachFeedback.content_metadata.hashtags && analysis.coachFeedback.content_metadata.hashtags.length > 0 && (
                  <Card className="bg-pink-50 p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">
                      #️⃣ Hashtags
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {analysis.coachFeedback.content_metadata.hashtags.map((tag, index) => (
                        <span key={index} className="rounded-full bg-white px-3 py-1 text-sm font-medium text-pink-600">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
