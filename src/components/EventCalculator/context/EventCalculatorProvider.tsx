import { ReactNode, useState, useEffect, useMemo } from 'react'
import { Product, CateringOrder } from '@/types'
import { supabase } from '@/lib/supabaseClient'
import { EventStateContext, EventDispatchContext, EventStateContextType, EventDispatchContextType } from './EventCalculatorContext'
import { useEvents } from '../hooks/useEvents'
import { useEventCalculations } from '../hooks/useEventCalculations'
import { useEventHandlers } from '../hooks/useEventHandlers'
import { useEventModals } from '../hooks/useEventModals'
import { useConfirmation } from '@/hooks/useConfirmation'

interface EventCalculatorProviderProps {
    children: ReactNode
    products: Product[]
    orders: CateringOrder[]
}

export const EventCalculatorProvider = ({ children, products, orders }: EventCalculatorProviderProps) => {
    // Confirmation System
    const { confirm, alert, ConfirmationDialog } = useConfirmation()

    // Combo ingredients map
    const [comboIngredientsMap, setComboIngredientsMap] = useState<{ [comboId: string]: { combo_id: string, ingredient_id: string, quantity: number }[] }>({})

    // Load combo ingredients on mount
    useEffect(() => {
        const loadAllComboIngredients = async () => {
            const { data, error } = await supabase
                .from('combo_ingredients')
                .select('combo_id, ingredient_id, quantity')

            if (data) {
                const map: { [key: string]: { combo_id: string, ingredient_id: string, quantity: number }[] } = {}
                data.forEach(item => {
                    if (!map[item.combo_id]) map[item.combo_id] = []
                    map[item.combo_id].push(item)
                })
                setComboIngredientsMap(map)
            }
        }
        loadAllComboIngredients()
    }, [])

    // Derived data
    const availableProducts = useMemo(() => products.filter(p => !p.is_combo && p.active), [products])
    const allProducts = useMemo(() => products.filter(p => p.active), [products])

    // Events hook
    const {
        events,
        setEvents,
        loading,
        saving,
        error,
        setError,
        eventVersions: eventsVersions,
        setEventVersions,
        eventNotes: eventsNotes,
        setEventNotes,
        loadEvents,
        saveEvent,
        deleteEvent
    } = useEvents(products)

    // Local filters state
    const [searchTerm, setSearchTerm] = useState('')
    const [dateFilter, setDateFilter] = useState({ start: '', end: '' })
    const [showSummary, setShowSummary] = useState(false)
    const [selectedEventIds, setSelectedEventIds] = useState<string[]>([])

    // Handle event selection
    const handleSelectEvent = (id: string, selected: boolean) => {
        if (selected) {
            setSelectedEventIds(prev => [...prev, id])
        } else {
            setSelectedEventIds(prev => prev.filter(eid => eid !== id))
        }
    }

    // UI State for views and messages
    const [viewMode, setViewMode] = useState<'list' | 'timeline' | 'comparison' | 'stats'>('list')
    const [filters, setFilters] = useState({
        search: '',
        dateFrom: '',
        dateTo: ''
    })
    const [regeneratingCosts, setRegeneratingCosts] = useState(false)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    // Filter events
    const filteredEvents = useMemo(() => {
        return events.filter(event => {
            if (searchTerm) {
                const searchLower = searchTerm.toLowerCase()
                if (!event.name.toLowerCase().includes(searchLower)) {
                    return false
                }
            }

            if (dateFilter.start && event.eventDate) {
                if (new Date(event.eventDate) < new Date(dateFilter.start)) {
                    return false
                }
            }

            if (dateFilter.end && event.eventDate) {
                if (new Date(event.eventDate) > new Date(dateFilter.end)) {
                    return false
                }
            }

            return true
        })
    }, [events, searchTerm, dateFilter])

    // Modals hook
    const {
        showAddEventModal, setShowAddEventModal,
        showSelectOrderModal, setShowSelectOrderModal,
        showNotesModal, setShowNotesModal,
        showHistoryModal, setShowHistoryModal,
        showMaterialSelectorModal, setShowMaterialSelectorModal,
        currentEventIdForSelector, selectedMaterialIds,
        handleOpenMaterialSelector, handleToggleMaterialSelection, handleAddSelectedMaterials,
        eventVersions, loadEventHistory, restoreVersion,
        eventNotes, handleNotesChange, handleObservationsChange, handleSaveNotes
    } = useEventModals({
        events,
        setEvents,
        products,
        availableProducts,
        saveEvent
    })

    // Handlers hook
    const {
        selectedOrderIds, setSelectedOrderIds,
        newEventName, setNewEventName,
        newEventGuests, setNewEventGuests,
        newEventDate, setNewEventDate,
        repairEvent, handleLoadOrdersAsEvents,
        toggleOrderSelection, handleAddEvent, handleRemoveEvent,
        toggleEventExpanded, toggleEventCosts, toggleEventNotes,
        handleAddIngredient, handleRemoveIngredient,
        handleUpdateQuantity, handleUpdateGuestCount,
        handleUpdateNotes,
        duplicateEvent
    } = useEventHandlers({
        events,
        setEvents,
        orders,
        products,
        availableProducts,
        allProducts,
        saveEvent,
        deleteEvent,
        setError,
        setSuccessMessage: () => { }, // We'll handle this in the component
        setShowAddEventModal,
        setShowSelectOrderModal,
        setShowNotesModal,
        setShowHistoryModal,
        setShowMaterialSelectorModal,
        confirm, // Inject confirm
        alert // Inject alert
    })

    // Calculations hook
    const { grandTotals, totalsByCategory, globalStats } = useEventCalculations(
        events,
        filteredEvents,
        products,
        comboIngredientsMap
    )

    // Regenerate all costs function
    const regenerateAllCosts = async () => {
        if (events.length === 0) {
            await alert({
                title: 'No hay eventos',
                message: 'No hay eventos para regenerar costos',
                variant: 'warning'
            })
            return
        }

        const confirmed = await confirm({
            title: 'Regenerar Costos',
            message: `¿Regenerar costos de ${events.length} evento(s)?\n\nEsto actualizará todos los costos en la base de datos basándose en los precios actuales de los productos.`,
            variant: 'warning'
        })

        if (!confirmed) return

        try {
            setRegeneratingCosts(true)
            setError(null)
            setSuccessMessage(null)

            let successCount = 0
            let errorCount = 0

            for (const event of events) {
                try {
                    await saveEvent(event, 'updated')
                    successCount++
                } catch (err) {
                    console.error(`Error regenerando costos para evento "${event.name}":`, err)
                    errorCount++
                }
            }

            if (errorCount === 0) {
                setSuccessMessage(`✅ Costos regenerados exitosamente para ${successCount} evento(s)`)
                setTimeout(() => setSuccessMessage(null), 5000)
            } else {
                setError(`⚠️ Se regeneraron ${successCount} evento(s), pero ${errorCount} tuvieron errores`)
            }

        } catch (err) {
            console.error('Error regenerando costos:', err)
            setError('Error al regenerar costos')
        } finally {
            setRegeneratingCosts(false)
        }
    }

    // Split Context Values
    const stateValue: EventStateContextType = useMemo(() => ({
        events,
        loading,
        saving,
        error,
        eventVersions,
        eventNotes,

        filteredEvents,
        searchTerm,
        dateFilter,
        showSummary,
        selectedEventIds,

        viewMode,
        filters,
        regeneratingCosts,
        successMessage,

        selectedOrderIds,
        newEventName,
        newEventGuests,
        newEventDate,

        showAddEventModal,
        showSelectOrderModal,
        showNotesModal,
        showHistoryModal,
        showMaterialSelectorModal,
        currentEventIdForSelector,
        selectedMaterialIds,

        grandTotals,
        totalsByCategory,
        globalStats,

        availableProducts,
        allProducts,
        orders,
        products,
        comboIngredientsMap
    }), [
        events, loading, saving, error, eventVersions, eventNotes,
        filteredEvents, searchTerm, dateFilter, showSummary, selectedEventIds,
        viewMode, filters, regeneratingCosts, successMessage,
        selectedOrderIds, newEventName, newEventGuests, newEventDate,
        showAddEventModal, showSelectOrderModal, showNotesModal, showHistoryModal,
        showMaterialSelectorModal, currentEventIdForSelector, selectedMaterialIds,
        grandTotals, totalsByCategory, globalStats,
        availableProducts, allProducts, orders, products, comboIngredientsMap
    ])

    const dispatchValue: EventDispatchContextType = useMemo(() => ({
        setEvents,
        setError,
        loadEvents,
        saveEvent,
        deleteEvent,

        setSearchTerm,
        setDateFilter,
        setShowSummary,
        setSelectedEventIds,
        handleSelectEvent,

        setViewMode,
        setFilters,
        regenerateAllCosts,

        setSelectedOrderIds,
        setNewEventName,
        setNewEventGuests,
        setNewEventDate,

        repairEvent,
        handleLoadOrdersAsEvents,
        toggleOrderSelection,
        handleAddEvent,
        handleRemoveEvent,
        toggleEventExpanded,
        toggleEventCosts,
        toggleEventNotes,
        handleAddIngredient,
        handleRemoveIngredient,
        handleUpdateQuantity,
        handleUpdateGuestCount,
        handleUpdateNotes,
        duplicateEvent,

        setShowAddEventModal,
        setShowSelectOrderModal,
        setShowNotesModal,
        setShowHistoryModal,
        setShowMaterialSelectorModal,

        loadEventHistory,
        restoreVersion,
        handleOpenMaterialSelector,
        handleMaterialSelectionChange: handleToggleMaterialSelection,
        handleAddMaterialsToEvent: handleAddSelectedMaterials,
        handleNotesChange,
        handleObservationsChange,
        handleSaveNotes
    }), [
        setEvents, setError, loadEvents, saveEvent, deleteEvent,
        setSearchTerm, setDateFilter, setShowSummary, setSelectedEventIds, // Setters are stable
        setViewMode, setFilters, regenerateAllCosts,
        setSelectedOrderIds, setNewEventName, setNewEventGuests, setNewEventDate,
        repairEvent, handleLoadOrdersAsEvents, toggleOrderSelection,
        handleAddEvent, handleRemoveEvent, toggleEventExpanded, toggleEventCosts, toggleEventNotes,
        handleAddIngredient, handleRemoveIngredient, handleUpdateQuantity, handleUpdateGuestCount,
        handleUpdateNotes, duplicateEvent,
        setShowAddEventModal, setShowSelectOrderModal, setShowNotesModal,
        setShowHistoryModal, setShowMaterialSelectorModal,
        loadEventHistory, restoreVersion, handleOpenMaterialSelector,
        handleToggleMaterialSelection, handleAddSelectedMaterials,
        handleNotesChange, handleObservationsChange, handleSaveNotes
    ])

    return (
        <EventDispatchContext.Provider value={dispatchValue}>
            <EventStateContext.Provider value={stateValue}>
                {children}
                <ConfirmationDialog />
            </EventStateContext.Provider>
        </EventDispatchContext.Provider>
    )
}
