import type { Role } from '../types'

export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ')
}

export const portalHome = (portal: 'central' | 'lab') =>
  portal === 'central' ? '/central/dashboard' : '/lab/dashboard'

export const portalLabel = (portal: 'central' | 'lab') =>
  portal === 'central' ? 'Central Property Custodian Portal' : 'WIL Lab Custodian Portal'

export const roleLabel: Record<Role, string> = {
  CENTRAL_CUSTODIAN: 'Central Property Custodian',
  SECOND_APPROVER: 'Second Approver',
  LAB_MANAGER: 'WIL Lab Manager',
  LAB_ASSISTANT: 'WIL Lab Assistant',
  TECHNICIAN: 'Campus Technician',
}

export function initialsOf(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

  return initials || 'EA'
}
