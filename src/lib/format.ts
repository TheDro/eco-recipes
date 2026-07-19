export function formatQuantity(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

export function formatMoney(n: number): string {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
