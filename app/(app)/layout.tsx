/**
 * Casca autenticada (ADMIN + VISUALIZACAO). A partir da ETAPA 2 este layout
 * passa a verificar a sessão do usuário e renderizar a navegação lateral
 * ciente do papel (role-aware sidebar/topbar).
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-neutral-950 p-6">{children}</div>;
}
