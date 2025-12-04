import React from 'react'
import { BudgetData } from '../types'
import styles from './TotalsSection.module.css'

interface TotalsSectionProps {
    data: BudgetData['totals']
    onUpdate: (path: string, value: any) => void
}

export function TotalsSection({ data, onUpdate }: TotalsSectionProps) {
    return (
        <section className={`${styles.section} ${styles.totalsFinal}`}>
            <h2 className={styles.title}>💰 Totales Finales</h2>
            <div className={styles.finalTotalsBox}>
                <div className={styles.totalRow}>
                    <span>Total HT Global:</span>
                    <strong>{data.totalHT.toFixed(2)} €</strong>
                </div>
                <div className={styles.totalRow}>
                    <span>Total TVA Global:</span>
                    <strong>{data.totalTVA.toFixed(2)} €</strong>
                </div>

                {/* Descuento */}
                <div className={styles.discountSection}>
                    <div className={styles.totalRow}>
                        <span>Descuento (%):</span>
                        <input
                            type="number"
                            value={data.discount?.percentage || 0}
                            onChange={(e) => {
                                const pct = parseFloat(e.target.value) || 0
                                const amount = data.totalHT * (pct / 100)
                                onUpdate('totals.discount', {
                                    reason: data.discount?.reason || 'Descuento comercial',
                                    percentage: pct,
                                    amount: amount
                                })
                            }}
                            className={styles.discountInput}
                            step="1"
                            min="0"
                            max="100"
                        />
                    </div>
                    {data.discount && data.discount.amount > 0 && (
                        <div className={styles.totalRow}>
                            <span>Monto Descuento:</span>
                            <strong style={{ color: '#ef4444' }}>- {data.discount.amount.toFixed(2)} €</strong>
                        </div>
                    )}
                </div>

                <div className={`${styles.totalRow} ${styles.highlightGreen}`}>
                    <span>TOTAL A PAGAR (TTC):</span>
                    <span className={styles.finalAmount}>
                        {(data.totalTTC - (data.discount?.amount || 0)).toFixed(2)} €
                    </span>
                </div>
            </div>
        </section>
    )
}
