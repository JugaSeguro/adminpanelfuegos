import { useState, useCallback } from 'react'
import { BudgetData } from '../types'
import { recalculateTotals } from '../utils/budgetCalculations'

export function useBudgetCalculations(initialData: BudgetData | null) {
    const [editedData, setEditedData] = useState<BudgetData | null>(initialData)

    const updateField = useCallback((path: string, value: any) => {
        setEditedData((prev) => {
            if (!prev) return prev
            const newData = { ...prev }
            const keys = path.split('.')
            let current: any = newData

            for (let i = 0; i < keys.length - 1; i++) {
                if (!current[keys[i]]) current[keys[i]] = {}
                current = current[keys[i]]
            }

            current[keys[keys.length - 1]] = value

            // Recalcular totales automáticamente
            return recalculateTotals(newData)
        })
    }, [])

    const setFullData = useCallback((data: BudgetData) => {
        setEditedData(data)
    }, [])

    return {
        editedData,
        updateField,
        setEditedData: setFullData
    }
}
