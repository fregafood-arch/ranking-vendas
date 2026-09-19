import Link from "next/link";
import { SellerAvatar } from "@/components/sellers/SellerAvatar";
import type { AppTheme } from "@/lib/theme-types";

export type PodiumEntry = {
  sellerId: string;
  name: string;
  photoPath: string | null;
  resultLabel: string;
  percent: number;
};

const RISE_DELAY_MS: Record<1 | 2 | 3, number> = { 1: 300, 2: 0, 3: 150 };

// ============================================================================
// Tema "default" — cartão minimalista com degrau (visual original).
// ============================================================================

const DEFAULT_STYLES: Record<1 | 2 | 3, { step: string; ring: string; medal: string }> = {
  1: { step: "bg-gradient-to-b from-amber-400 to-amber-600", ring: "ring-amber-400", medal: "🥇" },
  2: { step: "bg-gradient-to-b from-slate-300 to-slate-500", ring: "ring-slate-300", medal: "🥈" },
  3: { step: "bg-gradient-to-b from-orange-500 to-orange-800", ring: "ring-orange-600", medal: "🥉" },
};

function PodiumColumnDefault({
  entry,
  rank,
  profileHref,
  large,
}: {
  entry: PodiumEntry;
  rank: 1 | 2 | 3;
  profileHref: string;
  large?: boolean;
}) {
  const style = DEFAULT_STYLES[rank];
  const heightClass = large
    ? { 1: "h-40", 2: "h-28", 3: "h-20" }[rank]
    : { 1: "h-28", 2: "h-20", 3: "h-14" }[rank];
  const avatarSize = large ? (rank === 1 ? 160 : 112) : rank === 1 ? 88 : 64;

  return (
    <div
      className={
        large
          ? "flex w-48 origin-bottom flex-col items-center gap-3 opacity-0 sm:w-56"
          : "flex w-28 origin-bottom flex-col items-center gap-2 opacity-0 sm:w-36"
      }
      style={{ animation: `podium-rise 0.7s ease-out ${RISE_DELAY_MS[rank]}ms both` }}
    >
      <span className={large ? "text-5xl" : "text-2xl"}>{style.medal}</span>
      <Link href={profileHref} className={`rounded-full ring-4 ${style.ring}`}>
        <SellerAvatar photoPath={entry.photoPath} name={entry.name} size={avatarSize} />
      </Link>
      <Link
        href={profileHref}
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

// ============================================================================
// Tema "game" ("Arena") — escudo em degradê + gema + plataforma com brilho,
// inspirado numa arte de referência enviada pelo usuário. Recriado só com
// CSS (clip-path, gradientes, glow) — não é uma cópia pixel a pixel da
// ilustração original, que usa assets 3D prontos.
// ============================================================================

const GAME_STYLES: Record<1 | 2 | 3, { gradient: string; glow: string; gem: string; ring: string }> = {
  1: {
    gradient: "linear-gradient(160deg, #6690ff 0%, #2946b8 55%, #16205e 100%)",
    glow: "rgba(96,140,255,0.65)",
    gem: "linear-gradient(135deg, #fff3c4, #f5b301)",
    ring: "#ffd873",
  },
  2: {
    gradient: "linear-gradient(160deg, #4fe0c9 0%, #0f9488 55%, #0a5f57 100%)",
    glow: "rgba(45,212,191,0.55)",
    gem: "linear-gradient(135deg, #ccfbf1, #14b8a6)",
    ring: "#5eead4",
  },
  3: {
    gradient: "linear-gradient(160deg, #ff9d5c 0%, #d0451b 55%, #7a1a10 100%)",
    glow: "rgba(255,138,76,0.55)",
    gem: "linear-gradient(135deg, #ffd7b8, #f0631f)",
    ring: "#ffb27a",
  },
};

const SHIELD_CLIP = "polygon(0% 0%, 100% 0%, 100% 62%, 50% 100%, 0% 62%)";

function PodiumColumnGame({
  entry,
  rank,
  profileHref,
  large,
}: {
  entry: PodiumEntry;
  rank: 1 | 2 | 3;
  profileHref: string;
  large?: boolean;
}) {
  const style = GAME_STYLES[rank];
  const shieldSize = large
    ? { 1: { w: 168, h: 176 }, 2: { w: 128, h: 134 }, 3: { w: 128, h: 134 } }[rank]
    : { 1: { w: 120, h: 126 }, 2: { w: 92, h: 96 }, 3: { w: 92, h: 96 } }[rank];
  const avatarSize = large ? (rank === 1 ? 84 : 64) : rank === 1 ? 56 : 44;
  const platformWidth = shieldSize.w * 0.8;

  return (
    <div
      className="flex origin-bottom flex-col items-center opacity-0"
      style={{ animation: `podium-rise 0.7s ease-out ${RISE_DELAY_MS[rank]}ms both` }}
    >
      <div
        className="h-4 w-4 rotate-45 rounded-sm"
        style={{ background: style.gem, boxShadow: `0 0 14px ${style.glow}` }}
      />
      <div
        className="relative -mt-1 flex items-center justify-center pb-[18%]"
        style={{
          width: shieldSize.w,
          height: shieldSize.h,
          background: style.gradient,
          clipPath: SHIELD_CLIP,
          boxShadow: `0 0 30px ${style.glow}`,
        }}
      >
        <Link href={profileHref} className="rounded-full ring-4" style={{ ["--tw-ring-color" as string]: style.ring }}>
          <SellerAvatar photoPath={entry.photoPath} name={entry.name} size={avatarSize} />
        </Link>
      </div>
      <div
        className="-mt-1 rounded-full"
        style={{
          width: platformWidth,
          height: 10,
          background: style.glow,
          filter: "blur(7px)",
        }}
      />
      <Link
        href={profileHref}
        className={`mt-2 max-w-[8.5rem] text-center font-bold text-neutral-50 hover:text-emerald-300 ${large ? "text-base" : "text-xs"}`}
      >
        {entry.name}
      </Link>
      <p className={`font-semibold ${large ? "text-sm" : "text-[11px]"}`} style={{ color: style.ring }}>
        {entry.percent.toFixed(0)}% da meta
      </p>
      <p className={large ? "mt-1 text-sm text-neutral-400" : "mt-0.5 text-xs text-neutral-500"}>
        {entry.resultLabel}
      </p>
    </div>
  );
}

export function Podium({
  entries,
  periodId,
  large,
  theme = "default",
}: {
  entries: PodiumEntry[];
  periodId?: string;
  large?: boolean;
  theme?: AppTheme;
}) {
  const [first, second, third] = entries;

  if (!first) {
    return null;
  }

  const hrefFor = (sellerId: string) =>
    periodId ? `/sellers/${sellerId}?period=${periodId}` : `/sellers/${sellerId}`;

  const PodiumColumn = theme === "game" ? PodiumColumnGame : PodiumColumnDefault;
  const spacerClass = large ? "w-48 sm:w-56" : "w-28 sm:w-36";

  const containerClass =
    theme === "game"
      ? large
        ? "relative flex items-end justify-center gap-8 overflow-hidden rounded-2xl bg-[#0b1130] px-10 pt-14 pb-0 sm:gap-14"
        : "relative flex items-end justify-center gap-4 overflow-hidden rounded-2xl bg-[#0b1130] px-6 pt-10 pb-0 sm:gap-6"
      : large
        ? "relative flex items-end justify-center gap-10 overflow-hidden rounded-2xl bg-neutral-900 px-10 pt-12 pb-0 sm:gap-16"
        : "relative flex items-end justify-center gap-4 overflow-hidden rounded-2xl bg-neutral-900 px-6 pt-8 pb-0 sm:gap-8";

  const glowBackground =
    theme === "game"
      ? "radial-gradient(ellipse 620px 320px at 50% 0%, rgba(102,144,255,0.18), transparent 70%)"
      : "radial-gradient(ellipse 480px 260px at 50% 0%, rgba(251,191,36,0.10), transparent 70%)";

  return (
    <div className={containerClass}>
      <div className="pointer-events-none absolute inset-0" style={{ background: glowBackground }} />
      {theme === "game" && (
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(#8fb2ff 1px, transparent 1px), linear-gradient(90deg, #8fb2ff 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
      )}
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
