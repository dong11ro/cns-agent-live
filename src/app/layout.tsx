import type { Metadata } from "next";
import { Noto_Sans_KR, Geist_Mono, Jua } from "next/font/google";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jua = Jua({
  variable: "--font-jua",
  weight: "400",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "넥스트스텝 IT 아카데미 | 현업 개발자가 가르치는 IT 교육",
  description:
    "웹 개발, 데이터·AI, 클라우드까지. 현업 멘토와 함께하는 프로젝트 중심 IT 부트캠프.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${notoSansKr.variable} ${jua.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
