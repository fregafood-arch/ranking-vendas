import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PERIOD_TYPE_LABELS } from "@/lib/validations/period";
import { PeriodActiveToggle } from "@/components/periods/PeriodActiveToggle";

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR");
}

export default async function AdminPeriodsPage() {
  const supabase = await createClient();

  const { data: periods } = await supabase
    .from("periods")
    .select("id, type, label, start_date, end_date, is_active")
    .order("start_date", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-50">Períodos</h1>
        <Link
          href="/admin/periodos/novo"
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
        >
          Novo período
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-900 text-neutral-400">
            <tr>
              <th className="px-4 py-3 font-medium">Rótulo</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Intervalo</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium" aria-hidden />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {periods?.map((period) => (
              <tr key={period.id} className="text-neutral-200">
                <td className="px-4 py-3 whitespace-nowrap">{period.label}</td>
                <td className="px-4 py-3 text-neutral-400">{PERIOD_TYPE_LABELS[period.type]}</td>
                <td className="px-4 py-3 whitespace-nowrap text-neutral-400">
                  {formatDate(period.start_date)} – {formatDate(period.end_date)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      period.is_active
                        ? "rounded-full bg-emerald-900/50 px-2 py-1 text-xs text-emerald-300"
                        : "rounded-full bg-neutral-800 px-2 py-1 text-xs text-neutral-400"
                    }
                  >
                    {period.is_active ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-3 whitespace-nowrap">
                    <Link
                      href={`/admin/periodos/${period.id}`}
                      className="text-neutral-400 transition-colors hover:text-neutral-50"
                    >
                      Editar
                    </Link>
                    <PeriodActiveToggle periodId={period.id} isActive={period.is_active} />
                  </div>
                </td>
              </tr>
            ))}
            {!periods?.length && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-neutral-500">
                  Nenhum período cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
