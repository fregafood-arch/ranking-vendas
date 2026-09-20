import { SellerAvatar } from "@/components/sellers/SellerAvatar";
import { ProgressBar } from "@/components/ranking/ProgressBar";
import type { RankDirection } from "@/lib/tv/rank-direction";

function RankArrow({ direction }: { direction: "up" | "down" }) {
  const isUp = direction === "up";
  return (
    <svg
      viewBox="0 0 12 12"
      className={isUp ? "h-5 w-5 text-emerald-400" : "h-5 w-5 text-red-400"}
      fill="currentColor"
      aria-label={isUp ? "Subiu no ranking" : "Desceu no ranking"}
    >
      {isUp ? <polygon points="6,1 11,10 1,10" /> : <polygon points="1,2 11,2 6,11" />}
    </svg>
  );
}

export function TVRankingRow({
  rank,
  name,
  photoPath,
  percent,
  resultLabel,
  direction = null,
}: {
  rank: number;
  name: string;
  photoPath: string | null;
  percent: number;
  resultLabel: string;
  direction?: RankDirection;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900/60 px-6 py-3">
      <span className="w-12 shrink-0 text-2xl font-bold text-neutral-400">{rank}º</span>
      <span className="flex w-5 shrink-0 items-center justify-center" aria-hidden={!direction}>
        {direction && <RankArrow direction={direction} />}
      </span>
      <SellerAvatar photoPath={photoPath} name={name} size={56} />
      <span className="min-w-0 flex-1 truncate text-2xl font-medium text-neutral-100">{name}</span>
      <span className="w-28 shrink-0 text-right text-lg whitespace-nowrap text-neutral-400">
        {resultLabel}
      </span>
      <ProgressBar percent={percent} className="h-3 w-24 shrink-0" />
      <span
        className={`w-20 shrink-0 text-right text-2xl font-bold whitespace-nowrap ${
          percent >= 100 ? "text-emerald-400" : "text-neutral-200"
        }`}
      >
        {percent.toFixed(0)}%
      </span>
    </div>
  );
}
