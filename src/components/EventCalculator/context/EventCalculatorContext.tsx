import { createContext, useContext, ReactNode } from 'react'
import { Event, EventIngredient, EventCalculationVersion, IngredientTotal, GlobalStats } from '../types'
import { Product, CateringOrder, EventCalculationNote } from '@/types'

export interface EventCalculatorContextType {
    // State from useEvents
    events: Event[]
    loading: boolean
    saving: string | null
    error: string | null
    eventVersions: { [key: string]: EventCalculationVersion[] }
    eventNotes: { [key: string]: EventCalculationNote[] }

    // Actions from useEvents
    setEvents: (events: Event[]) => void
    setError: (error: string | null) => void
    loadEvents: () => Promise<void>
    saveEvent: (event: Event, changeType?: 'created' | 'updated' | 'duplicated' | 'restored') => Promise<string | undefined>
    deleteEvent: (id: string) => Promise<void>

    // State from EventCalculator (Local)
    filteredEvents: Event[]
    searchTerm: string
    setSearchTerm: (term: string) => void
    dateFilter: { start: string; end: string }
    setDateFilter: (filter: { start: string; end: string }) => void
    showSummary: boolean
    setShowSummary: (show: boolean) => void
    selectedEventIds: string[]
    setSelectedEventIds: React.Dispatch<React.SetStateAction<string[]>>
    handleSelectEvent: (id: string, selected: boolean) => void

    // UI State
    viewMode: 'list' | 'timeline' | 'comparison' | 'stats'
    setViewMode: (mode: 'list' | 'timeline' | 'comparison' | 'stats') => void
    filters: { search: string; dateFrom: string; dateTo: string }
    setFilters: (filters: { search: string; dateFrom: string; dateTo: string }) => void
    regeneratingCosts: boolean
    successMessage: string | null
    regenerateAllCosts: () => Promise<void>

    // Handlers from useEventHandlers
    selectedOrderIds: string[]
    setSelectedOrderIds: React.Dispatch<React.SetStateAction<string[]>>
    newEventName: string
    setNewEventName: (name: string) => void
    newEventGuests: number
    setNewEventGuests: (guests: number) => void
    newEventDate: string
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

    // Modals State & Handlers from useEventModals
    showAddEventModal: boolean
    setShowAddEventModal: (show: boolean) => void
    showSelectOrderModal: boolean
    setShowSelectOrderModal: (show: boolean) => void
    showNotesModal: string | null
    setShowNotesModal: (id: string | null) => void
    showHistoryModal: string | null
    setShowHistoryModal: (id: string | null) => void
    showMaterialSelectorModal: boolean
    setShowMaterialSelectorModal: (show: boolean) => void
    currentEventIdForSelector: string | null
    selectedMaterialIds: string[]

    loadEventHistory: (eventId: string) => Promise<void>
    restoreVersion: (eventId: string, version: EventCalculationVersion) => Promise<void>
    handleOpenMaterialSelector: (id: string) => void
    handleMaterialSelectionChange: (materialId: string) => void
    handleAddMaterialsToEvent: () => void
    handleNotesChange: (eventId: string, notes: string) => void
    handleObservationsChange: (eventId: string, observations: string) => void
    handleSaveNotes: (eventId: string) => Promise<void>

    // Calculations from useEventCalculations
    grandTotals: IngredientTotal[]
    totalsByCategory: { [key: string]: IngredientTotal[] }
    globalStats: GlobalStats

    // Data Props
    availableProducts: Product[]
    allProducts: Product[]
    orders: CateringOrder[]
    products: Product[]
    comboIngredientsMap: { [key: string]: any[] }
}

const EventCalculatorContext = createContext<EventCalculatorContextType | undefined>(undefined)

export const useEventCalculator = () => {
    const context = useContext(EventCalculatorContext)
    if (!context) {
        throw new Error('useEventCalculator must be used within an EventCalculatorProvider')
    }
    return context
}

export default EventCalculatorContext
