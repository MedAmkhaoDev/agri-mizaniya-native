export type UserRole = 'admin' | 'farmer' | 'viewer'
export type ParcelStatus = 'active' | 'archived'
export type CooperativeSupportType = 'gas' | 'seeds' | 'tools' | 'fertilizer' | 'equipment' | 'other'

export interface Profile {
  id: string
  fullName: string
  role: UserRole
  preferredLanguage: string
  avatarUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface Parcel {
  id: string
  userId: string
  name: string
  areaHectares: number | null
  location: string | null
  status: ParcelStatus
  notes: string | null
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
  userId: string
  parcelId: string
  typeId: string | null
  description: string | null
  amount: number
  quantity: number | null
  unit: string | null
  date: string
  notes: string | null
  createdAt: string
  updatedAt: string
  // Joined fields
  expenseType?: ExpenseType | null
  parcelName?: string | null
}

export interface Income {
  id: string
  userId: string
  parcelId: string
  productName: string
  quantity: number | null
  unit: string | null
  totalAmount: number
  date: string
  notes: string | null
  createdAt: string
  updatedAt: string
  // Joined fields
  parcelName?: string | null
}

export interface GasUsage {
  id: string
  userId: string
  parcelId: string
  quantityBottles: number
  totalAmount: number
  date: string
  notes: string | null
  createdAt: string
  updatedAt: string
  // Joined fields
  parcelName?: string | null
}

export interface CooperativeSupport {
  id: string
  userId: string
  parcelId: string | null
  invoiceNumber: string | null
  supportType: CooperativeSupportType
  description: string | null
  amount: number
  date: string
  notes: string | null
  createdAt: string
  updatedAt: string
  // Joined fields
  parcelName?: string | null
}

export interface ActivityItem {
  id: string
  type: 'expense' | 'income' | 'gas' | 'cooperative' | 'parcel'
  description: string
  amount?: number
  date: string
  parcelName?: string
}

export interface FinancialSummary {
  totalIncome: number
  totalExpenses: number
  totalGas: number
  totalCooperative: number
  netProfit: number
  parcelCount: number
}
