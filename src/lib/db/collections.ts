import "server-only";
import type { ObjectId } from "mongodb";
import type { OAuthProviderId } from "@/lib/auth/config";
import type { TermId } from "@/lib/auth/terms";
import { getDb } from "./client";

export type UserDoc = {
  _id: ObjectId;
  email: string;
  emailVerifiedAt: Date | null;
  passwordHash: string | null;
  name: string;
  tokenVersion: number;
  createdAt: Date;
  updatedAt: Date;
  // SMS·본인인증 플래그가 켜졌을 때만 생기는 필드
  phone?: string;
  phoneVerifiedAt?: Date;
  identityVerifiedAt?: Date;
  ciHash?: string;
};

export type AccountDoc = {
  _id: ObjectId;
  userId: ObjectId;
  provider: OAuthProviderId;
  providerAccountId: string;
  email: string | null;
  linkedAt: Date;
};

export type TermAgreementDoc = {
  _id: ObjectId;
  userId: ObjectId;
  termId: TermId;
  version: string;
  agreed: boolean;
  at: Date;
  source: "signup" | "oauth-signup" | "mypage" | "reconsent";
};

export type VerificationDoc = {
  _id: ObjectId;
  userId: ObjectId | null;
  target: string;
  channel: "email" | "sms";
  purpose: "signup" | "change-email" | "reset-password";
  codeHash: string;
  attempts: number;
  expiresAt: Date;
};

export type SessionDoc = {
  _id: string;
  userId: ObjectId;
  tokenHash: string;
  prevTokenHash?: string;
  rotatedAt?: Date;
  createdAt: Date;
  expiresAt: Date;
  userAgent?: string;
};

export type RateLimitDoc = { _id: string; count: number; expiresAt: Date };

export async function collections() {
  const db = await getDb();
  return {
    users: db.collection<UserDoc>("users"),
    accounts: db.collection<AccountDoc>("accounts"),
    termAgreements: db.collection<TermAgreementDoc>("termAgreements"),
    verifications: db.collection<VerificationDoc>("verifications"),
    sessions: db.collection<SessionDoc>("sessions"),
    rateLimits: db.collection<RateLimitDoc>("rateLimits"),
  };
}
