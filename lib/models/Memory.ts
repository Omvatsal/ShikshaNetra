import { getDatabase } from "@/lib/db/mongodb";
import {
  MemoryResponse,
  CreateMemoryInput,
  WeaknessField,
} from "@/lib/types/memory";
import { AnalysisResponse } from "@/lib/types/analysis";

const COLLECTION_NAME = "memories";

/* --------------------------------------------------
   Helpers
-------------------------------------------------- */

function mapDocumentToResponse(memory: any): MemoryResponse {
  return {
    id: memory._id.toString(),
    userId: memory.userId,
    totalSessions: memory.totalSessions,
    lastAnalysisDate: memory.lastAnalysisDate,
    lastSessionDate: memory.lastSessionDate,
    clarityScore: memory.clarityScore,
    confidenceScore: memory.confidenceScore,
    engagementScore: memory.engagementScore,
    gestureIndex: memory.gestureIndex,
    technicalDepth: memory.technicalDepth,
    interactionIndex: memory.interactionIndex,
    topicRelevanceScore: memory.topicRelevanceScore,
    weaknesses: memory.weaknesses || [],
    dominantEmotions: memory.dominantEmotions || {},
    frequentDominantEmotion: memory.frequentDominantEmotion,
    subjectsCovered: memory.subjectsCovered || [],
    languagesCovered: memory.languagesCovered || [],
    overallScore: memory.overallScore || 0,
    createdAt: memory.createdAt,
    updatedAt: memory.updatedAt,
  };
}

function createEmptyMetric() {
  return { mean: 0, latest: 0, min: 100, max: 0, trend: 0 };
}

const ALPHA = 0.2;

function updateMetricWithEMA(current: any, next: number) {
  const mean =
    current.mean === 0 ? next : ALPHA * next + (1 - ALPHA) * current.mean;
  return {
    mean,
    latest: next,
    min: Math.min(current.min, next),
    max: Math.max(current.max, next),
    trend: next - current.mean,
  };
}

function identifyWeaknesses(
  metrics: Record<string, { mean: number; latest: number; trend: number }>
): WeaknessField[] {
  const fields = [
    "clarityScore",
    "confidenceScore",
    "engagementScore",
    "gestureIndex",
    "technicalDepth",
    "interactionIndex",
    "topicRelevanceScore",
  ];

  const weaknesses: WeaknessField[] = [];

  for (const field of fields) {
    const m = metrics[field];
    if (!m) continue;

    if (m.latest < 50 || m.latest < 0.75 * m.mean) {
      let trendLabel: "improving" | "declining" | "stable" = "stable";
      if (m.trend > 5) trendLabel = "improving";
      if (m.trend < -5) trendLabel = "declining";

      weaknesses.push({
        fieldName: field,
        averageScore: m.mean,
        latestScore: m.latest,
        occurrences: 1,
        trendLabel,
        lastUpdated: new Date(),
      });
    }
  }

  return weaknesses;
}

/* --------------------------------------------------
   Public API
-------------------------------------------------- */

export async function getMemoryByUserId(
  userId: string
): Promise<MemoryResponse | null> {
  const db = await getDatabase();
  const doc = await db.collection(COLLECTION_NAME).findOne({ userId });
  return doc ? mapDocumentToResponse(doc) : null;
}

