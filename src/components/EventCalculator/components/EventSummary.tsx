import React from 'react'
import { Calculator, ChevronDown, ChevronUp } from 'lucide-react'
import { Event, IngredientTotal } from '../types'
import { convertToDisplayUnitForSummary } from '../utils/unitConversions'
import styles from './EventSummary.module.css'

interface EventSummaryProps {
    totalsByCategory: { [key: string]: IngredientTotal[] }
    isExpanded: boolean
    onToggle: () => void
}

const CATEGORY_NAMES: { [key: string]: string } = {
    'entradas': 'Entradas',
    'carnes_clasicas': 'Carnes Clásicas',
    'carnes_premium': 'Carnes Premium',
    'verduras': 'Acompañamiento',
    'postres': 'Postres',
    'pan': 'Pan',
    'extras': 'Extras',
    'material': 'Material'
}

export function EventSummary({ totalsByCategory, isExpanded, onToggle }: EventSummaryProps) {
    const hasItems = Object.keys(totalsByCategory).length > 0
    if (!hasItems) {
        return null
    }

    return (
        <div className={styles.summaryCard}>
            <div
                onClick={onToggle}
                className={styles.summaryHeader}
            >
                <div className={styles.summaryTitleWrapper}>
                    <Calculator size={24} />
                    <h3 className={styles.summaryTitle}>
                        Resumen General - Total de Compras
                    </h3>
                </div>
                {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
            </div>

            {isExpanded && (
                <div className={styles.summaryByCategory}>
                    {Object.keys(totalsByCategory).map(category => (
                        <div key={category} className={styles.categoryGroup}>
                            <h4 className={styles.categoryTitle}>
                                {CATEGORY_NAMES[category] || category}
                            </h4>
                            <table className={styles.ingredientsTable}>
                                <thead>
                                    <tr>
                                        <th>Ingrediente</th>
                                        <th>Cantidad Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {totalsByCategory[category].map(item => {
                                        const display = convertToDisplayUnitForSummary(item.product, item.total)
                                        return (
                                            <tr key={item.product.id}>
                                                <td className={styles.ingredientName}>{item.product.name}</td>
                                                <td className={styles.grandTotal}>
                                                    {display.value.toFixed(2)} {display.unit}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
