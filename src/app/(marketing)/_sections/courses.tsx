import { type Course, CourseCard } from "@/components/molecules/course-card";
import { SectionHeading } from "@/components/molecules/section-heading";
import { toneAt } from "@/lib/tones";
import type { Section } from "../_content";

export function Courses({ heading, items }: Section<Course>) {
  return (
    <section id="courses" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-24">
      <SectionHeading {...heading} />
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {items.map((course, i) => (
          <CourseCard key={course.title} {...course} tone={toneAt(i)} />
        ))}
      </div>
    </section>
  );
}
