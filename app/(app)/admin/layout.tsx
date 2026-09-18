/**
 * A partir da ETAPA 2, este layout redireciona para fora da área
 * administrativa qualquer usuário cujo profiles.role não seja ADMIN. Isto
 * é apenas uma conveniência de UX (esconder botões/telas) — a barreira de
 * segurança real são as políticas de RLS (ver supabase/migrations/0003),
 * que já hoje recusam qualquer escrita de um usuário não-ADMIN
 * independentemente do que esta camada de UI decidir mostrar.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="space-y-6">{children}</div>;
}
