// 클라이언트(가입 화면)도 import하므로 server-only 금지

export type TermId = "service" | "privacy" | "age14" | "marketing";

export type Term = {
  id: TermId;
  version: string;
  required: boolean;
  title: string;
  body: string;
};

// 본문은 자리표시 문구. 법무 검토본으로 교체한다.
const PLACEHOLDER = "본문은 준비 중입니다. 정식 약관으로 교체될 예정입니다.";

export const TERMS: Term[] = [
  { id: "service", version: "2026-11-01", required: true, title: "이용약관 동의", body: `넥스트스텝 IT 아카데미 이용약관. ${PLACEHOLDER}` },
  { id: "privacy", version: "2026-11-01", required: true, title: "개인정보 수집·이용 동의", body: `수집 항목: 이메일, 이름, 비밀번호(암호화 저장). 이용 목적: 회원 식별과 서비스 제공. 보유 기간: 회원 탈퇴 시까지. ${PLACEHOLDER}` },
  { id: "age14", version: "2026-11-01", required: true, title: "만 14세 이상입니다", body: "만 14세 미만은 법정대리인 동의가 필요해 가입할 수 없습니다." },
  { id: "marketing", version: "2026-11-01", required: false, title: "마케팅 정보 수신 동의(이메일)", body: `새 과정·할인 소식을 이메일로 받습니다. 동의하지 않아도 가입할 수 있고 마이페이지에서 언제든 철회할 수 있습니다. ${PLACEHOLDER}` },
];

export const TERM_IDS = TERMS.map((t) => t.id);
export const REQUIRED_TERM_IDS = TERMS.filter((t) => t.required).map((t) => t.id);

export type AgreementRecord = { termId: TermId; version: string; agreed: boolean; at: Date };
export type ConsentState = { agreed: boolean; version: string; at: Date } | null;

/** termId별 최신 레코드가 현재 상태다. */
export function currentConsents(records: AgreementRecord[]): Record<TermId, ConsentState> {
  const out = Object.fromEntries(TERM_IDS.map((id) => [id, null])) as Record<TermId, ConsentState>;
  for (const r of records) {
    const cur = out[r.termId];
    if (r.termId in out && (!cur || r.at > cur.at)) out[r.termId] = { agreed: r.agreed, version: r.version, at: r.at };
  }
  return out;
}

/** 최신 버전에 동의하지 않은 필수 약관(재동의 화면 감지용). */
export function missingRequiredTerms(records: AgreementRecord[]): TermId[] {
  const state = currentConsents(records);
  return TERMS.filter((t) => t.required && !(state[t.id]?.agreed && state[t.id]?.version === t.version)).map((t) => t.id);
}
