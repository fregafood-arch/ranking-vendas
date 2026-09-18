import { createClient } from "@/lib/supabase/server";
import { AchievementForm } from "@/components/achievements/AchievementForm";
import { createAchievement } from "@/lib/actions/achievements.actions";

export default async function NewAchievementPage() {
  const supabase = await createClient();
  const { data: indicators } = await supabase
    .from("indicators")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-neutral-50">Nova conquista</h1>
      <AchievementForm action={createAchievement} indicators={indicators ?? []} submitLabel="Cadastrar" />
    </div>
  );
}
