import { createClient } from "@/lib/supabase/server";
import { SellerAvatar } from "@/components/sellers/SellerAvatar";

export default async function SellersPage() {
  const supabase = await createClient();

  const { data: sellers } = await supabase
    .from("sellers")
    .select("id, full_name, role_title, photo_path, teams(name)")
    .eq("is_active", true)
    .order("full_name");

  // supabase-js tipa relações embutidas como array por padrão (não temos
  // Database types gerados); em runtime, uma relação many-to-one (FK na
  // própria tabela, como sellers.team_id) sempre vem como objeto único.
  type SellerRow = NonNullable<typeof sellers>[number];
  type SellerWithTeam = Omit<SellerRow, "teams"> & { teams: { name: string } | null };
  const sellerRows = (sellers ?? []) as unknown as SellerWithTeam[];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-neutral-50">Vendedores</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sellerRows.map((seller) => (
          <div
            key={seller.id}
            className="flex items-center gap-4 rounded-lg border border-neutral-800 bg-neutral-900 p-4"
          >
            <SellerAvatar photoPath={seller.photo_path} name={seller.full_name} size={48} />
            <div>
              <p className="font-medium text-neutral-100">{seller.full_name}</p>
              <p className="text-sm text-neutral-400">{seller.role_title ?? "—"}</p>
              {seller.teams?.name && (
                <p className="text-xs text-neutral-500">{seller.teams.name}</p>
              )}
            </div>
          </div>
        ))}
        {!sellerRows.length && (
          <p className="text-sm text-neutral-500">Nenhum vendedor ativo no momento.</p>
        )}
      </div>
    </div>
  );
}
