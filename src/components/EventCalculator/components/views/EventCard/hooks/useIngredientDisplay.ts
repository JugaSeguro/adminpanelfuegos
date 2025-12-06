import { useMemo } from 'react'
import {
    getDisplayUnit,
    convertToDisplayUnit,
    getInputValue,
    parseInputValue
} from '../../../../utils/unitConversions'
import type { Product } from '@/types'

/**
 * Hook que encapsula toda la lógica de conversión y formateo de unidades.
 * Elimina las IIFEs del JSX y centraliza la lógica de display.
 * 
 * @param product - El producto del ingrediente
 * @param quantityInKg - Cantidad en kilogramos (unidad base)
 * @returns Objeto con valores formateados y helpers de conversión
 */
export function useIngredientDisplay(product: Product, quantityInKg: number) {
    return useMemo(() => {
        const displayUnit = getDisplayUnit(product, quantityInKg)
        const displayValue = convertToDisplayUnit(product, quantityInKg)
        const inputValue = getInputValue(product, quantityInKg)

        return {
            displayUnit,
            displayValue,
            inputValue,

            /**
             * Helper para parsear el input del usuario de vuelta a kg
             */
            parseInput: (newInputValue: number) =>
                parseInputValue(product, newInputValue, displayUnit),

            /**
             * Helper para formatear un valor para display
             */
            format: (value: number) => `${value.toFixed(2)} ${displayUnit}`
        }
    }, [product.id, product.unit_type, product.portion_per_person, quantityInKg])
}
