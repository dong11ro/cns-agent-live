import "server-only";
import type { ObjectId } from "mongodb";
import { collections, type TermAgreementDoc } from "@/lib/db/collections";
import { currentConsents, TERMS, type TermId } from "./terms";

/** 동의 이력은 append-only. 체크한 항목과 체크 안 한 선택 항목 모두 기록한다. */
export async function recordAgreements(userId: ObjectId, agreements: Partial<Record<TermId, boolean>>, source: TermAgreementDoc["source"]) {
  const { termAgreements } = await collections();
  const at = new Date();
  const docs = TERMS.filter((t) => t.id in agreements).map((t) => ({ userId, termId: t.id, version: t.version, agreed: agreements[t.id] === true, at, source }));
  if (docs.length) await termAgreements.insertMany(docs as TermAgreementDoc[]);
}

export async function getConsents(userId: ObjectId) {
  const { termAgreements } = await collections();
  const records = await termAgreements.find({ userId }).sort({ at: -1 }).toArray();
  return currentConsents(records);
}
