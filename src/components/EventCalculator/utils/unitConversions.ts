import { Product } from '@/types'

/**
 * Convierte portion_per_person a número
 * Maneja formatos como: "1/4", "1/2", "30 gr", "83,3 gr", "1 feta", "1", etc.
 */
export function parsePortionPerPerson(portionStr: string | null | undefined): number {
    if (!portionStr) return 1 // Valor por defecto

    // Reemplazar comas por puntos para manejar formato europeo
    const normalized = portionStr.trim().replace(/,/g, '.')
    const trimmed = normalized.toLowerCase()

    // Manejar fracciones (1/4, 1/2, etc.)
    if (trimmed.includes('/')) {
        const [numerator, denominator] = trimmed.split('/').map(s => parseFloat(s.trim().replace(/,/g, '.')))
        if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
            return numerator / denominator
        }
    }

    // Manejar números con unidades (30 gr, 50 gr, 83,3 gr, etc.)
    // Acepta tanto punto como coma como separador decimal
    const numberMatch = trimmed.match(/^([\d.,]+)/)
    if (numberMatch) {
        // Reemplazar coma por punto para parseFloat
        const numberStr = numberMatch[1].replace(/,/g, '.')
        const number = parseFloat(numberStr)
        if (!isNaN(number)) {
            // Si tiene "gr" o "g", convertir a kg (30 gr = 0.03 kg, 83,3 gr = 0.0833 kg)
            if (trimmed.includes('gr') || trimmed.includes('g')) {
                return number / 1000 // 30 gr = 0.03 kg, 83,3 gr = 0.0833 kg
            }
            // Si es solo un número, usarlo directamente
            return number
        }
    }

    // Si tiene "feta", "bolsa", "unidad", etc., asumir 1
    if (trimmed.includes('feta') || trimmed.includes('bolsa') || trimmed.includes('unidad') || trimmed.includes('paquete')) {
        return 1
    }

    // Valor por defecto
    return 1
}

/**
 * Determina la unidad correcta a mostrar
 */
export function getDisplayUnit(product: Product, quantity: number): string {
    // Si el unit_type es "unidad", siempre mostrar "unidad"
    if (product.unit_type === 'unidad') {
        return 'unidad'
    }

    // Si portion_per_person contiene "gr" o "g", mostrar en gr (independientemente del unit_type)
    if (product.portion_per_person) {
        const portionLower = product.portion_per_person.toLowerCase().replace(/,/g, '.')
        if (portionLower.includes('gr') || portionLower.includes('g')) {
            return 'gr'
        }
    }

    // Si el unit_type es "porcion" y no tiene "gr" en portion_per_person
    if (product.unit_type === 'porcion') {
        // Si portion_per_person es una fracción o número simple, mostrar "unidad"
        return 'unidad'
    }

    // Si el unit_type es "kg", verificar si debe mostrarse en gr
    if (product.unit_type === 'kg') {
        // Si la cantidad es menor a 1 kg, mostrar en gr
        if (quantity < 1) {
            return 'gr'
        }
        return 'kg'
    }

    // Por defecto, usar el unit_type del producto
    return product.unit_type
}

/**
 * Convierte cantidad a la unidad de visualización
 */
export function convertToDisplayUnit(product: Product, quantity: number): { value: number, unit: string } {
    const displayUnit = getDisplayUnit(product, quantity)

    // Si la unidad de visualización es "gr", convertir de kg a gr
    if (displayUnit === 'gr') {
        return { value: quantity * 1000, unit: 'gr' }
    }

    // Si la unidad de visualización es "kg", usar el valor tal cual
    if (displayUnit === 'kg') {
        return { value: quantity, unit: 'kg' }
    }

    // Para otras unidades (unidad, porcion), usar el valor tal cual
    return { value: quantity, unit: displayUnit }
}

/**
 * Conversión específica para el resumen general (totales)
 * Prioriza mostrar en kg cuando la cantidad es >= 1 kg
 */
export function convertToDisplayUnitForSummary(product: Product, quantity: number): { value: number, unit: string } {
    // Si el producto usa kg como unidad base
    if (product.unit_type === 'kg') {
        // Siempre mostrar en kg para el resumen total
        return { value: quantity, unit: 'kg' }
    }

    // Para productos con unit_type 'unidad', siempre mostrar en unidad
    if (product.unit_type === 'unidad') {
        return { value: quantity, unit: 'unidad' }
    }

    // Para productos con unit_type 'porcion'
    if (product.unit_type === 'porcion') {
        // Si tiene portion_per_person con "gr", mostrar en kg para el resumen
        if (product.portion_per_person) {
            const portionLower = product.portion_per_person.toLowerCase().replace(/,/g, '.')
            if (portionLower.includes('gr') || portionLower.includes('g')) {
                return { value: quantity, unit: 'kg' }
            }
        }
        // De lo contrario, mostrar en unidad
        return { value: quantity, unit: 'unidad' }
    }

    // Por defecto, usar el unit_type del producto
    return { value: quantity, unit: product.unit_type }
}

/**
 * Obtiene el valor a mostrar en el input según la unidad de visualización
 */
export function getInputValue(product: Product, quantityInKg: number): number {
    const displayUnit = getDisplayUnit(product, quantityInKg)

    // Si la unidad de visualización es "gr", convertir de kg a gr
    if (displayUnit === 'gr') {
        return quantityInKg * 1000
    }

    // Para otros casos (kg, unidad, porcion sin gr), usar el valor tal cual
    return quantityInKg
}

/**
 * Convierte el valor del input de vuelta a kg para guardar
 */
export function parseInputValue(product: Product, inputValue: number, displayUnit: string): number {
    // Si el input está en gr, convertir a kg
    if (displayUnit === 'gr') {
        return inputValue / 1000
    }

    // Para otros casos (kg, unidad, porcion), usar el valor tal cual
    return inputValue
}
