import React, { useState } from 'react'
import { BudgetData } from '../types'
import styles from './MenuSection.module.css'

interface MenuSectionProps {
    data: BudgetData['menu']
    onUpdate: (path: string, value: any) => void
}

export function MenuSection({ data, onUpdate }: MenuSectionProps) {
    const [expanded, setExpanded] = useState(true)

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
                    <h2 className={styles.title}>🍽️ Menú</h2>
                </div>
            </div>
            {expanded && (
                <>
                    <div className={styles.editGrid}>
                        <div className={styles.editField}>
                            <label>Precio por Persona (€)</label>
                            <input
                                type="number"
                                value={data.pricePerPerson}
                                onChange={(e) => onUpdate('menu.pricePerPerson', parseFloat(e.target.value) || 0)}
                                step="0.01"
                                min="0"
                            />
                        </div>
                        <div className={styles.editField}>
                            <label>Total Personas</label>
                            <input
                                type="number"
                                value={data.totalPersons}
                                onChange={(e) => onUpdate('menu.totalPersons', parseInt(e.target.value) || 0)}
                                min="0"
                            />
                        </div>
                        <div className={styles.editField}>
                            <label>TVA (%)</label>
                            <input
                                type="number"
                                value={data.tvaPct}
                                onChange={(e) => onUpdate('menu.tvaPct', parseFloat(e.target.value) || 0)}
                                step="0.1"
                                min="0"
                                max="100"
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
