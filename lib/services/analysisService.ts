import { 
  MLResponse, 
  CreateAnalysisInput, 
  ProcessingStatus 
} from "@/lib/types/analysis";

function toUserFriendlyFailureMessage(raw: unknown): string {
  const message = typeof raw === "string" ? raw : (raw as any)?.message;
  const msg = (message || "").toString();
  const lower = msg.toLowerCase();

  if (!msg) return "Analysis failed. Please try again.";
  if (lower.includes("timeout") || lower.includes("timed out")) {
    return "Analysis timed out. Please try again with a shorter video or retry later.";
  }
  if (lower.includes("rate") && (lower.includes("limit") || lower.includes("429"))) {
    return "The analysis service is busy (rate-limited). Please wait a minute and try again.";
  }
  if (lower.includes("unauthorized") || lower.includes("forbidden") || lower.includes("401") || lower.includes("403")) {
    return "The analysis service rejected the request. Please try again.";
  }
  if (lower.includes("network") || lower.includes("fetch") || lower.includes("econn") || lower.includes("enotfound")) {
    return "Network error while contacting the analysis service. Please check your connection and try again.";
  }

  // Fallback: keep it short and readable
  return msg.length > 180 ? `${msg.slice(0, 180)}…` : msg;
}

function assertValidMLData(mlResponse: MLResponse): asserts mlResponse is Required<Pick<MLResponse, "success" | "data">> & MLResponse {
  if (!mlResponse.success || !mlResponse.data) {
    throw new Error(toUserFriendlyFailureMessage(mlResponse.error || "Analysis failed"));
  }

  const d: any = mlResponse.data;
  const hasScores = d?.scores?.audio && d?.scores?.video && d?.scores?.text;
  if (!hasScores) {
    throw new Error("The analysis service returned an incomplete response. Please try again.");
  }

  const audio = d.scores.audio;
  const video = d.scores.video;
  const text = d.scores.text;

  const requiredNumbers: Array<[string, any]> = [
    ["audio.overall.clarity_score", audio?.overall?.clarity_score],
    ["audio.overall.confidence_score", audio?.overall?.confidence_score],
    ["video.overall.engagement_score", video?.overall?.engagement_score],
    ["video.overall.gesture_index", video?.overall?.gesture_index],
    ["text.technical_depth", text?.technical_depth],
    ["text.interaction_index", text?.interaction_index],
  ];

  for (const [label, value] of requiredNumbers) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new Error(`The analysis service returned invalid "${label}". Please try again.`);
    }
  }
}

export function transformMLResponse(
  mlResponse: MLResponse,
  userId: string,
  videoMetadata: any,
  subject: string,
  language: string,
  videoUrl?: string
): Omit<CreateAnalysisInput, "status"> {
  // Fail fast: do NOT create placeholder/zeroed analyses on ML failure.
  assertValidMLData(mlResponse);

  const data = mlResponse.data;
  const audioScores = data.scores.audio;
  const videoScores = data.scores.video;
  const textScores = data.scores.text;

  const completedStatus: ProcessingStatus = {
    video: "completed",
    audio: "completed",
    text: "completed",
    overall: "completed"
  };

  return {
    userId,
    videoMetadata,
    subject,
    language,
    videoUrl,

    // Session info
    sessionId: data.session_id,
    topic: data.topic,
    transcript: data.transcript,

    // Audio scores (overall + per-minute)
    clarityScore: audioScores.overall.clarity_score,
    confidenceScore: audioScores.overall.confidence_score,
    audioPerMinute: audioScores.per_minute || [],

    // Video scores (overall + per-minute)
    engagementScore: videoScores.overall.engagement_score,
    gestureIndex: videoScores.overall.gesture_index,
    dominantEmotion: videoScores.overall.dominant_emotion || "neutral",
    videoConfidenceScore: videoScores.overall.confidence_score,
    videoPerMinute: videoScores.per_minute || [],

    // Text scores
    technicalDepth: textScores.technical_depth,
    interactionIndex: textScores.interaction_index,
    topicMatches: textScores.topic_relevance?.matches || {},
    topicRelevanceScore: textScores.topic_relevance?.relevance_score || 0,

    // Coach feedback is added separately after feedback generation
    // Not included in initial ML response

    // Keep original response for reference
    mlResponse,

    // NEW: Return the fully completed granular status
    processingStatus: completedStatus,
  };
}