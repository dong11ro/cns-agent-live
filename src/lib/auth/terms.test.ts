import { describe, expect, it } from "vitest";
import { currentConsents, missingRequiredTerms, type AgreementRecord } from "./terms";

const d = (s: string) => new Date(`2026-11-0${s}T00:00:00Z`);

describe("동의 이력", () => {
  it("termId별 최신 레코드가 현재 상태", () => {
    const records: AgreementRecord[] = [
      { termId: "marketing", version: "2026-11-01", agreed: true, at: d("1") },
      { termId: "marketing", version: "2026-11-01", agreed: false, at: d("2") },
    ];
    const s = currentConsents(records);
    expect(s.marketing?.agreed).toBe(false);
    expect(s.service).toBeNull();
  });
  it("필수 약관 새 버전 미동의 감지", () => {
    const records: AgreementRecord[] = [
      { termId: "service", version: "2026-11-01", agreed: true, at: d("1") },
      { termId: "privacy", version: "2020-01-01", agreed: true, at: d("1") },
      { termId: "age14", version: "2026-11-01", agreed: true, at: d("1") },
    ];
    expect(missingRequiredTerms(records)).toEqual(["privacy"]);
  });
});
