import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { UNIT_LABELS } from "@/lib/validations/indicator";
import { IndicatorActiveToggle } from "@/components/indicators/IndicatorActiveToggle";
import { IndicatorDeleteButton } from "@/components/indicators/IndicatorDeleteButton";

function countByIndicator(rows: { indicator_id: string }[] | null) {
  const counts = new Map<string, number>();
  for (const row of rows ?? []) {
    counts.set(row.indicator_id, (counts.get(row.indicator_id) ?? 0) + 1);
  }
  return counts;
}

export default async function AdminIndicatorsPage() {
  const supabase = await createClient();

  const [{ data: indicators }, { data: resultRows }, { data: goalRows }] = await Promise.all([
    supabase.from("indicators").select("id, name, unit, custom_unit_label, is_active").order("name"),
    supabase.from("sales_results").select("indicator_id"),
    supabase.from("seller_goals").select("indicator_id"),
  ]);

  const resultCounts = countByIndicator(resultRows);
  const goalCounts = countByIndicator(goalRows);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-50">Indicadores</h1>
        <Link
          href="/admin/indicadores/novo"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500"
        >
          Novo indicador
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-900 text-neutral-400">
            <tr>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Unidade</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium" aria-hidden />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {indicators?.map((indicator) => (
              <tr key={indicator.id} className="text-neutral-200">
                <td className="px-4 py-3">{indicator.name}</td>
                <td className="px-4 py-3 text-neutral-400">
                  {indicator.unit === "CUSTOM"
                    ? indicator.custom_unit_label
                    : UNIT_LABELS[indicator.unit]}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      indicator.is_active
                        ? "rounded-full bg-emerald-900/50 px-2 py-1 text-xs text-emerald-300"
                        : "rounded-full bg-neutral-800 px-2 py-1 text-xs text-neutral-400"
                    }
                  >
                    {indicator.is_active ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-3 whitespace-nowrap">
                    <Link
                      href={`/admin/indicadores/${indicator.id}`}
                      className="text-neutral-400 transition-colors hover:text-neutral-50"
                    >
                      Editar
                    </Link>
                    <IndicatorActiveToggle
                      indicatorId={indicator.id}
                      isActive={indicator.is_active}
                    />
                    <IndicatorDeleteButton
                      indicatorId={indicator.id}
                      resultCount={resultCounts.get(indicator.id) ?? 0}
                      goalCount={goalCounts.get(indicator.id) ?? 0}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {!indicators?.length && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-neutral-500">
                  Nenhum indicador cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
