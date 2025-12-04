import React from 'react'
import { Product } from '@/types'
import { Save, Loader2, Package } from 'lucide-react'
import styles from './ProductRow.module.css'

interface ProductRowProps {
    product: Product
    isEdited: boolean
    isSaving: boolean
    onPriceChange: (productId: string, field: 'price_per_kg' | 'price_per_portion', newPrice: string) => void
    onToggleActive: (productId: string) => void
    onUpdateField: (productId: string, field: keyof Product, value: any) => void
    onSave: (product: Product) => void
    onOpenIngredients: (product: Product) => void
}

export function ProductRow({
    product,
    isEdited,
    isSaving,
    onPriceChange,
    onToggleActive,
    onUpdateField,
    onSave,
    onOpenIngredients
}: ProductRowProps) {
    return (
        <div className={`${styles.productCard} ${!product.active ? styles.inactive : ''} ${isEdited ? styles.edited : ''}`}>
            <div className={styles.productHeader}>
                <div>
                    <h4 className={styles.productName}>{product.name}</h4>
                    {product.is_combo && (
                        <span className={styles.comboBadge}>COMBO</span>
                    )}
                </div>

                <label className={styles.toggleSwitch}>
                    <input
                        type="checkbox"
                        checked={product.active}
                        onChange={() => onToggleActive(product.id)}
                        disabled={isSaving}
                    />
                    <span className={styles.slider}></span>
                </label>
            </div>

            {product.notes && (
                <div className={styles.productNotes}>
                    {product.notes}
                </div>
            )}

            <div className={styles.productBody}>
                <div className={styles.pricesContainer}>
                    {product.price_per_kg !== null && (
                        <div className={styles.priceInputGroup}>
                            <label className={styles.priceLabel}>€/KG</label>
                            <div className={styles.inputWrapper}>
                                <span className={styles.currencySymbol}>€</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={product.price_per_kg}
                                    onChange={(e) => onPriceChange(product.id, 'price_per_kg', e.target.value)}
                                    className={styles.priceInput}
                                    disabled={isSaving || product.is_combo}
                                />
                            </div>
                        </div>
                    )}

                    <div className={styles.priceInputGroup}>
                        <label className={styles.priceLabel}>€/Porción</label>
                        <div className={styles.inputWrapper}>
                            <span className={styles.currencySymbol}>€</span>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={product.price_per_portion}
                                onChange={(e) => onPriceChange(product.id, 'price_per_portion', e.target.value)}
                                className={styles.priceInput}
                                disabled={isSaving || product.is_combo}
                                title={product.is_combo ? 'El precio se calcula automáticamente desde los ingredientes' : ''}
                            />
                        </div>
                    </div>

                    <div className={styles.priceInputGroup}>
                        <label className={styles.priceLabel}>Porción x Persona</label>
                        <input
                            type="text"
                            value={product.portion_per_person || ''}
                            onChange={(e) => onUpdateField(product.id, 'portion_per_person', e.target.value)}
                            className={styles.portionInput}
                            disabled={isSaving}
                            placeholder="Ej: 1/4, 1/2, 30 gr, 1 feta"
                        />
                    </div>
                </div>

                <div className={styles.clarificationsSection}>
                    <label className={styles.priceLabel}>Aclaraciones</label>
                    <textarea
                        value={product.clarifications || ''}
                        onChange={(e) => onUpdateField(product.id, 'clarifications', e.target.value)}
                        className={styles.clarificationsInput}
                        disabled={isSaving}
                        placeholder="Ej: Con 1 chorizo hago 4 choripanes..."
                        rows={2}
                    />
                </div>

                {product.is_combo ? (
                    <button
                        className={styles.ingredientsButton}
                        onClick={() => onOpenIngredients(product)}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <Loader2 className={styles.buttonSpinner} size={16} />
                        ) : (
                            <Package size={16} />
                        )}
                        Ver Ingredientes
                    </button>
                ) : (
                    <button
                        className={styles.saveButton}
                        onClick={() => onSave(product)}
                        disabled={!isEdited || isSaving}
                    >
                        {isSaving ? (
                            <Loader2 className={styles.buttonSpinner} size={16} />
                        ) : (
                            <Save size={16} />
                        )}
                        Guardar
                    </button>
                )}
            </div>
        </div>
    )
}
