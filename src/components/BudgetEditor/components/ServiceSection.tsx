import React, { useState } from 'react'
import { BudgetData } from '../types'
import styles from './ServiceSection.module.css'

interface ServiceSectionProps {
    data: BudgetData['service']
    onUpdate: (path: string, value: any) => void
    onDelete: () => void
}

export function ServiceSection({ data, onUpdate, onDelete }: ServiceSectionProps) {
    const [expanded, setExpanded] = useState(false)

    if (!data) return null

    return (
        <section className={`${styles.section} ${styles.editable}`}>
            <div className={styles.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className={styles.toggleBtn}
                        title={expanded ? 'Colapsar' : 'Expandir'}
                    >
                        {expanded ? '▼' : '▶'}
                    </button>
                    <h2 className={styles.title}>🤵 Servicio (Serveurs)</h2>
                </div>
                <button
                    onClick={onDelete}
                    className={styles.deleteSectionBtn}
                    title="Eliminar sección de servicio"
                >
                    🗑️
                </button>
            </div>
            {expanded && (
                <>
                    <div className={styles.editGrid}>
                        <div className={styles.editField}>
                            <label>Cantidad de Mozos</label>
                            <input
                                type="number"
                                value={data.mozos}
                                onChange={(e) => onUpdate('service.mozos', parseInt(e.target.value) || 0)}
                                min="0"
                            />
                        </div>
                        <div className={styles.editField}>
                            <label>Horas</label>
                            <input
                                type="number"
                                value={data.hours}
                                onChange={(e) => onUpdate('service.hours', parseFloat(e.target.value) || 0)}
                                min="0"
                                step="0.5"
                            />
                        </div>
                        <div className={styles.editField}>
                            <label>Precio/Hora (€)</label>
                            <input
                                type="number"
                                value={data.pricePerHour}
                                disabled
                                className={styles.disabledInput}
                            />
                        </div>
                        <div className={styles.editField}>
                            <label>TVA (%)</label>
                            <input
                                type="number"
                                value={data.tvaPct}
                                disabled
                                className={styles.disabledInput}
                            />
                        </div>
                    </div>
                    <div className={styles.totalsBox}>
                        <div className={styles.totalRow}>
                            <span>Total HT:</span>
                            <strong>{data.totalHT.toFixed(2)} €</strong>
                        </div>
                        <div className={styles.totalRow}>
                            <span>TVA ({data.tvaPct}%):</span>
                            <strong>{data.tva.toFixed(2)} €</strong>
                        </div>
                        <div className={`${styles.totalRow} ${styles.highlight}`}>
                            <span>Total TTC:</span>
                            <strong>{data.totalTTC.toFixed(2)} €</strong>
                        </div>
                    </div>
                </>
            )}
        </section>
    )
}
