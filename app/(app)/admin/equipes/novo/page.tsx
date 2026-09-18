import { TeamForm } from "@/components/teams/TeamForm";
import { createTeam } from "@/lib/actions/teams.actions";

export default function NewTeamPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-neutral-50">Nova equipe</h1>
      <TeamForm action={createTeam} submitLabel="Criar" />
    </div>
  );
}
