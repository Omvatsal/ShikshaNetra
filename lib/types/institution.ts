import { ObjectId } from "mongodb";

export interface Institution {
  _id?: ObjectId;
  id?: string;
  name: string;
  userIds: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface InstitutionResponse extends Omit<Institution, "_id"> {
  id: string;
}

export interface CreateInstitutionInput {
  name: string;
  userIds?: string[];
}

export interface UpdateInstitutionInput {
  name?: string;
  userIds?: string[];
}
