import { SellerAvatar } from "@/components/sellers/SellerAvatar";
import { ProgressBar } from "@/components/ranking/ProgressBar";

export function TVRankingRow({
  rank,
  name,
  photoPath,
  percent,
  resultLabel,
}: {
  rank: number;
  name: string;
  photoPath: string | null;
  percent: number;
  resultLabel: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-neutral-800 bg-neutral-900/60 px-6 py-3">
      <span className="w-14 text-2xl font-bold text-neutral-400">{rank}º</span>
      <SellerAvatar photoPath={photoPath} name={name} size={56} />
      <span className="flex-1 truncate text-2xl font-medium text-neutral-100">{name}</span>
      <span className="w-40 shrink-0 text-right text-lg text-neutral-400">{resultLabel}</span>
      <ProgressBar percent={percent} className="h-3 w-48 shrink-0" />
      <span
        className={`w-24 shrink-0 text-right text-2xl font-bold ${
          percent >= 100 ? "text-emerald-400" : "text-neutral-200"
        }`}
      >
        {percent.toFixed(0)}%
      </span>
    </div>
  );
}
