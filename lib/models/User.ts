import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/db/mongodb";
import { User, UserResponse, CreateUserInput, UpdateUserInput } from "@/lib/types/user";

const COLLECTION_NAME = "users";

export async function createUser(userData: CreateUserInput): Promise<UserResponse> {
  const db = await getDatabase();
  const collection = db.collection(COLLECTION_NAME);

  const user = {
    ...userData,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await collection.insertOne(user);

  return {
    id: result.insertedId.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
    institutionId: user.institutionId,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const db = await getDatabase();
  const collection = db.collection(COLLECTION_NAME);

  const user = await collection.findOne({ email });

  if (!user) return null;

  return {
    id: user._id.toString(),
    email: user.email,
    password: user.password,
    name: user.name,
    role: user.role,
    institutionId: user.institutionId,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  } as User;
}

export async function getUserById(id: string): Promise<User | null> {
  const db = await getDatabase();
  const collection = db.collection(COLLECTION_NAME);

  let objectId;
  try {
    objectId = new ObjectId(id);
  } catch {
    return null;
  }

  const user = await collection.findOne({ _id: objectId });

  if (!user) return null;

  return {
    id: user._id.toString(),
    email: user.email,
    password: user.password,
    name: user.name,
    role: user.role,
    institutionId: user.institutionId,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  } as User;
}

export async function updateUser(id: string, updates: UpdateUserInput): Promise<User | null> {
  const db = await getDatabase();
  const collection = db.collection(COLLECTION_NAME);

  let objectId;
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

  const updated = result.value;
  return {
    id: updated._id.toString(),
    email: updated.email,
    password: updated.password,
    name: updated.name,
    role: updated.role,
    institutionId: updated.institutionId,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  } as User;
}

export async function deleteUser(id: string): Promise<boolean> {
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
