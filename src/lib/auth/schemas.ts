// 클라이언트·서버 공용 검증 규칙. server-only 금지.
import { z } from "zod"
import { REQUIRED_TERM_IDS, TERM_IDS, type TermId } from "./terms"

/** trim → NFKC(전각→반각) → 소문자 */
export function normalizeEmail(email: string): string {
  return email.trim().normalize("NFKC").toLowerCase()
}

// 흔한 비밀번호 상위 목록(소문자 비교)
const COMMON_PASSWORDS = new Set([
  "123456", "123456789", "12345678", "password", "qwerty123", "qwerty1!", "1q2w3e4r", "1q2w3e4r!", "1q2w3e4r5t", "qwer1234",
  "qwer1234!", "q1w2e3r4", "q1w2e3r4!", "asdf1234", "asdf1234!", "zxcv1234", "1234qwer", "1234qwer!", "abcd1234", "abcd1234!",
  "abc12345", "abc123456", "a1234567", "a12345678", "aa123456", "password1", "password1!", "password12", "password123", "password!",
  "p@ssw0rd", "p@ssword", "p@ssw0rd1", "passw0rd", "passw0rd!", "iloveyou1", "iloveyou!", "sunshine1", "princess1", "football1",
  "baseball1", "welcome1", "welcome1!", "welcome123", "admin123", "admin1234", "admin123!", "administrator", "letmein1", "letmein!",
  "monkey123", "dragon123", "master123", "superman1", "batman123", "trustno1!", "starwars1", "qwertyuiop", "qwerty12345", "1qaz2wsx",
  "1qaz2wsx!", "1qaz@wsx", "zaq12wsx", "!qaz2wsx", "qazwsx123", "123qwe!@#", "qwe123!@#", "!@#123qwe", "1234abcd", "test1234",
  "test1234!", "test123!", "testtest1", "changeme1", "changeme!", "hello123", "hello1234", "hello123!", "korea123", "korea1234",
  "love1234", "love1234!", "sky12345", "gksrmf123", "dlfdlsdl1", "000000aa", "11111111a", "1111aaaa", "aaaa1111", "a1b2c3d4",
  "a1b2c3d4!", "1a2b3c4d", "pass1234", "pass1234!", "computer1", "internet1", "samsung1", "google123", "naver123", "kakao123",
])

const CLASSES = [/[A-Za-z]/, /[0-9]/, /[^A-Za-z0-9\s]/]

export type PasswordChecks = {
  length: boolean
  variety: boolean
  noEmail: boolean
  notCommon: boolean
  minLength: number
}

/** 영문·숫자·특수문자 중 3종 이상이면 8자, 2종이면 10자 이상. 최대 64자. */
export function passwordChecks(password: string, email = ""): PasswordChecks {
  const classes = CLASSES.filter((r) => r.test(password)).length
  const minLength = classes >= 3 ? 8 : 10
  const local = normalizeEmail(email).split("@")[0] ?? ""
  return {
    length: password.length >= minLength && password.length <= 64,
    variety: classes >= 2,
    noEmail: local.length < 3 || !password.toLowerCase().includes(local),
    notCommon: !COMMON_PASSWORDS.has(password.toLowerCase()),
    minLength,
  }
}

/** 0 = 미달, 1 = 약함(기준만 충족), 2 = 보통, 3 = 강함 */
export function passwordStrength(password: string, email = ""): 0 | 1 | 2 | 3 {
  const c = passwordChecks(password, email)
  if (!password || !(c.length && c.variety && c.noEmail && c.notCommon)) return 0
  const classes = CLASSES.filter((r) => r.test(password)).length
  if (password.length >= 14 && classes >= 3) return 3
  if (password.length >= 12 || classes >= 3) return 2
  return 1
}

export const emailSchema = z
  .string({ error: "이메일을 입력해 주세요." })
  .transform(normalizeEmail)
  .pipe(z.string().min(1, { error: "이메일을 입력해 주세요." }).max(254).pipe(z.email({ error: "올바른 이메일 형식이 아닙니다." })))

export const nameSchema = z
  .string({ error: "이름을 입력해 주세요." })
  .trim()
  .min(1, { error: "이름을 입력해 주세요." })
  .max(20, { error: "이름은 20자 이하로 입력해 주세요." })

/** 이메일 아이디 포함 검사를 위해 email을 같이 받는다. */
export function newPasswordSchema(email = "") {
  return z
    .string({ error: "비밀번호를 입력해 주세요." })
    .min(1, { error: "비밀번호를 입력해 주세요." })
    .superRefine((pw, ctx) => {
      const c = passwordChecks(pw, email)
      if (!c.variety) ctx.addIssue({ code: "custom", message: "영문·숫자·특수문자 중 2종 이상을 섞어 주세요." })
      else if (!c.length) ctx.addIssue({ code: "custom", message: pw.length > 64 ? "비밀번호는 64자 이하로 입력해 주세요." : `${c.minLength}자 이상 입력해 주세요.` })
      else if (!c.noEmail) ctx.addIssue({ code: "custom", message: "이메일 아이디를 비밀번호에 넣을 수 없습니다." })
      else if (!c.notCommon) ctx.addIssue({ code: "custom", message: "너무 흔한 비밀번호입니다." })
    })
}

export const agreementsSchema = z
  .record(z.string(), z.boolean())
  .transform((a) => Object.fromEntries(TERM_IDS.map((id) => [id, a[id] === true])) as Record<TermId, boolean>)
  .refine((a) => REQUIRED_TERM_IDS.every((id) => a[id]), { error: "필수 약관에 모두 동의해 주세요." })

export const signupSchema = z
  .object({
    email: emailSchema,
    password: z.string(),
    passwordConfirm: z.string(),
    name: nameSchema,
    agreements: agreementsSchema,
  })
  .superRefine((v, ctx) => {
    const r = newPasswordSchema(v.email).safeParse(v.password)
    if (!r.success) ctx.addIssue({ code: "custom", path: ["password"], message: r.error.issues[0].message })
    if (v.password !== v.passwordConfirm) ctx.addIssue({ code: "custom", path: ["passwordConfirm"], message: "비밀번호가 일치하지 않습니다." })
  })

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { error: "비밀번호를 입력해 주세요." }).max(256),
})

export const profileSchema = z.object({ name: nameSchema })

export const oauthSignupSchema = z.object({
  email: emailSchema,
  name: nameSchema,
  agreements: agreementsSchema,
})

/** 첫 issue만 필드별로 모은다. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form"
    out[key] ??= issue.message
  }
  return out
}

/** Server Action이 useActionState로 돌려주는 공통 상태. values로 입력을 되돌린다(비밀번호 제외). */
export type FormState = {
  ok?: boolean
  message?: string
  fieldErrors?: Record<string, string>
  formError?: string
  values?: Record<string, string>
}

/** 필드 하나만 검사해 첫 에러 메시지를 돌려준다(클라이언트 실시간 검증용). */
export function firstError(schema: z.ZodType, value: unknown): string | undefined {
  const r = schema.safeParse(value)
  return r.success ? undefined : r.error.issues[0]?.message
}
