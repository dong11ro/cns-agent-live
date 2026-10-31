import { type Stat, StatTile } from "@/components/molecules/stat-tile";
import { toneAt } from "@/lib/tones";

export function Stats({ stats }: { stats: Stat[] }) {
  return (
    <section className="px-4">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((stat, i) => (
          <StatTile key={stat.label} {...stat} tone={toneAt(i)} />
        ))}
      </div>
    </section>
  );
}
