export type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description?: string;
};

export function SectionHeading({ eyebrow, title, description }: SectionHeadingProps) {
  return (
    <div className="text-center">
      <div className="inline-flex -rotate-2 rounded-full bg-accent px-4 py-1 text-sm font-bold text-accent-foreground">
        {eyebrow}
      </div>
      <h2 className="mt-4 font-heading text-4xl md:text-5xl">{title}</h2>
      {description && <p className="mt-4 text-muted-foreground">{description}</p>}
    </div>
  );
}
