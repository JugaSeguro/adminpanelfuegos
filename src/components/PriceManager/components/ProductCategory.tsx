import React from 'react'
import { Product, ProductCategory as ProductCategoryType } from '@/types'
import { ProductRow } from './ProductRow'
import styles from './ProductCategory.module.css'

interface ProductCategoryProps {
    category: ProductCategoryType
    products: Product[]
    isExpanded: boolean
    onToggle: (categoryId: string) => void
    editedProducts: Set<string>
    saving: string | null
    onPriceChange: (productId: string, field: 'price_per_kg' | 'price_per_portion', newPrice: string) => void
    onToggleActive: (productId: string) => void
    onUpdateField: (productId: string, field: keyof Product, value: any) => void
    onSave: (product: Product) => void
    onOpenIngredients: (product: Product) => void
}

export function ProductCategory({
    category,
    products,
    isExpanded,
    onToggle,
    editedProducts,
    saving,
    onPriceChange,
    onToggleActive,
    onUpdateField,
    onSave,
    onOpenIngredients
}: ProductCategoryProps) {
    if (products.length === 0) return null

    return (
        <div className={styles.categorySection}>
            <div
                className={styles.categoryHeader}
                onClick={() => onToggle(category.id)}
            >
                <h3 className={styles.categoryTitle}>
                    {category.displayName}
                    <span className={styles.productCount}>({products.length})</span>
                </h3>
                <span className={`${styles.categoryToggle} ${isExpanded ? styles.expanded : ''}`}>
                    ▼
                </span>
            </div>

            {isExpanded && (
                <div className={styles.productsGrid}>
                    {products.map(product => (
                        <ProductRow
                            key={product.id}
                            product={product}
                            isEdited={editedProducts.has(product.id)}
                            isSaving={saving === product.id}
                            onPriceChange={onPriceChange}
                            onToggleActive={onToggleActive}
                            onUpdateField={onUpdateField}
                            onSave={onSave}
                            onOpenIngredients={onOpenIngredients}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
