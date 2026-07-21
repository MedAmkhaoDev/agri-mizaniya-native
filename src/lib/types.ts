export type FarmRole = 'owner' | 'manager' | 'worker' | 'viewer'
export type ParcelStatus = 'active' | 'archived'
export type CooperativeSupportType = 'gas' | 'seeds' | 'tools' | 'fertilizer' | 'equipment' | 'other'

export interface Profile {
  id: string
  fullName: string
  email: string
  preferredLanguage: string
  avatarUrl: string | null
  currentFarmId: string | null
  farmIds: string[]
  createdAt: string
  updatedAt: string
}

export interface Farm {
  id: string
  name: string
  description: string | null
  location: string | null
  ownerId: string
  memberCount: number
  parcelCount: number
  currency: string
  createdAt: string
  updatedAt: string
}

export interface FarmMember {
  userId: string
  email: string
  fullName: string
  avatarUrl: string | null
  role: FarmRole
  joinedAt: string
  invitedBy: string | null
}

export interface FarmInvitation {
  id: string
  farmId: string
  farmName: string
  email: string
  role: FarmRole
  invitedBy: string
  invitedByName: string
  status: 'pending' | 'accepted' | 'expired' | 'revoked'
  createdAt: string
  expiresAt: string
}

export interface FarmInviteCode {
  code: string
  farmId: string
  farmName: string
  role: FarmRole
  createdBy: string
  maxUses: number | null
  useCount: number
  expiresAt: string
  isActive: boolean
  createdAt: string
}

export interface ActivityLogEntry {
  id: string
  farmId: string
  userId: string
  userName: string
  action: 'create' | 'update' | 'delete' | 'invite' | 'join' | 'leave' | 'role_change'
  entityType: 'expense' | 'income' | 'gas' | 'cooperative' | 'parcel' | 'member' | 'farm'
  entityId: string
  entityName: string
  details: Record<string, any> | null
  createdAt: string
}

export interface Parcel {
  id: string
  farmId: string
  name: string
  areaHectares: number | null
  location: string | null
  status: ParcelStatus
  notes: string | null
  assignedTo: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface ExpenseType {
  id: string
  userId: string | null
  name: string
  nameFr: string | null
  nameAr: string | null
  icon: string
  color: string
  isActive: boolean
  createdAt: string
}

export interface Expense {
  id: string
  farmId: string
  parcelId: string
  typeId: string | null
  description: string | null
  amount: number
  quantity: number | null
  unit: string | null
  date: string
  notes: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
  expenseType?: ExpenseType | null
  parcelName?: string | null
  createdByName?: string | null
}

export interface Income {
  id: string
  farmId: string
  parcelId: string
  productName: string
  quantity: number | null
  unit: string | null
  totalAmount: number
  date: string
  notes: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
  parcelName?: string | null
  createdByName?: string | null
}

export interface GasUsage {
  id: string
  farmId: string
  parcelId: string
  quantityBottles: number
  totalAmount: number
  date: string
  notes: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
  parcelName?: string | null
  createdByName?: string | null
}

export interface CooperativeSupport {
  id: string
  farmId: string
  parcelId: string | null
  invoiceNumber: string | null
  supportType: CooperativeSupportType
  description: string | null
  amount: number
  date: string
  notes: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
  parcelName?: string | null
  createdByName?: string | null
}

export interface ActivityItem {
  id: string
  type: 'expense' | 'income' | 'gas' | 'cooperative' | 'parcel'
  description: string
  amount?: number
  date: string
  parcelName?: string
  userName?: string
  createdBy?: string
}

export interface FinancialSummary {
  totalIncome: number
  totalExpenses: number
  totalGas: number
  totalCooperative: number
  netProfit: number
  parcelCount: number
}
