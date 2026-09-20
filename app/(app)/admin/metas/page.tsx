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
          <Link href="/admin/periodos/novo" className="text-blue-400 hover:underline">
            Criar período
          </Link>
        </p>
      </div>
    );
  }

  const defaultPeriodId = periods.find((period) => period.is_active)?.id ?? periods[0].id;
  const periodId = periodIdParam ?? defaultPeriodId;

  const [{ data: indicators }, { data: sellers }, { data: teams }, { data: teamGoals }] = await Promise.all([
    supabase.from("indicators").select("id, name, unit").eq("is_active", true).order("name"),
    supabase.from("sellers").select("id, full_name").eq("is_active", true).order("full_name"),
    supabase.from("teams").select("id, name").eq("is_active", true).order("name"),
    supabase
      .from("team_goals")
      .select("team_id, indicator_id, target_value")
      .eq("period_id", periodId),
  ]);

  // Metas de equipe são opcionais e organizadas por equipe (tabela teams,
  // cadastrada em Administração > Equipes) — "Toda a empresa" (team_id
  // nulo) continua existindo à parte, pra quem quer acompanhar um número
  // geral sem amarrar a uma equipe específica.
  const goalsByTeam = new Map<string, Record<string, number>>();
  for (const goal of teamGoals ?? []) {
    const key = goal.team_id ?? "global";
    if (!goalsByTeam.has(key)) goalsByTeam.set(key, {});
    goalsByTeam.get(key)![goal.indicator_id] = Number(goal.target_value);
  }

  const teamSections = [
    { id: null, key: "global", name: "Toda a empresa" },
    ...(teams ?? []).map((team) => ({ id: team.id, key: team.id, name: team.name })),
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-neutral-50">Metas</h1>
        <PeriodPicker periods={periods} selectedId={periodId} basePath="/admin/metas" />
      </div>

      {!indicators?.length ? (
        <p className="text-sm text-neutral-400">
          Nenhum indicador ativo.{" "}
          <Link href="/admin/indicadores/novo" className="text-blue-400 hover:underline">
            Criar indicador
          </Link>
        </p>
      ) : (
        <>
          <section className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-neutral-100">Metas de equipe</h2>
              <p className="text-sm text-neutral-500">
                Opcional por equipe — deixe em branco se essa equipe não tiver meta neste período. Quando
                definida, aparece no Dashboard com o quanto já foi atingido.
              </p>
            </div>
            {teamSections.map((section) => (
              <div key={section.key} className="space-y-3 rounded-lg border border-neutral-800 p-4">
                <h3 className="text-sm font-medium text-neutral-200">{section.name}</h3>
                <TeamGoalsForm
                  periodId={periodId}
                  teamId={section.id}
                  indicators={indicators}
                  initialValues={goalsByTeam.get(section.key) ?? {}}
                />
              </div>
            ))}
            {!teams?.length && (
              <p className="text-xs text-neutral-500">
                Nenhuma equipe cadastrada ainda —{" "}
                <Link href="/admin/equipes/novo" className="text-blue-400 hover:underline">
                  criar equipe
                </Link>{" "}
                pra ter metas por equipe, além da meta da empresa toda acima.
              </p>
            )}
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
