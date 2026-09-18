import { SellerAvatar } from "@/components/sellers/SellerAvatar";

export type PodiumEntry = {
  sellerId: string;
  name: string;
  photoPath: string | null;
  resultLabel: string;
  percent: number;
};

const STEP_STYLES: Record<1 | 2 | 3, { height: string; step: string; ring: string; medal: string }> = {
  1: {
    height: "h-28",
    step: "bg-gradient-to-b from-amber-400 to-amber-600",
    ring: "ring-amber-400",
    medal: "🥇",
  },
  2: {
    height: "h-20",
    step: "bg-gradient-to-b from-slate-300 to-slate-500",
    ring: "ring-slate-300",
    medal: "🥈",
  },
  3: {
    height: "h-14",
    step: "bg-gradient-to-b from-orange-500 to-orange-800",
    ring: "ring-orange-600",
    medal: "🥉",
  },
};

function PodiumColumn({ entry, rank }: { entry: PodiumEntry; rank: 1 | 2 | 3 }) {
  const style = STEP_STYLES[rank];
  const avatarSize = rank === 1 ? 88 : 64;

  return (
    <div className="flex w-28 flex-col items-center gap-2 sm:w-36">
      <span className="text-2xl">{style.medal}</span>
      <div className={`rounded-full ring-4 ${style.ring}`}>
        <SellerAvatar photoPath={entry.photoPath} name={entry.name} size={avatarSize} />
      </div>
      <p
        className={
          rank === 1
            ? "text-center text-base font-semibold text-neutral-50"
            : "text-center text-sm font-medium text-neutral-200"
        }
      >
        {entry.name}
      </p>
      <p
        className={
          rank === 1
            ? "text-xl font-bold text-emerald-400"
            : "text-base font-semibold text-emerald-400"
        }
      >
        {entry.percent.toFixed(0)}%
      </p>
      <p className="text-xs text-neutral-500">{entry.resultLabel}</p>
      <div className={`mt-2 flex w-full items-start justify-center rounded-t-lg ${style.height} ${style.step}`}>
        <span className="mt-2 text-2xl font-bold text-black/70">{rank}º</span>
      </div>
    </div>
  );
}

export function Podium({ entries }: { entries: PodiumEntry[] }) {
  const [first, second, third] = entries;

  if (!first) {
    return null;
  }

  return (
    <div className="flex items-end justify-center gap-4 rounded-xl border border-neutral-800 bg-neutral-900 px-6 pt-8 pb-0 sm:gap-8">
      {second ? <PodiumColumn entry={second} rank={2} /> : <div className="w-28 sm:w-36" />}
      <PodiumColumn entry={first} rank={1} />
      {third ? <PodiumColumn entry={third} rank={3} /> : <div className="w-28 sm:w-36" />}
    </div>
  );
}
