import { useState } from 'react'
import { Event, EventIngredient } from '../types'
import { Product, CateringOrder } from '@/types'
import { supabase } from '@/lib/supabaseClient'
import { createEventFromOrder } from '../utils/eventBuilder'
import { parsePortionPerPerson } from '../utils/unitConversions'

interface UseEventHandlersProps {
    events: Event[]
    setEvents: (events: Event[]) => void
    orders: CateringOrder[]
    products: Product[]
    availableProducts: Product[]
    allProducts: Product[]
    saveEvent: (event: Event, changeType?: 'created' | 'updated' | 'duplicated' | 'restored') => Promise<string | undefined>
    deleteEvent: (eventId: string) => Promise<void>
    setError: (error: string | null) => void
    setSuccessMessage: (message: string | null) => void
    setShowAddEventModal: (show: boolean) => void
    setShowSelectOrderModal: (show: boolean) => void
    setShowNotesModal: (id: string | null) => void
    setShowHistoryModal: (id: string | null) => void
    setShowMaterialSelectorModal: (show: boolean) => void
    confirm: (options: { title: string; message: string; variant?: 'danger' | 'warning' | 'info' | 'success' }) => Promise<boolean>
    alert: (options: { title: string; message: string; variant?: 'danger' | 'warning' | 'info' | 'success' }) => Promise<void>
}

