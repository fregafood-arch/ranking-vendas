import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AppRole = "ADMIN" | "VISUALIZACAO" | "VENDEDOR";

export type CurrentProfile = {
  id: string;
  email: string | null;
  role: AppRole;
  displayName: string;
};

/**
 * Camada única de verificação de sessão + papel, reaproveitada por
 * layouts, páginas e Server Actions (ver guia de autenticação do Next.js:
 * a checagem deve acontecer perto de onde os dados são lidos, não só no
 * proxy/middleware). cache() do React memoiza o resultado durante um mesmo
 * ciclo de renderização, então (app)/layout.tsx e admin/layout.tsx não
 * disparam duas consultas ao Supabase para a mesma requisição.
 *
 * Se o usuário está autenticado mas ainda não tem linha em profiles (não
 * deveria acontecer, já que 0004_auth_provisioning.sql cria essa linha
 * automaticamente — mas defensivamente, para nunca gerar um loop de
 * redirecionamento /login <-> /dashboard), o papel cai para VISUALIZACAO,
 * o mínimo privilégio, em vez de falhar.
 */
export const getCurrentProfile = cache(async (): Promise<CurrentProfile> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, display_name")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    email: user.email ?? null,
    role: (profile?.role as AppRole | undefined) ?? "VISUALIZACAO",
    displayName: profile?.display_name ?? user.email ?? "Usuário",
  };
});

export const requireAdmin = cache(async (): Promise<CurrentProfile> => {
  const profile = await getCurrentProfile();

  if (profile.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return profile;
});
