export type StepId = "terms" | "account" | "verify";

export const steps: { id: StepId; title: string; description: string }[] = [
  { id: "terms", title: "약관 동의", description: "서비스 이용을 위해 약관에 동의해 주세요." },
  { id: "account", title: "계정 정보", description: "로그인에 쓸 이메일과 비밀번호를 입력해 주세요." },
  { id: "verify", title: "이메일 인증", description: "메일로 받은 6자리 코드를 입력해 주세요." },
];

export const copy = {
  title: "회원가입",
  allAgree: "전체 동의",
  requiredMissing: "필수 약관에 모두 동의해야 다음 단계로 갈 수 있습니다.",
  next: "다음",
  back: "이전",
  submit: "가입하기",
  submitting: "가입 중…",
  emailAvailable: "사용 가능한 이메일입니다 ✓",
  emailTaken: "이미 가입된 이메일입니다.",
  emailLimited: "확인 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
  passwordMatch: "비밀번호가 일치합니다 ✓",
  haveAccount: "이미 회원이신가요?",
  noscript: "회원가입은 단계별 화면이라 JavaScript가 필요합니다. 브라우저 설정에서 JavaScript를 켜 주세요.",
};
