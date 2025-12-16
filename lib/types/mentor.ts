import { ObjectId } from "mongodb";

export interface MentorStats {
  classesTaken: number;
  averageRating: number;
  feedbackStatus: "Excellent" | "Good" | "Average" | "Needs Improvement";
}

export interface Mentor {
  _id?: ObjectId;
  userId: string;
  name: string;
  email: string;
  institutionId: string;
  stats: MentorStats;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MentorResponse {
  id: string;
  userId: string;
  name: string;
  email: string;
  institutionId: string;
  stats: MentorStats;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMentorInput {
  userId: string;
  name: string;
  email: string;
  institutionId: string;
  stats?: MentorStats;
}

export interface UpdateMentorInput {
  name?: string;
  institutionId?: string;
  stats?: Partial<MentorStats>;
  isActive?: boolean;
}

export interface MentorSearchFilters {
  institutionId: string;
  name?: string;
  minRating?: number;
  isActive?: boolean;
}

export interface InstitutionReport {
  institutionId: string;
  totalMentors: number;
  averageInstitutionRating: number;
  mentors: MentorResponse[];
}