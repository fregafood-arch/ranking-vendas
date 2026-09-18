import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TeamForm } from "@/components/teams/TeamForm";
import { updateTeam } from "@/lib/actions/teams.actions";

export default async function EditTeamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: team } = await supabase.from("teams").select("id, name").eq("id", id).single();

  if (!team) {
    notFound();
  }

  const boundUpdateTeam = updateTeam.bind(null, team.id);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-neutral-50">Editar equipe</h1>
      <TeamForm action={boundUpdateTeam} submitLabel="Salvar" defaultValues={{ name: team.name }} />
    </div>
  );
}
