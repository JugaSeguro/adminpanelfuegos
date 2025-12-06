import { useMemo } from 'react'
import { useEventCalculator } from '../../context/EventCalculatorContext'
import { useEventCosts, useEventCardActions } from './EventCard/hooks'
import {
    EventHeader,
    WarningBox,
    ToolsBar,
    CostsPanel,
    NotesPanel,
    IngredientsTable
} from './EventCard/components'
import styles from './EventCard.module.css'
import type { Event } from '../../types'

interface EventCardProps {
    event: Event
}

/**
 * Componente principal de tarjeta de evento.
 * Actúa como compositor que orquesta todos los sub-componentes.
 * 
 * Refactorizado para eliminar IIFEs, reducir complejidad y mejorar testeabilidad.
 */
export const EventCard = ({ event }: EventCardProps) => {
    const { saving, eventNotes, selectedEventIds } = useEventCalculator()

    // Hooks personalizados
    const costs = useEventCosts(event)
    const actions = useEventCardActions(event.id)

    // Estados derivados
    const isSelected = selectedEventIds.includes(event.id)
    const isSaving = saving === event.id

    // Clase CSS del card (memoizada)
    const cardClassName = useMemo(
        () => `
      ${styles.eventCard} 
      ${event.expanded ? styles.expanded : ''} 
      ${event.isSaved === false ? styles.unsaved : ''}
    `.trim(),
        [event.expanded, event.isSaved]
    )

    return (
        <div className={cardClassName}>
            {/* Header con título, metadata y acciones principales */}
            <EventHeader
                event={event}
                isSelected={isSelected}
                isSaving={isSaving}
                onSelect={actions.onSelect}
                onToggleExpand={actions.onToggleExpand}
                onUpdateGuests={actions.onUpdateGuests}
                onDuplicate={actions.onDuplicate}
                onShowHistory={actions.onShowHistory}
                onRemove={actions.onRemove}
            />

            {/* Contenido expandible */}
            {event.expanded && (
                <div className={styles.eventContent}>
                    {/* Advertencia de items no encontrados */}
                    {event.notes?.includes('Items no encontrados') && (
                        <WarningBox
                            message={event.notes}
                            onRepair={actions.onRepair}
                            isSaving={isSaving}
                        />
                    )}

                    {/* Barra de herramientas */}
                    <ToolsBar
                        event={event}
                        isSaving={isSaving}
                        onToggleCosts={actions.onToggleCosts}
                        onToggleNotes={actions.onToggleNotes}
                        onShowNotesModal={actions.onShowNotes}
                        onRepair={actions.onRepair}
                    />

                    {/* Panel de análisis de costos */}
                    {event.showCosts && (
                        <CostsPanel costs={costs} />
                    )}

                    {/* Panel de notas y observaciones */}
                    {event.showNotes && (
                        <NotesPanel
                            event={event}
                            eventNotes={eventNotes[event.id]}
                        />
                    )}

                    {/* Tabla de ingredientes */}
                    <IngredientsTable
                        event={event}
                        onOpenMaterialSelector={actions.onOpenMaterialSelector}
                    />
                </div>
            )}
        </div>
    )
}
