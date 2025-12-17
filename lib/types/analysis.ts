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

// --- ML RESPONSE STRUCTURES ---
export interface AudioScores {
  clarity_score: number;
  confidence_score: number;
  features?: number[];
}

export interface VideoScores {
  engagement_score: number;
  gesture_index: number;
  dominant_emotion?: string;
}

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

export interface CoachFeedback {
  performance_summary?: string;
  strengths?: string[];
  improvements?: string[];
  error?: string;
}

export interface MLResponse {
  success: boolean;
  data?: {
    session_id: string;
    topic: string;
    transcript: string;
    scores: Scores;
    coach_feedback?: CoachFeedback;
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
  
  // Audio scores
  clarityScore?: number;
  confidenceScore?: number;
  audioFeatures?: number[];
  
  // Video scores
  engagementScore?: number;
  gestureIndex?: number;
  dominantEmotion?: string;
  
  // Text scores
  technicalDepth?: number;
  interactionIndex?: number;
  topicMatches?: TopicMatches;
  topicRelevanceScore?: number;
  
  // Coach feedback
  coachFeedbackError?: string;
  coachSuggestions?: string[];
  coachStrengths?: string[];
  
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
  audioFeatures?: number[];
  engagementScore?: number;
  gestureIndex?: number;
  dominantEmotion?: string;
  technicalDepth?: number;
  interactionIndex?: number;
  topicMatches?: TopicMatches;
  topicRelevanceScore?: number;
  
  coachFeedbackError?: string;
  coachSuggestions?: string[];
  coachStrengths?: string[];
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
  audioFeatures?: number[];
  engagementScore?: number;
  gestureIndex?: number;
  dominantEmotion?: string;
  technicalDepth?: number;
  interactionIndex?: number;
  topicMatches?: TopicMatches;
  topicRelevanceScore?: number;
  
  coachFeedbackError?: string;
  coachSuggestions?: string[];
  coachStrengths?: string[];
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