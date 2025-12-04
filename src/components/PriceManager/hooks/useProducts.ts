import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Product } from '@/types'

export function useProducts() {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const [editedProducts, setEditedProducts] = useState<Set<string>>(new Set())

    const loadProducts = useCallback(async () => {
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
    }, [])

    useEffect(() => {
        loadProducts()
    }, [loadProducts])

    const handlePriceChange = useCallback((productId: string, field: 'price_per_kg' | 'price_per_portion', newPrice: string) => {
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
    }, [])

    const handleToggleActive = useCallback((productId: string) => {
        setProducts(prevProducts =>
            prevProducts.map(product =>
                product.id === productId
                    ? { ...product, active: !product.active }
                    : product
            )
        )

        setEditedProducts(prev => new Set(prev).add(productId))
    }, [])

    const handleUpdateField = useCallback((productId: string, field: keyof Product, value: any) => {
        setProducts(prevProducts =>
            prevProducts.map(product =>
                product.id === productId
                    ? { ...product, [field]: value }
                    : product
            )
        )
        setEditedProducts(prev => new Set(prev).add(productId))
    }, [])

    const saveProduct = async (product: Product) => {
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

            setTimeout(() => setSuccessMessage(null), 3000)
            return true
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al guardar')
            console.error('Error saving product:', err)
            return false
        } finally {
            setSaving(null)
        }
    }

    const saveAll = async () => {
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

    const addProduct = async (newProduct: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
        try {
            setSaving('adding')
            setError(null)
            setSuccessMessage(null)

            const { data, error } = await supabase
                .from('products')
                .insert([
                    {
                        ...newProduct,
                        name: newProduct.name.trim(),
                        portion_per_person: newProduct.portion_per_person || null,
                        clarifications: newProduct.clarifications || null,
                        notes: newProduct.notes || null
                    }
                ])
                .select()
                .single()

            if (error) {
                throw new Error(error.message)
            }

            setProducts(prev => [...prev, data])
            setSuccessMessage(`Producto "${data.name}" creado correctamente`)
            setTimeout(() => setSuccessMessage(null), 3000)
            return true
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al crear producto')
            console.error('Error adding product:', err)
            return false
        } finally {
            setSaving(null)
        }
    }

    return {
        products,
        setProducts, // Exposed for local updates if needed
        loading,
        saving,
        error,
        successMessage,
        editedProducts,
        loadProducts,
        handlePriceChange,
        handleToggleActive,
        handleUpdateField,
        saveProduct,
        saveAll,
        addProduct,
        setError,
        setSuccessMessage
    }
}
