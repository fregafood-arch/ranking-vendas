import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PeriodForm } from "@/components/periods/PeriodForm";
import { updatePeriod } from "@/lib/actions/periods.actions";

export default async function EditPeriodPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: period } = await supabase
    .from("periods")
    .select("id, type, label, start_date, end_date, tv_hide_podium, tv_hide_stats, tv_hide_ranking_list")
    .eq("id", id)
    .single();

  if (!period) {
    notFound();
  }

  const boundUpdatePeriod = updatePeriod.bind(null, period.id);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-neutral-50">Editar período</h1>
      <PeriodForm
        action={boundUpdatePeriod}
        submitLabel="Salvar"
        defaultValues={{
          type: period.type,
          label: period.label,
          startDate: period.start_date,
          endDate: period.end_date,
          tvHidePodium: period.tv_hide_podium,
          tvHideStats: period.tv_hide_stats,
          tvHideRankingList: period.tv_hide_ranking_list,
        }}
      />
    </div>
  );
}
