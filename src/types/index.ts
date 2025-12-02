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
  paymentType?: 'blanco' | 'negro'
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
  type: 'Casamiento' | 'Aniversario' | 'Bautismo' | 'Empresarial' | 'Otros'
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
  portion_per_person: string | null // Porción por persona (ej: "1/4", "1/2", "30 gr", "1 feta")
  clarifications: string | null // Aclaraciones importantes (ej: "Con 1 chorizo hago 4 choripanes")
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

// Tipos para Calculadora de Eventos
export interface EventCalculation {
  id: string
  name: string
  event_date: string | null
  guest_count: number
  order_id: string | null
  version_number: number
  is_active: boolean
  created_by: string | null
  total_cost: number | null
  cost_per_guest: number | null
  total_ingredients_count: number | null
  notes: string | null
  observations: string | null
  created_at: string
  updated_at: string
}

export interface EventCalculationIngredient {
  id: string
  event_calculation_id: string
  product_id: string
  quantity_per_person: number
  total_quantity: number
  unit_price: number
  total_cost: number
  notes: string | null
  display_order: number
  created_at: string
  product?: Product
}

export interface EventCalculationVersion {
  id: string
  event_calculation_id: string
  version_number: number
  version_data: any
  change_description: string | null
  change_type: 'created' | 'updated' | 'duplicated' | 'restored'
  created_by: string | null
  created_at: string
}

export interface EventCalculationNote {
  id: string
  event_calculation_id: string
  note_type: 'general' | 'ingredient' | 'cost' | 'reminder'
  title: string | null
  content: string
  ingredient_id: string | null
  priority: 'low' | 'normal' | 'high' | 'urgent'
  is_resolved: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface EventCalculationStats {
  id: string
  event_calculation_id: string
  total_cost: number
  cost_per_guest: number
  total_ingredients: number
  cost_by_category: { [key: string]: number } | null
  ingredients_by_category: { [key: string]: number } | null
  comparison_data: any | null
  most_expensive_ingredient: any | null
  most_used_ingredient: any | null
  calculated_at: string
}