'use client'

import { Product, CateringOrder } from '@/types'
import { EventCalculatorProvider } from './context/EventCalculatorProvider'
import { EventCalculatorContent } from './EventCalculatorContent'

import { Loader } from '@/components/ui/Loader'

interface EventCalculatorProps {
  products: Product[]
  orders: CateringOrder[]
  isLoading?: boolean
}

export default function EventCalculator({ products, orders, isLoading }: EventCalculatorProps) {
  if (isLoading) {
    return <Loader />
  }

  return (
    <EventCalculatorProvider products={products} orders={orders}>
      <EventCalculatorContent />
    </EventCalculatorProvider>
  )
}
