import { CourseCard } from "@/components/molecules/course-card";
import { SectionHeading } from "@/components/molecules/section-heading";
import type { Course } from "@/content/landing";
import { tones } from "@/lib/tones";

const stickers = ["🚀", "💡", "☁️"];

export function Courses({ courses }: { courses: Course[] }) {
  return (
    <section id="courses" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-24">
      <SectionHeading
        eyebrow="교육과정"
        title="목표에 맞는 과정을 선택하세요"
        description="입문부터 재직자 심화까지, 현업에서 바로 쓰는 기술만 담았습니다."
      />
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {courses.map((course, i) => (
          <CourseCard
            key={course.title}
            {...course}
            tone={tones[i % tones.length]}
            sticker={stickers[i % stickers.length]}
          />
        ))}
      </div>
    </section>
  );
}
