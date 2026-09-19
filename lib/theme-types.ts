export type AppTheme = "default" | "game" | "zoeira";

export const THEME_OPTIONS: { value: AppTheme; label: string; description: string }[] = [
  { value: "default", label: "Padrão", description: "Visual minimalista, escuro e neutro." },
  { value: "game", label: "Arena", description: "Pódio estilo game, escudos em azul e dourado." },
  { value: "zoeira", label: "Zoeira", description: "Pódio com humor, apelidos e emoji nos resultados." },
];
