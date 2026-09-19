export type AppTheme = "default" | "game";

export const THEME_OPTIONS: { value: AppTheme; label: string; description: string }[] = [
  { value: "default", label: "Padrão", description: "Visual minimalista, escuro e neutro." },
  { value: "game", label: "Arena", description: "Pódio estilo game, escudos em azul e dourado." },
];
