import type { FarmRole } from './types'

export function canCreateEntries(role: FarmRole | null): boolean {
  return role === 'owner' || role === 'manager' || role === 'worker'
}

export function canEditOwnEntries(role: FarmRole | null): boolean {
  return role === 'owner' || role === 'manager' || role === 'worker'
}

export function canEditAnyEntries(role: FarmRole | null): boolean {
  return role === 'owner' || role === 'manager'
}

export function canDeleteOwnEntries(role: FarmRole | null): boolean {
  return role === 'owner' || role === 'manager' || role === 'worker'
}

export function canDeleteAnyEntries(role: FarmRole | null): boolean {
  return role === 'owner' || role === 'manager'
}

export function canManageParcels(role: FarmRole | null): boolean {
  return role === 'owner' || role === 'manager'
}

export function canExportReports(role: FarmRole | null): boolean {
  return role === 'owner' || role === 'manager'
}

export function canManageMembers(role: FarmRole | null): boolean {
  return role === 'owner'
}

export function canManageFarmSettings(role: FarmRole | null): boolean {
  return role === 'owner'
}

export function canDeleteFarm(role: FarmRole | null): boolean {
  return role === 'owner'
}

export function canLeaveFarm(role: FarmRole | null): boolean {
  return role !== 'owner'
}

export function isViewer(role: FarmRole | null): boolean {
  return role === 'viewer'
}

export function isWorker(role: FarmRole | null): boolean {
  return role === 'worker'
}

export function isOwner(role: FarmRole | null): boolean {
  return role === 'owner'
}
