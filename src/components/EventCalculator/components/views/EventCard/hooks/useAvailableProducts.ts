import { useMemo } from 'react'
import type { Product } from '@/types'

/**
 * Hook que filtra productos disponibles de forma optimizada.
 * Memoiza el resultado para evitar recálculos en cada render.
 * 
 * @param allProducts - Lista completa de productos
 * @param usedProductIds - IDs de productos ya utilizados
 * @returns Lista de productos filtrados (no utilizados)
 */
export function useAvailableProducts(
    allProducts: Product[],
    usedProductIds: string[]
) {
    // Crear string estable para la dependencia
    const usedIdsKey = usedProductIds.join(',')

    return useMemo(
        () => allProducts.filter(p => !usedProductIds.includes(p.id)),
        [allProducts, usedIdsKey]
    )
}
