'use client'

import FinancialReports from '@/components/FinancialReports/FinancialReports'
import { useOrders } from '@/hooks/useOrders'

export default function ReportsPage() {
    const { orders } = useOrders()

    return (
        <FinancialReports orders={orders} />
    )
}
