import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // Next가 내부 처리하는 server-only를 테스트에선 빈 모듈로 대체
      "server-only": fileURLToPath(new URL("./src/test/empty.ts", import.meta.url)),
    },
  },
  test: {
    include: ["src/**/*.test.ts"],
    passWithNoTests: true,
    // 실제 .env를 읽지 않도록 테스트 전용 값 고정(DB 연결은 하지 않는다)
    env: {
      DATABASE_URL: "mongodb://127.0.0.1:1/test-db",
      AUTH_SECRET: "test-secret-test-secret-test-secret-0123",
      APP_ORIGIN: "http://localhost:3005",
    },
  },
})
