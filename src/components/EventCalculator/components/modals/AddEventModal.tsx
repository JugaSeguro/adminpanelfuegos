import React from 'react'
import { Plus, X } from 'lucide-react'
import styles from './AddEventModal.module.css'

interface AddEventModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: () => void
    eventName: string
    eventDate: string
    guestCount: number
    onNameChange: (name: string) => void
    onDateChange: (date: string) => void
    onGuestCountChange: (count: number) => void
}

export function AddEventModal({
    isOpen,
    onClose,
    onSubmit,
    eventName,
    eventDate,
    guestCount,
    onNameChange,
    onDateChange,
    onGuestCountChange
}: AddEventModalProps) {
    if (!isOpen) return null

    const isValid = eventName.trim() && guestCount > 0

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h3 className={styles.modalTitle}>
                        <Plus size={24} />
                        Agregar Evento Manual
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
                        <label className={styles.label}>Nombre del Evento *</label>
                        <input
                            type="text"
                            className={styles.input}
                            value={eventName}
                            onChange={(e) => onNameChange(e.target.value)}
                            placeholder="Ej: Evento Viernes, Boda Juan y María..."
                            autoFocus
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Fecha del Evento</label>
                        <input
                            type="date"
                            className={styles.input}
                            value={eventDate}
                            onChange={(e) => onDateChange(e.target.value)}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Número de Invitados *</label>
                        <input
                            type="number"
                            min="1"
                            className={styles.input}
                            value={guestCount || ''}
                            onChange={(e) => onGuestCountChange(parseInt(e.target.value) || 0)}
                            placeholder="Ej: 50"
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
                        onClick={onSubmit}
                        disabled={!isValid}
                    >
                        <Plus size={18} />
                        Crear Evento
                    </button>
                </div>
            </div>
        </div>
    )
}
