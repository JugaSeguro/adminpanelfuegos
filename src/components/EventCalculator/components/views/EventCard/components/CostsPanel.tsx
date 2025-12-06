import { memo, useMemo } from 'react'
import { useIngredientDisplay } from '../hooks/useIngredientDisplay'
import styles from './CostsPanel.module.css'
import type { EventCost } from '../../../../utils/calculations'
import type { Product } from '@/types'

interface CostsPanelProps {
    costs: EventCost
}

/**
 * Panel que muestra el análisis completo de costos del evento.
 * Incluye resumen, desglose por categoría y desglose por ingrediente.
 */
export const CostsPanel = ({ costs }: CostsPanelProps) => {
    return (
        <div className={styles.costsPanel}>
            {/* Resumen de costos */}
            <div className={styles.costsSummary}>
                <div className={styles.costItem}>
                    <span className={styles.costLabel}>Costo Total:</span>
                    <span className={styles.costValue}>€{costs.totalCost.toFixed(2)}</span>
                </div>
                <div className={styles.costItem}>
                    <span className={styles.costLabel}>Por Invitado:</span>
                    <span className={styles.costValue}>€{costs.avgCostPerGuest.toFixed(2)}</span>
                </div>
            </div>

            {/* Desglose por categoría */}
            <div className={styles.costsBreakdown}>
                <h5 className={styles.breakdownTitle}>Desglose por Categoría:</h5>
                <div className={styles.categoryGrid}>
                    {Object.entries(costs.costByCategory).map(([cat, amount]) => (
                        <div key={cat} className={styles.categoryCard}>
                            <span className={styles.catName}>{cat}</span>
                            <span className={styles.catAmount}>€{amount.toFixed(2)}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Desglose por ingrediente */}
            <div className={styles.costsBreakdown}>
                <h5 className={styles.breakdownTitle}>Desglose por Ingrediente:</h5>
                <table className={styles.costsTable}>
                    <thead>
                        <tr>
                            <th>Ingrediente</th>
                            <th>Cantidad Total</th>
                            <th>Precio Unit.</th>
                            <th>Costo Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {costs.ingredientCosts.map((item, idx) => (
                            <CostsTableRow key={idx} item={item} />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

/**
 * Fila de la tabla de costos por ingrediente.
 * Usa el hook useIngredientDisplay para eliminar IIFEs.
 */
interface CostsTableRowProps {
    item: {
        product: Product
        quantity: number
        cost: number
    }
}

const CostsTableRow = memo(({ item }: CostsTableRowProps) => {
    const display = useIngredientDisplay(item.product, item.quantity)

    const formattedQuantity = useMemo(
        () => display.format(display.displayValue.value),
        [display]
    )

    const formattedPrice = useMemo(
        () => `€${item.product.price_per_portion.toFixed(2)}/${display.displayUnit}`,
        [item.product.price_per_portion, display.displayUnit]
    )

    const formattedCost = useMemo(
        () => `€${item.cost.toFixed(2)}`,
        [item.cost]
    )

    return (
        <tr>
            <td className={styles.ingredientName}>{item.product.name}</td>
            <td>{formattedQuantity}</td>
            <td>{formattedPrice}</td>
            <td className={styles.costAmount}>{formattedCost}</td>
        </tr>
    )
})

CostsTableRow.displayName = 'CostsTableRow'
