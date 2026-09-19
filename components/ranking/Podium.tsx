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

/**
 * Tamanho que cresce de verdade com a largura da tela (CSS clamp), em vez
 * de ficar travado num pixel fixo -- é o que faz o pódio da skin Arena se
 * ajustar numa tela grande / TV em vez de ficar pequeno e centralizado
 * num mar de vazio. `viewportForMax` é a largura de viewport em que o
 * valor atinge o teto (`max`); antes disso cresce, depois disso satura.
 */
function fluid(min: number, max: number, viewportForMax: number) {
  const vw = +((max / viewportForMax) * 100).toFixed(2);
  return `clamp(${min}px, ${vw}vw, ${max}px)`;
}

/**
 * Igual a `fluid()`, mas limitado também pela ALTURA da tela (min(vw, vh))
 * -- usado no Modo TV, onde o pódio vive dentro de um slide de altura fixa
 * e sem scroll: numa tela larga porém baixa (uma janela maximizada comum,
 * não só 4K), crescer só em função da largura faz o conteúdo estourar por
 * cima e ser cortado pelo overflow:hidden do slide.
 */
function fluidWH(min: number, max: number, viewportForMax: number, heightForMax: number) {
  const vw = +((max / viewportForMax) * 100).toFixed(2);
  const vh = +((max / heightForMax) * 100).toFixed(2);
  return `clamp(${min}px, min(${vw}vw, ${vh}vh), ${max}px)`;
}

const SPARKS = [
  { left: "6%", bottom: "8%", delay: "0s", size: 5 },
  { left: "88%", bottom: "22%", delay: "0.6s", size: 4 },
  { left: "48%", bottom: "-4%", delay: "1.1s", size: 6 },
  { left: "18%", bottom: "58%", delay: "1.7s", size: 4 },
  { left: "78%", bottom: "55%", delay: "0.3s", size: 5 },
];

