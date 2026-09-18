"use client";

import { ConfirmButton } from "@/components/shared/ConfirmButton";
import { deleteSalesResult } from "@/lib/actions/sales-results.actions";

export function DeleteResultButton({ resultId }: { resultId: string }) {
  return (
    <ConfirmButton
      label="Excluir"
      confirmLabel="Excluir"
      onConfirm={() => deleteSalesResult(resultId)}
    />
  );
}
