import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TeamActiveToggle } from "@/components/teams/TeamActiveToggle";

export default async function AdminTeamsPage() {
  const supabase = await createClient();

  const { data: teams } = await supabase
    .from("teams")
    .select("id, name, is_active")
    .order("name");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-50">Equipes</h1>
          <p className="text-sm text-neutral-400">
            Usadas no cadastro de vendedores (campo opcional &quot;Equipe&quot;).
          </p>
        </div>
        <Link
          href="/admin/equipes/novo"
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
        >
          Nova equipe
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-900 text-neutral-400">
            <tr>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium" aria-hidden />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {teams?.map((team) => (
              <tr key={team.id} className="text-neutral-200">
                <td className="px-4 py-3">{team.name}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      team.is_active
                        ? "rounded-full bg-emerald-900/50 px-2 py-1 text-xs text-emerald-300"
                        : "rounded-full bg-neutral-800 px-2 py-1 text-xs text-neutral-400"
                    }
                  >
                    {team.is_active ? "Ativa" : "Inativa"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-3 whitespace-nowrap">
                    <Link
                      href={`/admin/equipes/${team.id}`}
                      className="text-neutral-400 transition-colors hover:text-neutral-50"
                    >
                      Editar
                    </Link>
                    <TeamActiveToggle teamId={team.id} isActive={team.is_active} />
                  </div>
                </td>
              </tr>
            ))}
            {!teams?.length && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-neutral-500">
                  Nenhuma equipe cadastrada ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
