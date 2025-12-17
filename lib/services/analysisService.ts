import { 
  MLResponse, 
  CreateAnalysisInput, 
  ProcessingStatus 
} from "@/lib/types/analysis";

export function transformMLResponse(
  mlResponse: MLResponse,
  userId: string,
  videoMetadata: any,
  subject: string,
  language: string,
  videoUrl?: string
): Omit<CreateAnalysisInput, "status"> {
  
  // 1. HANDLE FAILURE CASE
  // If the ML service returns false or missing data, we mark everything as failed.
  if (!mlResponse.success || !mlResponse.data) {
    const failedStatus: ProcessingStatus = {
      video: "failed",
      audio: "failed",
      text: "failed",
      overall: "failed"
    };

    return {
      userId,
      videoMetadata,
      subject,
      language,
      videoUrl,
      sessionId: "failed",
      topic: subject,
      transcript: "",
      
      // Zero out scores
      clarityScore: 0,
      confidenceScore: 0,
      audioFeatures: [],
      engagementScore: 0,
      gestureIndex: 0,
      dominantEmotion: "unknown",
      technicalDepth: 0,
      interactionIndex: 0,
      topicMatches: {},
      topicRelevanceScore: 0,
      
      coachFeedbackError: mlResponse.error || "Analysis failed",
      mlResponse,
      
      // NEW: Return the failed granular status
      processingStatus: failedStatus,
    };
  }

  // 2. HANDLE SUCCESS CASE
  // If we have data, it means ML is done with all parts.
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

    // Audio scores
    clarityScore: audioScores.clarity_score,
    confidenceScore: audioScores.confidence_score,
    audioFeatures: audioScores.features || [],

    // Video scores
    engagementScore: videoScores.engagement_score,
    gestureIndex: videoScores.gesture_index,
    dominantEmotion: videoScores.dominant_emotion || "neutral",

    // Text scores
    technicalDepth: textScores.technical_depth,
    interactionIndex: textScores.interaction_index,
    topicMatches: textScores.topic_relevance?.matches || {},
    topicRelevanceScore: textScores.topic_relevance?.relevance_score || 0,

    // Coach feedback
    coachFeedbackError: data.coach_feedback?.error,
    coachSuggestions: data.coach_feedback?.improvements,
    coachStrengths: data.coach_feedback?.strengths,

    // Keep original response for reference
    mlResponse,

    // NEW: Return the fully completed granular status
    processingStatus: completedStatus,
  };
}