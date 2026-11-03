import "server-only"
import { MongoClient, type Db } from "mongodb"
import { getConfig } from "@/lib/auth/config"

const g = globalThis as unknown as { __mongo?: Promise<Db> }

// createIndexes는 멱등이라 첫 연결 때마다 실행해도 된다(별도 마이그레이션 없음).
async function ensureIndexes(db: Db) {
  await Promise.all([
    db.collection("users").createIndexes([
      { key: { email: 1 }, unique: true },
      { key: { ciHash: 1 }, unique: true, partialFilterExpression: { ciHash: { $exists: true } } },
    ]),
    db.collection("accounts").createIndexes([
      { key: { provider: 1, providerAccountId: 1 }, unique: true },
      { key: { userId: 1, provider: 1 }, unique: true },
    ]),
    db.collection("termAgreements").createIndexes([{ key: { userId: 1, termId: 1, at: -1 } }]),
    db.collection("verifications").createIndexes([
      { key: { target: 1, channel: 1, purpose: 1 }, unique: true },
      { key: { expiresAt: 1 }, expireAfterSeconds: 0 },
    ]),
    db.collection("sessions").createIndexes([
      { key: { tokenHash: 1 }, unique: true },
      { key: { prevTokenHash: 1 }, sparse: true },
      { key: { userId: 1 } },
      { key: { expiresAt: 1 }, expireAfterSeconds: 0 },
    ]),
    db.collection("rateLimits").createIndexes([{ key: { expiresAt: 1 }, expireAfterSeconds: 0 }]),
  ])
}

async function connect(): Promise<Db> {
  const client = new MongoClient(getConfig().databaseUrl)
  await client.connect()
  const db = client.db() // URL 경로의 DB 이름
  await ensureIndexes(db)
  return db
}

/** dev HMR에서도 연결 1개만 유지. 실패하면 다음 호출에서 재시도한다. */
export function getDb(): Promise<Db> {
  g.__mongo ??= connect().catch((err) => {
    g.__mongo = undefined
    throw err
  })
  return g.__mongo
}
