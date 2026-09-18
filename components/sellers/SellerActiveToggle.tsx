"use client";

import { useTransition } from "react";
import { setSellerActive } from "@/lib/actions/sellers.actions";

export function SellerActiveToggle({
  sellerId,
  isActive,
}: {
  sellerId: string;
  isActive: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => setSellerActive(sellerId, !isActive))}
      className="text-neutral-400 transition-colors hover:text-neutral-50 disabled:opacity-60"
    >
      {isActive ? "Inativar" : "Ativar"}
    </button>
  );
}
