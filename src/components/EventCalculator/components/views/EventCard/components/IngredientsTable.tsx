import { useEventCalculator } from '../../../../context/EventCalculatorContext'
import { useAvailableProducts } from '../hooks/useAvailableProducts'
import { IngredientRow } from './IngredientRow'
import { Package } from 'lucide-react'
import styles from './IngredientsTable.module.css'
import type { Event } from '../../../../types'

interface IngredientsTableProps {
    event: Event
    onOpenMaterialSelector: () => void
}

/**
 * Tabla de ingredientes del evento.
 * Incluye la lista de ingredientes y el selector para agregar nuevos.
 */
export const IngredientsTable = ({ event, onOpenMaterialSelector }: IngredientsTableProps) => {
    const { availableProducts, handleAddIngredient } = useEventCalculator()

    // Filtrar productos ya utilizados usando hook personalizado
    const usedProductIds = event.ingredients.map(ing => ing.product.id)
    const filteredProducts = useAvailableProducts(availableProducts, usedProductIds)

    return (
        <div className={styles.ingredientsList}>
            {/* Tabla o mensaje vacío */}
            {event.ingredients.length === 0 ? (
                <div className={styles.noIngredients}>
                    No hay ingredientes agregados
                </div>
            ) : (
                <table className={styles.ingredientsTable}>
                    <thead>
                        <tr>
                            <th>Ingrediente</th>
                            <th>Cant./Persona</th>
                            <th>Total</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {event.ingredients.map(ingredient => (
                            <IngredientRow
                                key={ingredient.id}
                                eventId={event.id}
                                ingredient={ingredient}
                                guestCount={event.guestCount}
                            />
                        ))}
                    </tbody>
                </table>
            )}

            {/* Selector de ingredientes */}
            <div className={styles.addIngredientSection}>
                <select
                    className={styles.productSelect}
                    onChange={(e) => {
                        if (e.target.value) {
                            handleAddIngredient(event.id, e.target.value)
                            e.target.value = ''
                        }
                    }}
                >
                    <option value="">Seleccionar ingrediente...</option>
                    {filteredProducts.map(product => (
                        <option key={product.id} value={product.id}>
                            {product.name}
                            {product.portion_per_person && ` - ${product.portion_per_person} por persona`}
                            {product.clarifications && ` (${product.clarifications.substring(0, 30)}...)`}
                        </option>
                    ))}
                </select>

                <button
                    className={styles.addMaterialsBtn}
                    onClick={onOpenMaterialSelector}
                    title="Seleccionar múltiples materiales"
                >
                    <Package size={18} />
                    Materiales
                </button>
            </div>
        </div>
    )
}
