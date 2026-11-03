import "server-only";
import { MongoServerError, ObjectId } from "mongodb";
import { collections, type UserDoc } from "@/lib/db/collections";
import { recordAgreements } from "./consents";
import type { TermId } from "./terms";
import type { TermAgreementDoc } from "@/lib/db/collections";

export const GENERIC_ERROR = "일시적인 오류입니다. 잠시 후 다시 시도해 주세요.";

export function isDuplicateKey(err: unknown): boolean {
  return err instanceof MongoServerError && err.code === 11000;
}

export async function emailExists(email: string): Promise<boolean> {
  const { users } = await collections();
  return (await users.countDocuments({ email }, { limit: 1 })) > 0;
}

/**
 * user → termAgreements 순서로 넣고, 두 번째가 실패하면 user를 지워 보상한다(트랜잭션 미사용).
 * 이메일 중복이면 null.
 */
export async function createUser(input: {
  email: string;
  name: string;
  passwordHash: string | null;
  emailVerifiedAt: Date | null;
  agreements: Record<TermId, boolean>;
  source: TermAgreementDoc["source"];
}): Promise<UserDoc | null> {
  const { users } = await collections();
  const now = new Date();
  const user: UserDoc = {
    _id: new ObjectId(),
    email: input.email,
    emailVerifiedAt: input.emailVerifiedAt,
    passwordHash: input.passwordHash,
    name: input.name,
    tokenVersion: 0,
    createdAt: now,
    updatedAt: now,
  };
  try {
    await users.insertOne(user);
  } catch (err) {
    if (isDuplicateKey(err)) return null;
    throw err;
  }
  try {
    await recordAgreements(user._id, input.agreements, input.source);
  } catch (err) {
    await users.deleteOne({ _id: user._id });
    throw err;
  }
  return user;
}

/** 탈퇴: 즉시 하드 삭제. 동의 이력까지 지운다. */
export async function deleteUserCompletely(userId: ObjectId) {
  const { users, accounts, sessions, verifications, termAgreements } = await collections();
  await Promise.all([
    accounts.deleteMany({ userId }),
    sessions.deleteMany({ userId }),
    verifications.deleteMany({ userId }),
    termAgreements.deleteMany({ userId }),
  ]);
  await users.deleteOne({ _id: userId });
}
