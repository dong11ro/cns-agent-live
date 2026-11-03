import type { EmailSender, IdentityVerifier, SmsSender } from "./types";

// 개발 전용: 실제로 보내지 않고 서버 콘솔에만 출력한다. production에선 config.ts가 선택을 거부한다.
export const consoleEmailSender: EmailSender = {
  async send({ to, subject, text }) {
    console.info(`[dev] email to=${to} subject=${subject}\n${text}`);
  },
};

export const consoleSmsSender: SmsSender = {
  async send({ to, text }) {
    console.info(`[dev] sms to=${to}\n${text}`);
  },
};

export const consoleIdentityVerifier: IdentityVerifier = {
  async start({ returnTo, state }) {
    const url = new URL(returnTo);
    url.searchParams.set("state", state);
    url.searchParams.set("dev_ci", "dev-ci");
    return { redirectUrl: url.toString() };
  },
  async verify({ callbackParams, state }) {
    if (callbackParams.get("state") !== state) throw new Error("state mismatch");
    return { ci: callbackParams.get("dev_ci") ?? "dev-ci", name: "개발자", birthDate: "2000-01-01" };
  },
};
