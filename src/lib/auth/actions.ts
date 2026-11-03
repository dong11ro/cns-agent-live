"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAccessClaims } from "./dal";
import { clearSessionCookies, revokeSession } from "./session";

/** 헤더·마이페이지 공용 로그아웃. 상태를 바꾸므로 form POST로만 호출한다. */
export async function logout() {
  const claims = await getAccessClaims();
  if (claims) await revokeSession(claims.sid);
  clearSessionCookies(await cookies());
  redirect("/");
}
