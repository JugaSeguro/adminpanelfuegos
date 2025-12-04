'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Save, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useProducts } from './hooks/useProducts'
import { useComboIngredients } from './hooks/useComboIngredients'
import { ProductCategory } from './components/ProductCategory'
import { AddProductModal } from './components/AddProductModal'
import { ComboIngredientsModal } from './components/ComboIngredientsModal'
import { Product } from '@/types'
import styles from './PriceManager.module.css'

const CATEGORIES = [
    { id: 'entradas', name: 'entradas', displayName: 'Entradas' },
    { id: 'carnes_clasicas', name: 'carnes_clasicas', displayName: 'Carnes Clásicas' },
    { id: 'carnes_premium', name: 'carnes_premium', displayName: 'Carnes Premium' },
    { id: 'verduras', name: 'verduras', displayName: 'Acompañamiento' },
    { id: 'postres', name: 'postres', displayName: 'Postres' },
    { id: 'pan', name: 'pan', displayName: 'Pan' },
    { id: 'extras', name: 'extras', displayName: 'Extras' },
    { id: 'material', name: 'material', displayName: 'Material' }
]

const HIDE_ENTRADAS_NAMES = new Set([
    'carne burguer',
    'chori',
    'chorizo',
    'jamon',
    'mozza',
    'pan burguer',
    'pan de chori',
    'queso burguer',
    'tomates'
])

export default function PriceManager() {
    const {
        products,
        loading,
        saving,
        error,
        successMessage,
        editedProducts,
        handlePriceChange,
        handleToggleActive,
        handleUpdateField,
        saveProduct,
        saveAll,
        addProduct
    } = useProducts()

    const {
        comboIngredients,
        loading: ingredientsLoading,
        loadComboIngredients,
        addIngredient,
        removeIngredient,
        updateQuantity,
        recalculateComboPrice
    } = useComboIngredients()

    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['entradas']))
    const [filterMode, setFilterMode] = useState<'all' | 'combos'>('all')
    const [showAddModal, setShowAddModal] = useState(false)
    const [showIngredientsModal, setShowIngredientsModal] = useState(false)
    const [selectedCombo, setSelectedCombo] = useState<Product | null>(null)
    const [availableIngredients, setAvailableIngredients] = useState<Product[]>([])

    const toggleCategory = (categoryId: string) => {
        setExpandedCategories(prev => {
            const newSet = new Set(prev)
            if (newSet.has(categoryId)) {
                newSet.delete(categoryId)
            } else {
                newSet.add(categoryId)
            }
            return newSet
        })
    }

    const getFilteredProductsByCategory = (categoryId: string) => {
        let filtered = products.filter(p => p.category === categoryId)
        if (categoryId === 'entradas') {
            filtered = filtered.filter(p => !HIDE_ENTRADAS_NAMES.has(p.name.trim().toLowerCase()))
        }
        if (filterMode === 'combos') {
            filtered = filtered.filter(p => p.is_combo)
        }
        filtered = filtered.sort((a, b) => Number(b.is_combo) - Number(a.is_combo))
        return filtered
    }

    const handleOpenIngredientsModal = async (combo: Product) => {
        setSelectedCombo(combo)
        await loadComboIngredients(combo.id)
        setAvailableIngredients(products.filter(p => !p.is_combo && p.id !== combo.id))
        setShowIngredientsModal(true)
    }

    const handleAddIngredientToCombo = async (ingredientId: string) => {
        if (!selectedCombo) return false
        const success = await addIngredient(selectedCombo.id, ingredientId, products)
        if (success) {
            await recalculateComboPrice(selectedCombo.id, products)
            // Recargar productos para reflejar el nuevo precio del combo
            // Nota: idealmente useProducts debería exponer una forma de actualizar un solo producto localmente
            // pero por simplicidad podemos confiar en que recalculateComboPrice actualiza la DB
            // y podríamos disparar un reload o actualizar localmente si fuera crítico.
            // Por ahora, el usuario verá el precio actualizado en el modal.
        }
        return success
    }

    const handleRemoveIngredientFromCombo = async (relationId: string) => {
        if (!selectedCombo) return false
        const success = await removeIngredient(relationId)
        if (success) {
            await recalculateComboPrice(selectedCombo.id, products)
        }
        return success
    }

    const handleUpdateIngredientQuantity = async (relationId: string, quantity: number) => {
        if (!selectedCombo) return
        await updateQuantity(relationId, quantity)
        // Esperar un poco para recalcular para no saturar, o hacerlo en blur/save.
        // Aquí lo hacemos directo pero podría optimizarse.
        await recalculateComboPrice(selectedCombo.id, products)
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.titleSection}>
                    <h1 className={styles.title}>Gestión de Precios</h1>
                    <p className={styles.subtitle}>Administra los productos y precios del sistema</p>
                </div>

                <div className={styles.headerActions}>
                    <div className={styles.segmentedToggle}>
                        <button
                            className={`${styles.segmentBtn} ${filterMode === 'all' ? styles.segmentActive : ''}`}
                            onClick={() => setFilterMode('all')}
                        >
                            Todos
                        </button>
                        <button
                            className={`${styles.segmentBtn} ${filterMode === 'combos' ? styles.segmentActive : ''}`}
                            onClick={() => setFilterMode('combos')}
                        >
                            Solo Combos
                        </button>
                    </div>

                    <button
                        className={styles.addProductButton}
                        onClick={() => setShowAddModal(true)}
                    >
                        <Plus size={20} />
                        Nuevo Producto
                    </button>

                    <button
                        className={styles.saveAllButton}
                        onClick={saveAll}
                        disabled={editedProducts.size === 0 || saving === 'all'}
                    >
                        <Save size={20} />
                        {saving === 'all' ? 'Guardando...' : `Guardar Todo (${editedProducts.size})`}
                    </button>
                </div>
            </div>

            {error && (
                <div className={styles.alert} data-type="error">
                    <AlertCircle size={20} />
                    {error}
                </div>
            )}

            {successMessage && (
                <div className={styles.alert} data-type="success">
                    <CheckCircle2 size={20} />
                    {successMessage}
                </div>
            )}

            {loading ? (
                <div className={styles.loadingContainer}>
                    <div className={styles.spinner}></div>
                    <p className={styles.loadingText}>Cargando productos...</p>
                </div>
            ) : (
                <div className={styles.categoriesContainer}>
                    {CATEGORIES.map(category => {
                        const categoryProducts = getFilteredProductsByCategory(category.id)
                        if (categoryProducts.length === 0) return null

                        return (
                            <ProductCategory
                                key={category.id}
                                category={category}
                                products={categoryProducts}
                                isExpanded={expandedCategories.has(category.id)}
                                onToggle={toggleCategory}
                                editedProducts={editedProducts}
                                saving={saving}
                                onPriceChange={handlePriceChange}
                                onToggleActive={handleToggleActive}
                                onUpdateField={handleUpdateField}
                                onSave={saveProduct}
                                onOpenIngredients={handleOpenIngredientsModal}
                            />
                        )
                    })}
                </div>
            )}

            <AddProductModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onAdd={addProduct}
            />

            <ComboIngredientsModal
                isOpen={showIngredientsModal}
                onClose={() => setShowIngredientsModal(false)}
                combo={selectedCombo}
                ingredients={comboIngredients}
                availableIngredients={availableIngredients}
                onAddIngredient={handleAddIngredientToCombo}
                onRemoveIngredient={handleRemoveIngredientFromCombo}
                onUpdateQuantity={handleUpdateIngredientQuantity}
                loading={ingredientsLoading || saving === 'loading-ingredients'}
            />
        </div>
    )
}
