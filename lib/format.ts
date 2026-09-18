export function formatIndicatorValue(value: number, unit: string): string {
  if (unit === "BRL") {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    });
  }

  if (unit === "PERCENT") {
    return `${value.toLocaleString("pt-BR")}%`;
  }

  return value.toLocaleString("pt-BR");
}
