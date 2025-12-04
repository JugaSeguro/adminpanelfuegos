import React, { useState } from 'react'
import { Product, ComboIngredient } from '@/types'
import { X, Plus, Trash2, Loader2 } from 'lucide-react'
import styles from './ComboIngredientsModal.module.css'

interface ComboIngredientsModalProps {
    isOpen: boolean
    onClose: () => void
    combo: Product | null
    ingredients: ComboIngredient[]
    availableIngredients: Product[]
    onAddIngredient: (ingredientId: string) => Promise<boolean>
    onRemoveIngredient: (relationId: string) => Promise<boolean>
    onUpdateQuantity: (relationId: string, quantity: number) => void
    loading: boolean
}

export function ComboIngredientsModal({
    isOpen,
    onClose,
    combo,
    ingredients,
    availableIngredients,
    onAddIngredient,
    onRemoveIngredient,
    onUpdateQuantity,
    loading
}: ComboIngredientsModalProps) {
    const [selectedIngredientId, setSelectedIngredientId] = useState('')

    if (!isOpen || !combo) return null

    const handleAdd = async () => {
        if (!selectedIngredientId) return
        const success = await onAddIngredient(selectedIngredientId)
        if (success) {
            setSelectedIngredientId('')
        }
    }

    const totalCost = ingredients.reduce((sum, item) => {
        const price = item.ingredient?.price_per_portion || 0
        return sum + (price * item.quantity)
    }, 0)

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modal}>
                <div className={styles.modalHeader}>
                    <div>
                        <h3 className={styles.modalTitle}>Ingredientes del Combo</h3>
                        <p className={styles.modalSubtitle}>{combo.name}</p>
                    </div>
                    <button onClick={onClose} className={styles.closeButton}>
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.modalBody}>
                    <div className={styles.addSection}>
                        <select
                            value={selectedIngredientId}
                            onChange={e => setSelectedIngredientId(e.target.value)}
                            className={styles.select}
                            disabled={loading}
                        >
                            <option value="">Seleccionar ingrediente...</option>
                            {availableIngredients.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.name} ({p.price_per_portion.toFixed(2)}€)
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={handleAdd}
                            disabled={!selectedIngredientId || loading}
                            className={styles.addButton}
                        >
                            <Plus size={20} />
                        </button>
                    </div>

                    <div className={styles.ingredientsList}>
                        {ingredients.length === 0 ? (
                            <p className={styles.emptyText}>No hay ingredientes agregados</p>
                        ) : (
                            ingredients.map(item => (
                                <div key={item.id} className={styles.ingredientRow}>
                                    <div className={styles.ingredientInfo}>
                                        <span className={styles.ingredientName}>{item.ingredient?.name}</span>
                                        <span className={styles.ingredientPrice}>
                                            {item.ingredient?.price_per_portion.toFixed(2)}€ x unidad
                                        </span>
                                    </div>

                                    <div className={styles.actions}>
                                        <input
                                            type="number"
                                            min="0.1"
                                            step="0.1"
                                            value={item.quantity}
                                            onChange={e => onUpdateQuantity(item.id, parseFloat(e.target.value) || 0)}
                                            className={styles.quantityInput}
                                        />
                                        <button
                                            onClick={() => onRemoveIngredient(item.id)}
                                            className={styles.removeButton}
                                            disabled={loading}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className={styles.footer}>
                        <div className={styles.totalRow}>
                            <span>Costo Total:</span>
                            <span className={styles.totalAmount}>{totalCost.toFixed(2)}€</span>
                        </div>
                        <p className={styles.footerNote}>
                            El precio del combo se actualizará automáticamente a este valor.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
