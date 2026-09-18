import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getGeneralRanking, getIndicatorAttainment } from "@/lib/ranking/scoring";
import { PeriodPicker } from "@/components/shared/PeriodPicker";
import { IndicatorFilterTabs } from "@/components/ranking/IndicatorFilterTabs";
import { Podium } from "@/components/ranking/Podium";
import { ProgressBar } from "@/components/ranking/ProgressBar";
import { SellerAvatar } from "@/components/sellers/SellerAvatar";
import { formatIndicatorValue } from "@/lib/format";

export default async function RankingPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: periodIdParam } = await searchParams;
  const supabase = await createClient();

  const { data: periods } = await supabase
    .from("periods")
    .select("id, label, is_active")
    .order("start_date", { ascending: false });

  if (!periods?.length) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-neutral-50">Ranking Geral</h1>
        <p className="text-sm text-neutral-400">Nenhum período cadastrado ainda.</p>
      </div>
    );
  }

  const defaultPeriodId = periods.find((period) => period.is_active)?.id ?? periods[0].id;
  const periodId = periodIdParam ?? defaultPeriodId;

  const { data: indicators } = await supabase
    .from("indicators")
    .select("id, name, unit")
    .eq("is_active", true)
    .order("name");

  const [ranking, attainment, { data: sellers }] = await Promise.all([
    getGeneralRanking(periodId),
    getIndicatorAttainment(periodId),
    supabase.from("sellers").select("id, full_name, photo_path"),
  ]);

  const sellerById = new Map((sellers ?? []).map((seller) => [seller.id, seller]));
  const indicatorById = new Map((indicators ?? []).map((indicator) => [indicator.id, indicator]));
  const attainmentByKey = new Map(
    attainment.map((row) => [`${row.seller_id}:${row.indicator_id}`, row]),
  );

  const rows = [...ranking]
    .sort((a, b) => a.rank_position - b.rank_position)
    .map((row) => {
      const seller = sellerById.get(row.seller_id);
      const primaryIndicator = row.primary_indicator_id
        ? indicatorById.get(row.primary_indicator_id)
        : undefined;
      const primaryAttainment = row.primary_indicator_id
        ? attainmentByKey.get(`${row.seller_id}:${row.primary_indicator_id}`)
        : undefined;

      return {
        rank: row.rank_position,
        sellerId: row.seller_id,
        name: seller?.full_name ?? "Vendedor removido",
        photoPath: seller?.photo_path ?? null,
        resultLabel:
          primaryAttainment && primaryIndicator
            ? formatIndicatorValue(primaryAttainment.actual_value, primaryIndicator.unit)
            : "—",
        metaLabel:
          primaryAttainment && primaryIndicator
            ? formatIndicatorValue(primaryAttainment.target_value, primaryIndicator.unit)
            : "—",
        percent: row.primary_attainment_pct ?? 0,
        score: row.general_score ?? 0,
      };
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-neutral-50">Ranking Geral</h1>
        <PeriodPicker periods={periods} selectedId={periodId} basePath="/ranking" />
      </div>

      <IndicatorFilterTabs indicators={indicators ?? []} activeIndicatorId={null} periodId={periodId} />

      <Podium
        periodId={periodId}
        entries={rows.slice(0, 3).map((row) => ({
          sellerId: row.sellerId,
          name: row.name,
          photoPath: row.photoPath,
          resultLabel: row.resultLabel,
          percent: row.percent,
        }))}
      />

      {rows.length > 3 && (
        <div className="overflow-x-auto rounded-lg border border-neutral-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-900 text-neutral-400">
              <tr>
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium" aria-hidden />
                <th className="px-4 py-3 font-medium">Vendedor</th>
                <th className="px-4 py-3 font-medium">Resultado</th>
                <th className="px-4 py-3 font-medium">Meta</th>
                <th className="px-4 py-3 font-medium">% da meta</th>
                <th className="px-4 py-3 font-medium">Progresso</th>
                <th className="px-4 py-3 font-medium">Pontuação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {rows.slice(3).map((row) => (
                <tr key={row.sellerId} className="text-neutral-200">
                  <td className="px-4 py-3 font-semibold">{row.rank}º</td>
                  <td className="px-4 py-3">
                    <Link href={`/sellers/${row.sellerId}?period=${periodId}`}>
                      <SellerAvatar photoPath={row.photoPath} name={row.name} size={32} />
                    </Link>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Link href={`/sellers/${row.sellerId}?period=${periodId}`} className="hover:text-neutral-50">
                      {row.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{row.resultLabel}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-neutral-400">{row.metaLabel}</td>
                  <td
                    className={
                      row.percent >= 100
                        ? "px-4 py-3 whitespace-nowrap font-medium text-emerald-400"
                        : "px-4 py-3 whitespace-nowrap font-medium text-neutral-200"
                    }
                  >
                    {row.percent.toFixed(0)}%
                  </td>
                  <td className="px-4 py-3">
                    <ProgressBar percent={row.percent} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap font-semibold">{row.score.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!rows.length && (
        <p className="text-sm text-neutral-500">
          Nenhum vendedor com metas configuradas neste período.
        </p>
      )}
    </div>
  );
}
