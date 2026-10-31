import type { Tone } from "@/lib/tones";
import { cn } from "@/lib/utils";

export type Stat = { value: string; label: string };

export function StatTile({ value, label, tone }: Stat & { tone: Tone }) {
  return (
    <div
      className={cn(
        "rounded-3xl px-4 py-8 text-center transition-transform hover:scale-105",
        tone.tile,
        tone.rotate,
      )}
    >
      <div className="font-heading text-4xl md:text-5xl">{value}</div>
      <div className="mt-1 text-sm font-medium text-muted-foreground">{label}</div>
    </div>
  );
}
