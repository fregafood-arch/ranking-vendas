import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AchievementForm } from "@/components/achievements/AchievementForm";
import { updateAchievement } from "@/lib/actions/achievements.actions";

export default async function EditAchievementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: achievement }, { data: indicators }] = await Promise.all([
    supabase
      .from("achievements")
      .select(
        "id, name, icon, description, trigger_type, indicator_id, comparison_operator, threshold_value, scope, rolling_window_days",
      )
      .eq("id", id)
      .single(),
    supabase.from("indicators").select("id, name").order("name"),
  ]);

  if (!achievement) {
    notFound();
  }

  const boundUpdateAchievement = updateAchievement.bind(null, achievement.id);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-neutral-50">Editar conquista</h1>
      <AchievementForm
        action={boundUpdateAchievement}
        indicators={indicators ?? []}
        submitLabel="Salvar"
        defaultValues={{
          name: achievement.name,
          icon: achievement.icon,
          description: achievement.description,
          triggerType: achievement.trigger_type,
          indicatorId: achievement.indicator_id,
          comparisonOperator: achievement.comparison_operator,
          thresholdValue: Number(achievement.threshold_value),
          scope: achievement.scope,
          rollingWindowDays: achievement.rolling_window_days,
        }}
      />
    </div>
  );
}
