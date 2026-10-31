import type { LucideIcon } from "lucide-react";
import type { Tone } from "@/lib/tones";
import { cn } from "@/lib/utils";

export type Feature = { icon: LucideIcon; title: string; description: string };

export function FeatureItem({ icon: Icon, title, description, tone }: Feature & { tone: Tone }) {
  return (
    <div className="rounded-3xl bg-background/80 p-6 shadow-sm ring-1 ring-border backdrop-blur transition-transform hover:-rotate-1">
      <span
        className={cn(
          "flex size-14 rotate-3 items-center justify-center rounded-2xl shadow-md",
          tone.icon,
        )}
      >
        <Icon className="size-7" />
      </span>
      <h3 className="mt-5 font-heading text-2xl">{title}</h3>
      <p className="mt-2 text-muted-foreground">{description}</p>
    </div>
  );
}
