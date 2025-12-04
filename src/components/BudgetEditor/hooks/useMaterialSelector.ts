import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Product } from '@/types'
import { BudgetData } from '../types'
import { recalculateTotals } from '../utils/budgetCalculations'

export function useMaterialSelector() {
    const [availableMaterials, setAvailableMaterials] = useState<Product[]>([])
    const [showMaterialSelector, setShowMaterialSelector] = useState(false)
    const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([])

    const loadMaterials = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('category', 'material')
                .eq('active', true)
                .order('name')

            if (error) throw error
            if (data) setAvailableMaterials(data)
        } catch (err) {
            console.error('Error cargando materiales:', err)
        }
    }, [])

    useEffect(() => {
        loadMaterials()
    }, [loadMaterials])

    const toggleMaterialSelection = (productId: string) => {
        setSelectedMaterialIds(prev =>
            prev.includes(productId)
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        )
    }

    const addSelectedMaterials = (currentData: BudgetData | null, onUpdate: (newData: BudgetData) => void) => {
        if (!currentData) return

        const materialsToAdd = availableMaterials.filter(p => selectedMaterialIds.includes(p.id))
        if (materialsToAdd.length === 0) {
            setShowMaterialSelector(false)
            return
        }

        const newData = { ...currentData }

        if (!newData.material) {
            newData.material = {
                items: [],
                totalHT: 0,
                tvaPct: 20,
                tva: 0,
                totalTTC: 0,
                insurancePct: 6,
                insuranceAmount: 0
            }
        }

        materialsToAdd.forEach(product => {
            const price = product.price_per_portion || 0
            newData.material!.items.push({
                name: product.name,
                quantity: 1,
                pricePerUnit: price,
                total: price * 1
            })
        })

        onUpdate(recalculateTotals(newData))
        setShowMaterialSelector(false)
        setSelectedMaterialIds([])
    }

    return {
        availableMaterials,
        showMaterialSelector,
        setShowMaterialSelector,
        selectedMaterialIds,
        toggleMaterialSelection,
        addSelectedMaterials
    }
}
