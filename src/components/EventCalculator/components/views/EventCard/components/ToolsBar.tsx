import { Calculator, StickyNote, FileText, Wrench } from 'lucide-react'
import styles from './ToolsBar.module.css'
import type { Event } from '../../../../types'

interface ToolsBarProps {
    event: Event
    isSaving: boolean
    onToggleCosts: () => void
    onToggleNotes: () => void
    onShowNotesModal: () => void
    onRepair: () => void
}

/**
 * Barra de herramientas con acciones rápidas para el evento.
 * Incluye botones para analizar costos, ver notas, editar notas y reparar.
 */
export const ToolsBar = ({
    event,
    isSaving,
    onToggleCosts,
    onToggleNotes,
    onShowNotesModal,
    onRepair
}: ToolsBarProps) => {
    return (
        <div className={styles.toolsBar}>
            {/* Botón reparar (si tiene orderId y no tiene advertencia) */}
            {event.orderId && !event.notes?.includes('Items no encontrados') && (
                <button
                    className={styles.actionBtn}
                    onClick={(e) => {
                        e.stopPropagation()
                        onRepair()
                    }}
                    disabled={isSaving}
                >
                    <Wrench size={16} />
                    {isSaving ? 'Reparando...' : 'Reparar Evento'}
                </button>
            )}

            {/* Botón analizar costos */}
            {event.ingredients.length > 0 && (
                <button
                    className={styles.actionBtn}
                    onClick={(e) => {
                        e.stopPropagation()
                        onToggleCosts()
                    }}
                >
                    <Calculator size={16} />
                    {event.showCosts ? 'Ocultar' : 'Analizar'} Costos
                </button>
            )}

            {/* Botón ver notas */}
            <button
                className={styles.actionBtn}
                onClick={(e) => {
                    e.stopPropagation()
                    onToggleNotes()
                }}
            >
                <StickyNote size={16} />
                {event.showNotes ? 'Ocultar' : 'Ver'} Notas
            </button>

            {/* Botón editar notas */}
            <button
                className={styles.actionBtn}
                onClick={(e) => {
                    e.stopPropagation()
                    onShowNotesModal()
                }}
            >
                <FileText size={16} />
                Editar Notas
            </button>
        </div>
    )
}
