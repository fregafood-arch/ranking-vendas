export function formatIndicatorValue(value: number, unit: string): string {
  if (unit === "BRL") {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  if (unit === "PERCENT") {
    return `${value.toLocaleString("pt-BR")}%`;
  }

  return value.toLocaleString("pt-BR");
}
