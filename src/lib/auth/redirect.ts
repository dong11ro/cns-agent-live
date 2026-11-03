/** 내부 경로만 허용한다. 외부·프로토콜 상대 URL은 fallback으로. */
export function safeNext(next: unknown, fallback = "/"): string {
  if (typeof next !== "string" || !next.startsWith("/")) return fallback
  if (next.startsWith("//") || next.startsWith("/\\")) return fallback
  if (/[\u0000-\u001f]/.test(next)) return fallback
  return next
}
