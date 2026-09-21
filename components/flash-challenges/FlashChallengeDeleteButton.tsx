"use client";

import { ConfirmButton } from "@/components/shared/ConfirmButton";
import { deleteFlashChallenge } from "@/lib/actions/flash-challenges.actions";

export function FlashChallengeDeleteButton({ challengeId }: { challengeId: string }) {
  return (
    <ConfirmButton
      label="Excluir"
      confirmQuestion="Excluir este desafio relâmpago? Ele some da TV imediatamente."
      confirmLabel="Excluir"
      onConfirm={() => deleteFlashChallenge(challengeId)}
    />
  );
}
