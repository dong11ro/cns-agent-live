import "server-only"
import { hash, verify } from "@node-rs/argon2"

// OWASP Password Storage Cheat Sheet 최소 권장값. algorithm 2 = Argon2id(const enum이라 isolatedModules에서 import 불가)
const OPTIONS = { algorithm: 2 as const, memoryCost: 19456, timeCost: 2, parallelism: 1 }
const PARAMS = `$argon2id$v=19$m=${OPTIONS.memoryCost},t=${OPTIONS.timeCost},p=${OPTIONS.parallelism}$`

export function hashPassword(password: string): Promise<string> {
  return hash(password, OPTIONS)
}

let dummyHash: Promise<string> | undefined

/** hash가 없어도(없는 계정·OAuth 전용) 더미 해시를 검증해 응답 시간을 맞춘다. */
export async function verifyPassword(hashed: string | null | undefined, password: string): Promise<boolean> {
  if (!hashed) {
    await verify(await (dummyHash ??= hashPassword("dummy-password-for-timing")), password).catch(() => false)
    return false
  }
  return verify(hashed, password).catch(() => false)
}

export function needsRehash(hashed: string): boolean {
  return !hashed.startsWith(PARAMS)
}
