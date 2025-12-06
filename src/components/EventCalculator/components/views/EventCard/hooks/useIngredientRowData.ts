import { useMemo } from 'react'
import { useIngredientDisplay } from './useIngredientDisplay'
import { isUsingDefaultPortion, calculateTotalQuantity } from '../utils/ingredientHelpers'
import type { EventIngredient } from '../../../../types'

/**
 * Hook que prepara todos los datos calculados para una fila de ingrediente.
 * Centraliza cálculos que antes estaban dispersos en el JSX.
 * 
 * @param ingredient - El ingrediente del evento
 * @param guestCount - Número de invitados del evento
 * @returns Objeto con datos pre-calculados para renderizar la fila
 */
export function useIngredientRowData(
    ingredient: EventIngredient,
    guestCount: number
) {
    // Display de cantidad por persona
    const display = useIngredientDisplay(
        ingredient.product,
        ingredient.quantityPerPerson
    )

    // Verifica si está usando la porción predeterminada
    const isUsingDefault = useMemo(
        () => isUsingDefaultPortion(ingredient),
        [ingredient]
    )

    // Calcula la cantidad total (fija o multiplicada por invitados)
    const totalQuantity = useMemo(
        () => calculateTotalQuantity(ingredient, guestCount),
        [ingredient.isFixedQuantity, ingredient.quantityPerPerson, guestCount]
    )

    return {
        display,
        isUsingDefault,
        totalQuantity
    }
}