export const useEventHandlers = ({
    events,
    setEvents,
    orders,
    products,
    availableProducts,
    allProducts,
    saveEvent,
    deleteEvent,
    setError,
    setSuccessMessage,
    setShowAddEventModal,
    setShowSelectOrderModal,
    setShowNotesModal,
    setShowHistoryModal,
    setShowMaterialSelectorModal,
    confirm,
    alert
}: UseEventHandlersProps) => {

    const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([])
    const [newEventName, setNewEventName] = useState('')
    const [newEventGuests, setNewEventGuests] = useState(0)
    const [newEventDate, setNewEventDate] = useState('')

    // Reparar evento existente agregando ingredientes faltantes desde el pedido original
    const repairEvent = async (eventId: string) => {
        const event = events.find(e => e.id === eventId)
        if (!event || !event.orderId) {
            await alert({ title: 'Error', message: 'Este evento no tiene un pedido asociado para reparar', variant: 'warning' })
            return
        }

        const originalOrder = orders.find(o => o.id === event.orderId)
        if (!originalOrder) {
            await alert({ title: 'Error', message: 'No se encontró el pedido original', variant: 'warning' })
            return
        }

        const confirmed = await confirm({
            title: 'Reparar Evento',
            message: `¿Reparar evento "${event.name}"?\n\nEsto agregará los ingredientes faltantes desde el pedido original.`,
            variant: 'info'
        })

        if (!confirmed) return

        try {
            const repairedEvent = createEventFromOrder(originalOrder, allProducts)

            if (repairedEvent.notes && repairedEvent.notes.includes('Items no encontrados')) {
                await alert({ title: 'Advertencia', message: `Advertencia durante la reparación: ${repairedEvent.notes}`, variant: 'warning' })
            }

            const updatedEvent: Event = {
                ...event,
                ingredients: repairedEvent.ingredients,
                notes: repairedEvent.notes,
                isSaved: false
            }

            setEvents(events.map(e => e.id === eventId ? updatedEvent : e))
            await saveEvent(updatedEvent, 'updated')

            setSuccessMessage(`✅ Evento reparado. Se agregaron ${repairedEvent.ingredients.length - event.ingredients.length} ingredientes faltantes.`)
            setTimeout(() => setSuccessMessage(null), 5000)
        } catch (err) {
            console.error('Error reparando evento:', err)
            setError('Error al reparar el evento. Por favor, intenta nuevamente.')
            setTimeout(() => setError(null), 5000)
        }
    }

    // Cargar eventos desde pedidos seleccionados
    const handleLoadOrdersAsEvents = async (availableOrders: CateringOrder[]) => {
        const ordersToLoad = availableOrders.filter(order =>
            selectedOrderIds.includes(order.id)
        )

        console.log('📦 Pedidos seleccionados para cargar:', ordersToLoad.length)
        console.log('📋 Productos disponibles en BD:', products.map(p => p.name).join(', '))

        const orderIdsToCheck = ordersToLoad.map(o => o.id)
        const { data: existingCalculations } = await supabase
            .from('event_calculations')
            .select('order_id')
            .in('order_id', orderIdsToCheck)
            .eq('is_active', true)

        const activeOrderIds = new Set(
            (existingCalculations || [])
                .map(c => c.order_id)
                .filter(Boolean) as string[]
        )

        const ordersToCreate = ordersToLoad.filter(order => !activeOrderIds.has(order.id))

        if (ordersToCreate.length === 0) {
            await alert({
                title: 'Información',
                message: 'Los pedidos seleccionados ya tienen eventos activos. Elimina el evento existente primero si quieres recrearlo.',
                variant: 'info'
            })
            return
        }

        if (ordersToCreate.length < ordersToLoad.length) {
            const skipped = ordersToLoad.length - ordersToCreate.length
            await alert({
                title: 'Información',
                message: `${skipped} pedido(s) ya tienen eventos activos y fueron omitidos.`,
                variant: 'info'
            })
        }

        const newEvents = ordersToCreate.map(order => {
            console.log('\n🔄 Procesando pedido:', {
                id: order.id,
                name: order.contact.name,
                entrees: Array.isArray(order.entrees) ? order.entrees : [],
                viandes: Array.isArray(order.viandes) ? order.viandes : [],
                dessert: order.dessert
            })
            return createEventFromOrder(order, allProducts)
        })

        console.log(`✅ ${newEvents.length} eventos nuevos creados de ${ordersToCreate.length} pedidos procesados`)

        setEvents([...events, ...newEvents])
        setSelectedOrderIds([])
        setShowSelectOrderModal(false)

        for (const event of newEvents) {
            await saveEvent(event, 'created')
        }
    }

    const toggleOrderSelection = (orderId: string) => {
        setSelectedOrderIds(prev => {
            if (prev.includes(orderId)) {
                return prev.filter(id => id !== orderId)
            } else {
                return [...prev, orderId]
            }
        })
    }

    const handleAddEvent = async () => {
        if (!newEventName.trim() || newEventGuests <= 0) return

        const newEvent: Event = {
            id: `temp-${Date.now()}`,
            name: newEventName.trim(),
            eventDate: newEventDate || null,
            guestCount: newEventGuests,
            orderId: null,
            ingredients: [],
            expanded: true,
            showCosts: false,
            showNotes: false,
            notes: '',
            observations: '',
            versionNumber: 1,
            isSaved: false
        }

        setEvents([...events, newEvent])
        setNewEventName('')
        setNewEventGuests(0)
        setNewEventDate('')
        setShowAddEventModal(false)

        await saveEvent(newEvent, 'created')
    }

    const handleRemoveEvent = async (eventId: string) => {
        const confirmed = await confirm({
            title: 'Eliminar Evento',
            message: '¿Estás seguro de eliminar este evento? Esta acción no se puede deshacer.',
            variant: 'danger'
        })

        if (!confirmed) return
        await deleteEvent(eventId)
    }

    const toggleEventExpanded = (eventId: string) => {
        setEvents(events.map(e =>
            e.id === eventId ? { ...e, expanded: !e.expanded } : e
        ))
    }

    const toggleEventCosts = (eventId: string) => {
        setEvents(events.map(e =>
            e.id === eventId ? { ...e, showCosts: !e.showCosts } : e
        ))
    }

    const toggleEventNotes = (eventId: string) => {
        setEvents(events.map(e =>
            e.id === eventId ? { ...e, showNotes: !e.showNotes } : e
        ))
    }

    const handleAddIngredient = async (eventId: string, productId: string) => {
        const product = availableProducts.find(p => p.id === productId)
        if (!product) return

        const event = events.find(e => e.id === eventId)
        if (!event) return

        if (event.ingredients.some(ing => ing.product.id === productId)) {
            return
        }

        const isMaterial = product.category === 'material'

        const quantityPerPerson = isMaterial
            ? 1
            : (product.portion_per_person
                ? parsePortionPerPerson(product.portion_per_person)
                : 1)

        const newIngredient: EventIngredient = {
            id: `${Date.now()}`,
            product,
            quantityPerPerson,
            notes: product.clarifications || undefined,
            isFixedQuantity: isMaterial
        }

        const updatedEvent = {
            ...event,
            ingredients: [...event.ingredients, newIngredient],
            isSaved: false
        }

        setEvents(events.map(e => e.id === eventId ? updatedEvent : e))
        await saveEvent(updatedEvent)
    }

    const handleRemoveIngredient = async (eventId: string, ingredientId: string) => {
        const event = events.find(e => e.id === eventId)
        if (!event) return

        const updatedEvent = {
            ...event,
            ingredients: event.ingredients.filter(ing => ing.id !== ingredientId),
            isSaved: false
        }

        setEvents(events.map(e => e.id === eventId ? updatedEvent : e))
        await saveEvent(updatedEvent)
    }

    const handleUpdateQuantity = async (eventId: string, ingredientId: string, quantity: number) => {
        if (quantity < 0) return

        const event = events.find(e => e.id === eventId)
        if (!event) return

        const updatedEvent = {
            ...event,
            ingredients: event.ingredients.map(ing =>
                ing.id === ingredientId ? { ...ing, quantityPerPerson: quantity } : ing
            ),
            isSaved: false
        }

        setEvents(events.map(e => e.id === eventId ? updatedEvent : e))

        setTimeout(() => saveEvent(updatedEvent), 1000)
    }

    const handleUpdateGuestCount = async (eventId: string, count: number) => {
        if (count < 0) return

        const event = events.find(e => e.id === eventId)
        if (!event) return

        const updatedEvent = {
            ...event,
            guestCount: count,
            isSaved: false
        }

        setEvents(events.map(e => e.id === eventId ? updatedEvent : e))
        await saveEvent(updatedEvent)
    }

    const handleUpdateNotes = async (eventId: string, notes: string, observations: string) => {
        const event = events.find(e => e.id === eventId)
        if (!event) return

        const updatedEvent = {
            ...event,
            notes,
            observations,
            isSaved: false
        }

        setEvents(events.map(e => e.id === eventId ? updatedEvent : e))
        await saveEvent(updatedEvent)
    }

    const duplicateEvent = async (eventId: string) => {
        const event = events.find(e => e.id === eventId)
        if (!event) return

        const duplicated: Event = {
            ...event,
            id: `temp-${Date.now()}`,
            name: `${event.name} (Copia)`,
            dbId: undefined,
            expanded: true,
            isSaved: false,
            versionNumber: 1
        }

        setEvents([...events, duplicated])
        await saveEvent(duplicated, 'duplicated')
    }

    return {
        // State
        selectedOrderIds,
        setSelectedOrderIds,
        newEventName,
        setNewEventName,
        newEventGuests,
        setNewEventGuests,
        newEventDate,
        setNewEventDate,

        // Handlers
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
        duplicateEvent
    }
}
