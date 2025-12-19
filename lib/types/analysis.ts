import { ObjectId } from "mongodb";

export interface VideoMetadata {
  fileName: string;
  fileSize?: number;
  duration?: number;
  mimeType?: string;
  storagePath?: string;
}

// --- NEW STATUS TYPES (Waterfall Logic) ---
export type ComponentStatus = "pending" | "processing" | "completed" | "failed";

export interface ProcessingStatus {
  video: ComponentStatus;
  audio: ComponentStatus;
  text: ComponentStatus;
  overall: ComponentStatus; // "completed" only when ALL 3 are done
}

// --- ML RESPONSE STRUCTURES (Updated for new API format) ---

// Per-minute audio scores
export interface AudioPerMinute {
  minute: number;
  start_sec: number;
  end_sec: number;
  clarity_score: number;
  confidence_score: number;
}

export interface AudioOverall {
  clarity_score: number;
  confidence_score: number;
}

export interface AudioScores {
  per_minute: AudioPerMinute[];
  overall: AudioOverall;
}

// Per-minute video scores
export interface VideoPerMinute {
  minute: number;
  engagement_score: number;
  gesture_index: number;
  dominant_emotion: string;
  confidence_score: number;
}

export interface VideoOverall {
  engagement_score: number;
  gesture_index: number;
  confidence_score: number;
  dominant_emotion: string;
}

export interface VideoScores {
  per_minute: VideoPerMinute[];
  overall: VideoOverall;
}

// Topic relevance
export interface TopicMatches {
  [key: string]: number;
}

export interface TopicRelevance {
  matches: TopicMatches;
  relevance_score: number;
}

export interface TextScores {
  technical_depth: number;
  interaction_index: number;
  topic_relevance?: TopicRelevance;
}

export interface Scores {
  audio: AudioScores;
  video: VideoScores;
  text: TextScores;
}

// Teaching style for coach feedback
export interface TeachingStyle {
  style: string;
  explanation: string;
}

// Content metadata for coach feedback
export interface ContentMetadata {
  titles: string[];
  hashtags: string[];
}

// Enhanced coach feedback with all features
export interface CoachFeedback {
  performance_summary: string;
  teaching_style: TeachingStyle;
  strengths: string[];
  weaknesses: string[];
  factual_accuracy_audit: string[];
  content_metadata: ContentMetadata;
  multilingual_feedback?: string | null;
  error?: string;
}

// Metadata from ML response
export interface MLMetadata {
  processing_time_sec: number;
}

export interface MLResponse {
  success: boolean;
  data?: {
    session_id: string;
    topic: string;
    transcript: string;
    scores: Scores;
    metadata?: MLMetadata;
    coach_feedback?: CoachFeedback; // Will be added after separate GenAI call
  };
  error?: string | null;
}

// --- MAIN ANALYSIS INTERFACE ---
export interface Analysis {
  _id?: ObjectId;
  id?: string;
  userId: string;
  videoMetadata?: VideoMetadata; // Made optional for initial create
  subject: string;
  language: string;
  videoUrl?: string;
  
  // Flattened ML response fields
  sessionId?: string;
  topic?: string;
  transcript?: string;
  
  // Audio scores (overall)
  clarityScore?: number;
  confidenceScore?: number;
  audioPerMinute?: AudioPerMinute[]; // Store per-minute audio data
  
  // Video scores (overall)
  engagementScore?: number;
  gestureIndex?: number;
  dominantEmotion?: string;
  videoConfidenceScore?: number; // Video-specific confidence
  videoPerMinute?: VideoPerMinute[]; // Store per-minute video data
  
  // Text scores
  technicalDepth?: number;
  interactionIndex?: number;
  topicMatches?: TopicMatches;
  topicRelevanceScore?: number;
  
  // Coach feedback (enhanced)
  coachFeedback?: CoachFeedback;
  coachFeedbackError?: string;
  
  // Original ML response
  mlResponse?: MLResponse;
  
  // *** GRANULAR STATUS ***
  processingStatus: ProcessingStatus;
  
  // Legacy status
  status?: "processing" | "completed" | "failed"; 

  // *** NEW: PROGRESS FIELD ***
  progress: number; 

  createdAt?: Date;
  updatedAt?: Date;
}

export interface AnalysisResponse extends Omit<Analysis, "_id"> {
  id: string;
}

export interface CreateAnalysisInput {
  userId: string;
  subject: string;
  language: string;
  
  // Optional on Create (because we fill them later)
  videoMetadata?: VideoMetadata; 
  videoUrl?: string;
  sessionId?: string;
  topic?: string;
  transcript?: string;
  
  // Scores (Optional initially)
  clarityScore?: number;
  confidenceScore?: number;
  audioPerMinute?: AudioPerMinute[];
  engagementScore?: number;
  gestureIndex?: number;
  dominantEmotion?: string;
  videoConfidenceScore?: number;
  videoPerMinute?: VideoPerMinute[];
  technicalDepth?: number;
  interactionIndex?: number;
  topicMatches?: TopicMatches;
  topicRelevanceScore?: number;
  
  coachFeedback?: CoachFeedback;
  coachFeedbackError?: string;
  mlResponse?: MLResponse;
  
  processingStatus?: Partial<ProcessingStatus>;
  status?: "processing" | "completed" | "failed";
  
  // *** NEW: Allow setting initial progress ***
  progress?: number; 
}

export interface UpdateAnalysisInput {
  videoMetadata?: VideoMetadata;
  subject?: string;
  language?: string;
  videoUrl?: string;
  sessionId?: string;
  topic?: string;
  transcript?: string;
  
  // Scores
  clarityScore?: number;
  confidenceScore?: number;
  audioPerMinute?: AudioPerMinute[];
  engagementScore?: number;
  gestureIndex?: number;
  dominantEmotion?: string;
  videoConfidenceScore?: number;
  videoPerMinute?: VideoPerMinute[];
  technicalDepth?: number;
  interactionIndex?: number;
  topicMatches?: TopicMatches;
  topicRelevanceScore?: number;
  
  coachFeedback?: CoachFeedback;
  coachFeedbackError?: string;
  mlResponse?: MLResponse;
  
  processingStatus?: Partial<ProcessingStatus>;
  status?: "processing" | "completed" | "failed";
  
  // *** NEW: Allow updating progress ***
  progress?: number;
}

export interface AnalysisStats {
  processing?: number;
  completed?: number;
  failed?: number;
}

export interface AnalysisSearchFilters {
  userId?: string;
  subject?: string;
  minClarityScore?: number;
  minConfidenceScore?: number;
  minEngagementScore?: number;
  minTechnicalDepth?: number;
  dominantEmotion?: string;
  topic?: string;
  
  status?: "processing" | "completed" | "failed";
  
  fromDate?: Date;
  toDate?: Date;
}