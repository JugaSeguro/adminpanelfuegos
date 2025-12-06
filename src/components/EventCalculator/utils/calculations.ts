import { Product } from '@/types'
import { Event, EventIngredient } from '../types'

export interface EventCost {
    totalCost: number
    avgCostPerGuest: number
    ingredientCosts: Array<{
        product: Product
        quantity: number
        cost: number
    }>
    costByCategory: { [category: string]: number }
}

/**
 * Calcula los costos totales de un evento
 */
export function calculateEventCost(event: Event): EventCost {
    let totalCost = 0
    const ingredientCosts: Array<{ product: Product, quantity: number, cost: number }> = []

    event.ingredients.forEach(ing => {
        const totalQuantity = ing.isFixedQuantity
            ? ing.quantityPerPerson
            : ing.quantityPerPerson * event.guestCount

        const cost = ing.product.price_per_portion * totalQuantity

        totalCost += cost
        ingredientCosts.push({
            product: ing.product,
            quantity: totalQuantity,
            cost
        })
    })

    const avgCostPerGuest = event.guestCount > 0 ? totalCost / event.guestCount : 0

    // Agrupar costos por categoría
    const costByCategory: { [category: string]: number } = {}

    ingredientCosts.forEach(item => {
        const category = item.product.category || 'Sin categoría'
        costByCategory[category] = (costByCategory[category] || 0) + item.cost
    })

    return {
        totalCost,
        avgCostPerGuest,
        ingredientCosts,
        costByCategory
    }
}
