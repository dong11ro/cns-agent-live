import "server-only";
import { ObjectId } from "mongodb";
import { collections } from "@/lib/db/collections";
import { isDuplicateKey } from "../account";
import { normalizeEmail } from "../schemas";
import type { OAuthProviderId } from "../config";
import type { OAuthProfile } from "./providers";
import type { OAuthIntent } from "./state";

export type LinkDecision = "login" | "link" | "reject" | "require-local-login" | "pending-signup";

/**
 * 링크 정책(§4.6). 식별은 provider + providerAccountId로만 하고 이메일로 자동 연결하지 않는다.
 * - linkedUserId: 이 제공자 계정이 이미 연결된 user
 * - emailOwnerId: 제공자 이메일과 같은 이메일의 기존 user
 */
export function decideLink(input: { intent: OAuthIntent; currentUserId: string | null; linkedUserId: string | null; emailOwnerId: string | null }): LinkDecision {
  const { intent, currentUserId, linkedUserId, emailOwnerId } = input;
  if (intent === "link") {
    if (!currentUserId) return "reject";
    return linkedUserId && linkedUserId !== currentUserId ? "reject" : "link";
  }
  if (linkedUserId) return "login";
  // 선점 계정 탈취 방지: 같은 이메일이라도 로컬 로그인 후 마이페이지에서 연결하게 한다
  if (emailOwnerId) return "require-local-login";
  return "pending-signup";
}

export type LinkOutcome =
  | { type: "login"; userId: ObjectId; tokenVersion: number }
  | { type: "linked" }
  | { type: "reject"; reason: "conflict" | "not-logged-in" | "provider-already-linked" }
  | { type: "require-local-login"; email: string }
  | { type: "pending-signup" };

export async function resolveOAuth(provider: OAuthProviderId, profile: OAuthProfile, intent: OAuthIntent, currentUserId: ObjectId | null): Promise<LinkOutcome> {
  const { accounts, users } = await collections();
  const linked = await accounts.findOne({ provider, providerAccountId: profile.providerAccountId });
  const email = profile.email ? normalizeEmail(profile.email) : null;
  const emailOwner = !linked && email ? await users.findOne({ email }, { projection: { _id: 1 } }) : null;

  const decision = decideLink({
    intent,
    currentUserId: currentUserId?.toHexString() ?? null,
    linkedUserId: linked?.userId.toHexString() ?? null,
    emailOwnerId: emailOwner?._id.toHexString() ?? null,
  });

  switch (decision) {
    case "login": {
      const user = await users.findOne({ _id: linked!.userId }, { projection: { tokenVersion: 1 } });
      if (!user) return { type: "pending-signup" };
      return { type: "login", userId: user._id, tokenVersion: user.tokenVersion };
    }
    case "link": {
      if (linked) return { type: "linked" }; // 이미 내 계정에 연결됨
      try {
        await accounts.insertOne({ _id: new ObjectId(), userId: currentUserId!, provider, providerAccountId: profile.providerAccountId, email, linkedAt: new Date() });
      } catch (err) {
        // (userId, provider) unique: 같은 제공자의 다른 계정이 이미 연결돼 있음
        if (isDuplicateKey(err)) return { type: "reject", reason: "provider-already-linked" };
        throw err;
      }
      return { type: "linked" };
    }
    case "reject":
      return { type: "reject", reason: currentUserId ? "conflict" : "not-logged-in" };
    case "require-local-login":
      return { type: "require-local-login", email: email! };
    case "pending-signup":
      return { type: "pending-signup" };
  }
}
