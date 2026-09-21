export type CelebrationEvent =
  | { kind: "overtake"; key: string; sellerId: string; name: string; rank: number }
  | { kind: "goal"; key: string; periodLabel: string }
  | { kind: "seller-goal"; key: string; sellerId: string; name: string; periodLabel: string };
