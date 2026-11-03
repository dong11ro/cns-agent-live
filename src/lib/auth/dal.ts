import "server-only"
import { cache } from "react"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { ObjectId } from "mongodb"
import { collections, type UserDoc } from "@/lib/db/collections"
import { getConsents } from "./consents"
import { COOKIE } from "./session"
import type { TermId } from "./terms"
import { verifyAccessToken } from "./tokens"

/** 클라이언트로 넘겨도 되는 좁은 사용자 정보. 해시·tokenVersion은 절대 넣지 않는다. */
export type UserDTO = {
  id: string
  email: string
  name: string
  emailVerified: boolean
  hasPassword: boolean
  createdAt: string
}

function toDTO(user: UserDoc): UserDTO {
  return {
    id: user._id.toHexString(),
    email: user.email,
    name: user.name,
    emailVerified: !!user.emailVerifiedAt,
    hasPassword: !!user.passwordHash,
    createdAt: user.createdAt.toISOString(),
  }
}

export const getAccessClaims = cache(async () => verifyAccessToken((await cookies()).get(COOKIE.access)?.value))

/** JWT 검증 → user 조회 → tokenVersion 대조. 서버 전용 원본 문서. */
export const getCurrentUserDoc = cache(async (): Promise<UserDoc | null> => {
  const claims = await getAccessClaims()
  if (!claims || !ObjectId.isValid(claims.sub)) return null
  const { users } = await collections()
  const user = await users.findOne({ _id: new ObjectId(claims.sub) })
  if (!user || user.tokenVersion !== claims.ver) return null
  return user
})

export async function getCurrentUser(): Promise<UserDTO | null> {
  const user = await getCurrentUserDoc()
  return user ? toDTO(user) : null
}

/** 보호 페이지·Server Action은 이것을 거쳐 데이터에 접근한다. */
export async function verifySession(): Promise<UserDTO> {
  const user = await getCurrentUser()
  if (!user) redirect("/login?reason=expired")
  return user
}

/** 비밀번호 확인 등 서버 내부에서 원본 문서가 필요한 액션용. */
export async function requireUserDoc(): Promise<UserDoc> {
  const user = await getCurrentUserDoc()
  if (!user) redirect("/login?reason=expired")
  return user
}

/** 마이페이지: 내 연결 계정(표시용 필드만) */
export async function getMyLinkedAccounts() {
  const user = await requireUserDoc()
  const { accounts } = await collections()
  const docs = await accounts.find({ userId: user._id }).toArray()
  return docs.map((a) => ({ provider: a.provider, email: a.email, linkedAt: a.linkedAt.toISOString() }))
}

/** 마이페이지: 약관별 현재 동의 상태 */
export async function getMyConsents() {
  const user = await requireUserDoc()
  const consents = await getConsents(user._id)
  return Object.fromEntries(
    Object.entries(consents).map(([id, c]) => [id, c && { agreed: c.agreed, version: c.version, at: c.at.toISOString() }]),
  ) as Record<TermId, { agreed: boolean; version: string; at: string } | null>
}
