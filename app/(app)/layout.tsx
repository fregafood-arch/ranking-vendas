import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { logout } from "@/lib/actions/auth.actions";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/ranking", label: "Ranking" },
  { href: "/sellers", label: "Vendedores" },
];

/**
 * Casca autenticada (ADMIN + VISUALIZAÇÃO). O link "Administração" só
 * aparece para ADMIN — pura conveniência de UX: a barreira de segurança
 * real são as políticas de RLS (supabase/migrations/0003), que recusam
 * qualquer escrita de quem não for ADMIN independente do que esta tela
 * decidir mostrar ou esconder.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  const isAdmin = profile.role === "ADMIN";

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
        <nav className="flex gap-5 text-sm text-neutral-300">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-neutral-50"
            >
              {item.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/admin/vendedores"
              className="transition-colors hover:text-neutral-50"
            >
              Administração
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-4 text-sm text-neutral-400">
          <span>{profile.displayName}</span>
          <form action={logout}>
            <button type="submit" className="transition-colors hover:text-neutral-50">
              Sair
            </button>
          </form>
        </div>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
