import Link from "next/link";

/**
 * Botão de salvar + link de cancelar, reaproveitado em todo formulário de
 * cadastro/edição — sem isto, a única forma de sair de uma tela sem salvar
 * era o botão "voltar" do navegador.
 */
export function FormActions({
  submitLabel,
  pending,
  cancelHref,
}: {
  submitLabel: string;
  pending: boolean;
  cancelHref: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-60"
      >
        {pending ? "Salvando..." : submitLabel}
      </button>
      <Link
        href={cancelHref}
        className="text-sm text-neutral-400 transition-colors hover:text-neutral-100"
      >
        Cancelar
      </Link>
    </div>
  );
}
