import { useMemo } from 'react'
import { Product } from '@/types'
import { Event, IngredientTotal, GlobalStats } from '../types'
import { calculateEventCost } from '../utils/calculations'

export const useEventCalculations = (
    events: Event[],
    filteredEvents: Event[],
    products: Product[],
    comboIngredientsMap: { [key: string]: any[] }
) => {

    // Calcular totales por ingrediente sumando todos los eventos (agrupado por categoría)
    const grandTotals = useMemo(() => {
        const totals: { [key: string]: { product: Product; total: number } } = {}

        events.forEach(event => {
            event.ingredients.forEach(ing => {
                const totalForEvent = ing.isFixedQuantity
                    ? ing.quantityPerPerson
                    : ing.quantityPerPerson * event.guestCount

                // Si es combo, desglosar ingredientes
                if (ing.product.is_combo) {
                    const subIngs = comboIngredientsMap[ing.product.id]
                    if (subIngs && subIngs.length > 0) {
                        subIngs.forEach(sub => {
                            const subProduct = products.find(p => p.id === sub.ingredient_id)
                            if (subProduct) {
                                const subTotal = totalForEvent * sub.quantity
                                if (totals[subProduct.id]) {
                                    totals[subProduct.id].total += subTotal
                                } else {
                                    totals[subProduct.id] = {
                                        product: subProduct,
                                        total: subTotal
                                    }
                                }
                            }
                        })
                        return // No agregar el producto combo en sí mismo
                    }
                }

                if (totals[ing.product.id]) {
                    totals[ing.product.id].total += totalForEvent
                } else {
                    totals[ing.product.id] = {
                        product: ing.product,
                        total: totalForEvent
                    }
                }
            })
        })

        return Object.values(totals)
    }, [events, products, comboIngredientsMap])

    // Agrupar por categoría
    const totalsByCategory = useMemo(() => {
        const byCategory: { [key: string]: IngredientTotal[] } = {}

        grandTotals.forEach(item => {
            const category = item.product.category
            if (!byCategory[category]) {
                byCategory[category] = []
            }
            byCategory[category].push(item)
        })

        return byCategory
    }, [grandTotals])

    // Calcular estadísticas globales (basado en eventos filtrados)
    const globalStats = useMemo<GlobalStats>(() => {
        const totalEvents = filteredEvents.length
        const totalGuests = filteredEvents.reduce((sum, e) => sum + e.guestCount, 0)
        const totalCost = filteredEvents.reduce((sum, e) => {
            const costs = calculateEventCost(e)
            return sum + costs.totalCost
        }, 0)
        const avgCostPerGuest = totalGuests > 0 ? totalCost / totalGuests : 0
        const avgCostPerEvent = totalEvents > 0 ? totalCost / totalEvents : 0

        return {
            totalEvents,
            totalGuests,
            totalCost,
            avgCostPerGuest,
            avgCostPerEvent
        }
    }, [filteredEvents])

    return {
        grandTotals,
        totalsByCategory,
        globalStats
    }
}
