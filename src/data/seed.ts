import raw from '../../docs/SEED-DATA.json'
import type { SeedData } from '../types'

export const seed = raw as unknown as SeedData

export const unreviewedFlags = seed.auditFlags.filter(
  (flag) => !flag.reviewed && flag.type !== 'VARIANCE',
).length

export const lockedRequisitions = seed.requisitions.filter(
  (req) => req.status === 'LOCKED_REVIEW',
).length

export const readyTurnovers = seed.turnovers.filter(
  (turnover) => turnover.status === 'READY_TO_APPROVE',
).length
