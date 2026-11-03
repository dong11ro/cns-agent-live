import { describe, expect, it } from "vitest";
import { guardedAttempt, hit, rateKey, type CounterStore } from "./rate-limit";

/** Mongo $inc처럼 원자적으로 증가하는 메모리 저장소 */
function memoryStore(): CounterStore & { counts: Map<string, number> } {
  const counts = new Map<string, number>();
  return {
    counts,
    async increment(id, windowSec, now) {
      await Promise.resolve(); // 실제 DB처럼 비동기 경계를 둔다
      const count = (counts.get(id) ?? 0) + 1;
      counts.set(id, count);
      return { count, expiresAt: new Date(now.getTime() + windowSec * 1000) };
    },
    async reset(id) {
      counts.delete(id);
    },
  };
}

const LIMIT = { limit: 5, windowSec: 900 };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("rate limit", () => {
  it("키는 평문을 담지 않고 결정적이다", () => {
    const k = rateKey("login-email", "a@b.co");
    expect(k).toBe(rateKey("login-email", "a@b.co"));
    expect(k).not.toContain("a@b.co");
    expect(k.startsWith("login-email:")).toBe(true);
    expect(rateKey("login-email", "c@d.co")).not.toBe(k);
  });

  it("한도까지는 통과, 초과(count > limit)부터 제한", async () => {
    const store = memoryStore();
    const results = [];
    for (let i = 0; i < 6; i++) results.push((await hit("s", "k", LIMIT, store)).limited);
    expect(results).toEqual([false, false, false, false, false, true]);
  });

  it("동시 요청 100개가 몰려도 비밀번호 검증은 한도(5회)까지만 실행된다", async () => {
    const store = memoryStore();
    let verified = 0;
    const attempt = async () => {
      verified++;
      await sleep(5); // argon2 검증처럼 오래 걸리는 확인
      return false;
    };
    const results = await Promise.all(Array.from({ length: 100 }, () => guardedAttempt("login-email", "victim@b.co", LIMIT, attempt, store)));
    expect(verified).toBe(5);
    expect(results.filter((r) => r.limited)).toHaveLength(95);
  });

  it("성공하면 카운터를 지워 이후 시도가 다시 허용된다", async () => {
    const store = memoryStore();
    for (let i = 0; i < 4; i++) await guardedAttempt("s", "k", LIMIT, async () => false, store);
    expect(await guardedAttempt("s", "k", LIMIT, async () => true, store)).toEqual({ limited: false, ok: true });
    expect(store.counts.size).toBe(0);
  });
});
