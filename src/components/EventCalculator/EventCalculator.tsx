'use client'

import { Product, CateringOrder } from '@/types'
import { EventCalculatorProvider } from './context/EventCalculatorProvider'
import { EventCalculatorContent } from './EventCalculatorContent'

interface EventCalculatorProps {
  products: Product[]
  orders: CateringOrder[]
}

export default function EventCalculator({ products, orders }: EventCalculatorProps) {
  return (
    <EventCalculatorProvider products={products} orders={orders}>
      <EventCalculatorContent />
    </EventCalculatorProvider>
  )
}
