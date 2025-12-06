import React from 'react'
import { History, X, Clock } from 'lucide-react'
import { Event, EventCalculationVersion } from '@/components/EventCalculator/types'
import styles from './HistoryModal.module.css'

interface HistoryModalProps {
    isOpen: boolean
    onClose: () => void
    eventId: string | null
    events: Event[]
    eventVersions: { [key: string]: EventCalculationVersion[] }
    onRestoreVersion: (eventId: string, version: EventCalculationVersion) => void
}

export function HistoryModal({
    isOpen,
    onClose,
    eventId,
    events,
    eventVersions,
    onRestoreVersion
}: HistoryModalProps) {
    if (!isOpen || !eventId) return null

    const versions = eventVersions[eventId] || []
    // We might not need the event object itself to display history, but kept it if needed for context
    // const event = events.find(e => e.id === eventId)

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalLarge} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h3 className={styles.modalTitle}>
                        <History size={24} />
                        Historial de Versiones
                    </h3>
                    <button
                        className={styles.closeButton}
                        onClick={onClose}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.modalBody}>
                    {versions.length === 0 ? (
                        <div className={styles.noHistory}>
                            <History size={48} />
                            <p>No hay historial de versiones para este evento.</p>
                        </div>
                    ) : (
                        <div className={styles.versionsList}>
                            {versions.map(version => (
                                <div key={version.id} className={styles.versionItem}>
                                    <div className={styles.versionHeader}>
                                        <div>
                                            <strong>Versión {version.version_number}</strong>
                                            <span className={styles.versionDate}>
                                                {new Date(version.created_at).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className={styles.versionActions}>
                                            <button
                                                className={styles.restoreBtn}
                                                onClick={() => onRestoreVersion(eventId, version)}
                                            >
                                                <Clock size={16} />
                                                Restaurar
                                            </button>
                                        </div>
                                    </div>
                                    <div className={styles.versionInfo}>
                                        <p><strong>Tipo:</strong> {version.change_type}</p>
                                        {version.change_description && (
                                            <p><strong>Descripción:</strong> {version.change_description}</p>
                                        )}
                                        {version.version_data && (
                                            <details className={styles.versionDetails}>
                                                <summary>Ver datos de la versión</summary>
                                                <pre>{JSON.stringify(version.version_data, null, 2)}</pre>
                                            </details>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className={styles.modalFooter}>
                    <button
                        className={styles.cancelButton}
                        onClick={onClose}
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    )
}
