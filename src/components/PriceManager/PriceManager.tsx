'use client'

import { useState, useEffect } from 'react'
import { Product, ComboIngredient } from '@/types'
import { supabase } from '@/lib/supabaseClient'
import { Save, Loader2, AlertCircle, CheckCircle2, Euro, Plus, X, Package } from 'lucide-react'
import styles from './PriceManager.module.css'

const CATEGORIES = [
  { id: 'entradas', name: 'entradas', displayName: 'Entradas' },
  { id: 'carnes_clasicas', name: 'carnes_clasicas', displayName: 'Carnes Clásicas' },
  { id: 'carnes_premium', name: 'carnes_premium', displayName: 'Carnes Premium' },
  { id: 'verduras', name: 'verduras', displayName: 'Verduras' },
  { id: 'postres', name: 'postres', displayName: 'Postres' },
  { id: 'pan', name: 'pan', displayName: 'Pan' },
  { id: 'extras', name: 'extras', displayName: 'Extras' }
]

export default function PriceManager() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [editedProducts, setEditedProducts] = useState<Set<string>>(new Set())
  const [showAddModal, setShowAddModal] = useState(false)
  const [showIngredientsModal, setShowIngredientsModal] = useState(false)
  const [selectedCombo, setSelectedCombo] = useState<Product | null>(null)
  const [comboIngredients, setComboIngredients] = useState<ComboIngredient[]>([])
  const [availableIngredients, setAvailableIngredients] = useState<Product[]>([])
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'entradas' as Product['category'],
    price_per_kg: null as number | null,
    price_per_portion: 0,
    unit_type: 'porcion' as Product['unit_type'],
    is_combo: false,
    notes: '',
    active: true
  })

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true })

      if (error) {
        throw new Error(error.message)
      }

      setProducts(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      console.error('Error loading products:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePriceChange = (productId: string, field: 'price_per_kg' | 'price_per_portion', newPrice: string) => {
    // Validar que sea un número válido
    const price = parseFloat(newPrice)
    if (isNaN(price) || price < 0) return

    setProducts(prevProducts =>
      prevProducts.map(product =>
        product.id === productId
          ? { ...product, [field]: price }
          : product
      )
    )

    setEditedProducts(prev => new Set(prev).add(productId))
  }

  const handleToggleActive = (productId: string) => {
    setProducts(prevProducts =>
      prevProducts.map(product =>
        product.id === productId
          ? { ...product, active: !product.active }
          : product
      )
    )

    setEditedProducts(prev => new Set(prev).add(productId))
  }

  const handleSaveProduct = async (product: Product) => {
    try {
      setSaving(product.id)
      setError(null)
      setSuccessMessage(null)

      const { error } = await supabase
        .from('products')
        .update({
          name: product.name,
          category: product.category,
          price_per_kg: product.price_per_kg,
          price_per_portion: product.price_per_portion,
          unit_type: product.unit_type,
          is_combo: product.is_combo,
          notes: product.notes,
          active: product.active,
          updated_at: new Date().toISOString()
        })
        .eq('id', product.id)

      if (error) {
        throw new Error(error.message)
      }

      setSuccessMessage(`${product.name} actualizado correctamente`)
      setEditedProducts(prev => {
        const newSet = new Set(prev)
        newSet.delete(product.id)
        return newSet
      })

      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
      console.error('Error saving product:', err)
    } finally {
      setSaving(null)
    }
  }

  const handleSaveAll = async () => {
    const productsToSave = products.filter(p => editedProducts.has(p.id))
    
    if (productsToSave.length === 0) {
      setError('No hay cambios para guardar')
      setTimeout(() => setError(null), 3000)
      return
    }

    try {
      setSaving('all')
      setError(null)
      setSuccessMessage(null)

      // Guardar todos los productos en paralelo
      const updatePromises = productsToSave.map(product =>
        supabase
          .from('products')
          .update({
            name: product.name,
            category: product.category,
            price_per_kg: product.price_per_kg,
            price_per_portion: product.price_per_portion,
            unit_type: product.unit_type,
            is_combo: product.is_combo,
            notes: product.notes,
            active: product.active,
            updated_at: new Date().toISOString()
          })
          .eq('id', product.id)
      )

      const results = await Promise.all(updatePromises)
      
      // Verificar si hubo errores
      const errors = results.filter(r => r.error)
      if (errors.length > 0) {
        throw new Error(`Error al guardar ${errors.length} producto(s)`)
      }

      setSuccessMessage(`${productsToSave.length} producto(s) actualizados correctamente`)
      setEditedProducts(new Set())

      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
      console.error('Error saving products:', err)
    } finally {
      setSaving(null)
    }
  }

  const getProductsByCategory = (categoryId: string) => {
    return products.filter(p => p.category === categoryId)
  }

  const handleOpenIngredientsModal = async (combo: Product) => {
    try {
      setSelectedCombo(combo)
      setSaving('loading-ingredients')
      
      // Cargar ingredientes del combo
      const { data: ingredients, error } = await supabase
        .from('combo_ingredients')
        .select(`
          id,
          combo_id,
          ingredient_id,
          quantity,
          created_at
        `)
        .eq('combo_id', combo.id)

      if (error) throw error

      // Cargar detalles de los ingredientes
      if (ingredients && ingredients.length > 0) {
        const ingredientIds = ingredients.map(i => i.ingredient_id)
        const { data: ingredientDetails, error: detailsError } = await supabase
          .from('products')
          .select('*')
          .in('id', ingredientIds)

        if (detailsError) throw detailsError

        // Combinar datos
        const enrichedIngredients = ingredients.map(ing => ({
          ...ing,
          ingredient: ingredientDetails?.find(p => p.id === ing.ingredient_id)
        }))

        setComboIngredients(enrichedIngredients)
      } else {
        setComboIngredients([])
      }

      // Cargar productos disponibles para agregar (que no sean combos)
      setAvailableIngredients(products.filter(p => !p.is_combo && p.id !== combo.id))
      
      setShowIngredientsModal(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar ingredientes')
      console.error('Error loading ingredients:', err)
    } finally {
      setSaving(null)
    }
  }

  const handleAddIngredient = async (ingredientId: string) => {
    if (!selectedCombo) return

    try {
      setSaving('adding-ingredient')
      setError(null)

      const { data, error } = await supabase
        .from('combo_ingredients')
        .insert([
          {
            combo_id: selectedCombo.id,
            ingredient_id: ingredientId,
            quantity: 1.0
          }
        ])
        .select()
        .single()

      if (error) throw error

      // Obtener detalles del ingrediente
      const ingredient = products.find(p => p.id === ingredientId)
      
      setComboIngredients(prev => [...prev, { ...data, ingredient }])
      setSuccessMessage('Ingrediente agregado al combo')
      setTimeout(() => setSuccessMessage(null), 3000)

      // Recalcular precio del combo
      await recalculateComboPrice(selectedCombo.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al agregar ingrediente')
      console.error('Error adding ingredient:', err)
    } finally {
      setSaving(null)
    }
  }

  const handleRemoveIngredient = async (ingredientRelationId: string) => {
    if (!selectedCombo) return

    try {
      setSaving('removing-ingredient')
      setError(null)

      const { error } = await supabase
        .from('combo_ingredients')
        .delete()
        .eq('id', ingredientRelationId)

      if (error) throw error

      setComboIngredients(prev => prev.filter(i => i.id !== ingredientRelationId))
      setSuccessMessage('Ingrediente eliminado del combo')
      setTimeout(() => setSuccessMessage(null), 3000)

      // Recalcular precio del combo
      await recalculateComboPrice(selectedCombo.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar ingrediente')
      console.error('Error removing ingredient:', err)
    } finally {
      setSaving(null)
    }
  }

  const handleUpdateQuantity = async (ingredientRelationId: string, newQuantity: number) => {
    if (!selectedCombo || newQuantity <= 0) return

    try {
      const { error } = await supabase
        .from('combo_ingredients')
        .update({ quantity: newQuantity })
        .eq('id', ingredientRelationId)

      if (error) throw error

      setComboIngredients(prev =>
        prev.map(i => i.id === ingredientRelationId ? { ...i, quantity: newQuantity } : i)
      )

      // Recalcular precio del combo
      await recalculateComboPrice(selectedCombo.id)
    } catch (err) {
      console.error('Error updating quantity:', err)
    }
  }

  const recalculateComboPrice = async (comboId: string) => {
    try {
      // Obtener ingredientes actuales
      const { data: ingredients } = await supabase
        .from('combo_ingredients')
        .select('ingredient_id, quantity')
        .eq('combo_id', comboId)

      if (!ingredients || ingredients.length === 0) return

      // Calcular precio total
      let totalPrice = 0
      for (const ing of ingredients) {
        const product = products.find(p => p.id === ing.ingredient_id)
        if (product) {
          totalPrice += product.price_per_portion * ing.quantity
        }
      }

      // Actualizar precio del combo
      await supabase
        .from('products')
        .update({ 
          price_per_portion: Math.round(totalPrice * 100) / 100,
          updated_at: new Date().toISOString()
        })
        .eq('id', comboId)

      // Actualizar en el estado local
      setProducts(prev =>
        prev.map(p => p.id === comboId ? { ...p, price_per_portion: Math.round(totalPrice * 100) / 100 } : p)
      )

      if (selectedCombo?.id === comboId) {
        setSelectedCombo(prev => prev ? { ...prev, price_per_portion: Math.round(totalPrice * 100) / 100 } : null)
      }
    } catch (err) {
      console.error('Error recalculating combo price:', err)
    }
  }

  const handleAddProduct = async () => {
    try {
      // Validar campos
      if (!newProduct.name.trim()) {
        setError('El nombre del producto es requerido')
        setTimeout(() => setError(null), 3000)
        return
      }

      if (newProduct.price_per_portion < 0) {
        setError('El precio por porción debe ser mayor o igual a 0')
        setTimeout(() => setError(null), 3000)
        return
      }

      if (newProduct.price_per_kg !== null && newProduct.price_per_kg < 0) {
        setError('El precio por KG debe ser mayor o igual a 0')
        setTimeout(() => setError(null), 3000)
        return
      }

      setSaving('adding')
      setError(null)
      setSuccessMessage(null)

      const { data, error } = await supabase
        .from('products')
        .insert([
          {
            name: newProduct.name.trim(),
            category: newProduct.category,
            price_per_kg: newProduct.price_per_kg,
            price_per_portion: newProduct.price_per_portion,
            unit_type: newProduct.unit_type,
            is_combo: newProduct.is_combo,
            notes: newProduct.notes || null,
            active: newProduct.active
          }
        ])
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      // Agregar el producto a la lista
      setProducts(prev => [...prev, data])
      
      // Resetear formulario
      setNewProduct({
        name: '',
        category: 'entradas',
        price_per_kg: null,
        price_per_portion: 0,
        unit_type: 'porcion',
        is_combo: false,
        notes: '',
        active: true
      })
      
      // Cerrar modal
      setShowAddModal(false)
      
      setSuccessMessage(`Producto "${data.name}" creado correctamente`)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear producto')
      console.error('Error adding product:', err)
    } finally {
      setSaving(null)
    }
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.spinner} size={48} />
        <p className={styles.loadingText}>Cargando productos...</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h2 className={styles.title}>
            <Euro size={28} />
            Gestión de Precios
          </h2>
          <p className={styles.subtitle}>
            Modifica los precios de tus productos. Los cambios se guardarán en la base de datos.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            className={styles.addProductButton}
            onClick={() => setShowAddModal(true)}
            disabled={saving !== null}
          >
            <Plus size={18} />
            Agregar Producto
          </button>

          {editedProducts.size > 0 && (
            <button
              className={styles.saveAllButton}
              onClick={handleSaveAll}
              disabled={saving !== null}
            >
              {saving === 'all' ? (
                <>
                  <Loader2 className={styles.buttonSpinner} size={18} />
                  Guardando...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Guardar Todos ({editedProducts.size})
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className={styles.alert} data-type="error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className={styles.alert} data-type="success">
          <CheckCircle2 size={20} />
          <span>{successMessage}</span>
        </div>
      )}

      <div className={styles.categoriesContainer}>
        {CATEGORIES.map(category => {
          const categoryProducts = getProductsByCategory(category.name)
          
          if (categoryProducts.length === 0) return null

          return (
            <div key={category.id} className={styles.categorySection}>
              <h3 className={styles.categoryTitle}>{category.displayName}</h3>
              
              <div className={styles.productsGrid}>
                {categoryProducts.map(product => {
                  const isEdited = editedProducts.has(product.id)
                  const isSaving = saving === product.id

                  return (
                    <div
                      key={product.id}
                      className={`${styles.productCard} ${!product.active ? styles.inactive : ''} ${isEdited ? styles.edited : ''}`}
                    >
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
                            onChange={() => handleToggleActive(product.id)}
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
                                  onChange={(e) => handlePriceChange(product.id, 'price_per_kg', e.target.value)}
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
                                onChange={(e) => handlePriceChange(product.id, 'price_per_portion', e.target.value)}
                                className={styles.priceInput}
                                disabled={isSaving || product.is_combo}
                                title={product.is_combo ? 'El precio se calcula automáticamente desde los ingredientes' : ''}
                              />
                            </div>
                          </div>
                        </div>

                        {product.is_combo ? (
                          <button
                            className={styles.ingredientsButton}
                            onClick={() => handleOpenIngredientsModal(product)}
                            disabled={saving === 'loading-ingredients'}
                          >
                            {saving === 'loading-ingredients' ? (
                              <Loader2 className={styles.buttonSpinner} size={16} />
                            ) : (
                              <Package size={16} />
                            )}
                            Ver Ingredientes
                          </button>
                        ) : (
                          <button
                            className={styles.saveButton}
                            onClick={() => handleSaveProduct(product)}
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

                      {!product.active && (
                        <div className={styles.inactiveBadge}>
                          Desactivado
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {products.length === 0 && (
        <div className={styles.emptyState}>
          <AlertCircle size={48} className={styles.emptyIcon} />
          <h3 className={styles.emptyTitle}>No hay productos</h3>
          <p className={styles.emptyText}>
            No se encontraron productos en la base de datos. 
            Ejecuta el script SQL para inicializar los productos o agrega uno nuevo.
          </p>
        </div>
      )}

      {/* Modal para agregar producto */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <Plus size={24} />
                Agregar Nuevo Producto
              </h3>
              <button
                className={styles.closeButton}
                onClick={() => setShowAddModal(false)}
                disabled={saving === 'adding'}
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Nombre del Producto *</label>
                <input
                  type="text"
                  className={styles.input}
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="Ej: Chorizo, Entrecote..."
                  disabled={saving === 'adding'}
                  autoFocus
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Categoría *</label>
                <select
                  className={styles.select}
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value as Product['category'] })}
                  disabled={saving === 'adding'}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.name}>
                      {cat.displayName}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Tipo de Unidad *</label>
                <select
                  className={styles.select}
                  value={newProduct.unit_type}
                  onChange={(e) => setNewProduct({ ...newProduct, unit_type: e.target.value as Product['unit_type'] })}
                  disabled={saving === 'adding'}
                >
                  <option value="porcion">Porción</option>
                  <option value="kg">Kilogramo (KG)</option>
                  <option value="unidad">Unidad</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Precio por Porción (€) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={styles.input}
                  value={newProduct.price_per_portion}
                  onChange={(e) => setNewProduct({ ...newProduct, price_per_portion: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  disabled={saving === 'adding'}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Precio por KG (€) - Opcional</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={styles.input}
                  value={newProduct.price_per_kg || ''}
                  onChange={(e) => setNewProduct({ ...newProduct, price_per_kg: e.target.value ? parseFloat(e.target.value) : null })}
                  placeholder="Dejar vacío si no aplica"
                  disabled={saving === 'adding'}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Notas / Descripción</label>
                <textarea
                  className={styles.textarea}
                  value={newProduct.notes}
                  onChange={(e) => setNewProduct({ ...newProduct, notes: e.target.value })}
                  placeholder="Ej: Ingredientes, descripción del combo..."
                  rows={3}
                  disabled={saving === 'adding'}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={newProduct.is_combo}
                    onChange={(e) => setNewProduct({ ...newProduct, is_combo: e.target.checked })}
                    disabled={saving === 'adding'}
                  />
                  <span>Es un combo (combinación de productos)</span>
                </label>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={newProduct.active}
                    onChange={(e) => setNewProduct({ ...newProduct, active: e.target.checked })}
                    disabled={saving === 'adding'}
                  />
                  <span>Producto activo</span>
                </label>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.cancelButton}
                onClick={() => setShowAddModal(false)}
                disabled={saving === 'adding'}
              >
                Cancelar
              </button>
              <button
                className={styles.confirmButton}
                onClick={handleAddProduct}
                disabled={saving === 'adding' || !newProduct.name.trim()}
              >
                {saving === 'adding' ? (
                  <>
                    <Loader2 className={styles.buttonSpinner} size={18} />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Plus size={18} />
                    Agregar Producto
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para gestionar ingredientes del combo */}
      {showIngredientsModal && selectedCombo && (
        <div className={styles.modalOverlay} onClick={() => setShowIngredientsModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <Package size={24} />
                Ingredientes de {selectedCombo.name}
              </h3>
              <button
                className={styles.closeButton}
                onClick={() => setShowIngredientsModal(false)}
                disabled={saving !== null}
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.comboPriceDisplay}>
                <div className={styles.comboPriceLabel}>Precio Total del Combo:</div>
                <div className={styles.comboPriceValue}>€ {selectedCombo.price_per_portion.toFixed(2)}</div>
              </div>

              <div className={styles.ingredientsList}>
                <h4 className={styles.ingredientsListTitle}>Ingredientes actuales:</h4>
                
                {comboIngredients.length === 0 ? (
                  <div className={styles.emptyIngredients}>
                    <AlertCircle size={32} />
                    <p>Este combo no tiene ingredientes asignados aún.</p>
                  </div>
                ) : (
                  <div className={styles.ingredientsGrid}>
                    {comboIngredients.map(ing => (
                      <div key={ing.id} className={styles.ingredientCard}>
                        <div className={styles.ingredientInfo}>
                          <div className={styles.ingredientName}>
                            {ing.ingredient?.name || 'Desconocido'}
                          </div>
                          <div className={styles.ingredientPrice}>
                            €{ing.ingredient?.price_per_portion.toFixed(2)} × {ing.quantity}
                          </div>
                          <div className={styles.ingredientTotal}>
                            = €{((ing.ingredient?.price_per_portion || 0) * ing.quantity).toFixed(2)}
                          </div>
                        </div>
                        
                        <div className={styles.ingredientActions}>
                          <input
                            type="number"
                            min="0.1"
                            step="0.1"
                            value={ing.quantity}
                            onChange={(e) => handleUpdateQuantity(ing.id, parseFloat(e.target.value) || 1)}
                            className={styles.quantityInput}
                            disabled={saving !== null}
                          />
                          <button
                            className={styles.removeIngredientButton}
                            onClick={() => handleRemoveIngredient(ing.id)}
                            disabled={saving !== null}
                            title="Eliminar ingrediente"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.addIngredientSection}>
                <h4 className={styles.ingredientsListTitle}>Agregar ingrediente:</h4>
                <select
                  className={styles.ingredientSelect}
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddIngredient(e.target.value)
                      e.target.value = ''
                    }
                  }}
                  disabled={saving !== null}
                >
                  <option value="">Seleccionar ingrediente...</option>
                  {availableIngredients
                    .filter(p => !comboIngredients.some(ci => ci.ingredient_id === p.id))
                    .map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} - €{product.price_per_portion.toFixed(2)}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.confirmButton}
                onClick={() => setShowIngredientsModal(false)}
                disabled={saving !== null}
              >
                <CheckCircle2 size={18} />
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

