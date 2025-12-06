import { parsePortionPerPerson } from '../../../../utils/unitConversions'
import type { EventIngredient } from '../../../../types'

/**
 * Verifica si el ingrediente está usando la porción predeterminada del producto.
 * 
 * @param ingredient - El ingrediente a verificar
 * @returns true si NO está usando la porción predeterminada
 */
export function isUsingDefaultPortion(ingredient: EventIngredient): boolean {
    const portionFromProduct = ingredient.product.portion_per_person
    if (!portionFromProduct) return false

    const defaultQty = parsePortionPerPerson(portionFromProduct)
    return defaultQty !== ingredient.quantityPerPerson
}

/**
 * Calcula la cantidad total basada en si es cantidad fija o por persona.
 * 
 * @param ingredient - El ingrediente del evento
 * @param guestCount - Número de invitados
 * @returns Cantidad total en kg
 */
export function calculateTotalQuantity(
    ingredient: EventIngredient,
    guestCount: number
): number {
    return ingredient.isFixedQuantity
        ? ingredient.quantityPerPerson
        : ingredient.quantityPerPerson * guestCount
}

/**
 * Formatea un valor monetario.
 * 
 * @param amount - Cantidad a formatear
 * @returns String formateado con símbolo de euro
 */
export function formatCurrency(amount: number): string {
    return `€${amount.toFixed(2)}`
}

/**
 * Formatea una fecha al formato local.
 * 
 * @param dateString - String de fecha ISO
 * @returns Fecha formateada en formato local
 */
export function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString()
}
