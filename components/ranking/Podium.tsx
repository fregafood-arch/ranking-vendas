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
// Tema "game" ("Arena") — placar de cerimônia: medalhão hexagonal, coroa e
// anel giratório reservados só para o 1º lugar (o único "momento" de
// destaque), pedestal com o número gravado e placa de nome com um brilho
// passando. Inspirado na arte de referência enviada pelo usuário, recriado
// inteiramente em CSS (clip-path, gradientes, glow) — sem imagens prontas.
// ============================================================================

const GAME_STYLES: Record<
  1 | 2 | 3,
  { medallion: string; pedestal: string; glow: string; ring: string; gem: string }
> = {
  1: {
    medallion: "linear-gradient(160deg, #ffe9b0 0%, #ffb627 45%, #8a5a08 100%)",
    pedestal: "linear-gradient(180deg, #ffcf6b, #a8710d)",
    glow: "rgba(255,183,39,0.55)",
    ring: "#ffc94a",
    gem: "linear-gradient(135deg, #fff3c4, #f5b301)",
  },
  2: {
    medallion: "linear-gradient(160deg, #baffef 0%, #52f2c6 45%, #0a5f52 100%)",
    pedestal: "linear-gradient(180deg, #7ff5d8, #0d8a73)",
    glow: "rgba(82,242,198,0.45)",
    ring: "#52f2c6",
    gem: "linear-gradient(135deg, #ccfbf1, #14b8a6)",
  },
  3: {
    medallion: "linear-gradient(160deg, #ffcfae 0%, #ff8a4c 45%, #7a2f0c 100%)",
    pedestal: "linear-gradient(180deg, #ffab78, #c2410c)",
    glow: "rgba(255,138,76,0.45)",
    ring: "#ff8a4c",
    gem: "linear-gradient(135deg, #ffd7b8, #f0631f)",
  },
};

const HEX_CLIP = "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)";

const SPARKS = [
  { left: "6%", bottom: "8%", delay: "0s", size: 5 },
  { left: "88%", bottom: "22%", delay: "0.6s", size: 4 },
  { left: "48%", bottom: "-4%", delay: "1.1s", size: 6 },
  { left: "18%", bottom: "58%", delay: "1.7s", size: 4 },
  { left: "78%", bottom: "55%", delay: "0.3s", size: 5 },
];

