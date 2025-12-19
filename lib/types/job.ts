import { ObjectId } from "mongodb";

export type JobStatus = 
  | "created"
  | "uploading"
  | "uploaded"
  | "analyzing"
  | "analysis_done"
  | "generating_feedback"
  | "completed"
  | "failed";

export interface Job {
  _id?: ObjectId;
  id?: string;
  userId: string;
  analysisId?: string; // Reference to the analysis document
  status: JobStatus;
  progress: number; // 0-100
  error?: string;
  /** Timestamp when the current status started (used for progress estimation). */
  statusStartedAt?: Date;
  videoMetadata?: {
    fileName: string;
    fileSize?: number;
    mimeType?: string;
    storagePath?: string;
    videoUrl?: string;
  };
  subject?: string;
  language?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateJobInput {
  userId: string;
  videoMetadata?: {
    fileName: string;
    fileSize?: number;
    mimeType?: string;
    storagePath?: string;
    videoUrl?: string;
  };
  subject?: string;
  language?: string;
}

export interface UpdateJobInput {
  status?: JobStatus;
  progress?: number;
  error?: string;
  analysisId?: string;
    videoMetadata?: {
      fileName: string;
      fileSize?: number;
      mimeType?: string;
      storagePath?: string;
      videoUrl?: string;
    };
}

export interface JobResponse {
  id: string;
  userId: string;
  analysisId?: string;
  status: JobStatus;
  progress: number;
  error?: string;
  statusStartedAt?: Date;
  videoMetadata?: {
    fileName: string;
    fileSize?: number;
    mimeType?: string;
    storagePath?: string;
    videoUrl?: string;
  };
  subject?: string;
  language?: string;
  createdAt: Date;
  updatedAt: Date;
}
