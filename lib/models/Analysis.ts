import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/db/mongodb";
import {
  AnalysisResponse,
  CreateAnalysisInput,
  UpdateAnalysisInput,
  AnalysisStats,
  ProcessingStatus
} from "@/lib/types/analysis";

const COLLECTION_NAME = "analyses";

/**
 * Helper to map DB document to Response Type using your explicit mapping style.
 * Ensures 'processingStatus' and 'progress' are correctly populated.
 */
function mapDocumentToResponse(analysis: any): AnalysisResponse {
  return {
    id: analysis._id.toString(),
    userId: analysis.userId,
    videoMetadata: analysis.videoMetadata,
    subject: analysis.subject,
    language: analysis.language,
    videoUrl: analysis.videoUrl,
    sessionId: analysis.sessionId,
    topic: analysis.topic,
    transcript: analysis.transcript,
    clarityScore: analysis.clarityScore,
    confidenceScore: analysis.confidenceScore,
    audioFeatures: analysis.audioFeatures,
    engagementScore: analysis.engagementScore,
    gestureIndex: analysis.gestureIndex,
    dominantEmotion: analysis.dominantEmotion,
    technicalDepth: analysis.technicalDepth,
    interactionIndex: analysis.interactionIndex,
    topicMatches: analysis.topicMatches,
    topicRelevanceScore: analysis.topicRelevanceScore,
    coachFeedbackError: analysis.coachFeedbackError,
    coachSuggestions: analysis.coachSuggestions,
    coachStrengths: analysis.coachStrengths,
    mlResponse: analysis.mlResponse,
    
    // --- STATUS & PROGRESS LOGIC ---
    processingStatus: analysis.processingStatus || {
      video: "completed",
      audio: "completed",
      text: "completed",
      overall: analysis.status || "completed"
    },
    // Keep legacy status synced
    status: analysis.processingStatus?.overall || analysis.status || "processing",
    
    // NEW: Progress field (0-100)
    progress: analysis.progress || 0,
    
    createdAt: analysis.createdAt,
    updatedAt: analysis.updatedAt,
  } as AnalysisResponse;
}

export async function createAnalysis(
  analysisData: CreateAnalysisInput
): Promise<AnalysisResponse> {
  const db = await getDatabase();
  const collection = db.collection(COLLECTION_NAME);

  // STRICT WATERFALL START
  const initialStatus: ProcessingStatus = {
    video: "processing", 
    audio: "pending",    
    text: "pending",     
    overall: "processing"
  };

  const analysis = {
    ...analysisData,
    processingStatus: initialStatus,
    status: "processing",
    progress: 0, // <--- Initialize progress at 0
    
    // Initialize defaults
    clarityScore: analysisData.clarityScore || 0,
    confidenceScore: analysisData.confidenceScore || 0,
    engagementScore: analysisData.engagementScore || 0,
    technicalDepth: analysisData.technicalDepth || 0,
    interactionIndex: analysisData.interactionIndex || 0,
    topicRelevanceScore: analysisData.topicRelevanceScore || 0,
    
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await collection.insertOne(analysis);

  return mapDocumentToResponse({ ...analysis, _id: result.insertedId });
}

export async function getAnalysisById(id: string): Promise<AnalysisResponse | null> {
  const db = await getDatabase();
  const collection = db.collection(COLLECTION_NAME);

  let objectId;
  try {
    objectId = new ObjectId(id);
  } catch {
    return null;
  }

  const analysis = await collection.findOne({ _id: objectId });
  if (!analysis) return null;

  return mapDocumentToResponse(analysis);
}

export async function getAnalysesByUserId(
  userId: string,
  limit = 10,
  skip = 0
): Promise<AnalysisResponse[]> {
  const db = await getDatabase();
  const collection = db.collection(COLLECTION_NAME);

  const analyses = await collection
    .find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .toArray();

  return analyses.map(mapDocumentToResponse);
}

export async function updateAnalysis(
  id: string,
  updates: UpdateAnalysisInput & { progress?: number } // Explicitly allow progress updates
): Promise<AnalysisResponse | null> {
  const db = await getDatabase();
  const collection = db.collection(COLLECTION_NAME);

  let objectId;
  try {
    objectId = new ObjectId(id);
  } catch {
    return null;
  }

  // Fetch current state for Waterfall Logic
  const currentDoc = await collection.findOne({ _id: objectId });
  if (!currentDoc) return null;

  const currentStatus = (currentDoc.processingStatus || {
    video: "pending", audio: "pending", text: "pending", overall: "processing"
  }) as ProcessingStatus;

  // Prepare Update
  const updateQuery: any = { 
    $set: { 
      updatedAt: new Date(),
      ...updates 
    } 
  };

  // --- WATERFALL LOGIC ---
  if (updates.processingStatus) {
    const newStatus = { ...currentStatus };

    if (updates.processingStatus.video) {
      newStatus.video = updates.processingStatus.video;
      if (updates.processingStatus.video === "completed") newStatus.audio = "processing"; 
    }

    if (updates.processingStatus.audio) {
      newStatus.audio = updates.processingStatus.audio;
      if (updates.processingStatus.audio === "completed") newStatus.text = "processing";
    }

    if (updates.processingStatus.text) {
      newStatus.text = updates.processingStatus.text;
      if (updates.processingStatus.text === "completed") newStatus.overall = "completed";
    }

    if (newStatus.video === "failed" || newStatus.audio === "failed" || newStatus.text === "failed") {
      newStatus.overall = "failed";
    }

    delete updateQuery.$set.processingStatus;
    updateQuery.$set.processingStatus = newStatus;
    updateQuery.$set.status = newStatus.overall;
  }

  const result = await collection.findOneAndUpdate(
    { _id: objectId },
    updateQuery,
    { returnDocument: "after" }
  );

  if (!result || !result.value) return null;

  return mapDocumentToResponse(result.value);
}

export async function deleteAnalysis(id: string): Promise<boolean> {
  const db = await getDatabase();
  const collection = db.collection(COLLECTION_NAME);

  let objectId;
  try {
    objectId = new ObjectId(id);
  } catch {
    return false;
  }

  const result = await collection.deleteOne({ _id: objectId });
  return result.deletedCount > 0;
}

export async function getAnalysisStats(userId: string): Promise<AnalysisStats> {
  const db = await getDatabase();
  const collection = db.collection(COLLECTION_NAME);

  const stats = await collection
    .aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ])
    .toArray();

  return stats.reduce((acc, stat) => {
    acc[stat._id as string] = stat.count;
    return acc;
  }, {} as AnalysisStats);
}

