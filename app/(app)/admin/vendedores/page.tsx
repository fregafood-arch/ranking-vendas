import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SellerAvatar } from "@/components/sellers/SellerAvatar";
import { SellerActiveToggle } from "@/components/sellers/SellerActiveToggle";

export default async function AdminSellersPage({
  searchParams,
}: {
  searchParams: Promise<{ photoUploadFailed?: string }>;
}) {
  const { photoUploadFailed } = await searchParams;
  const supabase = await createClient();

  const { data: sellers } = await supabase
    .from("sellers")
    .select("id, full_name, role_title, start_date, is_active, photo_path, teams(name)")
    .order("full_name");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-50">Vendedores</h1>
        <Link
          href="/admin/vendedores/novo"
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
        >
          Novo vendedor
        </Link>
      </div>

      {photoUploadFailed && (
        <p className="rounded-md border border-amber-800 bg-amber-950/50 px-4 py-2 text-sm text-amber-300">
          O vendedor foi cadastrado, mas o envio da foto falhou. Edite o cadastro para tentar
          novamente.
        </p>
      )}

      <div className="overflow-x-auto rounded-lg border border-neutral-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-900 text-neutral-400">
            <tr>
              <th className="px-4 py-3 font-medium" aria-hidden />
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Cargo</th>
              <th className="px-4 py-3 font-medium">Equipe</th>
              <th className="px-4 py-3 font-medium">Entrada</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium" aria-hidden />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {sellers?.map((seller) => (
              <tr key={seller.id} className="text-neutral-200">
                <td className="px-4 py-3">
                  <SellerAvatar photoPath={seller.photo_path} name={seller.full_name} size={36} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{seller.full_name}</td>
                <td className="px-4 py-3 text-neutral-400">{seller.role_title ?? "—"}</td>
                <td className="px-4 py-3 text-neutral-400">{seller.teams?.[0]?.name ?? "—"}</td>
                <td className="px-4 py-3 whitespace-nowrap text-neutral-400">
                  {new Date(`${seller.start_date}T00:00:00`).toLocaleDateString("pt-BR")}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      seller.is_active
                        ? "rounded-full bg-emerald-900/50 px-2 py-1 text-xs text-emerald-300"
                        : "rounded-full bg-neutral-800 px-2 py-1 text-xs text-neutral-400"
                    }
                  >
                    {seller.is_active ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-3 whitespace-nowrap">
                    <Link
                      href={`/admin/vendedores/${seller.id}`}
                      className="text-neutral-400 transition-colors hover:text-neutral-50"
                    >
                      Editar
                    </Link>
                    <SellerActiveToggle sellerId={seller.id} isActive={seller.is_active} />
                  </div>
                </td>
              </tr>
            ))}
            {!sellers?.length && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-neutral-500">
                  Nenhum vendedor cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
