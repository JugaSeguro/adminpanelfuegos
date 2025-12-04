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
  { id: 'verduras', name: 'verduras', displayName: 'Acompañamiento' },
  { id: 'postres', name: 'postres', displayName: 'Postres' },
  { id: 'pan', name: 'pan', displayName: 'Pan' },
  { id: 'extras', name: 'extras', displayName: 'Extras' },
  { id: 'material', name: 'material', displayName: 'Material' }
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

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['entradas']))
  const [filterMode, setFilterMode] = useState<'all' | 'combos'>('all')

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
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'entradas' as Product['category'],
    price_per_kg: null as number | null,
    price_per_portion: 0,
    unit_type: 'porcion' as Product['unit_type'],
    is_combo: false,
    notes: '',
    portion_per_person: '',
    clarifications: '',
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
          portion_per_person: product.portion_per_person || null,
          clarifications: product.clarifications || null,
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
            portion_per_person: product.portion_per_person || null,
            clarifications: product.clarifications || null,
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

  const loadComboIngredients = async (comboId: string) => {
    try {
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
        .eq('combo_id', comboId)

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
    } catch (err) {
      console.error('Error loading combo ingredients:', err)
    }
  }

  const handleOpenIngredientsModal = async (combo: Product) => {
    try {
      setSelectedCombo(combo)
      setSaving('loading-ingredients')

      await loadComboIngredients(combo.id)

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
    if (!selectedCombo || !ingredientId) return

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
      setSuccessMessage('Ingrediente agregado correctamente')
      setTimeout(() => setSuccessMessage(null), 3000)

      // Recalcular precio del combo
      await recalculateComboPrice(selectedCombo.id)

      // Recargar los datos del combo actualizado
      await loadComboIngredients(selectedCombo.id)
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

  const handleUpdateIngredientPrice = async (ingredientId: string, newPrice: number) => {
    if (!selectedCombo || newPrice < 0) return

    try {
      // Actualizar precio del producto ingrediente
      const { error } = await supabase
        .from('products')
        .update({
          price_per_portion: newPrice,
          updated_at: new Date().toISOString()
        })
        .eq('id', ingredientId)

      if (error) throw error

      // Actualizar estado local de productos
      setProducts(prev =>
        prev.map(p => p.id === ingredientId ? { ...p, price_per_portion: newPrice } : p)
      )

      // Actualizar comboIngredients para reflejar el nuevo precio
      setComboIngredients(prev =>
        prev.map(i => i.ingredient_id === ingredientId
          ? { ...i, ingredient: i.ingredient ? { ...i.ingredient, price_per_portion: newPrice } : undefined }
          : i
        )
      )

      // Recalcular precio del combo
      await recalculateComboPrice(selectedCombo.id)
    } catch (err) {
      console.error('Error updating ingredient price:', err)
      setError('Error al actualizar precio del ingrediente')
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
            portion_per_person: newProduct.portion_per_person || null,
            clarifications: newProduct.clarifications || null,
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
        portion_per_person: '',
        clarifications: '',
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
          <div className={styles.segmentedToggle} role="tablist" aria-label="Filtro de productos">
            <button
              role="tab"
              aria-selected={filterMode === 'all'}
              className={`${styles.segmentBtn} ${filterMode === 'all' ? styles.segmentActive : ''}`}
              onClick={() => setFilterMode('all')}
              disabled={saving !== null}
            >
              Ver todo
            </button>
            <button
              role="tab"
              aria-selected={filterMode === 'combos'}
              className={`${styles.segmentBtn} ${filterMode === 'combos' ? styles.segmentActive : ''}`}
              onClick={() => setFilterMode('combos')}
              disabled={saving !== null}
            >
              Solo combos
            </button>
          </div>
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

      {/* Vista de tabla con porciones y aclaraciones */}


      <div className={styles.categoriesContainer}>
        {CATEGORIES.map(category => {
          const categoryProducts = getFilteredProductsByCategory(category.name)
          const isExpanded = expandedCategories.has(category.id)

          if (categoryProducts.length === 0) return null

          return (
            <div key={category.id} className={styles.categorySection}>
              <div
                className={styles.categoryHeader}
                onClick={() => toggleCategory(category.id)}
              >
                <h3 className={styles.categoryTitle}>
                  {category.displayName}
                  <span className={styles.productCount}>({categoryProducts.length})</span>
                </h3>
                <span className={`${styles.categoryToggle} ${isExpanded ? styles.expanded : ''}`}>
                  ▼
                </span>
              </div>

              {isExpanded && (
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

                            <div className={styles.priceInputGroup}>
                              <label className={styles.priceLabel}>Porción x Persona</label>
                              <input
                                type="text"
                                value={product.portion_per_person || ''}
                                onChange={(e) => {
                                  setProducts(prevProducts =>
                                    prevProducts.map(p =>
                                      p.id === product.id
                                        ? { ...p, portion_per_person: e.target.value }
                                        : p
                                    )
                                  )
                                  setEditedProducts(prev => new Set(prev).add(product.id))
                                }}
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
                              onChange={(e) => {
                                setProducts(prevProducts =>
                                  prevProducts.map(p =>
                                    p.id === product.id
                                      ? { ...p, clarifications: e.target.value }
                                      : p
                                  )
                                )
                                setEditedProducts(prev => new Set(prev).add(product.id))
                              }}
                              className={styles.clarificationsInput}
                              disabled={isSaving}
                              placeholder="Ej: Con 1 chorizo hago 4 choripanes..."
                              rows={2}
                            />
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
              )}
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
                <label className={styles.label}>Porción por Persona</label>
                <input
                  type="text"
                  className={styles.input}
                  value={newProduct.portion_per_person}
                  onChange={(e) => setNewProduct({ ...newProduct, portion_per_person: e.target.value })}
                  placeholder="Ej: 1/4, 1/2, 30 gr, 1 feta, 1 bolsa cada 30 personas..."
                  disabled={saving === 'adding'}
                />
                <small className={styles.helpText}>
                  Cantidad necesaria por invitado (ej: 1/4, 1/2, 30 gr, 1 feta)
                </small>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Aclaraciones</label>
                <textarea
                  className={styles.textarea}
                  value={newProduct.clarifications}
                  onChange={(e) => setNewProduct({ ...newProduct, clarifications: e.target.value })}
                  placeholder="Ej: Con 1 chorizo hago 4 choripanes, Paquete trae 56 fetas..."
                  rows={3}
                  disabled={saving === 'adding'}
                />
                <small className={styles.helpText}>
                  Información importante para el cálculo (ej: rendimiento, cantidad por paquete, etc.)
                </small>
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
                          <div className={styles.ingredientPriceRow}>
                            <label className={styles.ingredientPriceLabel}>Cantidad:</label>
                            <input
                              type="number"
                              min="0.1"
                              step="0.1"
                              value={ing.quantity}
                              onChange={(e) => handleUpdateQuantity(ing.id, parseFloat(e.target.value) || 1)}
                              className={styles.smallInput}
                              disabled={saving !== null}
                            />
                          </div>
                          <div className={styles.ingredientPriceRow}>
                            <label className={styles.ingredientPriceLabel}>Precio unit:</label>
                            <div className={styles.inputWrapper}>
                              <span className={styles.currencySymbol} style={{ fontSize: '0.8rem', left: '0.5rem' }}>€</span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={ing.ingredient?.price_per_portion}
                                onChange={(e) => ing.ingredient && handleUpdateIngredientPrice(ing.ingredient.id, parseFloat(e.target.value) || 0)}
                                className={styles.smallInput}
                                style={{ paddingLeft: '1.5rem', width: '80px' }}
                                disabled={saving !== null}
                              />
                            </div>
                          </div>
                          <div className={styles.ingredientTotal}>
                            Total: €{((ing.ingredient?.price_per_portion || 0) * ing.quantity).toFixed(2)}
                          </div>
                        </div>

                        <div className={styles.ingredientActions}>
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
                <div className={styles.addIngredientRow}>
                  <select
                    id="ingredientSelect"
                    className={styles.ingredientSelect}
                    disabled={saving !== null}
                    defaultValue=""
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
                  <button
                    className={styles.addIngredientBtn}
                    onClick={() => {
                      const select = document.getElementById('ingredientSelect') as HTMLSelectElement
                      if (select && select.value) {
                        handleAddIngredient(select.value)
                        select.value = ''
                      }
                    }}
                    disabled={saving !== null}
                  >
                    {saving === 'adding-ingredient' ? (
                      <Loader2 className={styles.buttonSpinner} size={16} />
                    ) : (
                      <Plus size={16} />
                    )}
                    Agregar
                  </button>
                </div>
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

