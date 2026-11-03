import "server-only"
import { createHmac } from "node:crypto"
import { headers } from "next/headers"
import { collections } from "@/lib/db/collections"
import { isDuplicateKey } from "./account"
import { deriveKey } from "./config"

export type Limit = { limit: number; windowSec: number }

export const LIMITS = {
  loginIp: { limit: 20, windowSec: 15 * 60 },
  loginEmail: { limit: 5, windowSec: 15 * 60 },
  emailCheck: { limit: 30, windowSec: 10 * 60 },
  signupIp: { limit: 5, windowSec: 60 * 60 },
  verifySend: { limit: 3, windowSec: 10 * 60 },
} satisfies Record<string, Limit>

/** 평문 이메일·IP를 남기지 않도록 HMAC 해시로 키를 만든다. */
export function rateKey(scope: string, raw: string): string {
  return `${scope}:${createHmac("sha256", deriveKey("rate-limit")).update(raw).digest("base64url")}`
}

export type RateResult = { limited: boolean; retryAfterSec: number }

/** 카운터 저장소. increment는 원자적이어야 한다(Mongo $inc). 테스트에선 메모리 구현으로 바꾼다. */
export type CounterStore = {
  increment(id: string, windowSec: number, now: Date): Promise<{ count: number; expiresAt: Date } | null>
  reset(id: string): Promise<void>
}

const mongoStore: CounterStore = {
  async increment(_id, windowSec, now) {
    const { rateLimits } = await collections()
    // TTL 모니터는 1분 주기라 만료 문서가 남아 있을 수 있다
    await rateLimits.deleteOne({ _id, expiresAt: { $lte: now } })
    const update = { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(now.getTime() + windowSec * 1000) } }
    const upsert = () => rateLimits.findOneAndUpdate({ _id }, update, { upsert: true, returnDocument: "after" })
    // 동시 upsert가 같은 _id를 넣으면 한쪽이 중복 키로 실패한다. 그때만 1회 재시도(이번엔 갱신이 된다)
    return upsert().catch((err) => {
      if (!isDuplicateKey(err)) throw err
      return upsert()
    })
  },
  async reset(_id) {
    const { rateLimits } = await collections()
    await rateLimits.deleteOne({ _id })
  },
}

/** 고정 윈도 카운터를 1 올리고 한도 초과(count > limit) 여부를 돌려준다. */
export async function hit(scope: string, raw: string, { limit, windowSec }: Limit, store = mongoStore): Promise<RateResult> {
  const now = new Date()
  const doc = await store.increment(rateKey(scope, raw), windowSec, now)
  if (!doc || doc.expiresAt <= now) return { limited: false, retryAfterSec: 0 }
  return { limited: doc.count > limit, retryAfterSec: Math.ceil((doc.expiresAt.getTime() - now.getTime()) / 1000) }
}

export async function reset(scope: string, raw: string, store = mongoStore) {
  await store.reset(rateKey(scope, raw))
}

export type AttemptResult = { limited: true; retryAfterSec: number } | { limited: false; ok: boolean }

/**
 * 비밀번호 확인처럼 실패 횟수를 제한할 시도: 먼저 원자적으로 세고(hit) 한도를 넘었으면 시도 자체를 하지 않는다.
 * 확인-후-증가(peek → verify → hit)는 동시 요청이 모두 확인을 통과해 한도를 넘는다. 성공하면 카운터를 지운다.
 */
export async function guardedAttempt(scope: string, raw: string, limit: Limit, attempt: () => Promise<boolean>, store = mongoStore): Promise<AttemptResult> {
  const r = await hit(scope, raw, limit, store)
  if (r.limited) return { limited: true, retryAfterSec: r.retryAfterSec }
  const ok = await attempt()
  if (ok) await reset(scope, raw, store)
  return { limited: false, ok }
}

/** 신뢰할 프록시 뒤에서만 의미가 있다. 없으면 null → IP 한도는 건너뛴다. */
// shortcut: X-Forwarded-For 첫 값은 클라이언트가 위조할 수 있다(Next는 헤더가 없을 때만 소켓 주소로 채운다,
// next/dist/server/base-server.js:601). 요청마다 값을 바꾸면 loginIp·emailCheck·signupIp 한도가 무력해진다.
// 배포 형태(PLAN §11 Q10)가 정해지면 업그레이드: 신뢰 프록시 1단 뒤면 .at(-1)(프록시가 붙인 값), Vercel 등은 플랫폼 헤더.
export async function clientIp(): Promise<string | null> {
  const forwarded = (await headers()).get("x-forwarded-for")
  return forwarded?.split(",")[0]?.trim() || null
}
