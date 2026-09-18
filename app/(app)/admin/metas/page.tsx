import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PeriodPicker } from "@/components/shared/PeriodPicker";
import { TeamGoalsForm } from "@/components/goals/TeamGoalsForm";

export default async function AdminGoalsPage({
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
        <h1 className="text-xl font-semibold text-neutral-50">Metas</h1>
        <p className="text-sm text-neutral-400">
          Nenhum período cadastrado ainda.{" "}
          <Link href="/admin/periodos/novo" className="text-emerald-400 hover:underline">
            Criar período
          </Link>
        </p>
      </div>
    );
  }

  const defaultPeriodId = periods.find((period) => period.is_active)?.id ?? periods[0].id;
  const periodId = periodIdParam ?? defaultPeriodId;

  const [{ data: indicators }, { data: sellers }, { data: teamGoals }] = await Promise.all([
    supabase.from("indicators").select("id, name, unit").eq("is_active", true).order("name"),
    supabase.from("sellers").select("id, full_name").eq("is_active", true).order("full_name"),
    supabase
      .from("team_goals")
      .select("indicator_id, target_value")
      .is("team_id", null)
      .eq("period_id", periodId),
  ]);

  const teamGoalValues = Object.fromEntries(
    (teamGoals ?? []).map((goal) => [goal.indicator_id, Number(goal.target_value)]),
  );

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-neutral-50">Metas</h1>
        <PeriodPicker periods={periods} selectedId={periodId} basePath="/admin/metas" />
      </div>

      {!indicators?.length ? (
        <p className="text-sm text-neutral-400">
          Nenhum indicador ativo.{" "}
          <Link href="/admin/indicadores/novo" className="text-emerald-400 hover:underline">
            Criar indicador
          </Link>
        </p>
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="text-lg font-medium text-neutral-100">Meta da equipe</h2>
            <TeamGoalsForm periodId={periodId} indicators={indicators} initialValues={teamGoalValues} />
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-medium text-neutral-100">Metas individuais</h2>
            <div className="divide-y divide-neutral-800 rounded-lg border border-neutral-800">
              {sellers?.map((seller) => (
                <Link
                  key={seller.id}
                  href={`/admin/metas/${seller.id}?period=${periodId}`}
                  className="flex items-center justify-between px-4 py-3 text-sm text-neutral-200 transition-colors hover:bg-neutral-900"
                >
                  {seller.full_name}
                  <span className="text-neutral-500">Editar metas</span>
                </Link>
              ))}
              {!sellers?.length && (
                <p className="px-4 py-3 text-sm text-neutral-500">Nenhum vendedor ativo.</p>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
