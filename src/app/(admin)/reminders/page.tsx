'use client'

import EventReminders from '@/components/EventReminders/EventReminders'
import { useOrders } from '@/hooks/useOrders'

export default function RemindersPage() {
    const { orders } = useOrders()

    return (
        <EventReminders orders={orders} />
    )
}