export async function createMemory(
  input: CreateMemoryInput
): Promise<MemoryResponse> {
  const db = await getDatabase();

  const doc = {
    userId: input.userId,
    totalSessions: 0,
    clarityScore: createEmptyMetric(),
    confidenceScore: createEmptyMetric(),
    engagementScore: createEmptyMetric(),
    gestureIndex: createEmptyMetric(),
    technicalDepth: createEmptyMetric(),
    interactionIndex: createEmptyMetric(),
    topicRelevanceScore: createEmptyMetric(),
    weaknesses: [],
    dominantEmotions: {},
    frequentDominantEmotion: undefined,
    subjectsCovered: [],
    languagesCovered: [],
    overallScore: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await db.collection(COLLECTION_NAME).insertOne(doc);
  return mapDocumentToResponse({ ...doc, _id: result.insertedId });
}

/* --------------------------------------------------
   🔥 CORE: ATOMIC UPSERT MEMORY UPDATE
-------------------------------------------------- */

export async function updateMemoryFromAnalysis(
  userId: string,
  analysis: AnalysisResponse
): Promise<MemoryResponse> {
  const db = await getDatabase();
  const collection = db.collection(COLLECTION_NAME);

  // Load existing doc ONCE (safe)
  const existing = (await collection.findOne({ userId })) ?? {
    clarityScore: createEmptyMetric(),
    confidenceScore: createEmptyMetric(),
    engagementScore: createEmptyMetric(),
    gestureIndex: createEmptyMetric(),
    technicalDepth: createEmptyMetric(),
    interactionIndex: createEmptyMetric(),
    topicRelevanceScore: createEmptyMetric(),
    weaknesses: [],
    dominantEmotions: {},
    subjectsCovered: [],
    languagesCovered: [],
  };

  const scores = {
    clarityScore: analysis.clarityScore ?? 0,
    confidenceScore: analysis.confidenceScore ?? 0,
    engagementScore: analysis.engagementScore ?? 0,
    gestureIndex: analysis.gestureIndex ?? 0,
    technicalDepth: analysis.technicalDepth ?? 0,
    interactionIndex: analysis.interactionIndex ?? 0,
    topicRelevanceScore: analysis.topicRelevanceScore ?? 0,
  };

  const updatedMetrics = {
    clarityScore: updateMetricWithEMA(
      existing.clarityScore,
      scores.clarityScore
    ),
    confidenceScore: updateMetricWithEMA(
      existing.confidenceScore,
      scores.confidenceScore
    ),
    engagementScore: updateMetricWithEMA(
      existing.engagementScore,
      scores.engagementScore
    ),
    gestureIndex: updateMetricWithEMA(
      existing.gestureIndex,
      scores.gestureIndex
    ),
    technicalDepth: updateMetricWithEMA(
      existing.technicalDepth,
      scores.technicalDepth
    ),
    interactionIndex: updateMetricWithEMA(
      existing.interactionIndex,
      scores.interactionIndex
    ),
    topicRelevanceScore: updateMetricWithEMA(
      existing.topicRelevanceScore,
      scores.topicRelevanceScore
    ),
  };

  // Weakness merge
  const newWeaknesses = identifyWeaknesses(updatedMetrics);
  const merged: Record<string, WeaknessField> = {};

  for (const w of existing.weaknesses || []) merged[w.fieldName] = w;
  for (const w of newWeaknesses) {
    if (merged[w.fieldName]) {
      merged[w.fieldName].occurrences += 1;
      merged[w.fieldName].latestScore = w.latestScore;
      merged[w.fieldName].averageScore = w.averageScore;
      merged[w.fieldName].trendLabel = w.trendLabel;
      merged[w.fieldName].lastUpdated = new Date();
    } else {
      merged[w.fieldName] = w;
    }
  }

  // Emotions
  const emotions = { ...(existing.dominantEmotions || {}) };
  if (analysis.dominantEmotion) {
    emotions[analysis.dominantEmotion] =
      (emotions[analysis.dominantEmotion] || 0) + 1;
  }

  const frequentEmotion = (Object.entries(emotions) as [string, number][]).sort(
    (a, b) => b[1] - a[1]
  )[0]?.[0];

  const subjects = new Set(existing.subjectsCovered || []);
  if (analysis.subject) subjects.add(analysis.subject);

  const languages = new Set(existing.languagesCovered || []);
  if (analysis.language) languages.add(analysis.language);

  const overallScore =
    Object.values(updatedMetrics)
      .map((m) => m.mean)
      .reduce((a, b) => a + b, 0) / Object.keys(updatedMetrics).length;

  // ✅ SINGLE ATOMIC UPSERT
  const result = await collection.findOneAndUpdate(
    { userId },
    {
      $set: {
        ...updatedMetrics,
        weaknesses: Object.values(merged),
        dominantEmotions: emotions,
        frequentDominantEmotion: frequentEmotion,
        subjectsCovered: Array.from(subjects),
        languagesCovered: Array.from(languages),
        overallScore,
        lastAnalysisDate: new Date(),
        lastSessionDate: new Date(),
        updatedAt: new Date(),
      },
      $setOnInsert: {
        userId,
        createdAt: new Date(),
      },
      $inc: { totalSessions: 1 },
    },
    { upsert: true, returnDocument: "after" }
  );

  console.log("MEMORY UPSERT PAYLOAD", {
    set: {
      ...updatedMetrics,
      weaknesses: Object.values(merged),
    },
    setOnInsert: { totalSessions: 0 },
    inc: { totalSessions: 1 },
  });

  let doc = result?.value;

  if (!doc) {
    doc = await collection.findOne({ userId });
  }

  if (!doc) {
    throw new Error("Memory document missing after upsert");
  }

  return mapDocumentToResponse(doc);
}

/* --------------------------------------------------
   Admin helpers
-------------------------------------------------- */

export async function getMemoriesByUserIds(
  userIds: string[]
): Promise<MemoryResponse[]> {
  const db = await getDatabase();
  const docs = await db
    .collection(COLLECTION_NAME)
    .find({ userId: { $in: userIds } })
    .toArray();
  return docs.map(mapDocumentToResponse);
}

export async function deleteMemory(userId: string): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.collection(COLLECTION_NAME).deleteOne({ userId });
  return result.deletedCount === 1;
}
