import { createContext, useContext } from 'react'
import { Event, EventCalculationVersion, IngredientTotal, GlobalStats } from '../types'
import { Product, CateringOrder, EventCalculationNote } from '@/types'

// --- State Inteface (Data that changes frequently) ---
export interface EventStateContextType {
    // Events Data
    events: Event[]
    loading: boolean
    saving: string | null
    error: string | null
    eventVersions: { [key: string]: EventCalculationVersion[] }
    eventNotes: { [key: string]: EventCalculationNote[] }

    // Local Filter State
    filteredEvents: Event[]
    searchTerm: string
    dateFilter: { start: string; end: string }
    showSummary: boolean
    selectedEventIds: string[]

    // UI State
    viewMode: 'list' | 'timeline' | 'comparison' | 'stats'
    filters: { search: string; dateFrom: string; dateTo: string }
    regeneratingCosts: boolean
    successMessage: string | null

    // Handlers State (Form inputs)
    selectedOrderIds: string[]
    newEventName: string
    newEventGuests: number
    newEventDate: string

    // Modals State
    showAddEventModal: boolean
    showSelectOrderModal: boolean
    showNotesModal: string | null
    showHistoryModal: string | null
    showMaterialSelectorModal: boolean
    currentEventIdForSelector: string | null
    selectedMaterialIds: string[]

    // Calculations
    grandTotals: IngredientTotal[]
    totalsByCategory: { [key: string]: IngredientTotal[] }
    globalStats: GlobalStats

    // Reference Data
    availableProducts: Product[]
    allProducts: Product[]
    orders: CateringOrder[]
    products: Product[]
    comboIngredientsMap: { [key: string]: any[] }
}

// --- Dispatch Interface (Functions that are stable) ---
export interface EventDispatchContextType {
    // Events Actions
    setEvents: (events: Event[]) => void
    setError: (error: string | null) => void
    loadEvents: () => Promise<void>
    saveEvent: (event: Event, changeType?: 'created' | 'updated' | 'duplicated' | 'restored') => Promise<string | undefined>
    deleteEvent: (id: string) => Promise<void>

    // Local Filter Actions
    setSearchTerm: (term: string) => void
    setDateFilter: (filter: { start: string; end: string }) => void
    setShowSummary: (show: boolean) => void
    setSelectedEventIds: React.Dispatch<React.SetStateAction<string[]>>
    handleSelectEvent: (id: string, selected: boolean) => void

    // UI Actions
    setViewMode: (mode: 'list' | 'timeline' | 'comparison' | 'stats') => void
    setFilters: (filters: { search: string; dateFrom: string; dateTo: string }) => void
    regenerateAllCosts: () => Promise<void>

    // Handler Actions
    setSelectedOrderIds: React.Dispatch<React.SetStateAction<string[]>>
    setNewEventName: (name: string) => void
    setNewEventGuests: (guests: number) => void
    setNewEventDate: (date: string) => void

    repairEvent: (eventId: string) => Promise<void>
    handleLoadOrdersAsEvents: (orders: CateringOrder[]) => Promise<void>
    toggleOrderSelection: (orderId: string) => void
    handleAddEvent: () => Promise<void>
    handleRemoveEvent: (eventId: string) => Promise<void>
    toggleEventExpanded: (eventId: string) => void
    toggleEventCosts: (eventId: string) => void
    toggleEventNotes: (eventId: string) => void
    handleAddIngredient: (eventId: string, productId: string) => Promise<void>
    handleRemoveIngredient: (eventId: string, ingredientId: string) => Promise<void>
    handleUpdateQuantity: (eventId: string, ingredientId: string, quantity: number) => Promise<void>
    handleUpdateGuestCount: (eventId: string, count: number) => Promise<void>
    handleUpdateNotes: (eventId: string, notes: string, observations: string) => Promise<void>
    duplicateEvent: (eventId: string) => Promise<void>

    // Modal Actions
    setShowAddEventModal: (show: boolean) => void
    setShowSelectOrderModal: (show: boolean) => void
    setShowNotesModal: (id: string | null) => void
    setShowHistoryModal: (id: string | null) => void
    setShowMaterialSelectorModal: (show: boolean) => void

    loadEventHistory: (eventId: string) => Promise<void>
    restoreVersion: (eventId: string, version: EventCalculationVersion) => Promise<void>
    handleOpenMaterialSelector: (id: string) => void
    handleMaterialSelectionChange: (materialId: string) => void
    handleAddMaterialsToEvent: () => void
    handleNotesChange: (eventId: string, notes: string) => void
    handleObservationsChange: (eventId: string, observations: string) => void
    handleSaveNotes: (eventId: string) => Promise<void>
}

// Create Contexts
export const EventStateContext = createContext<EventStateContextType | undefined>(undefined)
export const EventDispatchContext = createContext<EventDispatchContextType | undefined>(undefined)

// Hooks
export const useEventState = () => {
    const context = useContext(EventStateContext)
    if (!context) throw new Error('useEventState must be used within EventCalculatorProvider')
    return context
}

export const useEventDispatch = () => {
    const context = useContext(EventDispatchContext)
    if (!context) throw new Error('useEventDispatch must be used within EventCalculatorProvider')
    return context
}

// Legacy Combined Hook (for backward compatibility during refactor)
export const useEventCalculator = () => {
    const state = useEventState()
    const dispatch = useEventDispatch()
    return { ...state, ...dispatch }
}

export default EventStateContext // Default export kept for compatibility if needed, though named is preferred
