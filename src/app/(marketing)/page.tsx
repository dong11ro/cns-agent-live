import { courses, faqs, features, navItems, reviews, stats } from "./_content";
import { Courses } from "./_sections/courses";
import { Cta } from "./_sections/cta";
import { Faq } from "./_sections/faq";
import { Features } from "./_sections/features";
import { Footer } from "./_sections/footer";
import { Header } from "./_sections/header";
import { Hero } from "./_sections/hero";
import { Reviews } from "./_sections/reviews";
import { Stats } from "./_sections/stats";

// 랜딩 페이지: 위에서 아래로 화면에 보이는 섹션 순서 그대로 나열한다
export default function LandingPage() {
  return (
    <>
      <Header navItems={navItems} />
      <main className="flex-1">
        <Hero />
        <Stats stats={stats} />
        <Courses courses={courses} />
        <Features features={features} />
        <Reviews reviews={reviews} />
        <Faq faqs={faqs} />
        <Cta />
      </main>
      <Footer />
    </>
  );
}
