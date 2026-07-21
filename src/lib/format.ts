export function formatMAD(amount: number): string {
  return new Intl.NumberFormat('fr-MA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount))
}

export function formatMADDecimal(amount: number): string {
  return new Intl.NumberFormat('fr-MA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function filterNumeric(v: string): string {
  return v.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1')
}
