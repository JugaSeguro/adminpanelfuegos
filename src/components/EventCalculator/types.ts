import { Product, EventCalculationStats, EventCalculationVersion } from '@/types'

// Re-export specific types if needed by consumers of this module
export type { EventCalculationVersion }

export interface EventIngredient {
    id: string
    product: Product
    quantityPerPerson: number
    notes?: string
    dbId?: string
    isFixedQuantity?: boolean
    totalQuantity?: number
}

export interface Event {
    id: string
    dbId?: string
    name: string
    eventDate: string | null
    guestCount: number
    orderId: string | null
    ingredients: EventIngredient[]
    expanded: boolean
    showCosts: boolean
    showNotes: boolean
    notes: string
    observations: string
    versionNumber: number
    isSaved: boolean
    stats?: EventCalculationStats
}

export interface IngredientTotal {
    product: Product
    total: number
}

export interface GlobalStats {
    totalEvents: number
    totalGuests: number
    totalCost: number
    avgCostPerGuest: number
    avgCostPerEvent: number
}

export type ViewMode = 'list' | 'timeline' | 'comparison' | 'stats'