function Crown({ width }: { width: number }) {
  return (
    <svg width={width} height={width * 0.6} viewBox="0 0 48 30" className="drop-shadow-[0_0_6px_rgba(255,183,39,0.7)]">
      <path
        d="M2 27 L2 12 L14 20 L24 4 L34 20 L46 12 L46 27 Z"
        fill="url(#arena-crown-gradient)"
        stroke="#8a5a08"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <circle cx="24" cy="4" r="3" fill="#fff3c4" />
      <circle cx="2" cy="12" r="2.4" fill="#fff3c4" />
      <circle cx="46" cy="12" r="2.4" fill="#fff3c4" />
      <defs>
        <linearGradient id="arena-crown-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffe9b0" />
          <stop offset="100%" stopColor="#ffb627" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function SparkField({ color }: { color: string }) {
  return (
    <div className="pointer-events-none absolute inset-[-20%]" aria-hidden>
      {SPARKS.map((spark, i) => (
        <span
          key={i}
          className="arena-spark absolute rounded-full"
          style={{
            left: spark.left,
            bottom: spark.bottom,
            width: spark.size,
            height: spark.size,
            background: color,
            boxShadow: `0 0 6px ${color}`,
            animation: `arena-spark-rise 2.6s ease-in ${spark.delay} infinite`,
          }}
        />
      ))}
    </div>
  );
}

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
  const isChampion = rank === 1;

  const colWidth = large
    ? { 1: 176, 2: 136, 3: 136 }[rank]
    : { 1: 132, 2: 104, 3: 104 }[rank];
  const hexSize = large ? { 1: 124, 2: 96, 3: 96 }[rank] : { 1: 92, 2: 72, 3: 72 }[rank];
  const avatarSize = large ? { 1: 88, 2: 66, 3: 66 }[rank] : { 1: 64, 2: 48, 3: 48 }[rank];
  const pedestalHeight = large
    ? { 1: 148, 2: 104, 3: 76 }[rank]
    : { 1: 92, 2: 64, 3: 46 }[rank];

  return (
    <div
      className="relative flex origin-bottom flex-col items-center opacity-0"
      style={{ width: colWidth, animation: `podium-rise 0.7s ease-out ${RISE_DELAY_MS[rank]}ms both` }}
    >
      {isChampion && (
        <div
          className="pointer-events-none absolute top-[-14%] left-1/2 -translate-x-1/2"
          style={{
            width: large ? 240 : 175,
            height: large ? 300 : 220,
            background: "linear-gradient(180deg, rgba(255,201,74,0.28), rgba(255,201,74,0) 78%)",
            clipPath: "polygon(42% 0%, 58% 0%, 100% 100%, 0% 100%)",
          }}
          aria-hidden
        />
      )}

      <div className="relative flex flex-col items-center">
        {isChampion ? (
          <Crown width={large ? 52 : 38} />
        ) : (
          <div
            className="h-3.5 w-3.5 rotate-45 rounded-sm"
            style={{ background: style.gem, boxShadow: `0 0 12px ${style.glow}` }}
          />
        )}

        <div className="relative mt-1" style={{ width: hexSize, height: hexSize }}>
          {isChampion && (
            <div
              className="arena-ring-spin pointer-events-none absolute inset-[-14%] rounded-full"
              style={{ border: "2px dashed rgba(255,201,74,0.6)", animation: "arena-ring-spin 9s linear infinite" }}
              aria-hidden
            />
          )}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: style.medallion, clipPath: HEX_CLIP, boxShadow: `0 0 28px ${style.glow}` }}
          >
            <Link href={profileHref} className="rounded-full ring-4" style={{ ["--tw-ring-color" as string]: style.ring }}>
              <SellerAvatar photoPath={entry.photoPath} name={entry.name} size={avatarSize} />
            </Link>
          </div>
          {isChampion && <SparkField color={style.ring} />}
        </div>
      </div>

      <div
        className="relative mt-3 max-w-full overflow-hidden rounded-lg px-3 py-1.5 text-center"
        style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${style.ring}4d` }}
      >
        {isChampion && (
          <div
            className="arena-shine pointer-events-none absolute inset-0"
            style={{
              background: "linear-gradient(115deg, transparent 40%, rgba(255,255,255,0.35) 50%, transparent 60%)",
              backgroundSize: "60% 100%",
              backgroundRepeat: "no-repeat",
              animation: "arena-shine-sweep 3.6s ease-in-out infinite",
            }}
            aria-hidden
          />
        )}
        <Link
          href={profileHref}
          className={`relative block truncate font-semibold text-neutral-50 hover:text-emerald-300 ${large ? "text-base" : "text-xs"}`}
        >
          {entry.name}
        </Link>
        <p
          className={`relative font-bold ${large ? "text-lg" : "text-sm"}`}
          style={{ fontFamily: "var(--font-arena-display)", color: style.ring }}
        >
          {entry.percent.toFixed(0)}%
        </p>
      </div>

      <p className={large ? "mt-1 text-sm text-neutral-400" : "mt-0.5 text-xs text-neutral-500"}>
        {entry.resultLabel}
      </p>

      <div
        className="relative mt-3 flex w-full items-start justify-center overflow-hidden rounded-t-md"
        style={{ height: pedestalHeight, background: style.pedestal, boxShadow: `0 0 22px ${style.glow}` }}
      >
        <div className="absolute inset-x-0 top-0 h-[3px] bg-white/55" aria-hidden />
        <span
          className="mt-1 leading-none font-black text-black/25 select-none"
          style={{ fontFamily: "var(--font-arena-display)", fontSize: large ? 44 : 28 }}
        >
          {rank}
        </span>
      </div>
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
  const gameSpacerWidth = large ? 136 : 104;

  const containerClass =
    theme === "game"
      ? large
        ? "relative mx-auto flex w-fit max-w-full items-end justify-center gap-8 overflow-hidden rounded-2xl bg-[#0b1130] px-12 pt-20 pb-0 sm:gap-12"
        : "relative mx-auto flex w-fit max-w-full items-end justify-center gap-4 overflow-hidden rounded-2xl bg-[#0b1130] px-7 pt-16 pb-0 sm:gap-6"
      : large
        ? "relative flex items-end justify-center gap-10 overflow-hidden rounded-2xl bg-neutral-900 px-10 pt-12 pb-0 sm:gap-16"
        : "relative flex items-end justify-center gap-4 overflow-hidden rounded-2xl bg-neutral-900 px-6 pt-8 pb-0 sm:gap-8";

  const glowBackground =
    theme === "game"
      ? "radial-gradient(ellipse 560px 320px at 50% 0%, rgba(255,183,39,0.16), transparent 70%)"
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
      ) : theme === "game" ? (
        <div style={{ width: gameSpacerWidth }} />
      ) : (
        <div className={spacerClass} />
      )}
      <PodiumColumn entry={first} rank={1} profileHref={hrefFor(first.sellerId)} large={large} />
      {third ? (
        <PodiumColumn entry={third} rank={3} profileHref={hrefFor(third.sellerId)} large={large} />
      ) : theme === "game" ? (
        <div style={{ width: gameSpacerWidth }} />
      ) : (
        <div className={spacerClass} />
      )}
    </div>
  );
}
