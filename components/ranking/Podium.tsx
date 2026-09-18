import Link from "next/link";
import { SellerAvatar } from "@/components/sellers/SellerAvatar";

export type PodiumEntry = {
  sellerId: string;
  name: string;
  photoPath: string | null;
  resultLabel: string;
  percent: number;
};

const STEP_STYLES: Record<1 | 2 | 3, { step: string; ring: string; medal: string }> = {
  1: {
    step: "bg-gradient-to-b from-amber-400 to-amber-600",
    ring: "ring-amber-400",
    medal: "🥇",
  },
  2: {
    step: "bg-gradient-to-b from-slate-300 to-slate-500",
    ring: "ring-slate-300",
    medal: "🥈",
  },
  3: {
    step: "bg-gradient-to-b from-orange-500 to-orange-800",
    ring: "ring-orange-600",
    medal: "🥉",
  },
};

function PodiumColumn({
  entry,
  rank,
  profileHref,
  large,
}: {
  entry: PodiumEntry;
  rank: 1 | 2 | 3;
  profileHref?: string;
  large?: boolean;
}) {
  const style = STEP_STYLES[rank];
  const heightClass = large
    ? { 1: "h-40", 2: "h-28", 3: "h-20" }[rank]
    : { 1: "h-28", 2: "h-20", 3: "h-14" }[rank];
  const avatarSize = large ? (rank === 1 ? 160 : 112) : rank === 1 ? 88 : 64;
  // 2º e 3º sobem primeiro, o 1º por último — efeito de "anúncio do
  // resultado" em vez de tudo aparecer de uma vez.
  const riseDelayMs = { 1: 300, 2: 0, 3: 150 }[rank];

  return (
    <div
      className={
        large
          ? "flex w-48 origin-bottom flex-col items-center gap-3 opacity-0 sm:w-56"
          : "flex w-28 origin-bottom flex-col items-center gap-2 opacity-0 sm:w-36"
      }
      style={{ animation: `podium-rise 0.7s ease-out ${riseDelayMs}ms both` }}
    >
      <span className={large ? "text-5xl" : "text-2xl"}>{style.medal}</span>
      <Link href={profileHref ?? "#"} className={`rounded-full ring-4 ${style.ring}`}>
        <SellerAvatar photoPath={entry.photoPath} name={entry.name} size={avatarSize} />
      </Link>
      <Link
        href={profileHref ?? "#"}
        className={
          rank === 1
            ? `text-center font-semibold text-neutral-50 hover:text-emerald-300 ${large ? "text-3xl" : "text-base"}`
            : `text-center font-medium text-neutral-200 hover:text-emerald-300 ${large ? "text-xl" : "text-sm"}`
        }
      >
        {entry.name}
      </Link>
      <p
        className={
          rank === 1
            ? `font-bold text-emerald-400 ${large ? "text-5xl" : "text-xl"}`
            : `font-semibold text-emerald-400 ${large ? "text-3xl" : "text-base"}`
        }
      >
        {entry.percent.toFixed(0)}%
      </p>
      <p className={large ? "text-lg text-neutral-400" : "text-xs text-neutral-500"}>{entry.resultLabel}</p>
      <div className={`mt-2 flex w-full items-start justify-center rounded-t-lg ${heightClass} ${style.step}`}>
        <span className={`mt-2 font-bold text-black/70 ${large ? "text-4xl" : "text-2xl"}`}>{rank}º</span>
      </div>
    </div>
  );
}

export function Podium({
  entries,
  periodId,
  large,
}: {
  entries: PodiumEntry[];
  periodId?: string;
  large?: boolean;
}) {
  const [first, second, third] = entries;

  if (!first) {
    return null;
  }

  const hrefFor = (sellerId: string) =>
    periodId ? `/sellers/${sellerId}?period=${periodId}` : `/sellers/${sellerId}`;

  const spacerClass = large ? "w-48 sm:w-56" : "w-28 sm:w-36";

  return (
    <div
      className={
        large
          ? "relative flex items-end justify-center gap-10 overflow-hidden rounded-2xl bg-neutral-900 px-10 pt-12 pb-0 sm:gap-16"
          : "relative flex items-end justify-center gap-4 overflow-hidden rounded-2xl bg-neutral-900 px-6 pt-8 pb-0 sm:gap-8"
      }
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 480px 260px at 50% 0%, rgba(251,191,36,0.10), transparent 70%)",
        }}
      />
      {second ? (
        <PodiumColumn entry={second} rank={2} profileHref={hrefFor(second.sellerId)} large={large} />
      ) : (
        <div className={spacerClass} />
      )}
      <PodiumColumn entry={first} rank={1} profileHref={hrefFor(first.sellerId)} large={large} />
      {third ? (
        <PodiumColumn entry={third} rank={3} profileHref={hrefFor(third.sellerId)} large={large} />
      ) : (
        <div className={spacerClass} />
      )}
    </div>
  );
}
