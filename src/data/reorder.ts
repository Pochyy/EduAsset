export interface ForecastRow {
  id: string
  name: string
  code: string
  stock: number
  consumed: number
  lead: number
  buffer: number
  prNumber: string
}

export const initialForecast: ForecastRow[] = [
  {
    id: 'tnr',
    name: 'HP LaserJet Toner',
    code: 'W9004MC',
    stock: 2,
    consumed: 3,
    lead: 21,
    buffer: 7,
    prNumber: 'PR-2026-0412',
  },
  {
    id: 'a4',
    name: 'Bond paper A4 (ream)',
    code: 'BP-A4',
    stock: 40,
    consumed: 22,
    lead: 21,
    buffer: 7,
    prNumber: 'PR-2026-0413',
  },
  {
    id: 'ctn',
    name: 'Color toner (cyan)',
    code: 'W9001MC',
    stock: 4,
    consumed: 2,
    lead: 21,
    buffer: 7,
    prNumber: 'PR-2026-0414',
  },
  {
    id: 'pla',
    name: 'PLA filament spool 1 kg',
    code: 'FIL-PLA',
    stock: 12,
    consumed: 4,
    lead: 14,
    buffer: 7,
    prNumber: 'PR-2026-0415',
  },
  {
    id: 'drm',
    name: 'Imaging drum unit',
    code: 'W1104A',
    stock: 3,
    consumed: 1,
    lead: 21,
    buffer: 7,
    prNumber: 'PR-2026-0416',
  },
]

export const burnRate = (row: ForecastRow) => row.consumed / 14

export const triggerDays = (row: ForecastRow) => row.lead + row.buffer

export const daysLeft = (row: ForecastRow) => {
  const rate = burnRate(row)
  return rate > 0 ? row.stock / rate : Number.POSITIVE_INFINITY
}

export const isAlert = (row: ForecastRow) => daysLeft(row) <= triggerDays(row)

export const projectedDemand = (row: ForecastRow) =>
  Math.max(0, Math.ceil(burnRate(row) * triggerDays(row) - row.stock))
