const TIME_ZONE = 'Europe/Paris'

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  timeZone: TIME_ZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const dateTimeFormatter = new Intl.DateTimeFormat('fr-FR', {
  timeZone: TIME_ZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const numberFormatter = new Intl.NumberFormat('fr-FR')

export function formatDate(value: string | null | undefined): string {
  return value ? dateFormatter.format(new Date(value)) : '—'
}

export function formatDateTime(value: string | null | undefined): string {
  return value ? dateTimeFormatter.format(new Date(value)) : '—'
}

export function formatNumber(value: number | null | undefined): string {
  return value === null || value === undefined ? '—' : numberFormatter.format(value)
}

export function formatMoney(amount: number | null | undefined, currency = 'EUR'): string {
  if (amount === null || amount === undefined) return '—'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(amount)
}

export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes) return '—'
  const units = ['o', 'Ko', 'Mo', 'Go']
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  return `${value.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} ${units[unit]}`
}

export function fullName(firstname?: string | null, lastname?: string | null): string {
  return [firstname, lastname].filter(Boolean).join(' ').trim()
}
