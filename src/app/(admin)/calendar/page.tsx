'use client'

import { useState } from 'react'
import EventsCalendar from '@/components/EventsCalendar/EventsCalendar'
import { useOrders } from '@/hooks/useOrders'
import { CalendarEvent } from '@/types'
import { useProducts } from '@/hooks/useProducts' // Not used here directly but consistent with page.tsx hook usage
// We might need to fetch products if AddEventModal uses it, but EventsCalendar props are just orders and manualEvents

export default function CalendarPage() {
    const { orders, handleStatusChange } = useOrders()
    const [manualEvents, setManualEvents] = useState<CalendarEvent[]>([])

    // Manejar adición de eventos manuales
    const handleAddEvent = (event: CalendarEvent) => {
        setManualEvents(prevEvents => [...prevEvents, event])
    }

    // Eliminar evento del calendario
    const handleDeleteEvent = async (eventId: string) => {
        if (eventId.startsWith('manual-')) {
            setManualEvents(prev => prev.filter(e => e.id !== eventId))
        } else if (eventId.startsWith('event-')) {
            const orderId = eventId.replace('event-', '')
            if (confirm('Este evento está vinculado a un pedido. ¿Deseas cancelar el pedido?')) {
                await handleStatusChange(orderId, 'rejected')
            }
        }
    }

    return (
        <EventsCalendar
            orders={orders}
            manualEvents={manualEvents}
            onAddEvent={handleAddEvent}
            onDeleteEvent={handleDeleteEvent}
        />
    )
}
