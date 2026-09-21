"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ADMIN_NAV_ITEMS = [
  { href: "/admin/vendedores", label: "Vendedores" },
  { href: "/admin/equipes", label: "Equipes" },
  { href: "/admin/resultados", label: "Resultados" },
  { href: "/admin/indicadores", label: "Indicadores" },
  { href: "/admin/metas", label: "Metas" },
  { href: "/admin/periodos", label: "Períodos" },
  { href: "/admin/conquistas", label: "Conquistas" },
  { href: "/admin/avisos", label: "Avisos" },
  { href: "/admin/desafios", label: "Desafios" },
  { href: "/admin/configuracoes", label: "Configurações" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2 border-b border-neutral-800 pb-4">
      {ADMIN_NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              isActive
                ? "rounded-full bg-blue-600 px-3 py-1.5 text-sm font-medium text-white"
                : "rounded-full px-3 py-1.5 text-sm text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-neutral-100"
            }
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
