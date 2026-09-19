import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TRIGGER_TYPE_OPTIONS } from "@/lib/validations/achievement";
import { AchievementActiveToggle } from "@/components/achievements/AchievementActiveToggle";

const TRIGGER_LABELS = Object.fromEntries(TRIGGER_TYPE_OPTIONS.map((option) => [option.value, option.label]));

export default async function AdminAchievementsPage() {
  const supabase = await createClient();

  const { data: achievements } = await supabase
    .from("achievements")
    .select("id, name, icon, trigger_type, comparison_operator, threshold_value, scope, is_active")
    .order("name");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-50">Conquistas</h1>
          <p className="text-sm text-neutral-400">
            Regras avaliadas automaticamente a cada lançamento de resultado.
          </p>
        </div>
        <Link
          href="/admin/conquistas/novo"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500"
        >
          Nova conquista
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-900 text-neutral-400">
            <tr>
              <th className="px-4 py-3 font-medium" aria-hidden />
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Gatilho</th>
              <th className="px-4 py-3 font-medium">Condição</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium" aria-hidden />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {achievements?.map((achievement) => (
              <tr key={achievement.id} className="text-neutral-200">
                <td className="px-4 py-3 text-lg">{achievement.icon}</td>
                <td className="px-4 py-3 whitespace-nowrap">{achievement.name}</td>
                <td className="px-4 py-3 text-neutral-400">{TRIGGER_LABELS[achievement.trigger_type]}</td>
                <td className="px-4 py-3 text-neutral-400 whitespace-nowrap">
                  {achievement.comparison_operator} {Number(achievement.threshold_value)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      achievement.is_active
                        ? "rounded-full bg-emerald-900/50 px-2 py-1 text-xs text-emerald-300"
                        : "rounded-full bg-neutral-800 px-2 py-1 text-xs text-neutral-400"
                    }
                  >
                    {achievement.is_active ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-3 whitespace-nowrap">
                    <Link
                      href={`/admin/conquistas/${achievement.id}`}
                      className="text-neutral-400 transition-colors hover:text-neutral-50"
                    >
                      Editar
                    </Link>
                    <AchievementActiveToggle
                      achievementId={achievement.id}
                      isActive={achievement.is_active}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {!achievements?.length && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-neutral-500">
                  Nenhuma conquista cadastrada ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
