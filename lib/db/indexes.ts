import { getDatabase } from "@/lib/db/mongodb";

/**
 * Create indexes for the analyses collection to optimize queries
 * Run this once during deployment or database setup
 */
export async function createAnalysisIndexes() {
  const db = await getDatabase();
  const collection = db.collection("analyses");

  try {
    // Index on userId for user-specific queries
    await collection.createIndex({ userId: 1 });

    // Index on status for filtering
    await collection.createIndex({ status: 1 });

    // Index on subject for filtering
    await collection.createIndex({ subject: 1 });

    // Index on topic for search
    await collection.createIndex({ topic: "text" });

    // Index on transcript for full-text search
    await collection.createIndex({ transcript: "text" });

    // Compound index for userId + status
    await collection.createIndex({ userId: 1, status: 1 });

    // Index on scores for range queries
    await collection.createIndex({ clarityScore: 1 });
    await collection.createIndex({ confidenceScore: 1 });
    await collection.createIndex({ engagementScore: 1 });
    await collection.createIndex({ technicalDepth: 1 });

    // Index on emotion for filtering
    await collection.createIndex({ dominantEmotion: 1 });

    // Index on createdAt for date range queries and sorting
    await collection.createIndex({ createdAt: -1 });

    // Compound index for userId + createdAt (most common query pattern)
    await collection.createIndex({ userId: 1, createdAt: -1 });

    console.log("Analysis collection indexes created successfully");
    return { success: true };
  } catch (error) {
    console.error("Error creating indexes:", error);
    throw error;
  }
}

/**
 * Create indexes for the users collection
 */
export async function createUserIndexes() {
  const db = await getDatabase();
  const collection = db.collection("users");

  try {
    // Unique index on email
    await collection.createIndex({ email: 1 }, { unique: true });

    // Index on role for filtering
    await collection.createIndex({ role: 1 });

    // Index on institutionId for org-scoped queries
    await collection.createIndex({ institutionId: 1 });

    console.log("User collection indexes created successfully");
    return { success: true };
  } catch (error) {
    console.error("Error creating user indexes:", error);
    throw error;
  }
}

/**
 * Create indexes for the institutions collection
 */
export async function createInstitutionIndexes() {
  const db = await getDatabase();
  const collection = db.collection("institutions");

  try {
    // Optional unique index on name; if names can duplicate, remove unique flag
    await collection.createIndex({ name: 1 }, { unique: true });
    await collection.createIndex({ createdAt: -1 });
    await collection.createIndex({ userIds: 1 });

    console.log("Institution collection indexes created successfully");
    return { success: true };
  } catch (error) {
    console.error("Error creating institution indexes:", error);
    throw error;
  }
}

/**
 * Create all database indexes
 */
export async function createAllIndexes() {
  await createUserIndexes();
  await createAnalysisIndexes();
  await createInstitutionIndexes();
  console.log("All database indexes created successfully");
}
