import { FaqItem } from "@/components/molecules/faq-item";
import { SectionHeading } from "@/components/molecules/section-heading";
import { Accordion } from "@/components/ui/accordion";
import type { Faq as FaqEntry } from "@/content/landing";

export function Faq({ faqs }: { faqs: FaqEntry[] }) {
  return (
    <section id="faq" className="scroll-mt-20 py-24">
      <div className="mx-auto max-w-3xl px-4">
        <SectionHeading eyebrow="FAQ" title="자주 묻는 질문" />
        <Accordion className="mt-12 gap-3">
          {faqs.map((faq) => (
            <FaqItem key={faq.q} {...faq} />
          ))}
        </Accordion>
      </div>
    </section>
  );
}
