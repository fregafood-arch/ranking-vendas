import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getIndicatorAttainment } from "@/lib/ranking/scoring";
import { PeriodPicker } from "@/components/shared/PeriodPicker";
import { IndicatorFilterTabs } from "@/components/ranking/IndicatorFilterTabs";
import { ProgressBar } from "@/components/ranking/ProgressBar";
import { SellerAvatar } from "@/components/sellers/SellerAvatar";
import { formatIndicatorValue } from "@/lib/format";

export default async function RankingByIndicatorPage({
  params,
  searchParams,
}: {
  params: Promise<{ indicatorId: string }>;
  searchParams: Promise<{ period?: string }>;
}) {
  const { indicatorId } = await params;
  const { period: periodIdParam } = await searchParams;
  const supabase = await createClient();

  const [{ data: periods }, { data: indicator }, { data: indicators }] = await Promise.all([
    supabase.from("periods").select("id, label, is_active").order("start_date", { ascending: false }),
    supabase.from("indicators").select("id, name, unit").eq("id", indicatorId).single(),
    supabase.from("indicators").select("id, name").eq("is_active", true).order("name"),
  ]);

  if (!indicator) {
    notFound();
  }

  if (!periods?.length) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-neutral-50">Ranking — {indicator.name}</h1>
        <p className="text-sm text-neutral-400">Nenhum período cadastrado ainda.</p>
      </div>
    );
  }

  const defaultPeriodId = periods.find((period) => period.is_active)?.id ?? periods[0].id;
  const periodId = periodIdParam ?? defaultPeriodId;

  const [attainment, { data: sellers }] = await Promise.all([
    getIndicatorAttainment(periodId),
    supabase.from("sellers").select("id, full_name, photo_path"),
  ]);

  const sellerById = new Map((sellers ?? []).map((seller) => [seller.id, seller]));

  const rows = attainment
    .filter((row) => row.indicator_id === indicatorId)
    .sort((a, b) => b.attainment_pct - a.attainment_pct || b.actual_value - a.actual_value)
    .map((row, index) => {
      const seller = sellerById.get(row.seller_id);
      return {
        rank: index + 1,
        sellerId: row.seller_id,
        name: seller?.full_name ?? "Vendedor removido",
        photoPath: seller?.photo_path ?? null,
        resultLabel: formatIndicatorValue(row.actual_value, indicator.unit),
        metaLabel: formatIndicatorValue(row.target_value, indicator.unit),
        percent: row.attainment_pct,
      };
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-neutral-50">Ranking — {indicator.name}</h1>
        <PeriodPicker periods={periods} selectedId={periodId} basePath={`/ranking/${indicatorId}`} />
      </div>

      <IndicatorFilterTabs
        indicators={indicators ?? []}
        activeIndicatorId={indicatorId}
        periodId={periodId}
      />

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
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {rows.map((row) => (
              <tr key={row.sellerId} className="text-neutral-200">
                <td className="px-4 py-3 font-semibold">{row.rank}º</td>
                <td className="px-4 py-3">
                  <SellerAvatar photoPath={row.photoPath} name={row.name} size={32} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{row.name}</td>
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
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-neutral-500">
                  Nenhum vendedor com meta deste indicador neste período.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
