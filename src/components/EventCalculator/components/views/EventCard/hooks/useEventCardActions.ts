import { useCallback } from 'react'
import { useEventCalculator } from '../../../../context/EventCalculatorContext'

/**
 * Hook que abstrae las acciones del context y pre-aplica el eventId.
 * Reduce el acoplamiento con el context y facilita el testing.
 * Todos los callbacks están memoizados para prevenir re-renders.
 * 
 * @param eventId - ID del evento
 * @returns Objeto con handlers memoizados con eventId pre-aplicado
 */
export function useEventCardActions(eventId: string) {
    const {
        handleSelectEvent,
        toggleEventExpanded,
        toggleEventCosts,
        toggleEventNotes,
        handleUpdateGuestCount,
        handleRemoveEvent,
        loadEventHistory,
        setShowHistoryModal,
        repairEvent,
        duplicateEvent,
        setShowNotesModal,
        handleOpenMaterialSelector
    } = useEventCalculator()

    return {
        /**
         * Seleccionar/deseleccionar evento
         */
        onSelect: useCallback(
            (checked: boolean) => handleSelectEvent(eventId, checked),
            [eventId, handleSelectEvent]
        ),

        /**
         * Expandir/colapsar evento
         */
        onToggleExpand: useCallback(
            () => toggleEventExpanded(eventId),
            [eventId, toggleEventExpanded]
        ),

        /**
         * Mostrar/ocultar panel de costos
         */
        onToggleCosts: useCallback(
            () => toggleEventCosts(eventId),
            [eventId, toggleEventCosts]
        ),

        /**
         * Mostrar/ocultar panel de notas
         */
        onToggleNotes: useCallback(
            () => toggleEventNotes(eventId),
            [eventId, toggleEventNotes]
        ),

        /**
         * Actualizar número de invitados
         */
        onUpdateGuests: useCallback(
            (count: number) => handleUpdateGuestCount(eventId, count),
            [eventId, handleUpdateGuestCount]
        ),

        /**
         * Eliminar evento
         */
        onRemove: useCallback(
            () => handleRemoveEvent(eventId),
            [eventId, handleRemoveEvent]
        ),

        /**
         * Duplicar evento
         */
        onDuplicate: useCallback(
            () => duplicateEvent(eventId),
            [eventId, duplicateEvent]
        ),

        /**
         * Abrir modal de historial de versiones
         */
        onShowHistory: useCallback(
            () => {
                loadEventHistory(eventId)
                setShowHistoryModal(eventId)
            },
            [eventId, loadEventHistory, setShowHistoryModal]
        ),

        /**
         * Abrir modal de edición de notas
         */
        onShowNotes: useCallback(
            () => setShowNotesModal(eventId),
            [eventId, setShowNotesModal]
        ),

        /**
         * Reparar evento (agregar ingredientes faltantes)
         */
        onRepair: useCallback(
            () => repairEvent(eventId),
            [eventId, repairEvent]
        ),

        /**
         * Abrir selector de materiales
         */
        onOpenMaterialSelector: useCallback(
            () => handleOpenMaterialSelector(eventId),
            [eventId, handleOpenMaterialSelector]
        )
    }
}
