import { useMemo } from 'react'
import { calculateEventCost } from '../../../../utils/calculations'
import type { Event } from '../../../../types'

/**
 * Hook que memoiza el cálculo de costos de un evento.
 * Solo recalcula cuando cambian los ingredientes o el número de invitados.
 * 
 * @param event - El evento del cual calcular los costos
 * @returns Objeto con costos totales, por invitado, por ingrediente y por categoría
 */
export function useEventCosts(event: Event) {
    return useMemo(
        () => calculateEventCost(event),
        [event.ingredients, event.guestCount]
    )
}
