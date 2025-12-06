import { ChevronDown, ChevronUp, History, Copy, Trash2, Users } from 'lucide-react'
import styles from './EventHeader.module.css'
import type { Event } from '../../../../types'

interface EventHeaderProps {
    event: Event
    isSelected: boolean
    isSaving: boolean
    onSelect: (checked: boolean) => void
    onToggleExpand: () => void
    onUpdateGuests: (count: number) => void
    onDuplicate: () => void
    onShowHistory: () => void
    onRemove: () => void
}

/**
 * Header del evento con título, metadata y acciones.
 * Incluye checkbox, botón expandir/colapsar, título, badges,
 * input de invitados y botones de acción (duplicar, historial, eliminar).
 */
export const EventHeader = ({
    event,
    isSelected,
    isSaving,
    onSelect,
    onToggleExpand,
    onUpdateGuests,
    onDuplicate,
    onShowHistory,
    onRemove
}: EventHeaderProps) => {
    return (
        <div className={styles.eventHeader}>
            {/* Sección de título */}
            <div className={styles.eventTitleSection}>
                {/* Checkbox de selección */}
                <div className={styles.checkboxWrapper}>
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => onSelect(e.target.checked)}
                        className={styles.eventCheckbox}
                    />
                </div>

                {/* Botón expandir/colapsar */}
                <button
                    className={styles.expandBtn}
                    onClick={onToggleExpand}
                >
                    {event.expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>

                {/* Título y metadata */}
                <div>
                    <h3 className={styles.eventName}>
                        {event.name}
                        {event.isSaved === false && (
                            <span className={styles.unsavedBadge}>* Sin guardar</span>
                        )}
                        {isSaving && (
                            <span className={styles.savingBadge}>Guardando...</span>
                        )}
                    </h3>
                    <div className={styles.eventMeta}>
                        {event.eventDate && (
                            <span className={styles.eventDate}>
                                📅 {new Date(event.eventDate).toLocaleDateString()}
                            </span>
                        )}
                        <span className={styles.ingredientCount}>
                            🍽️ {event.ingredients.length} ingredientes
                        </span>
                        {event.dbId && (
                            <span className={styles.versionInfo}>
                                v{event.versionNumber || 1}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Sección de acciones */}
            <div className={styles.eventActions}>
                {/* Input de invitados */}
                <div className={styles.guestsInput}>
                    <Users size={18} />
                    <input
                        type="number"
                        value={event.guestCount}
                        onChange={(e) => onUpdateGuests(parseInt(e.target.value) || 0)}
                        min="1"
                    />
                    <span>invitados</span>
                </div>

                {/* Botones de acción */}
                <div className={styles.actionButtons}>
                    <button
                        className={styles.iconActionBtn}
                        onClick={onDuplicate}
                        title="Duplicar evento"
                    >
                        <Copy size={18} />
                    </button>

                    {event.dbId && (
                        <button
                            className={styles.iconActionBtn}
                            onClick={onShowHistory}
                            title="Ver historial de versiones"
                        >
                            <History size={18} />
                        </button>
                    )}

                    <button
                        className={styles.deleteBtn}
                        onClick={onRemove}
                        title="Eliminar evento"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>
        </div>
    )
}
