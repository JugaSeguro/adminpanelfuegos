import { useState } from 'react'
import { Event, EventIngredient, EventCalculationVersion } from '../types'
import { Product } from '@/types'
import { supabase } from '@/lib/supabaseClient'

interface UseEventModalsProps {
    events: Event[]
    setEvents: (events: Event[]) => void
    products: Product[]
    availableProducts: Product[]
    saveEvent: (event: Event, changeType?: 'created' | 'updated' | 'duplicated' | 'restored') => Promise<string | undefined>
}

interface EventVersionsMap {
    [eventId: string]: EventCalculationVersion[]
}

interface EventNotesMap {
    [eventId: string]: any[]
}

export const useEventModals = ({
    events,
    setEvents,
    products,
    availableProducts,
    saveEvent
}: UseEventModalsProps) => {

    const [showAddEventModal, setShowAddEventModal] = useState(false)
    const [showSelectOrderModal, setShowSelectOrderModal] = useState(false)
    const [showNotesModal, setShowNotesModal] = useState<string | null>(null)
    const [showHistoryModal, setShowHistoryModal] = useState<string | null>(null)
    const [showMaterialSelectorModal, setShowMaterialSelectorModal] = useState(false)
    const [currentEventIdForSelector, setCurrentEventIdForSelector] = useState<string | null>(null)
    const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([])

    const [eventVersions, setEventVersions] = useState<EventVersionsMap>({})
    const [eventNotes, setEventNotes] = useState<EventNotesMap>({})

    // Cargar historial de versiones
    const loadEventHistory = async (eventId: string) => {
        const event = events.find(e => e.id === eventId)
        if (!event?.dbId) return

        try {
            const { data, error } = await supabase
                .from('event_calculation_versions')
                .select('*')
                .eq('event_calculation_id', event.dbId)
                .order('created_at', { ascending: false })

            if (error) throw error
            setEventVersions(prev => ({ ...prev, [eventId]: data || [] }))
        } catch (err) {
            console.error('Error loading history:', err)
        }
    }

    // Restaurar versión
    const restoreVersion = async (eventId: string, version: EventCalculationVersion) => {
        if (!confirm('¿Restaurar esta versión? Se creará una nueva versión del evento.')) return

        const event = events.find(e => e.id === eventId)
        if (!event) return

        const versionData = version.version_data
        const restoredIngredients: EventIngredient[] = []

        for (const ingData of versionData.ingredients || []) {
            const product = products.find(p => p.id === ingData.productId)
            if (product) {
                restoredIngredients.push({
                    id: `${Date.now()}-${ingData.productId}`,
                    product,
                    quantityPerPerson: ingData.quantityPerPerson,
                    notes: ingData.notes
                })
            }
        }

        const restoredEvent: Event = {
            ...event,
            name: versionData.name,
            eventDate: versionData.eventDate,
            guestCount: versionData.guestCount,
            ingredients: restoredIngredients,
            notes: versionData.notes || '',
            observations: versionData.observations || '',
            isSaved: false
        }

        setEvents(events.map(e => e.id === eventId ? restoredEvent : e))
        await saveEvent(restoredEvent, 'restored')
        setShowHistoryModal(null)
    }

    // Material Selector Modal
    const handleOpenMaterialSelector = (eventId: string) => {
        setCurrentEventIdForSelector(eventId)
        setSelectedMaterialIds([])
        setShowMaterialSelectorModal(true)
    }

    const handleToggleMaterialSelection = (productId: string) => {
        setSelectedMaterialIds(prev =>
            prev.includes(productId)
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        )
    }

    const handleAddSelectedMaterials = async () => {
        if (!currentEventIdForSelector) return

        const event = events.find(e => e.id === currentEventIdForSelector)
        if (!event) return

        const materialsToAdd = availableProducts.filter(p => selectedMaterialIds.includes(p.id))
        if (materialsToAdd.length === 0) {
            setShowMaterialSelectorModal(false)
            return
        }

        const newMaterials = materialsToAdd.filter(p => !event.ingredients.some(ing => ing.product.id === p.id))

        if (newMaterials.length === 0) {
            setShowMaterialSelectorModal(false)
            return
        }

        const newIngredients: EventIngredient[] = newMaterials.map((product, index) => {
            const quantityPerPerson = 1

            return {
                id: `${Date.now()}-material-${index}-${product.id}`,
                product,
                quantityPerPerson,
                notes: product.clarifications || undefined,
                isFixedQuantity: true
            }
        })

        const updatedEvent = {
            ...event,
            ingredients: [...event.ingredients, ...newIngredients],
            isSaved: false
        }

        setEvents(events.map(e => e.id === currentEventIdForSelector ? updatedEvent : e))
        await saveEvent(updatedEvent)

        setShowMaterialSelectorModal(false)
        setSelectedMaterialIds([])
        setCurrentEventIdForSelector(null)
    }

    // Notes Modal Handlers
    const handleNotesChange = (eventId: string, notes: string) => {
        const event = events.find(e => e.id === eventId)
        if (event) {
            const updated = { ...event, notes, isSaved: false }
            setEvents(events.map(e => e.id === eventId ? updated : e))
        }
    }

    const handleObservationsChange = (eventId: string, observations: string) => {
        const event = events.find(e => e.id === eventId)
        if (event) {
            const updated = { ...event, observations, isSaved: false }
            setEvents(events.map(e => e.id === eventId ? updated : e))
        }
    }

    const handleSaveNotes = async (eventId: string) => {
        const event = events.find(e => e.id === eventId)
        if (event) {
            await saveEvent(event)
            setShowNotesModal(null)
        }
    }

    return {
        // Modal visibility states
        showAddEventModal,
        setShowAddEventModal,
        showSelectOrderModal,
        setShowSelectOrderModal,
        showNotesModal,
        setShowNotesModal,
        showHistoryModal,
        setShowHistoryModal,
        showMaterialSelectorModal,
        setShowMaterialSelectorModal,

        // Material selector state
        currentEventIdForSelector,
        selectedMaterialIds,
        handleOpenMaterialSelector,
        handleToggleMaterialSelection,
        handleAddSelectedMaterials,

        // History state and handlers
        eventVersions,
        setEventVersions,
        loadEventHistory,
        restoreVersion,

        // Notes state and handlers
        eventNotes,
        setEventNotes,
        handleNotesChange,
        handleObservationsChange,
        handleSaveNotes
    }
}