export async function searchAnalyses(
  filters: import("@/lib/types/analysis").AnalysisSearchFilters,
  limit = 10,
  skip = 0
): Promise<AnalysisResponse[]> {
  const db = await getDatabase();
  const collection = db.collection(COLLECTION_NAME);

  const query: any = {};

  if (filters.userId) query.userId = filters.userId;
  if (filters.subject) query.subject = filters.subject;
  if (filters.topic) query.topic = { $regex: filters.topic, $options: "i" };
  if (filters.dominantEmotion) query.dominantEmotion = filters.dominantEmotion;
  if (filters.status) query.status = filters.status;

  if (filters.minClarityScore !== undefined) query.clarityScore = { $gte: filters.minClarityScore };
  if (filters.minConfidenceScore !== undefined) query.confidenceScore = { $gte: filters.minConfidenceScore };
  if (filters.minEngagementScore !== undefined) query.engagementScore = { $gte: filters.minEngagementScore };
  if (filters.minTechnicalDepth !== undefined) query.technicalDepth = { $gte: filters.minTechnicalDepth };

  if (filters.fromDate || filters.toDate) {
    query.createdAt = {};
    if (filters.fromDate) query.createdAt.$gte = filters.fromDate;
    if (filters.toDate) query.createdAt.$lte = filters.toDate;
  }

  const analyses = await collection
    .find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .toArray();

  // Using your Explicit Return Mapping
  return analyses.map((analysis) => ({
    id: analysis._id.toString(),
    userId: analysis.userId,
    videoMetadata: analysis.videoMetadata,
    subject: analysis.subject,
    language: analysis.language,
    videoUrl: analysis.videoUrl,
    sessionId: analysis.sessionId,
    topic: analysis.topic,
    transcript: analysis.transcript,
    clarityScore: analysis.clarityScore,
    confidenceScore: analysis.confidenceScore,
    audioFeatures: analysis.audioFeatures,
    engagementScore: analysis.engagementScore,
    gestureIndex: analysis.gestureIndex,
    dominantEmotion: analysis.dominantEmotion,
    technicalDepth: analysis.technicalDepth,
    interactionIndex: analysis.interactionIndex,
    topicMatches: analysis.topicMatches,
    topicRelevanceScore: analysis.topicRelevanceScore,
    coachFeedbackError: analysis.coachFeedbackError,
    coachSuggestions: analysis.coachSuggestions,
    coachStrengths: analysis.coachStrengths,
    mlResponse: analysis.mlResponse,
    
    // Status fields mapped explicitly
    processingStatus: analysis.processingStatus || {
        video: "completed", audio: "completed", text: "completed", overall: analysis.status || "completed"
    },
    status: analysis.status || "processing",
    progress: analysis.progress || 0, // <--- Mapped progress here
    
    createdAt: analysis.createdAt,
    updatedAt: analysis.updatedAt,
  })) as AnalysisResponse[];
}