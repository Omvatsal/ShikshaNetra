import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/db/mongodb";
import {
  Institution,
  InstitutionResponse,
  CreateInstitutionInput,
  UpdateInstitutionInput,
} from "@/lib/types/institution";

const COLLECTION_NAME = "institutions";

export async function createInstitution(
  data: CreateInstitutionInput
): Promise<InstitutionResponse> {
  const db = await getDatabase();
  const collection = db.collection<Institution>(COLLECTION_NAME);

  const now = new Date();
  const doc: Institution = {
    name: data.name,
    userIds: data.userIds ?? [],
    createdAt: now,
    updatedAt: now,
  };

  const result = await collection.insertOne(doc);

  return {
    id: result.insertedId.toString(),
    name: doc.name,
    userIds: doc.userIds,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function getInstitutionById(
  id: string
): Promise<InstitutionResponse | null> {
  const db = await getDatabase();
  const collection = db.collection(COLLECTION_NAME);

  let objectId: ObjectId;
  try {
    objectId = new ObjectId(id);
  } catch {
    return null;
  }

  const inst = await collection.findOne({ _id: objectId });
  if (!inst) return null;

  return {
    id: inst._id.toString(),
    name: inst.name,
    userIds: inst.userIds ?? [],
    createdAt: inst.createdAt,
    updatedAt: inst.updatedAt,
  } as InstitutionResponse;
}

export async function updateInstitution(
  id: string,
  updates: UpdateInstitutionInput
): Promise<InstitutionResponse | null> {
  const db = await getDatabase();
  const collection = db.collection(COLLECTION_NAME);

  let objectId: ObjectId;
  try {
    objectId = new ObjectId(id);
  } catch {
    return null;
  }

  const result = await collection.findOneAndUpdate(
    { _id: objectId },
    { $set: { ...updates, updatedAt: new Date() } },
    { returnDocument: "after" }
  );

  if (!result || !result.value) return null;

  const inst = result.value as Institution;
  return {
    id: inst._id!.toString(),
    name: inst.name,
    userIds: inst.userIds ?? [],
    createdAt: inst.createdAt,
    updatedAt: inst.updatedAt,
  } as InstitutionResponse;
}

export async function deleteInstitution(id: string): Promise<boolean> {
  const db = await getDatabase();
  const collection = db.collection(COLLECTION_NAME);

  let objectId: ObjectId;
  try {
    objectId = new ObjectId(id);
  } catch {
    return false;
  }

  const res = await collection.deleteOne({ _id: objectId });
  return res.deletedCount > 0;
}

export async function addUserToInstitution(
  institutionId: string,
  userId: string
): Promise<InstitutionResponse | null> {
  const db = await getDatabase();
  const collection = db.collection(COLLECTION_NAME);

  let objectId: ObjectId;
  try {
    objectId = new ObjectId(institutionId);
  } catch {
    return null;
  }

  const result = await collection.findOneAndUpdate(
    { _id: objectId },
    { $addToSet: { userIds: userId }, $set: { updatedAt: new Date() } },
    { returnDocument: "after" }
  );

  if (!result || !result.value) return null;
  const inst = result.value as Institution;
  return {
    id: inst._id!.toString(),
    name: inst.name,
    userIds: inst.userIds ?? [],
    createdAt: inst.createdAt,
    updatedAt: inst.updatedAt,
  } as InstitutionResponse;
}

export async function removeUserFromInstitution(
  institutionId: string,
  userId: string
): Promise<InstitutionResponse | null> {
  const db = await getDatabase();
  const collection = db.collection<Institution>(COLLECTION_NAME);

  let objectId: ObjectId;
  try {
    objectId = new ObjectId(institutionId);
  } catch {
    return null;
  }

  const result = await collection.findOneAndUpdate(
    { _id: objectId },
    {
      $pull: { userIds: userId } as any,
      $set: { updatedAt: new Date() },
    },
    { returnDocument: "after" }
  );

  if (!result) return null;
  const inst = result as Institution;
  return {
    id: inst._id!.toString(),
    name: inst.name,
    userIds: inst.userIds ?? [],
    createdAt: inst.createdAt,
    updatedAt: inst.updatedAt,
  } as InstitutionResponse;
}

export async function getInstitutionsByUserId(
  userId: string,
  limit = 10,
  skip = 0
): Promise<InstitutionResponse[]> {
  const db = await getDatabase();
  const collection = db.collection(COLLECTION_NAME);

  const items = await collection
    .find({ userIds: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .toArray();

  return items.map((inst: any) => ({
    id: inst._id.toString(),
    name: inst.name,
    userIds: inst.userIds ?? [],
    createdAt: inst.createdAt,
    updatedAt: inst.updatedAt,
  }));
}
