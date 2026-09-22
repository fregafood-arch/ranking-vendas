export type AppTheme = "default" | "game" | "zoeira" | "holofote" | "futurista" | "clash";

export const THEME_OPTIONS: { value: AppTheme; label: string; description: string }[] = [
  { value: "default", label: "Padrão", description: "Visual minimalista, escuro e neutro." },
  { value: "game", label: "Arena", description: "Pódio estilo game, escudos em azul e dourado." },
  { value: "zoeira", label: "Zoeira", description: "Pódio com humor, apelidos e emoji nos resultados." },
  { value: "holofote", label: "Holofote", description: "Pódio de palco: luzes, confete e brilho em movimento." },
  { value: "futurista", label: "Futurista", description: "Escudos flutuantes num portal neon, com raios de luz no 1º lugar." },
  { value: "clash", label: "Arena Real", description: "Torres medievais num campo gramado animado, com bandeiras e tochas." },
];
