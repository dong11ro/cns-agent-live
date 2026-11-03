# 회원가입·로그인·OAuth·마이페이지 기획

> 상태: 기획(코드 없음) · 작성일 2026-11-03 · 대상: 넥스트스텝 IT 아카데미 랜딩 (Next.js 16.4.3 · React 19.3 · Tailwind v4 · shadcn `base-nova` · npm)
>
> 표기: **[필수]** = 사용자 요구사항, **[제안(선택)]** = 요구사항 밖, 이번 범위에서 빼도 되는 것.

## 0. 근거로 확인한 Next.js 16 문서

`npm ci` 후 `node_modules/next/dist/docs/01-app/` 아래에서 확인했다. 이 문서의 Next.js 관련 결정은 모두 아래 문서에 근거한다.

| 주제 | 경로 | 이 기획에 준 영향 |
|---|---|---|
| 인증 가이드 | `02-guides/authentication.md` | DAL·DTO 패턴, 쿠키 권장 옵션(`:627`), proxy는 "낙관적 검사"만(`:1026-1033`), 레이아웃에서 인증 검사 금지(`:1356-1366`), Server Action·Route Handler마다 재검증(`:1467`, `:1507`) |
| Cache Components와 인증 | `02-guides/authentication-with-cache-components.md` | 세션 읽기는 반드시 `<Suspense>` 안(밖이면 **빌드 에러**), 레이아웃 최상단에서 세션 `await` 금지, `use cache: private`, 캐시 키·태그에 이메일·토큰 금지 |
| Instant navigation 검증 | `02-guides/instant-navigation.md:103` | 세션을 읽는 라우트는 dev에서 경고가 뜬다. Suspense 경계로 해결 |
| Proxy (구 middleware) | `01-getting-started/16-proxy.md`, `03-api-reference/03-file-conventions/proxy.md` | v16에서 Middleware→**Proxy**로 이름 변경, 파일은 `src/proxy.ts`(app과 같은 레벨), **기본 Node.js 런타임**(`proxy.md:253-255`, `runtime` 설정 불가), 요청·응답 쿠키/헤더 수정 가능(`:344`, `:416`), 느린 데이터 조회·완전한 인가 용도 아님 |
| Server Actions·폼 | `02-guides/server-actions.md`, `02-guides/forms.md`, `01-getting-started/07-mutating-data.md` | `useActionState`(검증 에러·pending, `forms.md:190-316`), `useFormStatus` |
| 데이터 보안·CSRF | `02-guides/data-security.md` | 액션은 직접 POST로 호출 가능 → 액션마다 인증(`:281-291`), POST 전용 + Origin/Host 비교(`:544-550`), 클로저 암호화와 `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`(`:526-542`), `server-only`는 Next가 내부 처리(`:255`) |
| cookies API | `03-api-reference/04-functions/cookies.md` | async. **설정·삭제는 Server Function/Route Handler에서만**(`:74`, `:81`) → Server Component 렌더 중에는 토큰 재발급 쿠키를 못 쓴다(토큰 회전 위치 결정의 핵심) |
| redirect | `03-api-reference/04-functions/redirect.md:51` | 액션·핸들러에서 `redirect`는 `try` 블록 **밖**에서 |
| unauthorized/forbidden | `03-api-reference/03-file-conventions/unauthorized.md` | **experimental**(`authInterrupts`) → 쓰지 않고 `redirect` 사용 |
| Route groups·private folders | `01-getting-started/02-project-structure.md:91`, `:257` | `(group)`은 URL 영향 없음, `_folder`는 라우팅 제외 |
| 환경 변수 | `02-guides/environment-variables.md` | `.env*` 자동 로드, `NEXT_PUBLIC_` 접두사만 브라우저로 인라인 → 비밀은 접두사 금지 |
| serverActions 설정 | `03-api-reference/05-config/01-next-config-js/serverActions.md:11` | 리버스 프록시 뒤 배포 시에만 `allowedOrigins` |

현재 `next.config.ts`는 `cacheComponents: true`, `partialPrefetching: true`이다.

---

## 1. 아키텍처 결정과 근거

### 1.1 인증 구현: 직접 구현 vs 라이브러리

| 안 | JWT 요구 | OAuth | 장점 | 단점 |
|---|---|---|---|---|
| **A. 직접 구현** (jose + argon2 + arctic) | ✅ access JWT + refresh 회전을 그대로 설계 | ✅ arctic 3.7.0이 Google·Kakao·Naver·GitHub 모두 지원(설치 패키지에서 `dist/providers/{google,kakao,naver,github}.js` 확인), state·PKCE 헬퍼 제공 | 동작 전부가 코드로 보인다. Next 16 버전 결합이 없다(Next API는 `cookies()`·proxy·Server Action만 사용) | 보안 세부(회전·재사용 탐지·rate limit)를 직접 책임 |
| B. Auth.js(next-auth) | △ JWT 세션은 JWE(암호화) 단일 쿠키, refresh 회전 없음 | ✅ | 제공자 설정이 짧다 | v5는 아직 `5.0.0-beta.32`(npm dist-tag `beta`), stable은 v4. Credentials provider는 DB 세션 미지원·권장하지 않음, 계정 링크 정책 커스터마이즈가 제한적(`allowDangerousEmailAccountLinking` 수준) |
| C. Better Auth (1.7.x) | △ 기본은 DB 세션 + 쿠키 캐시, JWT는 플러그인 | ✅ | 기능이 많다(2FA·링크 등) | 요구보다 큰 표면, 자체 스키마·라우트 규약에 맞춰야 해 기존 Atomic/colocation 구조와 어긋난다 |

**추천: A. 직접 구현.** 요구사항이 "JWT 기반 + 로컬 계정과의 OAuth 링크 정책 + 약관 이력 + 비활성 검증 어댑터"로 라이브러리 기본값과 하나씩 다 어긋난다. 라이브러리를 쓰면 결국 콜백·어댑터를 덮어써야 하고, 그러면 코드 양은 비슷한데 동작은 덜 보인다. 직접 구현해도 암호·OAuth 프로토콜은 검증된 라이브러리(jose, argon2, arctic)에 맡기므로 "암호를 직접 짜는" 위험은 없다.

### 1.2 DB 접근: 공식 `mongodb` 드라이버 vs Mongoose

**추천: 공식 `mongodb` 드라이버(7.x).**
- 검증은 이미 zod로 한다(요구사항 2: 클라이언트·서버 동일 스키마). Mongoose 스키마까지 두면 같은 규칙이 두 곳에 생긴다.
- 컬렉션이 6개, 쿼리가 단순(단건 조회·upsert·TTL)하다. ODM 이점(populate, 미들웨어)이 필요 없다.
- 타입은 `Collection<UserDoc>` 제네릭으로 충분하다.
- 클라이언트는 `globalThis`에 1개만 캐시(dev HMR 시 연결 누수 방지). 인덱스는 첫 연결 시 `createIndexes`(멱등)로 보장해 별도 마이그레이션 스크립트를 두지 않는다.

### 1.3 토큰 전략

| 토큰 | 형식 | 수명 | 저장 위치 | 서버 저장 |
|---|---|---|---|---|
| access | JWT(HS256, jose). 클레임 `sub`(userId), `sid`(세션 id), `ver`(user.tokenVersion), `iat`, `exp`, `iss`, `aud` | **15분** | httpOnly 쿠키 `ns_at` | 없음(무상태) |
| refresh | 불투명 랜덤 32바이트(base64url) | **14일**, 사용할 때마다 회전(만료도 새로 14일, 최대 수명 상한 30일) | httpOnly 쿠키 `ns_rt` | `sessions` 컬렉션에 **SHA-256 해시**만 저장 |

