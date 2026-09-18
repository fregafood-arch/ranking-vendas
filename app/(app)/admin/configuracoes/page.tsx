import { createClient } from "@/lib/supabase/server";
import { PeriodPicker } from "@/components/shared/PeriodPicker";
import { RankingWeightsForm } from "@/components/config/RankingWeightsForm";
import { TieBreakRulesForm } from "@/components/config/TieBreakRulesForm";

const DEFAULT_TIE_BREAK_ORDER = [
  { ruleKey: "PRIMARY_GOAL_PERCENT", direction: "DESC" as const },
  { ruleKey: "GENERAL_SCORE", direction: "DESC" as const },
  { ruleKey: "RAW_SALES_COUNT", direction: "DESC" as const },
  { ruleKey: "EARLIEST_ACHIEVEMENT", direction: "ASC" as const },
];

export default async function AdminSettingsPage({
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
        <h1 className="text-xl font-semibold text-neutral-50">Configurações</h1>
        <p className="text-sm text-neutral-400">Nenhum período cadastrado ainda.</p>
      </div>
    );
  }

  const defaultPeriodId = periods.find((period) => period.is_active)?.id ?? periods[0].id;
  const periodId = periodIdParam ?? defaultPeriodId;

  const [{ data: indicators }, { data: rankingRules }, { data: tieBreakRules }] = await Promise.all([
    supabase.from("indicators").select("id, name, unit").eq("is_active", true).order("name"),
    supabase
      .from("ranking_rules")
      .select("indicator_id, default_weight, attainment_cap")
      .eq("period_id", periodId),
    supabase
      .from("tie_break_rules")
      .select("priority, rule_key, direction")
      .eq("ranking_scope", "GENERAL")
      .order("priority"),
  ]);

  const rankingRulesByIndicator = Object.fromEntries(
    (rankingRules ?? []).map((rule) => [
      rule.indicator_id,
      {
        defaultWeight: Number(rule.default_weight),
        attainmentCap: rule.attainment_cap === null ? null : Number(rule.attainment_cap),
      },
    ]),
  );

  const tieBreakInitial = tieBreakRules?.length
    ? tieBreakRules.map((rule) => ({
        ruleKey: rule.rule_key,
        direction: rule.direction as "ASC" | "DESC",
      }))
    : DEFAULT_TIE_BREAK_ORDER;

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-neutral-50">Configurações</h1>
          <p className="text-sm text-neutral-400">
            Pesos padrão, teto de atingimento e ordem de desempate do Ranking Geral.
          </p>
        </div>
        <PeriodPicker periods={periods} selectedId={periodId} basePath="/admin/configuracoes" />
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-neutral-100">Pesos padrão e teto de atingimento</h2>
        <p className="text-sm text-neutral-500">
          O <strong>teto de atingimento</strong> é usado de verdade no cálculo do Ranking Geral
          (evita que um resultado atípico num indicador domine a pontuação — 200% é o padrão). Já o{" "}
          <strong>peso padrão</strong> serve apenas como sugestão inicial ao cadastrar a meta de um
          vendedor em Metas — o cálculo do ranking sempre usa o peso configurado na meta individual
          de cada um, nunca este valor diretamente.
        </p>
        <RankingWeightsForm
          periodId={periodId}
          indicators={indicators ?? []}
          initialRules={rankingRulesByIndicator}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-neutral-100">Ordem de desempate do Ranking Geral</h2>
        <p className="text-sm text-neutral-500">
          Critérios aplicados em ordem até que o empate seja resolvido. Use as setas para reordenar.
        </p>
        <TieBreakRulesForm initialRules={tieBreakInitial} />
      </section>
    </div>
  );
}
