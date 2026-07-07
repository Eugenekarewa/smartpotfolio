/**
 * All monetary values are stored and computed as integer cents (NFR-1).
 * Never run parseFloat/Number on money outside this module.
 */

export function kesToCents(kes: number): number {
  return Math.round(kes * 100);
}

export function centsToKes(cents: number): number {
  return cents / 100;
}

export function formatKes(cents: number): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(centsToKes(cents));
}

export function addCents(...values: number[]): number {
  return values.reduce((sum, v) => sum + Math.trunc(v), 0);
}

export function sumCents(values: number[]): number {
  return addCents(...values);
}