function Crown({ size }: { size: string }) {
  return (
    <svg
      viewBox="0 0 48 30"
      style={{ width: size, aspectRatio: "48 / 30" }}
      className="drop-shadow-[0_0_6px_rgba(255,183,39,0.7)]"
    >
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

  // viewportForMax: até que largura de tela o tamanho continua crescendo.
  // Na tela de Ranking (página normal, rola se precisar) cresce bastante
  // com a largura. No modo TV (large) o pódio fica dentro de um slide de
  // altura FIXA (overflow: hidden, sem scroll) -- então ali não basta
  // caber na largura, precisa caber na ALTURA da tela também, senão a
  // coroa/anel do 1º lugar saem cortados por cima. Por isso as peças que
  // empilham verticalmente (medalhão, avatar, pedestal, coroa, fontes)
  // usam min(vw, vh): crescem com o menor dos dois, largura ou altura.
  // No Ranking (admin) o pódio é só mais um elemento da página, ao lado da
  // lista -- não precisa (nem deve) dominar a tela como no Modo TV, então
  // cresce bem mais modestamente.
  const vpMax = large ? 2000 : 2200;
  const vhMax = 1080;
  const sizes = large
    ? {
        1: { col: fluid(176, 364, vpMax), hex: fluidWH(124, 260, vpMax, vhMax), avatar: fluidWH(88, 176, vpMax, vhMax), pedestal: fluidWH(148, 190, vpMax, vhMax) },
        2: { col: fluid(136, 280, vpMax), hex: fluidWH(96, 195, vpMax, vhMax), avatar: fluidWH(66, 132, vpMax, vhMax), pedestal: fluidWH(104, 132, vpMax, vhMax) },
        3: { col: fluid(136, 280, vpMax), hex: fluidWH(96, 195, vpMax, vhMax), avatar: fluidWH(66, 132, vpMax, vhMax), pedestal: fluidWH(76, 97, vpMax, vhMax) },
      }[rank]
    : {
        1: { col: fluid(132, 240, vpMax), hex: fluid(92, 165, vpMax), avatar: fluid(64, 115, vpMax), pedestal: fluid(92, 195, vpMax) },
        2: { col: fluid(104, 190, vpMax), hex: fluid(72, 128, vpMax), avatar: fluid(48, 88, vpMax), pedestal: fluid(64, 135, vpMax) },
        3: { col: fluid(104, 190, vpMax), hex: fluid(72, 128, vpMax), avatar: fluid(48, 88, vpMax), pedestal: fluid(46, 100, vpMax) },
      }[rank];

  const crownSize = large ? fluidWH(52, 96, vpMax, vhMax) : fluid(38, 68, vpMax);
  const nameSize = large ? fluidWH(16, 30, vpMax, vhMax) : fluid(12, 20, vpMax);
  const percentSize = large ? fluidWH(18, 34, vpMax, vhMax) : fluid(14, 22, vpMax);
  const digitSize = large ? fluidWH(44, 60, vpMax, vhMax) : fluid(28, 56, vpMax);

  return (
    <div
      className="relative flex origin-bottom flex-col items-center opacity-0"
      style={{ width: sizes.col, animation: `podium-rise 0.7s ease-out ${RISE_DELAY_MS[rank]}ms both` }}
    >
      {isChampion && (
        <div
          className="pointer-events-none absolute top-[-14%] left-1/2 -translate-x-1/2"
          style={{
            width: large ? fluidWH(240, 300, vpMax, vhMax) : fluid(175, 235, vpMax),
            height: large ? fluidWH(300, 375, vpMax, vhMax) : fluid(220, 295, vpMax),
            background: "linear-gradient(180deg, rgba(255,201,74,0.28), rgba(255,201,74,0) 78%)",
            clipPath: "polygon(42% 0%, 58% 0%, 100% 100%, 0% 100%)",
          }}
          aria-hidden
        />
      )}

      <div className="relative flex flex-col items-center">
        {isChampion ? (
          <Crown size={crownSize} />
        ) : (
          <div
            className="h-3.5 w-3.5 rotate-45 rounded-sm"
            style={{ background: style.gem, boxShadow: `0 0 12px ${style.glow}` }}
          />
        )}

        <div className="relative mt-1" style={{ width: sizes.hex, height: sizes.hex }}>
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
              <SellerAvatar photoPath={entry.photoPath} name={entry.name} size={sizes.avatar} />
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
          className="relative block truncate font-semibold text-neutral-50 hover:text-emerald-300"
          style={{ fontSize: nameSize }}
        >
          {entry.name}
        </Link>
        <p
          className="relative font-bold"
          style={{ fontFamily: "var(--font-arena-display)", color: style.ring, fontSize: percentSize }}
        >
          {entry.percent.toFixed(0)}%
        </p>
      </div>

      <p className={large ? "mt-1 text-sm text-neutral-400" : "mt-0.5 text-xs text-neutral-500"}>
        {entry.resultLabel}
      </p>

      <div
        className="relative mt-3 flex w-full items-start justify-center overflow-hidden rounded-t-md"
        style={{ height: sizes.pedestal, background: style.pedestal, boxShadow: `0 0 22px ${style.glow}` }}
      >
        <div className="absolute inset-x-0 top-0 h-[3px] bg-white/55" aria-hidden />
        <span
          className="mt-1 leading-none font-black text-black/25 select-none"
          style={{ fontFamily: "var(--font-arena-display)", fontSize: digitSize }}
        >
          {rank}
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// Tema "zoeira" — pódio de humor: bloco 3D com bisel, avatar redondo com
// figurinha de emoji, "etiqueta" com apelido + citação. Apelido e citação
// são CALCULADOS a partir do % de atingimento real (não fixos por
// vendedor) — assim continuam corretos quando os números mudarem, em vez
// de virar piada errada. Inspirado na arte de referência enviada pelo
// usuário ("Pódio da Zoeira"), recriado em CSS.
// ============================================================================

const ZOEIRA_STYLES: Record<1 | 2 | 3, { ring: string; glow: string; top: string; front: string }> = {
  1: {
    ring: "#ffcf40",
    glow: "rgba(255,207,64,0.55)",
    top: "linear-gradient(135deg, #fff3c4, #ffcf40)",
    front: "linear-gradient(180deg, #f5a623, #a8710d)",
  },
  2: {
    ring: "#22d3ee",
    glow: "rgba(34,211,238,0.5)",
    top: "linear-gradient(135deg, #cffafe, #22d3ee)",
    front: "linear-gradient(180deg, #0891b2, #0a4d5c)",
  },
  3: {
    ring: "#ff7a59",
    glow: "rgba(255,122,89,0.5)",
    top: "linear-gradient(135deg, #ffd4c2, #ff7a59)",
    front: "linear-gradient(180deg, #dc4b26, #7a1f0c)",
  },
};

function zoeiraFlavor(percent: number): { sticker: string; tag: string; quote: string } {
  if (percent >= 150) {
    return { sticker: "🚀", tag: "Imparável", quote: "Não para, não cansa." };
  }
  if (percent >= 100) {
    return { sticker: "🏆", tag: "Bateu a meta", quote: "Prometeu, cumpriu." };
  }
  if (percent >= 70) {
    return { sticker: "🎯", tag: "Quase lá", quote: "Fala que vai e entrega (quase)." };
  }
  return { sticker: "👻", tag: "Sumiu no CRM", quote: "Lenda urbana do pipeline." };
}

const LAUREL_LEAVES = [
  { x: 36, y: 71, angle: -62 },
  { x: 31, y: 57, angle: -48 },
  { x: 25, y: 44, angle: -28 },
  { x: 19, y: 32, angle: -6 },
  { x: 13, y: 21, angle: 16 },
  { x: 8, y: 9, angle: 38 },
];

function LaurelBranch({ flip, color }: { flip?: boolean; color: string }) {
  return (
    <svg
      viewBox="0 0 44 80"
      style={{ width: "1.3em", height: "2.9em", transform: flip ? "scaleX(-1)" : undefined }}
      aria-hidden
    >
      <path
        d="M39 76 C 34 58 29 46 23 33 C 19 23 14 14 7 4"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
        opacity="0.7"
      />
      {LAUREL_LEAVES.map((leaf, i) => (
        <ellipse
          key={i}
          cx={leaf.x}
          cy={leaf.y}
          rx="8.5"
          ry="4"
          fill={color}
          opacity={0.55 + i * 0.08}
          transform={`rotate(${leaf.angle} ${leaf.x} ${leaf.y})`}
        />
      ))}
    </svg>
  );
}

function PodiumColumnZoeira({
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
  const style = ZOEIRA_STYLES[rank];
  const flavor = zoeiraFlavor(entry.percent);
  const isChampion = rank === 1;

  const vpMax = large ? 2000 : 2200;
  const vhMax = 1080;
  const sizes = large
    ? {
        1: { col: fluid(176, 364, vpMax), ring: fluidWH(124, 250, vpMax, vhMax), block: fluidWH(148, 190, vpMax, vhMax) },
        2: { col: fluid(136, 280, vpMax), ring: fluidWH(96, 190, vpMax, vhMax), block: fluidWH(104, 132, vpMax, vhMax) },
        3: { col: fluid(136, 280, vpMax), ring: fluidWH(96, 190, vpMax, vhMax), block: fluidWH(76, 97, vpMax, vhMax) },
      }[rank]
    : {
        1: { col: fluid(132, 240, vpMax), ring: fluid(92, 160, vpMax), block: fluid(92, 195, vpMax) },
        2: { col: fluid(104, 190, vpMax), ring: fluid(72, 128, vpMax), block: fluid(64, 135, vpMax) },
        3: { col: fluid(104, 190, vpMax), ring: fluid(72, 128, vpMax), block: fluid(46, 100, vpMax) },
      }[rank];

  const nameSize = large ? fluidWH(16, 30, vpMax, vhMax) : fluid(12, 20, vpMax);
  const tagSize = large ? fluidWH(13, 22, vpMax, vhMax) : fluid(11, 16, vpMax);
  const quoteSize = large ? fluidWH(12, 19, vpMax, vhMax) : fluid(10, 14, vpMax);
  const digitSize = large ? fluidWH(44, 60, vpMax, vhMax) : fluid(28, 56, vpMax);
  const stickerSize = large ? fluidWH(22, 42, vpMax, vhMax) : fluid(16, 30, vpMax);

  return (
    <div
      className="relative flex origin-bottom flex-col items-center opacity-0"
      style={{ width: sizes.col, animation: `podium-rise 0.7s ease-out ${RISE_DELAY_MS[rank]}ms both` }}
    >
      <div className="relative" style={{ width: sizes.ring, height: sizes.ring }}>
        <div
          className="absolute inset-0 rounded-full"
          style={{ boxShadow: `0 0 0 3px ${style.ring}, 0 0 24px ${style.glow}` }}
          aria-hidden
        />
        <Link href={profileHref} className="absolute inset-[6%] block overflow-hidden rounded-full">
          <SellerAvatar photoPath={entry.photoPath} name={entry.name} size="100%" />
        </Link>
        <span
          className="absolute -top-1 -right-1 leading-none select-none"
          style={{ fontSize: stickerSize, filter: `drop-shadow(0 2px 4px ${style.glow})` }}
          aria-hidden
        >
          {flavor.sticker}
        </span>
      </div>

      <div
        className="relative mt-3 max-w-full rounded-lg px-3 py-1.5 text-center"
        style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${style.ring}4d` }}
      >
        <Link
          href={profileHref}
          className="block truncate font-semibold text-neutral-50 hover:text-neutral-200"
          style={{ fontSize: nameSize }}
        >
          {entry.name}
        </Link>
        <p className="font-medium" style={{ fontSize: tagSize, color: style.ring }}>
          {flavor.tag}
        </p>
      </div>

      <p
        className="mt-1.5 max-w-full truncate text-center text-neutral-400 italic"
        style={{ fontSize: quoteSize }}
      >
        “{flavor.quote}”
      </p>

      <div
        className="relative mt-3 flex w-full flex-col items-center"
        style={{ filter: `drop-shadow(0 8px 18px ${style.glow})` }}
      >
        {isChampion && (
          <div className="mb-[-0.4em] flex items-end" style={{ color: style.ring }} aria-hidden>
            <LaurelBranch color={style.ring} />
            <LaurelBranch flip color={style.ring} />
          </div>
        )}
        <div className="w-full overflow-hidden rounded-t-md" style={{ height: sizes.block }}>
          <div className="h-[14%] w-full" style={{ background: style.top }} aria-hidden />
          <div
            className="flex h-[86%] w-full items-center justify-center"
            style={{ background: style.front }}
          >
            <span
              className="leading-none font-black text-white/90 select-none"
              style={{ fontFamily: "var(--font-arena-display)", fontSize: digitSize }}
            >
              {rank}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ZoeiraHeader({
  large,
  vpMax,
  vhMax,
}: {
  large?: boolean;
  vpMax: number;
  vhMax: number;
}) {
  const titleSize = large ? fluidWH(18, 30, vpMax, vhMax) : "1.5rem";
  const subtitleSize = large ? fluidWH(11, 14, vpMax, vhMax) : "0.75rem";
  const doodleSize = large ? fluidWH(12, 17, vpMax, vhMax) : "1.1rem";

  return (
    <div className="relative mb-2 flex w-full items-center justify-center px-4 text-center">
      <span
        className="pointer-events-none absolute top-0 left-2 hidden -rotate-6 text-neutral-500 lg:block"
        style={{ fontFamily: "var(--font-zoeira-doodle)", fontSize: doodleSize }}
        aria-hidden
      >
        meta é só o começo
      </span>
      <span
        className="pointer-events-none absolute top-0 right-2 hidden rotate-3 text-neutral-500 lg:block"
        style={{ fontFamily: "var(--font-zoeira-doodle)", fontSize: doodleSize }}
        aria-hidden
      >
        CRM nunca esquece
      </span>
      <div>
        <h2 className="font-black tracking-tight text-neutral-50" style={{ fontSize: titleSize }}>
          Ranking de <span className="text-blue-400">Vendas</span> 👑
        </h2>
        <p className="text-neutral-400" style={{ fontSize: subtitleSize }}>
          Foco na meta. Olho no topo.
        </p>
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

  const isGame = theme === "game";
  const isZoeira = theme === "zoeira";
  const isFancy = isGame || isZoeira;

  const PodiumColumn = isGame ? PodiumColumnGame : isZoeira ? PodiumColumnZoeira : PodiumColumnDefault;
  const spacerClass = large ? "w-48 sm:w-56" : "w-28 sm:w-36";
  const fancyVpMax = large ? 2000 : 2200;
  const fancyVhMax = 1080;
  const fancySpacerWidth = large ? fluid(136, 280, fancyVpMax) : fluid(104, 190, fancyVpMax);

  const row = (
    <div
      className="flex items-end justify-center"
      style={{ gap: large ? fluidWH(24, 45, fancyVpMax, fancyVhMax) : fluid(16, 34, fancyVpMax) }}
    >
      {second ? (
        <PodiumColumn entry={second} rank={2} profileHref={hrefFor(second.sellerId)} large={large} />
      ) : (
        <div style={{ width: fancySpacerWidth }} />
      )}
      <PodiumColumn entry={first} rank={1} profileHref={hrefFor(first.sellerId)} large={large} />
      {third ? (
        <PodiumColumn entry={third} rank={3} profileHref={hrefFor(third.sellerId)} large={large} />
      ) : (
        <div style={{ width: fancySpacerWidth }} />
      )}
    </div>
  );

  if (isFancy) {
    const containerClass = `relative mx-auto flex w-fit max-w-full shrink-0 flex-col overflow-hidden rounded-2xl ${
      isZoeira ? "bg-[#05070f]" : "bg-[#0b1130]"
    }`;
    const containerStyle = {
      paddingLeft: large ? fluid(32, 58, fancyVpMax) : fluid(20, 44, fancyVpMax),
      paddingRight: large ? fluid(32, 58, fancyVpMax) : fluid(20, 44, fancyVpMax),
      paddingTop: isZoeira
        ? large
          ? fluidWH(16, 24, fancyVpMax, fancyVhMax)
          : fluid(16, 28, fancyVpMax)
        : large
          ? fluidWH(56, 90, fancyVpMax, fancyVhMax)
          : fluid(56, 104, fancyVpMax),
      paddingBottom: large ? fluid(24, 40, fancyVpMax) : fluid(16, 28, fancyVpMax),
    };
    const glowBackground = isZoeira
      ? "radial-gradient(ellipse 300px 260px at 20% 60%, rgba(34,211,238,0.10), transparent 65%), radial-gradient(ellipse 300px 260px at 80% 60%, rgba(255,122,89,0.10), transparent 65%), radial-gradient(ellipse 480px 300px at 50% 15%, rgba(255,207,64,0.14), transparent 70%)"
      : "radial-gradient(ellipse 560px 320px at 50% 0%, rgba(255,183,39,0.16), transparent 70%)";

    return (
      <div className={containerClass} style={containerStyle}>
        <div className="pointer-events-none absolute inset-0" style={{ background: glowBackground }} />
        {isGame && (
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "linear-gradient(#8fb2ff 1px, transparent 1px), linear-gradient(90deg, #8fb2ff 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
        )}
        {isZoeira && <ZoeiraHeader large={large} vpMax={fancyVpMax} vhMax={fancyVhMax} />}
        {row}
      </div>
    );
  }

  const containerClass = large
    ? "relative flex items-end justify-center gap-10 overflow-hidden rounded-2xl bg-neutral-900 px-10 pt-12 pb-0 sm:gap-16"
    : "relative flex items-end justify-center gap-4 overflow-hidden rounded-2xl bg-neutral-900 px-6 pt-8 pb-0 sm:gap-8";
  const glowBackground = "radial-gradient(ellipse 480px 260px at 50% 0%, rgba(251,191,36,0.10), transparent 70%)";

  return (
    <div className={containerClass}>
      <div className="pointer-events-none absolute inset-0" style={{ background: glowBackground }} />
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
