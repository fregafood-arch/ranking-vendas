import Link from "next/link";

/**
 * Paginação de verdade no servidor (não só cortar as N mais recentes): a
 * consulta busca só a página pedida (range), então isto continua rápido
 * mesmo com muitos lançamentos acumulados ao longo do tempo.
 */
export function ResultsPagination({
  currentPage,
  totalPages,
  basePath,
}: {
  currentPage: number;
  totalPages: number;
  basePath: string;
}) {
  if (totalPages <= 1) {
    return null;
  }

  const linkClass =
    "rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 transition-colors hover:bg-neutral-800";
  const disabledClass =
    "rounded-md border border-neutral-800 px-3 py-1.5 text-sm text-neutral-600 cursor-not-allowed";

  return (
    <div className="flex items-center justify-between">
      {currentPage > 1 ? (
        <Link href={`${basePath}?page=${currentPage - 1}`} className={linkClass}>
          Anterior
        </Link>
      ) : (
        <span className={disabledClass}>Anterior</span>
      )}

      <span className="text-sm text-neutral-500">
        Página {currentPage} de {totalPages}
      </span>

      {currentPage < totalPages ? (
        <Link href={`${basePath}?page=${currentPage + 1}`} className={linkClass}>
          Próxima
        </Link>
      ) : (
        <span className={disabledClass}>Próxima</span>
      )}
    </div>
  );
}
