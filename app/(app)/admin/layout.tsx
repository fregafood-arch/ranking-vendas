import { requireAdmin } from "@/lib/auth/get-current-profile";

/**
 * Redireciona para /dashboard qualquer usuário autenticado cujo papel não
 * seja ADMIN. Isto é apenas UX (esconder telas administrativas) — a
 * barreira de segurança real são as políticas de RLS em
 * supabase/migrations/0003_rls_policies.sql, que já recusam hoje qualquer
 * escrita de um usuário não-ADMIN independentemente desta camada.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return <div className="space-y-6">{children}</div>;
}
