export interface EmailSender {
  send(msg: { to: string; subject: string; text: string; html?: string }): Promise<void>;
}

export interface SmsSender {
  send(msg: { to: string; text: string }): Promise<void>;
}

export interface IdentityVerifier {
  /** 외부 본인인증 창(PASS·포트원 등)으로 보낼 URL 생성 */
  start(input: { returnTo: string; state: string }): Promise<{ redirectUrl: string }>;
  /** 콜백 결과 확인. CI는 호출 측에서 즉시 HMAC 해시한다 */
  verify(input: { callbackParams: URLSearchParams; state: string }): Promise<{ ci: string; name: string; birthDate: string }>;
}
