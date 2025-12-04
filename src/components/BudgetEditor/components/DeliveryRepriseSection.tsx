import React, { useState } from 'react'
import { BudgetData } from '../types'
import styles from './DeliveryRepriseSection.module.css'

interface DeliveryRepriseSectionProps {
    data: BudgetData['deliveryReprise']
    onUpdate: (path: string, value: any) => void
    onDelete: () => void
}

export function DeliveryRepriseSection({ data, onUpdate, onDelete }: DeliveryRepriseSectionProps) {
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
                    <h2 className={styles.title}>🚚 Livraison et Reprise</h2>
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
                            <label>Costo Entrega (€)</label>
                            <input
                                type="number"
                                value={data.deliveryCost}
                                onChange={(e) => onUpdate('deliveryReprise.deliveryCost', parseFloat(e.target.value) || 0)}
                                step="0.01"
                                min="0"
                            />
                        </div>
                        <div className={styles.editField}>
                            <label>Costo Recogida (€)</label>
                            <input
                                type="number"
                                value={data.pickupCost}
                                onChange={(e) => onUpdate('deliveryReprise.pickupCost', parseFloat(e.target.value) || 0)}
                                step="0.01"
                                min="0"
                            />
                        </div>
                        <div className={styles.editField}>
                            <label>TVA (%)</label>
                            <input
                                type="number"
                                value={data.tvaPct}
                                onChange={(e) => onUpdate('deliveryReprise.tvaPct', parseFloat(e.target.value) || 0)}
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
