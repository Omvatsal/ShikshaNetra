import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/db/mongodb";
import {
  Job,
  JobResponse,
  CreateJobInput,
  UpdateJobInput,
} from "@/lib/types/job";

const COLLECTION_NAME = "jobs";

function clampProgress(progress: unknown): number {
  const n = typeof progress === "number" ? progress : Number(progress);
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n)));
}

function omitUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const next: Partial<T> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) (next as any)[key] = value;
  }
  return next;
}

function mapDocumentToResponse(doc: any): JobResponse {
  return {
    id: doc._id.toString(),
    userId: doc.userId,
    analysisId: doc.analysisId,
    status: doc.status,
    progress: clampProgress(doc.progress),
    error: doc.error,
    statusStartedAt: doc.statusStartedAt,
    videoMetadata: doc.videoMetadata,
    subject: doc.subject,
    language: doc.language,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  } as JobResponse;
}

/**
 * Create a new job
 */
export async function createJob(input: CreateJobInput): Promise<JobResponse> {
  const db = await getDatabase();
  const collection = db.collection(COLLECTION_NAME);

  const now = new Date();
  const job: Job = {
    userId: input.userId,
    status: "created",
    progress: 0,
    statusStartedAt: now,
    videoMetadata: input.videoMetadata,
    subject: input.subject,
    language: input.language,
    createdAt: now,
    updatedAt: now,
  };

  const result = await collection.insertOne(job);
  
  return mapDocumentToResponse({
    ...job,
    _id: result.insertedId,
  });
}

/**
 * Get job by ID
 */
export async function getJobById(
  jobId: string,
  userId?: string
): Promise<JobResponse | null> {
  const db = await getDatabase();
  const collection = db.collection(COLLECTION_NAME);

  let objectId: ObjectId;
  try {
    objectId = new ObjectId(jobId);
  } catch {
    return null;
  }

  const query: any = { _id: objectId };
  if (userId) {
    query.userId = userId;
  }

  const job = await collection.findOne(query);
  if (!job) return null;

  return mapDocumentToResponse(job);
}

/**
 * Update job
 */
export async function updateJob(
  jobId: string,
  update: UpdateJobInput
): Promise<JobResponse | null> {
  const db = await getDatabase();
  const collection = db.collection(COLLECTION_NAME);

  let objectId: ObjectId;
  try {
    objectId = new ObjectId(jobId);
  } catch {
    return null;
  }

  const now = new Date();
  const updateDoc = omitUndefined({
    ...update,
    ...(update.progress !== undefined
      ? { progress: clampProgress(update.progress) }
      : {}),
    ...(update.status !== undefined ? { statusStartedAt: now } : {}),
    updatedAt: now,
  });

  const result: any = await collection.findOneAndUpdate(
    { _id: objectId },
    { $set: updateDoc },
    { returnDocument: "after" }
  );

  if (!result || !result.value) return null;

  return mapDocumentToResponse(result.value);
}

/**
 * Get all jobs for a user
 */
export async function getUserJobs(
  userId: string,
  limit: number = 20
): Promise<JobResponse[]> {
  const db = await getDatabase();
  const collection = db.collection(COLLECTION_NAME);

  const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 100) : 20;

  const jobs = await collection
    .find({ userId })
    .sort({ createdAt: -1 })
    .limit(safeLimit)
    .toArray();

  return jobs.map(mapDocumentToResponse);
}

/**
 * Delete job
 */
export async function deleteJob(jobId: string, userId: string): Promise<boolean> {
  const db = await getDatabase();
  const collection = db.collection(COLLECTION_NAME);

  let objectId: ObjectId;
  try {
    objectId = new ObjectId(jobId);
  } catch {
    return false;
  }

  const result = await collection.deleteOne({
    _id: objectId,
    userId,
  });

  return result.deletedCount === 1;
}

/**
 * Get all incomplete jobs (for restart on server startup)
 */
/**
 * Get incomplete jobs (excludes completed and failed jobs)
 * Only restarts jobs that were interrupted by server shutdown, not user errors
 */
export async function getIncompleteJobs(): Promise<JobResponse[]> {
  const db = await getDatabase();
  const collection = db.collection(COLLECTION_NAME);

  // Find jobs that are not completed or failed
  // Failed jobs are NOT restarted - only interrupted processing jobs
  const jobs = await collection
    .find({
      status: {
        $in: ["created", "uploading", "uploaded", "analyzing", "analysis_done", "generating_feedback"]
      }
    })
    .sort({ createdAt: 1 }) // Process oldest first
    .toArray();

  return jobs.map(mapDocumentToResponse);
}

/**
 * Mark incomplete jobs as failed (called on server shutdown/restart)
 */
export async function failIncompleteJobs(reason: string = "Server restarted"): Promise<number> {
  const db = await getDatabase();
  const collection = db.collection(COLLECTION_NAME);

  const result = await collection.updateMany(
    {
      status: {
        $in: ["created", "uploading", "uploaded", "analyzing", "analysis_done", "generating_feedback"]
      }
    },
    {
      $set: {
        status: "failed",
        error: reason,
        updatedAt: new Date()
      }
    }
  );

  return result.modifiedCount;
}