- **왜 refresh는 JWT가 아닌가**: refresh는 어차피 DB 조회(폐기 확인)가 필요하므로 서명할 이유가 없다. 불투명 토큰 + 해시 저장이 더 단순하고 유출에 안전하다. "JWT 기반 인증"은 매 요청을 검증하는 access 토큰으로 충족한다.
- **회전·재사용 탐지**: refresh 사용 시 새 토큰 발급, 이전 토큰 해시는 `prevTokenHash`로 남긴다. 이미 회전된 토큰이 다시 오면:
  - 회전 후 **30초 이내**: 동시 요청(프리페치 여러 개)으로 보고 access만 새로 발급, refresh 쿠키는 건드리지 않는다(다른 응답이 이미 새 refresh를 심었으므로).
  - 30초 이후: 탈취로 간주해 **그 세션을 폐기**하고 로그아웃.
- **로그아웃**: Server Action(POST)으로 `sessions` 문서 삭제 + 두 쿠키 삭제. access JWT는 최대 15분 남지만 쿠키가 지워져 브라우저는 더 보내지 않는다.
- **전체 기기 로그아웃·비밀번호 변경·탈퇴**: `users.tokenVersion += 1` + 해당 user의 sessions 전부 삭제. DAL이 `jwt.ver !== user.tokenVersion`이면 거부하므로 남은 access도 즉시 무효.
- **쿠키 속성**(`authentication.md:627` 권장안 그대로): `httpOnly`, `secure`(production), `sameSite: 'lax'`, `path: '/'`, `maxAge`(토큰 수명과 동일). production에선 이름에 `__Host-` 접두사(`__Host-ns_at`)를 붙여 도메인·경로 고정을 브라우저가 강제하게 한다(dev의 http://localhost는 Safari가 Secure를 거부하므로 접두사 없이).

### 1.4 인증 확인 위치: proxy vs DAL

**두 겹으로 하되 책임을 나눈다.**

| 계층 | 하는 일 | 하지 않는 일 |
|---|---|---|
| `src/proxy.ts` (낙관적 검사) | access JWT **서명·만료만** 확인. ① 보호 경로(`/mypage`)에 토큰 없음 → `/login?next=…`로 redirect ② 로그인 상태로 `/login`·`/signup` 접근 → `/mypage`(또는 `next`)로 redirect ③ **access 만료 + refresh 있음 → 여기서 회전**하고 응답 쿠키와 *요청* 쿠키를 함께 갱신해 같은 요청의 렌더가 새 토큰을 보게 함 | 사용자 조회, 권한 판단 |
| `src/lib/auth/dal.ts` (권위 있는 검사) | `verifySession()`: JWT 검증 → user 조회 → `tokenVersion` 대조 → 좁은 DTO 반환, 실패 시 `redirect('/login')`. 모든 보호 페이지·Server Action·Route Handler가 이것만 통해 데이터에 접근 | 쿠키 쓰기(렌더 중엔 불가) |

근거와 이유:
- 문서가 proxy는 프리페치 포함 모든 경로에서 돌므로 DB 조회를 피하라고 한다(`authentication.md:1033`). 그래서 평상시 proxy는 서명 검증만 한다. **refresh 회전만 예외로 proxy에서 DB를 친다** — 사용자당 15분에 1번뿐이고, Server Component 렌더 중에는 쿠키를 쓸 수 없어서(`cookies.md:74,81`) 렌더 전에 갱신할 수 있는 곳이 proxy뿐이기 때문이다. Proxy가 v16부터 기본 Node.js 런타임이라 `mongodb` 드라이버를 그대로 쓸 수 있다(`proxy.md:253-255`).
- Server Action도 페이지 경로로 가는 POST라 proxy를 거치므로 액션 직전에도 토큰이 갱신된다.
- 레이아웃에서 인증 검사를 하지 않는다(`authentication.md:1356`: 레이아웃은 내비게이션 때 다시 렌더되지 않음). 검사는 페이지 안의 Suspense 경계 안쪽 컴포넌트와 액션에서 DAL로.
- `use cache: private`는 **처음엔 쓰지 않는다.** 로그아웃·계정 전환 직후 브라우저 캐시에 남은 사용자 정보가 보일 위험을 검증하기 전까지는 React `cache()`로 렌더 1회 중복 제거만 한다. [제안(선택)] 마이페이지 내비게이션 속도가 문제되면 도입.
- `unauthorized()`/`forbidden()`은 experimental이라 쓰지 않는다.

---

## 2. 라우트·디렉터리 구조

### 2.1 colocation 규칙 (기존 `(marketing)` 패턴 확장)

| 위치 | 담는 것 | 규칙 |
|---|---|---|
| `app/(그룹)/<라우트>/page.tsx` | 조립만 | 기존 `LandingPage`처럼 화면 순서대로 컴포넌트 나열 |
| `<라우트>/_content.ts` | 화면 문구·단계 정의 | 기존 `(marketing)/_content.ts`와 같은 역할 |
| `<라우트>/_components/` | 그 화면에서만 쓰는 클라이언트·서버 컴포넌트 | 기존 `_sections/`는 랜딩 섹션 이름이라 유지, 폼 화면은 `_components/` |
| `<라우트>/_actions.ts` | 그 화면의 Server Action(`'use server'`) | 액션은 얇게: 스키마 검증 → `lib/auth` 호출 → 상태 반환/redirect |
| `src/components/{atoms,molecules}` | 2개 이상 화면이 쓰는 표현 컴포넌트 | DB·DAL import 금지(순수 표현) |
| `src/components/ui` | shadcn CLI로 추가한 원본 | 직접 수정 최소 |
| `src/lib/auth`, `src/lib/db` | 서버 로직 | `import 'server-only'`. **예외: `schemas.ts`는 클라이언트도 import하므로 server-only 금지** |

### 2.2 파일 트리 (추가·변경분, `+` 신규 `~` 수정)

```text
.env.example                         + 키만 (§7)
.gitignore                           ~ `!.env.example` 한 줄 추가 (현재 `.env*`가 예시 파일까지 무시함)
vitest.config.ts                     + (§10)
src/
├─ proxy.ts                          + 낙관적 검사 + refresh 회전
├─ app/
│  ├─ (marketing)/
│  │  └─ _sections/
│  │     ├─ header.tsx               ~ "수강 신청" 옆에 <Suspense><AccountSlot/></Suspense>
│  │     └─ account-slot.tsx         + 로그인 여부에 따라 "로그인" 버튼 / "마이페이지" 링크
│  ├─ (auth)/
│  │  ├─ layout.tsx                  + 가운데 정렬 카드 레이아웃(로고만, 세션 읽지 않음)
│  │  ├─ login/
│  │  │  ├─ page.tsx                 +
│  │  │  ├─ _actions.ts              + login
│  │  │  └─ _components/login-form.tsx      + 'use client', useActionState
│  │  └─ signup/
│  │     ├─ page.tsx                 +
│  │     ├─ _content.ts              + 단계 정의·문구
│  │     ├─ _actions.ts              + signup, checkEmailAvailable
│  │     ├─ _components/
│  │     │  ├─ signup-wizard.tsx     + 단계 상태 관리('use client')
│  │     │  ├─ terms-step.tsx        +
│  │     │  ├─ account-step.tsx      +
│  │     │  └─ verify-step.tsx       + 검증 플래그 on일 때만 렌더
│  │     └─ oauth/                   + OAuth 신규 가입자 약관 동의·이메일 보완
│  │        ├─ page.tsx
│  │        ├─ _actions.ts           + completeOAuthSignup
│  │        └─ _components/oauth-signup-form.tsx
│  ├─ (account)/
│  │  └─ mypage/
│  │     ├─ page.tsx                 + 섹션별 <Suspense> 조립
│  │     ├─ _actions.ts              + updateProfile, changePassword, unlinkAccount, updateConsents, logoutAll, deleteAccount
│  │     └─ _components/
│  │        ├─ profile-section.tsx
│  │        ├─ password-section.tsx
│  │        ├─ linked-accounts-section.tsx
│  │        ├─ consents-section.tsx
│  │        └─ danger-zone-section.tsx   (전체 로그아웃·탈퇴)
│  └─ api/auth/oauth/[provider]/
│     ├─ route.ts                    + GET: state·PKCE 쿠키 발급 후 제공자로 redirect (?intent=login|link&next=)
│     └─ callback/route.ts           + GET: state 검증 → 토큰 교환 → 프로필 → 링크 정책(§4.6) → 세션 발급
├─ components/
│  ├─ ui/                            + shadcn add: input, label, checkbox, alert-dialog (§8)
│  ├─ atoms/password-strength.tsx    + 강도 막대(표현만)
│  └─ molecules/
│     ├─ form-field.tsx              + Label + Input + 힌트 + 에러(aria 연결)
│     ├─ password-input.tsx          + 보기/숨기기 토글
│     └─ oauth-buttons.tsx           + 활성 제공자 버튼 목록
└─ lib/
   ├─ db/
   │  ├─ client.ts                   + MongoClient 싱글턴, 첫 연결 시 인덱스 보장
   │  └─ collections.ts              + 문서 타입 + Collection getter
   └─ auth/
      ├─ config.ts                   + env 읽기·검증(시작 시 실패), 활성 OAuth·플래그 계산
      ├─ schemas.ts                  + zod 스키마(클라·서버 공용, server-only 아님)
      ├─ password.ts                 + argon2id hash/verify, 강도 계산(순수 함수는 schemas 쪽과 공유)
      ├─ tokens.ts                   + access JWT sign/verify, refresh 생성·해시
      ├─ session.ts                  + createSession / rotateSession / revokeSession, 쿠키 set/clear
      ├─ dal.ts                      + verifySession, getCurrentUser(DTO)
      ├─ actions.ts                  + logout (헤더·마이페이지 공용 Server Action)
      ├─ redirect.ts                 + safeNext(next) — 내부 경로만 허용
      ├─ rate-limit.ts               + Mongo 고정 윈도 카운터
      ├─ terms.ts                    + 약관 정의(id·버전·필수 여부·본문 경로)
      ├─ oauth/
      │  ├─ providers.ts             + arctic 인스턴스, 제공자별 프로필 정규화
      │  └─ link.ts                  + 링크 정책(§4.6)
      └─ verification/
         ├─ types.ts                 + EmailSender / SmsSender / IdentityVerifier 인터페이스
         ├─ disabled.ts              + 비활성 기본 구현
         ├─ console.ts               + dev 전용 콘솔 구현
         └─ index.ts                 + 플래그에 따라 구현 선택, 코드 발급·검증 로직
```

라우트 결과: `/login`, `/signup`, `/signup/oauth`, `/mypage`, `/api/auth/oauth/{google|kakao|naver|github}`, `…/callback`. 비밀번호 재설정은 §6 [제안(선택)].

---

## 3. 데이터 모델 (MongoDB)

DB 이름은 `DATABASE_URL`의 경로에서 가져온다(없으면 드라이버 기본값 `test`가 되므로 URL에 반드시 포함 — 구현 시 `config.ts`에서 검사). 모든 시각은 `Date`(UTC).

### `users`
| 필드 | 타입 | 비고 |
|---|---|---|
| `_id` | ObjectId | |
| `email` | string | **정규화**(trim → NFKC → 소문자) 후 저장 |
| `emailVerifiedAt` | Date \| null | 검증 off면 null 유지. OAuth 제공자가 검증된 이메일을 주면 그 시각 |
| `passwordHash` | string \| null | OAuth 전용 계정은 null |
| `name` | string | 표시 이름 1~20자 |
| `phone`, `phoneVerifiedAt` | string \| null | **SMS 검증 on일 때만 수집**(개인정보 최소화). 기본은 필드 자체를 안 만든다 |
| `identityVerifiedAt`, `ciHash` | Date / string \| null | 본인인증 on일 때만. CI 원문은 저장하지 않고 HMAC 해시만(중복 가입 확인용) |
| `tokenVersion` | int | 전체 세션 무효화용 |
| `createdAt`, `updatedAt` | Date | |

인덱스: `{ email: 1 }` unique, `{ ciHash: 1 }` unique + partial(`ciHash` 존재 시).

### `accounts` (OAuth 연결)
| 필드 | 비고 |
|---|---|
| `userId` | ObjectId |
| `provider` | `'google' \| 'kakao' \| 'naver' \| 'github'` |
| `providerAccountId` | 제공자의 사용자 고유 id(이메일 아님) |
| `email` | 제공자가 준 이메일(표시용, 없을 수 있음) |
| `linkedAt` | Date |

인덱스: `{ provider: 1, providerAccountId: 1 }` unique, `{ userId: 1, provider: 1 }` unique(제공자당 1개 연결). **제공자 access/refresh 토큰은 저장하지 않는다**(로그인에만 쓰고 API를 호출하지 않으므로 — 최소 보관).

### `termAgreements` (동의 이력, append-only)
약관 **정의는 코드**(`lib/auth/terms.ts`, git이 버전 관리)에 두고, **동의 기록만 DB**에 쌓는다.
| 필드 | 비고 |
|---|---|
| `userId` | ObjectId |
| `termId` | `'service' \| 'privacy' \| 'age14' \| 'marketing'` 등 |
| `version` | `'2026-11-01'` 같은 날짜 문자열 |
| `agreed` | boolean (선택 약관 철회는 `false` 레코드를 새로 추가) |
| `at` | Date |
| `source` | `'signup' \| 'oauth-signup' \| 'mypage' \| 'reconsent'` |

인덱스: `{ userId: 1, termId: 1, at: -1 }`. 현재 상태 = termId별 최신 레코드. 필수 약관의 새 버전이 나오면 로그인 시 "최신 필수 약관 미동의"를 감지해 재동의 화면으로 보낸다 — [제안(선택)], 처음엔 감지 함수만 둔다.

`terms.ts` 정의 예: `{ id: 'service', version: '2026-11-01', required: true, title: '이용약관', href: '/terms/service' }`. 본문 페이지(`/terms/*`)는 [제안(선택)]; 처음엔 가입 화면 아코디언(기존 shadcn `Accordion`)에 본문을 펼친다.

### `verifications` (이메일/SMS 코드)
| 필드 | 비고 |
|---|---|
| `userId` \| null, `target` | 대상(이메일 또는 전화번호, 정규화) |
| `channel` | `'email' \| 'sms'` |
| `purpose` | `'signup' \| 'change-email' \| 'reset-password'` |
| `codeHash` | 6자리 코드의 SHA-256 (+ pepper) |
| `attempts` | 5회 초과 시 무효 |
| `expiresAt` | 발급 + 10분 |

인덱스: `{ target: 1, channel: 1, purpose: 1 }` unique(재발송 시 교체), `{ expiresAt: 1 }` TTL(`expireAfterSeconds: 0`). 본인인증(PASS 등)은 외부 리다이렉트 방식이라 이 컬렉션이 아니라 `users.identityVerifiedAt`만 갱신한다.

### `sessions` (refresh 토큰)
| 필드 | 비고 |
|---|---|
| `_id` | 세션 id = JWT `sid` |
| `userId` | |
| `tokenHash` | 현재 refresh 해시 |
| `prevTokenHash`, `rotatedAt` | 재사용 탐지·30초 유예 |
| `createdAt`, `expiresAt` | 상한 30일(`createdAt` 기준) |
| `userAgent` | 마이페이지 "로그인된 기기" 표시용 — [제안(선택)], 저장 시 앞 200자만 |

인덱스: `{ tokenHash: 1 }` unique, `{ prevTokenHash: 1 }`(sparse), `{ userId: 1 }`, `{ expiresAt: 1 }` TTL.

### `rateLimits`
`{ _id: '<scope>:<key>', count, expiresAt }`, `{ expiresAt: 1 }` TTL. `key`는 IP나 이메일의 **해시**(평문 이메일을 남기지 않음).

### 개인정보 최소화 요약
수집: 이메일, 이름, 비밀번호 해시, 동의 기록. 기본 미수집: 전화번호·생년월일·CI·제공자 토큰·IP 원문(로그·rate limit은 해시). 탈퇴 시 처리는 §11 질문 3.

---

## 4. 보안

### 4.1 비밀번호 해시
- **argon2id**(`@node-rs/argon2`) — OWASP Password Storage Cheat Sheet 최소 권장값 **m=19456 KiB(19 MiB), t=2, p=1**. 해시 문자열에 파라미터가 들어가므로 나중에 올릴 때 로그인 성공 시 `needsRehash` 판단 후 재해시.
- `@node-rs/argon2`를 고른 이유: 미리 빌드된 바이너리라 Windows/macOS에서 node-gyp가 필요 없다(`argon2` 패키지는 빌드 도구가 필요할 수 있음). 이 저장소 `npm ci`도 install script를 기본 차단하므로(설치 로그 경고) 빌드 스크립트 없는 패키지가 안전하다.
- 비밀번호 정책(KISA 권고와 NIST 800-63B 절충): 8~64자, **영문·숫자·특수문자 중 3종 이상이면 8자, 2종이면 10자 이상**, 이메일 아이디 부분 포함 금지, 흔한 비밀번호 상위 목록(코드에 100개 내외 상수) 금지. 공백 허용, 자르지 않음.

### 4.2 쿠키
§1.3 참고. 추가로 OAuth용 임시 쿠키 `ns_oauth`(state·codeVerifier·intent·next를 담은 **서명 JWT**, 10분, httpOnly, SameSite=Lax, path=`/api/auth/oauth`). 제공자에서 돌아오는 콜백은 최상위 GET 내비게이션이라 Lax로 전송된다.

### 4.3 CSRF
- **Server Actions**: POST만 허용 + Origin과 Host(`X-Forwarded-Host`) 비교, 다르면 중단(`data-security.md:546-550`). 쿠키 SameSite=Lax까지 겹쳐 추가 토큰이 필요 없다. 리버스 프록시 뒤에 둘 때만 `serverActions.allowedOrigins`.
- **상태를 바꾸는 GET을 만들지 않는다.** 로그아웃은 링크가 아니라 `<form action={logout}>`.
- **Route Handler**는 OAuth 시작·콜백 GET 두 개뿐이고, 콜백은 state 대조로 보호. 시작 GET은 상태를 바꾸지 않는다(임시 쿠키만).
- **Open redirect**: `next` 파라미터는 `safeNext()`로 `/`로 시작하고 `//`·`/\`로 시작하지 않는 내부 경로만 허용, 아니면 `/`.

### 4.4 브루트포스·rate limit (추가 인프라 없이)
MongoDB 하나로 해결(`rateLimits` + TTL 인덱스, `findOneAndUpdate` upsert `$inc`) — 인스턴스가 여러 개여도 공유된다.

| 대상 | 키 | 한도(초안) |
|---|---|---|
| 로그인 | IP | 20회 / 15분 |
| 로그인 | 이메일 해시 | 5회 실패 / 15분 → 이후 "잠시 후 다시 시도" (계정 잠금이 아니라 시간창이라 타인이 계정을 영구 잠글 수 없다) |
| 이메일 중복 확인 | IP | 30회 / 10분 |
| 가입 | IP | 5회 / 1시간 |
| 검증 코드 발송/확인 | target | 발송 3회/10분, 확인 5회/코드 |

IP는 `headers()`의 `x-forwarded-for` 첫 값 — **신뢰할 프록시 뒤에서만 의미가 있다**(배포 환경에 따라 구현 시 확인). 없으면 IP 한도는 건너뛰고 이메일 한도만 적용.

### 4.5 계정 열거 방지 vs 중복 확인 UX
- **로그인**: "이메일 또는 비밀번호가 올바르지 않습니다" 하나만. 없는 이메일이어도 더미 해시를 verify해 응답 시간을 맞춘다. OAuth 전용 계정(비밀번호 null)도 같은 메시지 + 아래에 "소셜 계정으로 가입하셨다면 위 버튼을 이용하세요" 상시 안내(특정 계정을 지목하지 않음).
- **가입 중복 확인**: 가입 화면은 어차피 "이미 가입된 이메일"을 알려줄 수밖에 없다(유니크 제약). 그래서 숨기기보다 **실시간 확인을 제공하되 rate limit으로 대량 조회를 막는다**. 이메일 검증이 켜지면 "인증 메일을 보냈습니다"로 통일하고 기존 계정 소유자에게는 "가입 시도 알림" 메일을 보내는 방식으로 전환할 수 있다 — [제안(선택)], 질문 6.

### 4.6 OAuth: state·PKCE·계정 링크 정책
- **state**: 32바이트 랜덤, `ns_oauth` 쿠키와 콜백 쿼리 비교(상수 시간). **PKCE**: arctic이 지원하는 제공자(Google 필수, 나머지는 arctic 시그니처 기준 — Kakao·GitHub는 state만, Naver는 구현 시 시그니처 확인)에 S256 적용.
- 콜백에서 쓰는 식별자는 **`provider + providerAccountId`**. 이메일은 식별에 쓰지 않는다.
- **링크 정책** (`lib/auth/oauth/link.ts`):

| 상황 | 처리 |
|---|---|
| 이미 연결된 `providerAccountId` | 그 user로 로그인 |
| intent=link (마이페이지에서 로그인 상태로 시작) | 현재 user에 연결. 그 제공자 계정이 **다른 user에 이미 연결**돼 있으면 거부("다른 계정에 연결된 소셜 계정입니다") |
| 미연결 + 제공자 이메일이 기존 로컬 계정과 같음 | **자동 연결하지 않는다.** "이미 가입된 이메일입니다. 비밀번호로 로그인한 뒤 마이페이지에서 연결하세요." → `/login?email=…` (선점 계정 탈취 방지: 제공자 이메일 검증 수준이 제각각이고, 반대로 공격자가 피해자 이메일로 로컬 계정을 먼저 만들어 둘 수도 있다) |
| 미연결 + 새 이메일(또는 이메일 없음) | 프로필을 서명 JWT 임시 쿠키(`ns_pending`, 10분)에 담고 `/signup/oauth`로 → 필수 약관 동의(+ 이메일 없으면 이메일 입력) 후 user·account 생성. 제공자가 `email_verified`를 준 경우만 `emailVerifiedAt` 설정 |

- **연결 해제**: 남는 로그인 수단(비밀번호 또는 다른 제공자)이 있을 때만 허용. OAuth 전용 사용자는 마이페이지에서 "비밀번호 설정" 후 해제 가능.
- Kakao는 이메일이 동의 항목 선택이고(비즈 앱 전환 필요) 사용자가 거부할 수 있으므로 이메일 없음 경로가 실제로 쓰인다.

### 4.7 비밀 키 관리
- `AUTH_SECRET`: 32바이트 이상 랜덤(`openssl rand -base64 32`). JWT 서명, 임시 쿠키 서명, 코드·IP 해시 pepper에 HKDF로 용도별 키를 파생(`crypto.hkdfSync`, 의존성 불필요)해 키 하나만 관리.
- 키 교체: `AUTH_SECRET_PREVIOUS`(선택)가 있으면 verify만 이전 키도 허용 → 15분 후 제거. — [제안(선택)]
- 모든 비밀은 `NEXT_PUBLIC_` 접두사 금지(`environment-variables.md:156`). `lib/auth/config.ts`는 `server-only`. 값은 로그·에러 메시지에 출력하지 않는다.
- 자체 호스팅 다중 인스턴스면 `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` 고정(`data-security.md:534`).
- DAL DTO는 `passwordHash`·`tokenVersion`·`ciHash`를 절대 포함하지 않는다(`authentication.md` DTO 절). 캐시 키·태그에 이메일·토큰 금지(`authentication-with-cache-components.md` Step 4).

---

## 5. 검증 인터페이스 (이메일 / SMS / 본인인증)

**인프라가 없으므로 인터페이스와 흐름만 만들고 기본은 꺼 둔다. 실제 발송 코드는 넣지 않는다.**

```ts
// lib/auth/verification/types.ts (설계안, 구현 시 이 모양을 따른다)
export interface EmailSender {
  send(msg: { to: string; subject: string; text: string; html?: string }): Promise<void>
}
export interface SmsSender {
  send(msg: { to: string; text: string }): Promise<void>
}
export interface IdentityVerifier {
  // 외부 본인인증 창(PASS·포트원 등)으로 보낼 URL 생성
  start(input: { returnTo: string; state: string }): Promise<{ redirectUrl: string }>
  // 콜백 결과 확인 → 이름·생년월일·CI 등 (CI는 호출 측에서 즉시 HMAC)
  verify(input: { callbackParams: URLSearchParams; state: string }): Promise<{ ci: string; name: string; birthDate: string }>
}
```

| 구현 | 쓰는 곳 | 동작 |
|---|---|---|
| `disabled.ts` | 기본값(플래그 off), production에서 플래그 on인데 어댑터 미설정 | 호출 자체가 일어나지 않도록 흐름에서 단계를 숨긴다. 호출되면 `throw new Error('verification disabled')` |
| `console.ts` | `NODE_ENV=development` + 플래그 on | 서버 콘솔에 "[dev] to=… code=…" 출력. production에선 선택 불가(`config.ts`에서 거부) |
| (나중) `resend.ts`, `solapi.ts`, `portone.ts` 등 | 실제 운영 | 인터페이스만 구현해 `index.ts`의 선택 분기에 한 줄 추가 |

플래그(env): `AUTH_EMAIL_VERIFICATION`, `AUTH_SMS_VERIFICATION`, `AUTH_IDENTITY_VERIFICATION` — 값 `off`(기본) | `console` | 어댑터 이름.

| 흐름 | off (기본) | on |
|---|---|---|
| 회원가입 | 약관 → 계정 정보 → 완료(바로 로그인). `emailVerifiedAt = null` | 계정 정보 다음에 **"이메일 인증" 단계** 노출: 6자리 코드 발송 → 입력 → `emailVerifiedAt` 설정 후 완료. 미인증 상태로 이탈하면 계정은 생성되지만 마이페이지 상단에 "이메일 인증하기" 배너 |
| SMS | 전화번호를 묻지 않음 | 계정 정보 단계에 휴대폰 번호 + 인증 버튼 추가, `phoneVerifiedAt` |
| 본인인증 | 단계 없음 | 약관 다음에 "본인인증" 단계(외부 창 → 콜백 → `ciHash`로 중복 가입 차단) |
| 비밀번호 재설정 | 화면 없음("고객센터 문의" 안내) | `/forgot-password` 코드 발송 → 새 비밀번호 — [제안(선택)] |

코드 발급·검증 로직(`verifications` 컬렉션, 해시·만료·시도 횟수)은 **플래그와 무관하게 구현·테스트**해 둔다. 그래야 어댑터만 꽂으면 된다.

> **구현 메모(사용자 결정 5 반영)**: 화면 흐름까지 연결한 것은 이메일 인증 단계뿐이다. SMS(전화번호 입력)·본인인증 단계와 마이페이지 "이메일 인증하기" 배너는 인터페이스·비활성/console 구현만 두고 화면에는 연결하지 않았다 — 실제 어댑터를 붙일 때 함께 만든다.

---

## 6. 화면별 UX 명세

공통 디자인: `(auth)/layout.tsx`는 `bg-background` 위 가운데 `Card`(기존 `src/components/ui/card.tsx`), 제목은 `font-heading`, 주 버튼은 헤더의 `gradient-brand` 그라데이션 + `rounded-full` 스타일을 그대로 쓴다. 입력은 shadcn `Input`/`Label`/`Checkbox`. 색은 `brand.css` 토큰만(새 색 추가 없음), 에러는 shadcn 기본 `destructive`. 다크 모드는 기존 `.dark` 토큰이 처리.

### 공통 폼 동작 [필수 2·9]
- 폼은 Client Component + `useActionState(action, initialState)`; 액션은 `{ ok, fieldErrors, formError, values }` 반환. React 19는 액션 후 폼을 리셋하므로 **`values`로 `defaultValue`를 되돌려** 입력이 사라지지 않게 한다(비밀번호는 되돌리지 않음).
- **실시간 검증**: 같은 zod 스키마로 `onBlur` 시 그 필드만 검사, 한 번 에러가 난 필드는 `onChange`로 즉시 재검사(처음부터 타이핑마다 빨간 글씨 띄우지 않음). 서버는 제출 시 전체 재검사.
- 이메일 중복 확인: 이메일 형식이 통과한 뒤 blur 시 `checkEmailAvailable` 액션(디바운스 400ms), 결과를 필드 아래 "사용 가능한 이메일입니다 ✓"/"이미 가입된 이메일입니다 · 로그인하기" 링크로.
- 제출 중: 버튼 `disabled` + 스피너(`lucide-react` `Loader2`) + 문구 유지("가입 중…"). 중복 제출 방지.
- 에러 위치: 필드 에러는 필드 바로 아래, 폼 전체 에러(네트워크·rate limit)는 폼 상단 알림 영역. 제출 실패 시 **첫 에러 필드로 포커스 이동**.
- `autocomplete`: 로그인 `email`/`current-password`, 가입 `email`/`new-password`/`name`, 인증 코드 `one-time-code` + `inputMode="numeric"`, 전화 `tel`.
- `type="email"`, `autoCapitalize="none"`, `spellCheck={false}`.

### 접근성 [필수 9]
- 모든 입력에 `<Label htmlFor>`; 힌트·에러는 `aria-describedby`로 연결, 에러 시 `aria-invalid`(기존 `buttonVariants`에 이미 `aria-invalid` 스타일이 있고 shadcn Input도 동일). 폼 상단 에러·중복 확인 결과는 `role="alert"`/`aria-live="polite"`.
- 비밀번호 보기/숨기기 버튼: `type="button"`, `aria-label="비밀번호 보기"`/`"숨기기"`, `aria-pressed`. 토글해도 포커스·커서 위치 유지.
- 강도 막대는 색만으로 전달하지 않고 텍스트("약함/보통/강함") 병기 + 충족 조건 체크리스트(✓ 8자 이상 …).
- 단계형 가입: 상단 단계 표시 `<ol aria-label="가입 단계">` + 현재 단계 `aria-current="step"`, 단계 전환 시 새 단계 제목으로 포커스.
- 키보드만으로 전 과정 가능, 포커스 링은 기존 `ring` 토큰.

### 회원가입 `/signup` (단계형)
1. **약관 동의**: "전체 동의" 체크박스(하위와 동기화, 일부만 체크 시 indeterminate) + 항목별 체크박스, 각 항목 `Accordion`으로 본문 펼치기, `[필수]`/`[선택]` 배지(`Badge`). 필수 미체크 시 "다음" 비활성 + 이유 문구.
   - 기본 항목: [필수] 이용약관, [필수] 개인정보 수집·이용, [필수] 만 14세 이상입니다, [선택] 마케팅 정보 수신(이메일). (질문 7)
2. **계정 정보**: 이메일(중복 확인) · 비밀번호(보기/숨기기 + 강도) · 비밀번호 확인(일치 시 즉시 ✓) · 이름. 위에 OAuth 버튼("카카오로 3초 만에 가입") — 이 단계에서 OAuth를 누르면 1단계 동의를 들고 가지 않고 `/signup/oauth`에서 다시 확인한다(동의 근거를 서버에서 남기기 위해 단순화).
3. **(플래그 on일 때만) 인증**: 코드 6칸 입력, 재발송 60초 쿨다운 표시, 만료 타이머.
4. **완료**: 자동 로그인 후 `next` 또는 `/`로 이동, 토스트 대신 완료 화면 한 장("환영합니다, ○○님" + "강의 둘러보기" 버튼) — 토스트 라이브러리 의존성을 늘리지 않기 위해.

상태는 클라이언트 `useState`로 들고, 마지막에 **한 번의 `signup` 액션**에 전부 보낸다(동의는 hidden input). 서버는 약관·계정 전부를 다시 검증 → 중복 재확인(유니크 인덱스 에러를 "이미 가입된 이메일" 필드 에러로 변환) → 해시 → user + termAgreements 삽입 → 세션 발급 → redirect.

뒤로 가기: 단계 이동은 URL을 바꾸지 않는다(새로고침 시 1단계로 — 비밀번호를 URL·스토리지에 남기지 않기 위해). 이탈 경고는 [제안(선택)].

### 로그인 `/login`
- 이메일, 비밀번호(보기/숨기기), "로그인" 버튼, 그 아래 구분선(`Separator`) + OAuth 버튼, 하단 "아직 회원이 아니신가요? 회원가입".
- `?reason=expired` → 상단 안내 "로그인 시간이 만료되었습니다. 다시 로그인해 주세요." / `?reason=linked-required` → §4.6 문구 / `?email=` → 이메일 미리 채움.
- 실패: 일반 메시지, 비밀번호 필드만 비우고 포커스. rate limit: "로그인 시도가 너무 많습니다. N분 뒤 다시 시도해 주세요."
- 성공: `safeNext(next)`로 복귀(proxy가 보호 페이지에서 보낼 때 `next`를 붙인다).
- "로그인 상태 유지" 체크박스: 넣지 않는다 — refresh가 이미 14일이라 의미가 겹친다. 공용 PC 우려는 로그아웃 버튼 노출로 대응. (질문 8에서 TTL과 함께 결정)

### OAuth 버튼 (`molecules/oauth-buttons.tsx`)
- ~~활성 제공자만 렌더~~ → **구현(사용자 결정 1)**: 제공자는 Kakao·Google 두 개만 두고(Naver·GitHub 제외), client id/secret이 없으면 버튼을 숨기지 않고 "준비 중" 배지와 함께 비활성(`disabled`)으로 보여준다. 시작·콜백 라우트도 키가 없거나 모르는 제공자면 404/500 대신 `/login?error=oauth_disabled`로 돌려보낸다. 실제 제공자 로그인은 아직 동작시키지 않는다(구조만).
- 각 제공자 브랜드 가이드의 공식 색·로고 규칙을 따른다(카카오 노랑 버튼 등). 브랜드 로고 SVG는 각 제공자 가이드 배포 자산을 쓴다 — 구현 시 확인. 그 외 버튼 모양은 기존 `Button` `outline` + `rounded-full`.
- `<a href="/api/auth/oauth/kakao?next=…">`(GET, 상태 변경 없음). 클릭 후 버튼 로딩 표시.
- 콜백 실패(사용자 취소·state 불일치): `/login?error=oauth_cancelled|oauth_failed` → "카카오 로그인이 취소되었습니다." 등.

### `/signup/oauth`
"카카오 계정으로 가입합니다" + 제공자 이메일 표시(없으면 이메일 입력) + 이름(제공자 값 미리 채움, 수정 가능) + 약관 단계 재사용(`terms-step.tsx`). `ns_pending` 만료 시 "다시 시도해 주세요" + 로그인 링크.

### 마이페이지 `/mypage` [필수 8]
페이지는 섹션 조립만 하고, 섹션마다 `<Suspense fallback={<SectionSkeleton/>}>` 안에서 DAL을 호출한다(Cache Components 규칙). 범위 추천(질문 4):

| 섹션 | 내용 | 비고 |
|---|---|---|
| 프로필 | 이름 수정, 이메일(읽기 전용 + 인증 상태 배지) | 이메일 변경은 검증 인프라가 필요해 [제안(선택)] |
| 비밀번호 | 현재 비밀번호 + 새 비밀번호(강도) + 확인. OAuth 전용이면 "비밀번호 설정"(현재 비밀번호 없음) | 변경 시 `tokenVersion+1`, 현재 세션만 새로 발급하고 다른 기기는 로그아웃 |
| 연결된 계정 | 제공자별 연결 상태, "연결하기"(→ `intent=link`), "해제"(남는 수단 없으면 비활성 + 이유) | |
| 약관 동의 내역 | 항목별 현재 상태·버전·동의 일시. 선택 약관은 토글로 철회/재동의(새 이력 추가) | 필수 약관 철회 = 탈퇴이므로 토글 없음 |
| 로그인 관리 | 로그아웃, 모든 기기에서 로그아웃 | 기기 목록은 [제안(선택)] |
| 회원 탈퇴 | `AlertDialog`로 확인, 비밀번호 사용자는 비밀번호 재입력 / OAuth 전용은 이메일 입력으로 확인 | 정책은 질문 3 |

각 섹션 폼은 독립 `useActionState` → 성공 시 섹션 안 "저장되었습니다" 인라인 메시지(`aria-live`)와 `refresh()`/`updateTag`로 갱신.

### 랜딩 헤더
"수강 신청" 버튼 왼쪽에 `<Suspense fallback={<로그인 링크/>}><AccountSlot/></Suspense>`. 로그인 상태면 "마이페이지" 링크(이름 이니셜 원형 + 이름). 헤더는 Server Component이므로 세션 읽기를 경계 안 컴포넌트로 내려 랜딩의 정적 셸을 유지한다(`authentication.md:1368`).

### 상태별 처리
| 상태 | 처리 |
|---|---|
| 로딩(페이지) | 섹션 스켈레톤(`bg-muted animate-pulse`), `(account)/mypage/loading.tsx`는 두지 않고 섹션별 Suspense로 |
| 로딩(제출) | 버튼 pending (위) |
| 빈 상태 | 연결된 계정 없음 → "연결된 소셜 계정이 없습니다" + 연결 버튼, 선택 약관 동의 없음 → "동의한 선택 항목이 없습니다" |
| 세션 만료 | proxy가 refresh 실패 시 보호 페이지는 `/login?reason=expired&next=현재경로`. Server Action 중 만료면 DAL이 같은 redirect(입력값은 잃는다 — refresh가 14일이라 드묾) |
| 서버 오류 | 액션은 예상 못 한 에러를 잡아 "일시적인 오류입니다. 잠시 후 다시 시도해 주세요."(원인은 서버 로그만), 페이지는 `error.tsx`(그룹별 1개) — 재시도 버튼 |
| JS 비활성 | 폼은 `action={formAction}`이라 기본 제출로도 동작(점진적 향상). 단계형 가입만 JS 필요 → `noscript` 안내 |

---

## 7. 환경 변수와 `.env.example` 초안

`.gitignore`의 `.env*`가 `.env.example`도 무시하므로 `!.env.example`을 추가해야 커밋된다.

```dotenv
# ── DB ──────────────────────────────────────────
# MongoDB 연결 문자열. 경로에 DB 이름을 반드시 포함(…/nextstep)
DATABASE_URL=

# ── 인증 ────────────────────────────────────────
# 32바이트 이상 랜덤 (openssl rand -base64 32). JWT·임시 쿠키 서명, 해시 pepper 파생
AUTH_SECRET=
# OAuth redirect URI와 메일 링크의 기준 주소 (예: http://localhost:3000)
APP_ORIGIN=

# ── OAuth (client id·secret 둘 다 있으면 해당 버튼 활성) ──
AUTH_GOOGLE_CLIENT_ID=
AUTH_GOOGLE_CLIENT_SECRET=
AUTH_KAKAO_CLIENT_ID=
AUTH_KAKAO_CLIENT_SECRET=
AUTH_NAVER_CLIENT_ID=
AUTH_NAVER_CLIENT_SECRET=
AUTH_GITHUB_CLIENT_ID=
AUTH_GITHUB_CLIENT_SECRET=

# ── 검증 기능 플래그: off | console(개발 전용) | <어댑터 이름> ──
AUTH_EMAIL_VERIFICATION=off
AUTH_SMS_VERIFICATION=off
AUTH_IDENTITY_VERIFICATION=off

# ── 선택 ────────────────────────────────────────
# 자체 호스팅 다중 인스턴스에서 Server Action 암호화 키 고정
# NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=
```

(어댑터를 붙일 때 `EMAIL_FROM`, 발송 서비스 API 키 등이 추가된다 — 지금은 넣지 않는다.)

---

## 8. 추가 의존성

| 패키지 | 구분 | 이유 | 대안을 안 쓴 이유 |
|---|---|---|---|
| `mongodb` ^7 | dep | DB 접근(§1.2) | Mongoose: 검증 중복 |
| `jose` ^6 | dep | JWT 서명·검증. Web Crypto 기반이라 proxy·Node 어디서나 동작 | `jsonwebtoken`: 콜백 API, 유지보수 둔화 |
| `@node-rs/argon2` ^2 | dep | argon2id, 프리빌드 바이너리(§4.1) | `bcrypt`: 72바이트 제한·OWASP 2순위, `argon2`: 빌드 도구 필요 가능 |
| `arctic` ^3 | dep | 4개 제공자 OAuth 2.0·PKCE·state 헬퍼, 의존성 거의 없음 | 직접 구현: 제공자별 엔드포인트·토큰 교환 차이를 다 손으로 |
| `zod` ^4 | dep | 클라·서버 공용 스키마. 지금도 shadcn 경유로 `node_modules`에 있지만 **직접 의존성으로 명시** | |
| `vitest` | devDep | 단위 테스트(§10) | Node 내장 `node --test`: `@/` 경로 별칭·TS 처리 설정이 더 번거로움 |
| shadcn `input`, `label`, `checkbox`, `alert-dialog` | 코드 복사(`npx shadcn@latest add …`) | 폼·탈퇴 확인. `base-nova`라 이미 있는 `@base-ui/react`를 쓴다 — 추가 npm 패키지가 생기는지 실행 후 `package.json` diff로 확인 | |

넣지 않는 것: `zxcvbn`(수백 KB, 규칙 기반으로 충분), 토스트 라이브러리, 폼 라이브러리(`react-hook-form` — `useActionState` + zod로 충분), `server-only`(Next가 내부 처리, `data-security.md:255`. 단 vitest에서는 빈 모듈로 alias 필요), `iron-session`(jose로 대체).

---

## 9. 구현 단계 계획

각 단계는 독립 커밋(필요하면 여러 개). 모든 단계 공통 완료 확인: `npx tsc --noEmit`, `npm run lint`, (테스트 생긴 뒤) `npx vitest run`. 화면 단계는 추가로 `npm run build`(Suspense 밖 `cookies()` 같은 Cache Components 위반이 **빌드 에러**로 잡힌다)와 `npm run dev` 수동 확인. 시작 전에 `.env`를 저장소 루트에 사용자가 직접 둔다(에이전트는 값을 읽거나 출력하지 않는다).

| # | 내용 | 커밋 메시지 예 | 완료 확인 |
|---|---|---|---|
| 1 | 의존성 설치, `.env.example`, `.gitignore`에 `!.env.example` | `chore(auth): 인증 의존성과 환경 변수 예시 추가` | `git status`에 `.env.example`만 보이고 `.env`는 안 보임 |
| 2 | shadcn `input label checkbox alert-dialog` 추가 | `chore(ui): shadcn 폼 컴포넌트 추가` | 빌드 통과, `package.json` diff 확인 |
| 3 | vitest 설정(`@`→`src` alias, `server-only` 빈 모듈 alias), `test` 스크립트 | `test: vitest 설정 추가` | `npm test`가 0개 테스트로 성공 |
| 4 | `lib/auth/{config,schemas,password,tokens,redirect}.ts` + 단위 테스트 | `feat(auth): 스키마·비밀번호 해시·JWT 유틸 추가` | §10 테스트 통과 |
| 5 | `lib/db/{client,collections}.ts`, 인덱스 보장 | `feat(db): MongoDB 클라이언트와 컬렉션 인덱스 정의` | dev에서 임시 호출로 연결·인덱스 생성 확인(값 출력 없이 `listIndexes` 이름만) |
| 6 | `lib/auth/{session,dal,rate-limit,actions}.ts`, `src/proxy.ts` | `feat(auth): refresh 회전 세션·DAL·proxy 추가` | 회전·재사용·유예 테스트, `/mypage` 미로그인 접근 시 `/login?next=/mypage` |
| 7 | `lib/auth/terms.ts` + 동의 이력 저장·조회 함수 | `feat(auth): 약관 버전 정의와 동의 이력 저장` | 최신 상태 계산 테스트 |
| 8 | 공유 컴포넌트 `form-field`, `password-input`, `password-strength` | `feat(ui): 폼 필드·비밀번호 입력 컴포넌트 추가` | 키보드·스크린리더 속성 수동 점검 |
| 9 | `(auth)/layout`, `/signup` 단계형 + 액션 | `feat(auth): 단계형 회원가입 화면과 액션 구현` | 가입 → 자동 로그인 → DB에 user·termAgreements 확인, 중복 이메일 메시지, JS로 우회 제출 시 서버 에러 |
| 10 | `/login` + 로그아웃 + rate limit 연결 | `feat(auth): 로그인·로그아웃과 시도 횟수 제한` | 6번째 실패 시 제한 메시지, `next` 복귀, 외부 `next` 무시 |
| 11 | `lib/auth/verification/*` + 가입 인증 단계(플래그) | `feat(auth): 이메일·SMS·본인인증 인터페이스와 비활성 구현` | off: 단계 없음 / `console`(dev): 콘솔 코드로 인증 완료 / production+console: 시작 시 에러 |
| 12 | OAuth 시작·콜백, 링크 정책, `/signup/oauth` — **제공자 1개(추천 1순위)로 먼저**, 나머지는 같은 단계의 후속 커밋 | `feat(auth): Google OAuth 로그인과 계정 연결 정책 구현` / `feat(auth): Kakao OAuth 추가` | 신규 가입, 재로그인, 같은 이메일 로컬 계정 존재 시 자동 연결 안 됨, state 변조 시 실패 |
| 13 | `/mypage` 섹션들 + 액션 | `feat(account): 마이페이지 프로필·비밀번호·연결 계정·동의 내역` / `feat(account): 회원 탈퇴와 전체 로그아웃` | 각 액션을 로그아웃 상태 POST로 호출 시 거부(DAL), 비밀번호 변경 후 다른 브라우저 세션 만료 |
| 14 | 랜딩 헤더 `AccountSlot` | `feat(landing): 헤더에 로그인 상태 표시` | 랜딩 정적 셸 유지(`npm run build` 출력에서 `/`가 부분 프리렌더), 로그인 시 마이페이지 링크 |

순서 근거: 순수 유틸(테스트 가능) → DB → 세션 → 화면. OAuth는 로컬 가입·로그인과 세션이 안정된 뒤에 얹는다(링크 정책이 로컬 계정을 전제).

---

## 10. 테스트 전략

새 의존성은 `vitest` 하나. DB가 필요한 테스트는 실제 `DATABASE_URL`을 쓰지 않는다(운영 데이터 위험). 그래서 **DB에 의존하지 않는 판단 로직을 순수 함수로 분리**해 단위 테스트하고, DB 연동은 수동 체크리스트로 확인한다.

남길 최소 테스트:

| 파일 | 검사 |
|---|---|
| `schemas.test.ts` | 이메일 정규화(대소문자·공백·전각), 비밀번호 정책 경계(7/8자, 2종 9/10자, 이메일 포함, 흔한 비밀번호), 필수 약관 누락 거부 |
| `password.test.ts` | hash→verify 성공, 틀린 비밀번호 실패, 해시에 argon2id·파라미터 포함 |
| `tokens.test.ts` | sign→verify, 만료(가짜 시계 `vi.useFakeTimers`), 다른 키·변조 서명 거부, `aud`/`iss` 불일치 거부 |
| `redirect.test.ts` | `safeNext`: `/mypage` 허용, `//evil.com`·`/\evil.com`·`https://evil.com`·빈 값 → `/` |
| `session.test.ts` | 회전 판단 함수(`decideRefresh(session, presentedHash, now)`): 정상 회전 / 30초 내 재사용 = access만 / 30초 후 재사용 = 폐기 / 30일 상한 초과 = 거부 |
| `link.test.ts` | 링크 정책 표(§4.6) 5가지 경우 → 기대 결정(`login`/`link`/`reject`/`require-local-login`/`pending-signup`) |
| `terms.test.ts` | 이력 → 현재 동의 상태, 필수 새 버전 미동의 감지 |
| `verification.test.ts` | 코드 해시 검증, 만료, 5회 초과, 플래그 off에서 disabled 구현 선택, production에서 console 거부 |
| `rate-limit.test.ts` | 윈도 계산 순수 부분(키 생성 해시, 한도 판정) |

수동 E2E 체크리스트(단계 9~14의 "완료 확인" 열)를 PR 설명에 붙인다. [제안(선택)] `mongodb-memory-server`(바이너리 다운로드 수백 MB)로 DB 통합 테스트, Playwright E2E — 지금은 넣지 않는다.

---

## 11. 사용자 결정이 필요한 질문

| # | 질문 | 추천 기본값 | 이유 |
|---|---|---|---|
| 1 | OAuth 제공자는? (Google/Kakao/Naver/GitHub) | **Kakao + Google** 먼저, GitHub는 [제안(선택)], Naver 제외 | 국내 수강생 가입 전환은 카카오가 가장 크고, Google은 이메일이 항상 검증된 상태로 와서 링크 정책이 단순하다. GitHub는 개발 지망생에게 친숙하나 필수는 아님. arctic이 4개 모두 지원하므로 나중 추가 비용은 env 2개 + 버튼 1개. ⚠️ 카카오 이메일 수집은 비즈 앱 전환이 필요하고 사용자가 거부 가능 → 이메일 입력 보완 단계가 필요(설계에 포함) |
| 2 | 로그인 식별자는 이메일만? | **이메일만** | 아이디를 따로 두면 중복 확인·찾기 화면이 늘고, 이메일은 나중에 검증·알림에 그대로 쓰인다 |
| 3 | 탈퇴 정책은? | **즉시 하드 삭제**(users·accounts·sessions·verifications 삭제, termAgreements도 삭제) | 결제·수강 기록이 아직 없어 법정 보관 대상(전자상거래법 계약 기록 등)이 없다. 결제가 생기면 "주문 기록 별도 보관 + 계정은 삭제"로 재검토. 대안: 30일 유예 후 삭제(복구 가능, 대신 배치 작업 필요) |
| 4 | 마이페이지 범위는? | §6 표: 프로필(이름)·비밀번호 변경/설정·연결된 계정·약관 동의 내역(선택 철회)·로그아웃/전체 로그아웃·탈퇴 | 요구사항 기능을 각각 관리할 곳이 필요한 최소 범위. 이메일 변경·기기 목록·수강 내역은 데이터/인프라가 없어 제외 |
| 5 | 이름 필드는 실명인가 표시 이름인가? | **표시 이름 1개(1~20자)** | 본인인증이 꺼져 있어 실명을 검증할 수 없다. 본인인증 on이면 인증 결과 실명을 별도 저장 |
| 6 | 가입 시 이메일 실시간 중복 확인을 보여줄까? (계정 열거와의 균형) | **보여준다 + IP rate limit** | 가입 제출 시 어차피 드러나는 정보라 숨겨도 보안 이득이 작고 UX 손해가 크다. 이메일 검증을 켜면 "인증 메일 발송"으로 통일하는 방식으로 전환 가능 |
| 7 | 약관 항목은? | [필수] 이용약관, [필수] 개인정보 수집·이용, [필수] 만 14세 이상, [선택] 마케팅 정보 수신(이메일) | 개인정보보호법상 만 14세 미만은 법정대리인 동의가 필요해 확인 항목이 사실상 필요. 마케팅은 선택 분리 의무. 약관 **본문**은 누가 제공하는지도 결정 필요(기본: 자리표시 문구로 구현, 법무 검토본으로 교체) |
| 8 | 토큰 수명은? | access **15분**, refresh **14일**(회전, 상한 30일), "로그인 유지" 체크박스 없음 | 탈취 시 피해 창을 짧게 하면서 재로그인 빈도는 2주에 한 번 수준. 공용 PC 사용자가 많다면 refresh를 1일로 줄이고 "로그인 유지" 체크 시 14일로 |
| 9 | 비밀번호 재설정을 이번에 넣을까? | **제외**(이메일 어댑터가 생길 때 함께) | 메일 발송 없이는 안전한 재설정 경로가 없다. 그동안은 "고객센터 문의" 안내 |
| 10 | 배포 환경은? (Vercel / 자체 호스팅 1대 / 다중 인스턴스) | 구현은 환경 무관하게, 확인만 필요 | rate limit의 IP 신뢰(`x-forwarded-for`)와 `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` 필요 여부가 여기에 달려 있다. **미결 메모(리뷰 #3)**: 지금 `clientIp()`는 XFF 첫 값을 쓰는데 클라이언트가 위조할 수 있어 IP 한도(로그인·이메일 확인·가입)를 우회할 수 있다. Next는 XFF가 없을 때만 소켓 주소로 채우므로 "없으면 건너뜀" 분기도 사실상 실행되지 않는다. 배포 형태가 정해지면 신뢰 프록시가 붙인 값(`.at(-1)`)이나 플랫폼 헤더로 바꾼다(`rate-limit.ts`의 `shortcut:` 주석). 이메일별 로그인 한도는 IP와 무관하게 동작한다 |

---

## 부록: 이 기획의 가정

- `DATABASE_URL`은 DB 이름을 경로에 포함한 MongoDB(Atlas 또는 자체) 연결 문자열이며 트랜잭션은 쓰지 않는다(가입 시 user → termAgreements 순서 삽입, 두 번째 실패 시 user 삭제로 보상). 레플리카셋이면 트랜잭션으로 바꿔도 된다.
- 관리자(admin) 역할·권한은 요구사항에 없어 `role` 필드를 두지 않는다.
- arctic 제공자별 메서드 시그니처(특히 Naver PKCE 여부), 각 제공자의 동의 항목·검수 절차는 구현 단계 12에서 해당 패키지 타입 정의와 제공자 콘솔로 확인한다.
