'use client'

import EventCalculator from '@/components/EventCalculator/EventCalculator'
import { useOrders } from '@/hooks/useOrders'
import { useProducts } from '@/hooks/useProducts'

export default function CalculatorPage() {
    const { orders } = useOrders()
    const { products, loading: productsLoading } = useProducts()

    return (
        <EventCalculator
            products={products}
            orders={orders}
            isLoading={productsLoading}
        />
    )
}
