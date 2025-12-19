import { ObjectId } from "mongodb";

/**
 * Memory represents aggregated analytics for a user across multiple sessions.
 * Stores statistical summaries using Exponential Moving Average (EMA).
 */

export interface WeaknessField {
  fieldName: string; // e.g., "clarityScore", "engagementScore"
  averageScore: number; // Long-term mean
  latestScore: number; // Most recent score
  occurrences: number; // Number of times identified as weakness
  trendLabel: "improving" | "declining" | "stable";
  lastUpdated: Date;
}

export interface Memory {
  _id?: ObjectId;
  id?: string;
  userId: string;
  
  // Total sessions tracked
  totalSessions: number;
  lastAnalysisDate?: Date;
  
  // === AGGREGATED METRICS (Mean, Median, Latest) ===
  
  // Audio Metrics
  clarityScore: {
    mean: number; // Exponential Moving Average
    latest: number; // Last session value
    min: number; // Historical minimum
    max: number; // Historical maximum
    trend: number; // latestScore - previousMean
  };
  confidenceScore: {
    mean: number;
    latest: number;
    min: number;
    max: number;
    trend: number;
  };
  
  // Video Metrics
  engagementScore: {
    mean: number;
    latest: number;
    min: number;
    max: number;
    trend: number;
  };
  gestureIndex: {
    mean: number;
    latest: number;
    min: number;
    max: number;
    trend: number;
  };
  
  // Text Metrics
  technicalDepth: {
    mean: number;
    latest: number;
    min: number;
    max: number;
    trend: number;
  };
  interactionIndex: {
    mean: number;
    latest: number;
    min: number;
    max: number;
    trend: number;
  };
  topicRelevanceScore: {
    mean: number;
    latest: number;
    min: number;
    max: number;
    trend: number;
  };
  
  // === WEAKNESS ANALYSIS ===
  // Fields that consistently score low across sessions
  weaknesses: WeaknessField[];
  
  // === EMOTIONAL & OTHER PATTERNS ===
  dominantEmotions: {
    [emotion: string]: number; // Frequency count of each emotion
  };
  frequentDominantEmotion?: string; // Most common emotion
  
  // Subject areas covered (for categorization)
  subjectsCovered: string[];
  languagesCovered: string[];
  
  // Overall performance score (0-100)
  overallScore: number;
  
  // === TIMESTAMPS ===
  createdAt: Date;
  updatedAt: Date;
  lastSessionDate?: Date;
}

export interface MemoryResponse extends Omit<Memory, "_id"> {
  id: string;
}

export interface CreateMemoryInput {
  userId: string;
}

export interface UpdateMemoryInput {
  totalSessions?: number;
  lastAnalysisDate?: Date;
  clarityScore?: Memory["clarityScore"];
  confidenceScore?: Memory["confidenceScore"];
  engagementScore?: Memory["engagementScore"];
  gestureIndex?: Memory["gestureIndex"];
  technicalDepth?: Memory["technicalDepth"];
  interactionIndex?: Memory["interactionIndex"];
  topicRelevanceScore?: Memory["topicRelevanceScore"];
  weaknesses?: WeaknessField[];
  dominantEmotions?: { [emotion: string]: number };
  frequentDominantEmotion?: string;
  subjectsCovered?: string[];
  languagesCovered?: string[];
  overallScore?: number;
  lastSessionDate?: Date;
}
