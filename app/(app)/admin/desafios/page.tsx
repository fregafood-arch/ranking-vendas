import { createClient } from "@/lib/supabase/server";
import { FlashChallengeForm } from "@/components/flash-challenges/FlashChallengeForm";
import { FlashChallengeActiveToggle } from "@/components/flash-challenges/FlashChallengeActiveToggle";
import { FlashChallengeDeleteButton } from "@/components/flash-challenges/FlashChallengeDeleteButton";

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export default async function AdminFlashChallengesPage() {
  const supabase = await createClient();

  const { data: challenges } = await supabase
    .from("flash_challenges")
    .select("id, title, description, prize_label, ends_at, is_active, created_at")
    .order("created_at", { ascending: false });

  const now = new Date().getTime();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-neutral-50">Desafios Relâmpago</h1>
        <p className="text-sm text-neutral-400">
          Mini-desafio avulso com prazo curto e prêmio próprio — aparece como um slide extra no Modo
          TV, com contagem regressiva, enquanto estiver ativo e dentro do prazo.
        </p>
      </div>

      <FlashChallengeForm />

      <div className="space-y-3">
        {challenges?.map((challenge) => {
          const expired = new Date(challenge.ends_at).getTime() < now;
          return (
            <div
              key={challenge.id}
              className="flex items-start justify-between gap-4 rounded-lg border border-neutral-800 p-4"
            >
              <div className="min-w-0 space-y-1">
                <p className="font-medium text-neutral-50">{challenge.title}</p>
                {challenge.description && (
                  <p className="text-sm break-words whitespace-pre-wrap text-neutral-300">
                    {challenge.description}
                  </p>
                )}
                <p className="text-sm text-amber-400">🏆 {challenge.prize_label}</p>
                <p className="text-xs text-neutral-500">Termina em {formatDateTime(challenge.ends_at)}</p>
                <span
                  className={
                    challenge.is_active && !expired
                      ? "inline-block rounded-full bg-emerald-900/50 px-2 py-0.5 text-xs text-emerald-300"
                      : "inline-block rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-400"
                  }
                >
                  {expired ? "Prazo encerrado" : challenge.is_active ? "Visível na TV" : "Oculto"}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-3 whitespace-nowrap">
                <FlashChallengeActiveToggle challengeId={challenge.id} isActive={challenge.is_active} />
                <FlashChallengeDeleteButton challengeId={challenge.id} />
              </div>
            </div>
          );
        })}
        {!challenges?.length && (
          <p className="text-sm text-neutral-500">Nenhum desafio relâmpago cadastrado ainda.</p>
        )}
      </div>
    </div>
  );
}
