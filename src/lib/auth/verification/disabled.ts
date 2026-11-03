import type { EmailSender, IdentityVerifier, SmsSender } from "./types";

// 플래그 off면 흐름에서 단계를 숨기므로 호출 자체가 일어나지 않아야 한다
function disabled(): never {
  throw new Error("verification disabled");
}

export const disabledEmailSender: EmailSender = { send: async () => disabled() };
export const disabledSmsSender: SmsSender = { send: async () => disabled() };
export const disabledIdentityVerifier: IdentityVerifier = { start: async () => disabled(), verify: async () => disabled() };
