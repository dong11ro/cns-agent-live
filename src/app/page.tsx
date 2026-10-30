import { Courses } from "@/components/organisms/courses";
import { Cta } from "@/components/organisms/cta";
import { Faq } from "@/components/organisms/faq";
import { Features } from "@/components/organisms/features";
import { Footer } from "@/components/organisms/footer";
import { Header } from "@/components/organisms/header";
import { Hero } from "@/components/organisms/hero";
import { Reviews } from "@/components/organisms/reviews";
import { Stats } from "@/components/organisms/stats";
import { courses, faqs, features, navItems, reviews, stats } from "@/content/landing";

export default function Home() {
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
