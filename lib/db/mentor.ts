import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/db/mongodb";
// Notice the import path below points to the types folder
import {
  Mentor,
  MentorResponse,
  CreateMentorInput,
  UpdateMentorInput,
  MentorSearchFilters,
  InstitutionReport,
} from "@/lib/types/mentor";

const COLLECTION_NAME = "mentors";

function mapDocumentToResponse(doc: any): MentorResponse {
  return {
    id: doc._id.toString(),
    userId: doc.userId,
    name: doc.name,
    email: doc.email,
    institutionId: doc.institutionId,
    stats: doc.stats || { classesTaken: 0, averageRating: 0, feedbackStatus: "Average" },
    isActive: doc.isActive ?? true,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function createMentor(
  mentorData: CreateMentorInput
): Promise<MentorResponse> {
  const db = await getDatabase();
  const collection = db.collection(COLLECTION_NAME);

  const mentor = {
    ...mentorData,
    stats: mentorData.stats || { 
      classesTaken: 0, 
      averageRating: 0, 
      feedbackStatus: "Average" 
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await collection.insertOne(mentor);
  return mapDocumentToResponse({ ...mentor, _id: result.insertedId });
}

export async function getMentorById(id: string): Promise<MentorResponse | null> {
  const db = await getDatabase();
  const collection = db.collection(COLLECTION_NAME);

  let objectId;
  try {
    objectId = new ObjectId(id);
  } catch {
    return null;
  }

  const mentor = await collection.findOne({ _id: objectId });
  if (!mentor) return null;

  return mapDocumentToResponse(mentor);
}

export async function getMentorByUserId(userId: string): Promise<MentorResponse | null> {
  const db = await getDatabase();
  const collection = db.collection(COLLECTION_NAME);

  const mentor = await collection.findOne({ userId });
  if (!mentor) return null;

  return mapDocumentToResponse(mentor);
}

export async function updateMentor(
  id: string,
  updates: UpdateMentorInput
): Promise<MentorResponse | null> {
  const db = await getDatabase();
  const collection = db.collection(COLLECTION_NAME);

  let objectId;
  try {
    objectId = new ObjectId(id);
  } catch {
    return null;
  }

  const updateQuery: any = {
    ...updates,
    updatedAt: new Date(),
  };

  const result = await collection.findOneAndUpdate(
    { _id: objectId },
    { $set: updateQuery },
    { returnDocument: "after" }
  );

  if (!result || !result.value) return null;
  return mapDocumentToResponse(result.value);
}

export async function deleteMentor(id: string): Promise<boolean> {
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

export async function searchMentors(
  filters: MentorSearchFilters,
  limit = 20,
  skip = 0
): Promise<MentorResponse[]> {
  const db = await getDatabase();
  const collection = db.collection(COLLECTION_NAME);

  const query: any = { institutionId: filters.institutionId };

  if (filters.isActive !== undefined) query.isActive = filters.isActive;
  
  if (filters.name) {
    query.name = { $regex: filters.name, $options: "i" };
  }

  if (filters.minRating !== undefined) {
    query["stats.averageRating"] = { $gte: filters.minRating };
  }

  const mentors = await collection
    .find(query)
    .sort({ "stats.averageRating": -1 })
    .limit(limit)
    .skip(skip)
    .toArray();

  return mentors.map(mapDocumentToResponse);
}

export async function getInstitutionAnalysis(institutionId: string): Promise<InstitutionReport> {
  const db = await getDatabase();
  const collection = db.collection(COLLECTION_NAME);

  const mentorsRaw = await collection
    .find({ institutionId })
    .toArray();
    
  const mentors = mentorsRaw.map(mapDocumentToResponse);
  const totalMentors = mentors.length;

  const totalRating = mentors.reduce((sum, m) => sum + m.stats.averageRating, 0);
  const avgRating = totalMentors > 0 ? (totalRating / totalMentors) : 0;

  return {
    institutionId,
    totalMentors,
    averageInstitutionRating: Number(avgRating.toFixed(2)),
    mentors, 
  };
}