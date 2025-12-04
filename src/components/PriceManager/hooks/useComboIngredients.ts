import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Product, ComboIngredient } from '@/types'

export function useComboIngredients() {
    const [comboIngredients, setComboIngredients] = useState<ComboIngredient[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const loadComboIngredients = async (comboId: string) => {
        try {
            setLoading(true)
            setError(null)

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

            if (ingredients && ingredients.length > 0) {
                const ingredientIds = ingredients.map(i => i.ingredient_id)
                const { data: ingredientDetails, error: detailsError } = await supabase
                    .from('products')
                    .select('*')
                    .in('id', ingredientIds)

                if (detailsError) throw detailsError

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
            setError(err instanceof Error ? err.message : 'Error al cargar ingredientes')
        } finally {
            setLoading(false)
        }
    }

    const addIngredient = async (comboId: string, ingredientId: string, products: Product[]) => {
        try {
            setLoading(true)
            setError(null)

            const { data, error } = await supabase
                .from('combo_ingredients')
                .insert([
                    {
                        combo_id: comboId,
                        ingredient_id: ingredientId,
                        quantity: 1.0
                    }
                ])
                .select()
                .single()

            if (error) throw error

            const ingredient = products.find(p => p.id === ingredientId)
            setComboIngredients(prev => [...prev, { ...data, ingredient }])

            return true
        } catch (err) {
            console.error('Error adding ingredient:', err)
            setError(err instanceof Error ? err.message : 'Error al agregar ingrediente')
            return false
        } finally {
            setLoading(false)
        }
    }

    const removeIngredient = async (ingredientRelationId: string) => {
        try {
            setLoading(true)
            setError(null)

            const { error } = await supabase
                .from('combo_ingredients')
                .delete()
                .eq('id', ingredientRelationId)

            if (error) throw error

            setComboIngredients(prev => prev.filter(i => i.id !== ingredientRelationId))
            return true
        } catch (err) {
            console.error('Error removing ingredient:', err)
            setError(err instanceof Error ? err.message : 'Error al eliminar ingrediente')
            return false
        } finally {
            setLoading(false)
        }
    }

    const updateQuantity = async (ingredientRelationId: string, newQuantity: number) => {
        if (newQuantity <= 0) return

        try {
            const { error } = await supabase
                .from('combo_ingredients')
                .update({ quantity: newQuantity })
                .eq('id', ingredientRelationId)

            if (error) throw error

            setComboIngredients(prev =>
                prev.map(i => i.id === ingredientRelationId ? { ...i, quantity: newQuantity } : i)
            )
        } catch (err) {
            console.error('Error updating quantity:', err)
        }
    }

    const recalculateComboPrice = async (comboId: string, products: Product[]) => {
        try {
            const { data: ingredients } = await supabase
                .from('combo_ingredients')
                .select('ingredient_id, quantity')
                .eq('combo_id', comboId)

            if (!ingredients || ingredients.length === 0) return

            let totalPrice = 0
            for (const ing of ingredients) {
                const product = products.find(p => p.id === ing.ingredient_id)
                if (product) {
                    totalPrice += product.price_per_portion * ing.quantity
                }
            }

            const finalPrice = Math.round(totalPrice * 100) / 100

            await supabase
                .from('products')
                .update({
                    price_per_portion: finalPrice,
                    updated_at: new Date().toISOString()
                })
                .eq('id', comboId)

            return finalPrice
        } catch (err) {
            console.error('Error recalculating combo price:', err)
            return null
        }
    }

    return {
        comboIngredients,
        setComboIngredients,
        loading,
        error,
        loadComboIngredients,
        addIngredient,
        removeIngredient,
        updateQuantity,
        recalculateComboPrice
    }
}
