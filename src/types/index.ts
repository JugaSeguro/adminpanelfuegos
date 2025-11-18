export interface ContactData {
  email: string
  name: string
  phone: string
  eventDate: string
  eventType: string
  eventTime?: string
  address: string
  guestCount: number
}

export interface MenuSelection {
  type: 'dejeuner' | 'diner' | null
}

export interface ExtraServices {
  wines: boolean
  equipment: string[]
  decoration: boolean
  specialRequest: string
}

export interface PaymentInfo {
  totalAmount: number
  paidAmount: number
  pendingAmount: number
  paymentStatus: 'pending' | 'partial' | 'completed'
  paymentHistory: PaymentRecord[]
  dueDate?: string
}

export interface PaymentRecord {
  id: string
  amount: number
  date: string
  method: 'cash' | 'card' | 'transfer' | 'check'
  reference?: string
  notes?: string
}

export interface CateringOrder {
  id: string
  contact: ContactData
  menu: MenuSelection
  entrees: string[]
  viandes: string[]
  dessert: string | null
  extras: ExtraServices
  status: 'pending' | 'sent' | 'approved' | 'rejected'
  createdAt: string
  updatedAt: string
  estimatedPrice?: number
  notes?: string
  payment?: PaymentInfo
}

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  content: string
  type: 'reminder' | 'quote_update' | 'approval' | 'rejection' | 'custom'
}

export interface FilterOptions {
  status?: 'pending' | 'sent' | 'approved' | 'rejected' | 'all'
  dateFrom?: string
  dateTo?: string
  searchTerm?: string
}

export interface FinancialReport {
  period: string
  totalRevenue: number
  totalOrders: number
  averageOrderValue: number
  paymentBreakdown: {
    completed: number
    partial: number
    pending: number
  }
  monthlyData: MonthlyFinancialData[]
  topServices: ServiceRevenue[]
}

export interface MonthlyFinancialData {
  month: string
  revenue: number
  orders: number
  averageValue: number
}

export interface ServiceRevenue {
  service: string
  revenue: number
  orders: number
  percentage: number
}

export interface CalendarEvent {
  id: string
  orderId: string | null
  title: string
  date: string
  time?: string
  type: 'Event' | 'Reminder' | 'Payment Due'
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled'
  clientName: string
  location?: string
  notes?: string
}

export interface Reminder {
  id: string
  orderId: string
  type: 'event_upcoming' | 'payment_due' | 'follow_up' | 'custom'
  title: string
  message: string
  dueDate: string
  isRead: boolean
  priority: 'low' | 'medium' | 'high'
  createdAt: string
}

// Tipos para gestión de precios de productos
export interface Product {
  id: string
  name: string
  category: 'entradas' | 'carnes_clasicas' | 'carnes_premium' | 'verduras' | 'postres' | 'pan' | 'extras'
  price_per_kg: number | null
  price_per_portion: number
  unit_type: 'kg' | 'unidad' | 'porcion'
  is_combo: boolean
  notes: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export interface ComboIngredient {
  id: string
  combo_id: string
  ingredient_id: string
  quantity: number
  created_at: string
  ingredient?: Product
}

export type ProductCategory = {
  id: string
  name: string
  displayName: string
}