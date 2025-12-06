import { memo, useCallback } from 'react'
import { useEventCalculator } from '../../../../context/EventCalculatorContext'
import { useIngredientRowData } from '../hooks/useIngredientRowData'
import { useIngredientDisplay } from '../hooks/useIngredientDisplay'
import { parsePortionPerPerson, convertToDisplayUnitForSummary } from '../../../../utils/unitConversions'
import { X } from 'lucide-react'
import styles from './IngredientRow.module.css'
import type { EventIngredient } from '../../../../types'

interface IngredientRowProps {
    eventId: string
    ingredient: EventIngredient
    guestCount: number
}

/**
 * Fila individual de ingrediente en la tabla.
 * Muestra nombre, cantidad por persona (editable), total y botón eliminar.
 * Usa hooks personalizados para eliminar IIFEs y memoizar cálculos.
 */
export const IngredientRow = memo(({
    eventId,
    ingredient,
    guestCount
}: IngredientRowProps) => {
    const { handleUpdateQuantity, handleRemoveIngredient } = useEventCalculator()

    // Datos calculados con hook personalizado
    const { display, isUsingDefault, totalQuantity } = useIngredientRowData(
        ingredient,
        guestCount
    )

    // Display para el total (usa convertToDisplayUnitForSummary)
    const totalDisplay = convertToDisplayUnitForSummary(ingredient.product, totalQuantity)

    // Handler para cambio de cantidad
    const handleQuantityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newInputValue = parseFloat(e.target.value) || 0
        const newQuantityInKg = display.parseInput(newInputValue)
        handleUpdateQuantity(eventId, ingredient.id, newQuantityInKg)
    }, [eventId, ingredient.id, display, handleUpdateQuantity])

    // Handler para usar porción estándar
    const handleUseDefault = useCallback(() => {
        const portionFromProduct = ingredient.product.portion_per_person
        if (portionFromProduct) {
            const defaultQty = parsePortionPerPerson(portionFromProduct)
            handleUpdateQuantity(eventId, ingredient.id, defaultQty)
        }
    }, [eventId, ingredient.id, ingredient.product.portion_per_person, handleUpdateQuantity])

    // Handler para eliminar ingrediente
    const handleRemove = useCallback(() => {
        handleRemoveIngredient(eventId, ingredient.id)
    }, [eventId, ingredient.id, handleRemoveIngredient])

    const portionFromProduct = ingredient.product.portion_per_person

    return (
        <tr>
            {/* Nombre del ingrediente */}
            <td className={styles.ingredientName}>
                <div>
                    <strong>{ingredient.product.name}</strong>

                    {/* Badge de cantidad fija */}
                    {ingredient.isFixedQuantity && (
                        <span
                            className={styles.fixedQuantityBadge}
                            title="Cantidad fija por evento (no se multiplica por invitados)"
                        >
                            🔒 Fijo
                        </span>
                    )}

                    {/* Porción estándar y aclaraciones */}
                    {!ingredient.isFixedQuantity && portionFromProduct && (
                        <div className={styles.portionInfo}>
                            <span className={styles.portionLabel}>
                                Porción estándar: {portionFromProduct}
                            </span>
                            {ingredient.product.clarifications && (
                                <span
                                    className={styles.clarificationHint}
                                    title={ingredient.product.clarifications}
                                >
                                    💡 {ingredient.product.clarifications}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Notas personalizadas (solo si son diferentes de clarifications) */}
                    {ingredient.notes &&
                        ingredient.notes !== ingredient.product.clarifications && (
                            <span className={styles.ingredientNote} title={ingredient.notes}>
                                📝 {ingredient.notes}
                            </span>
                        )}
                </div>
            </td>

            {/* Input de cantidad por persona */}
            <td>
                <div className={styles.quantityContainer}>
                    <input
                        type="number"
                        min="0"
                        step={display.displayUnit === 'gr' ? '1' : '0.1'}
                        value={display.inputValue}
                        onChange={handleQuantityChange}
                        className={styles.quantityInput}
                        title={
                            portionFromProduct
                                ? `Valor estándar: ${portionFromProduct}`
                                : 'Cantidad personalizada'
                        }
                    />
                    <span className={styles.unit}>{display.displayUnit}</span>

                    {/* Botón para usar porción estándar */}
                    {portionFromProduct && isUsingDefault && (
                        <button
                            className={styles.useDefaultBtn}
                            onClick={handleUseDefault}
                            title={`Usar valor estándar: ${portionFromProduct}`}
                        >
                            Usar estándar
                        </button>
                    )}
                </div>
            </td>

            {/* Total calculado */}
            <td className={styles.total}>
                {totalDisplay.value.toFixed(2)} {totalDisplay.unit}
            </td>

            {/* Botón eliminar */}
            <td>
                <button
                    className={styles.removeBtn}
                    onClick={handleRemove}
                    title="Eliminar"
                >
                    <X size={16} />
                </button>
            </td>
        </tr>
    )
})

IngredientRow.displayName = 'IngredientRow'
