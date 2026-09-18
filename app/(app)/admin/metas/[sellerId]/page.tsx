import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SellerGoalsForm } from "@/components/goals/SellerGoalsForm";

export default async function SellerGoalsPage({
  params,
  searchParams,
}: {
  params: Promise<{ sellerId: string }>;
  searchParams: Promise<{ period?: string }>;
}) {
  const { sellerId } = await params;
  const { period: periodIdParam } = await searchParams;
  const supabase = await createClient();

  const [{ data: seller }, { data: indicators }, { data: activePeriod }] = await Promise.all([
    supabase.from("sellers").select("id, full_name").eq("id", sellerId).single(),
    supabase.from("indicators").select("id, name, unit").eq("is_active", true).order("name"),
    periodIdParam
      ? supabase.from("periods").select("id, label").eq("id", periodIdParam).single()
      : supabase
          .from("periods")
          .select("id, label")
          .eq("is_active", true)
          .order("start_date", { ascending: false })
          .limit(1)
          .maybeSingle(),
  ]);

  if (!seller) {
    notFound();
  }

  if (!activePeriod) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-neutral-50">Metas de {seller.full_name}</h1>
        <p className="text-sm text-neutral-400">
          Nenhum período disponível.{" "}
          <Link href="/admin/periodos/novo" className="text-emerald-400 hover:underline">
            Criar período
          </Link>
        </p>
      </div>
    );
  }

  const { data: existingGoals } = await supabase
    .from("seller_goals")
    .select("indicator_id, target_value, weight")
    .eq("seller_id", sellerId)
    .eq("period_id", activePeriod.id)
    .eq("is_active", true);

  const initialGoals = Object.fromEntries(
    (existingGoals ?? []).map((goal) => [
      goal.indicator_id,
      { targetValue: Number(goal.target_value), weight: Number(goal.weight) },
    ]),
  );

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/metas" className="text-sm text-neutral-400 hover:text-neutral-50">
          Metas
        </Link>
        <h1 className="text-xl font-semibold text-neutral-50">Metas de {seller.full_name}</h1>
        <p className="text-sm text-neutral-400">Período: {activePeriod.label}</p>
      </div>
      <SellerGoalsForm
        sellerId={sellerId}
        periodId={activePeriod.id}
        indicators={indicators ?? []}
        initialGoals={initialGoals}
      />
    </div>
  );
}
