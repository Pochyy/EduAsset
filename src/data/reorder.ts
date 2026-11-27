import type { PolicySettings } from '../types'

export interface ForecastRow {
  id: string
  itemId: string
  name: string
  code: string
  stock: number
  /** Issuance scans in the standard forecast window (14 days by default). */
  issues14: number
  /** Issuance scans in the low-volume forecast window (42 days by default). */
  issues42: number
  /** Issuance scans in the same weeks of the previous term; null when no term exists. */
  lastTermIssues: number | null
  lead: number
  buffer: number
  prNumber: string
  /** Set when stock is held as a consumable lot rather than individual units. */
  lotItemId?: string | null
}

export const initialForecast: ForecastRow[] = [
  {
    id: 'tnr',
    itemId: 'TNR',
    name: 'HP LaserJet Toner',
    code: 'W9004MC',
    stock: 2,
    issues14: 3,
    issues42: 8,
    lastTermIssues: 4,
    lead: 21,
    buffer: 7,
    prNumber: 'PR-2026-0412',
  },
  {
    id: 'a4',
    itemId: 'A4',
    name: 'Bond paper A4 (ream)',
    code: 'BP-A4',
    stock: 40,
    issues14: 22,
    issues42: 55,
    lastTermIssues: 30,
    lead: 21,
    buffer: 7,
    prNumber: 'PR-2026-0413',
    lotItemId: 'A4',
  },
  {
    id: 'ctn',
    itemId: 'CTN',
    name: 'Color toner (cyan)',
    code: 'W9001MC',
    stock: 4,
    issues14: 2,
    issues42: 6,
    lastTermIssues: 3,
    lead: 21,
    buffer: 7,
    prNumber: 'PR-2026-0414',
  },
  {
    id: 'pla',
    itemId: 'PLA',
    name: 'PLA filament spool 1 kg',
    code: 'FIL-PLA',
    stock: 12,
    issues14: 4,
    issues42: 9,
    lastTermIssues: 6,
    lead: 14,
    buffer: 7,
    prNumber: 'PR-2026-0415',
  },
  {
    id: 'drm',
    itemId: 'DRM',
    name: 'Imaging drum unit',
    code: 'W1104A',
    stock: 3,
    issues14: 1,
    issues42: 3,
    lastTermIssues: 2,
    lead: 21,
    buffer: 7,
    prNumber: 'PR-2026-0416',
  },
  {
    id: 'thrm',
    itemId: 'THRM',
    name: 'Thermal paper roll',
    code: 'THRM',
    stock: 10,
    issues14: 0,
    issues42: 0,
    lastTermIssues: 0,
    lead: 21,
    buffer: 7,
    prNumber: 'PR-2026-0417',
    lotItemId: 'THRM',
  },
]

export const triggerDays = (row: ForecastRow) => row.lead + row.buffer

/**
 * FR-1.03: use the low-volume window when fewer than the configured number of
 * issues were recorded in the standard window; otherwise use the standard window.
 */
export const windowDays = (row: ForecastRow, policy: PolicySettings) =>
  row.issues14 < policy.lowVolumeIssueThreshold
    ? policy.lowVolumeWindowDays
    : policy.forecastWindowDays

export const windowIssues = (row: ForecastRow, policy: PolicySettings) =>
  row.issues14 < policy.lowVolumeIssueThreshold ? row.issues42 : row.issues14

export const burnRateWindow = (row: ForecastRow, policy: PolicySettings) =>
  windowIssues(row, policy) / windowDays(row, policy)

/**
 * FR-1.03 / SDD 5.1: BR_season uses the same weeks of last term, normalised by
 * the lead-time + safety-buffer trigger. Null or zero history yields zero.
 */
export const burnRateSeason = (row: ForecastRow) =>
  row.lastTermIssues === null ? 0 : row.lastTermIssues / triggerDays(row)

export const burnRate = (row: ForecastRow, policy: PolicySettings) =>
  Math.max(burnRateWindow(row, policy), burnRateSeason(row))

export type BurnRateBasis = '14-day' | '42-day low-volume' | 'Last-term seasonal' | 'No recent use'

export const burnRateBasis = (
  row: ForecastRow,
  policy: PolicySettings,
): BurnRateBasis => {
  const windowRate = burnRateWindow(row, policy)
  const seasonRate = burnRateSeason(row)
  if (windowRate === 0 && seasonRate === 0) return 'No recent use'
  if (seasonRate > windowRate) return 'Last-term seasonal'
  return row.issues14 < policy.lowVolumeIssueThreshold
    ? '42-day low-volume'
    : '14-day'
}

export const isNoRecentUse = (row: ForecastRow, policy: PolicySettings) =>
  burnRate(row, policy) === 0

export const daysLeft = (row: ForecastRow, policy: PolicySettings) => {
  const rate = burnRate(row, policy)
  return rate > 0 ? row.stock / rate : null
}

export const isAlert = (row: ForecastRow, policy: PolicySettings) => {
  const days = daysLeft(row, policy)
  return days !== null && days <= triggerDays(row)
}

export const projectedDemand = (row: ForecastRow, policy: PolicySettings) =>
  Math.max(0, Math.ceil(burnRate(row, policy) * triggerDays(row) - row.stock))
