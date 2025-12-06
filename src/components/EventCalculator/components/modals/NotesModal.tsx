import React from 'react'
import { StickyNote, X, Save } from 'lucide-react'
import { Event } from '../../types'
import styles from './NotesModal.module.css'

interface NotesModalProps {
    isOpen: boolean
    onClose: () => void
    event: Event | undefined
    onNotesChange: (notes: string) => void
    onObservationsChange: (observations: string) => void
    onSave: () => void
}

export function NotesModal({
    isOpen,
    onClose,
    event,
    onNotesChange,
    onObservationsChange,
    onSave
}: NotesModalProps) {
    if (!isOpen || !event) return null

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h3 className={styles.modalTitle}>
                        <StickyNote size={24} />
                        Notas y Observaciones
                    </h3>
                    <button
                        className={styles.closeButton}
                        onClick={onClose}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.modalBody}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Notas Generales</label>
                        <textarea
                            className={styles.textarea}
                            value={event.notes}
                            onChange={(e) => onNotesChange(e.target.value)}
                            placeholder="Notas generales sobre el evento..."
                            rows={4}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Observaciones</label>
                        <textarea
                            className={styles.textarea}
                            value={event.observations}
                            onChange={(e) => onObservationsChange(e.target.value)}
                            placeholder="Observaciones importantes..."
                            rows={4}
                        />
                    </div>
                </div>

                <div className={styles.modalFooter}>
                    <button
                        className={styles.cancelButton}
                        onClick={onClose}
                    >
                        Cancelar
                    </button>
                    <button
                        className={styles.confirmButton}
                        onClick={onSave}
                    >
                        <Save size={18} />
                        Guardar Notas
                    </button>
                </div>
            </div>
        </div>
    )
}
