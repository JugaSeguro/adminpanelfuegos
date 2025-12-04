import React, { useState } from 'react'
import { BudgetData } from '../types'
import styles from './BoissonsSoftSection.module.css'

interface BoissonsSoftSectionProps {
    data: BudgetData['boissonsSoft']
    onUpdate: (path: string, value: any) => void
    onDelete: () => void
}

export function BoissonsSoftSection({ data, onUpdate, onDelete }: BoissonsSoftSectionProps) {
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
                    <h2 className={styles.title}>🥤 Boissons Soft</h2>
                </div>
                <button
                    onClick={onDelete}
                    className={styles.deleteSectionBtn}
                    title="Eliminar sección"
                >
                    🗑️
                </button>
            </div>
            {expanded && (
                <>
                    <div className={styles.editGrid}>
                        <div className={styles.editField}>
                            <label>Precio por Persona (€)</label>
                            <input
                                type="number"
                                value={data.pricePerPerson}
                                onChange={(e) => onUpdate('boissonsSoft.pricePerPerson', parseFloat(e.target.value) || 0)}
                                step="0.01"
                                min="0"
                            />
                        </div>
                        <div className={styles.editField}>
                            <label>Total Personas</label>
                            <input
                                type="number"
                                value={data.totalPersons}
                                onChange={(e) => onUpdate('boissonsSoft.totalPersons', parseInt(e.target.value) || 0)}
                                min="0"
                            />
                        </div>
                    </div>
                    <div className={styles.infoDisplay}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#6b7280', fontWeight: 600 }}>TVA:</span>
                            <strong style={{ color: '#e2943a', fontSize: '16px' }}>20%</strong>
                        </div>
                        <div className={styles.infoNote}>
                            ⚙️ Valor fijo (no editable)
                        </div>
                    </div>
                    <div className={styles.totalsBox}>
                        <div className={styles.totalRow}>
                            <span>Total HT:</span>
                            <strong>{data.totalHT.toFixed(2)} €</strong>
                        </div>
                        <div className={styles.totalRow}>
                            <span>TVA (20%):</span>
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
