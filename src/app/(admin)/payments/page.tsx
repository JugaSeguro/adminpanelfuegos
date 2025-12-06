'use client'

import PaymentTracker from '@/components/PaymentTracker/PaymentTracker'
import { useOrders } from '@/hooks/useOrders'

export default function PaymentsPage() {
    const { orders, handleUpdatePayment } = useOrders()

    return (
        <PaymentTracker orders={orders} onUpdatePayment={handleUpdatePayment} />
    )
}
