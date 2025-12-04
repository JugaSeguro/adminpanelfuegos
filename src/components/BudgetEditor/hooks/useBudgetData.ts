import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Budget, BudgetData } from '../types'
import { formatItemName } from '../utils/formatItemName'

export function useBudgetData(budgetId: string) {
    const [budget, setBudget] = useState<Budget | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)

    const loadBudget = useCallback(async () => {
        try {
            setLoading(true)

            const { data, error } = await supabase
                .from('budgets')
                .select('*')
                .eq('id', budgetId)
                .single()

            if (error) {
                throw error
            }

            if (data) {
                setBudget(data as any)

                // Procesamiento inicial de datos (similar al original)
                const budgetData = { ...data.budget_data } as BudgetData

                // Asegurar valores fijos para servicio si existe
                if (budgetData.service) {
                    budgetData.service.pricePerHour = 40
                    budgetData.service.tvaPct = 20
                    const serviceHT = budgetData.service.mozos * budgetData.service.hours * 40
                    budgetData.service.totalHT = serviceHT
                    budgetData.service.tva = serviceHT * 0.20
                    budgetData.service.totalTTC = serviceHT + budgetData.service.tva
                }

                // Formatear nombres de items de material
                if (budgetData.material && budgetData.material.items) {
                    budgetData.material.items = budgetData.material.items
                        .filter(item => {
                            const itemNameLower = item.name.toLowerCase()
                            return !itemNameLower.includes('serveur') &&
                                !itemNameLower.includes('servicio') &&
                                !itemNameLower.includes('mozos')
                        })
                        .map(item => ({
                            ...item,
                            name: formatItemName(item.name)
                        }))

                    // Recálculo inicial de material
                    if (budgetData.material.items.length > 0) {
                        let materialHT = 0
                        budgetData.material.items.forEach(item => {
                            item.total = item.quantity * item.pricePerUnit
                            materialHT += item.total
                        })
                        const insPct = (budgetData.material.insurancePct ?? 6) / 100
                        const insurance = materialHT * insPct
                        budgetData.material.insurancePct = insPct * 100
                        budgetData.material.insuranceAmount = insurance
                        const materialHTWithInsurance = materialHT + insurance
                        budgetData.material.totalHT = materialHTWithInsurance
                        budgetData.material.tva = materialHTWithInsurance * (budgetData.material.tvaPct / 100)
                        budgetData.material.totalTTC = budgetData.material.totalHT + budgetData.material.tva
                    } else {
                        delete budgetData.material
                    }
                }

                return budgetData
            }
            return null
        } catch (err) {
            setError('Error cargando presupuesto')
            console.error(err)
            return null
        } finally {
            setLoading(false)
        }
    }, [budgetId])

    useEffect(() => {
        if (budgetId) {
            loadBudget()
        }
    }, [budgetId, loadBudget])

    const saveBudget = async (editedData: BudgetData, summary: string = 'Edición manual') => {
        try {
            setSaving(true)

            const response = await fetch('/api/update-budget', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    budgetId,
                    budgetData: editedData,
                    editedBy: 'admin',
                    changesSummary: summary
                })
            })

            if (!response.ok) {
                throw new Error('Error al guardar')
            }

            const result = await response.json()
            console.log('✅ Cambios guardados:', result)

            // Recargar presupuesto para actualizar versión y estado
            const updatedData = await loadBudget()
            return { success: true, data: updatedData }
        } catch (err) {
            console.error('Error guardando:', err)
            return { success: false, error: err }
        } finally {
            setSaving(false)
        }
    }

    const deleteBudget = async () => {
        try {
            setSaving(true)
            const { error } = await supabase
                .from('budgets')
                .delete()
                .eq('id', budgetId)

            if (error) throw error
            return { success: true }
        } catch (err) {
            console.error('Error eliminando:', err)
            return { success: false, error: err }
        } finally {
            setSaving(false)
        }
    }

    const approveAndSend = async (clientEmail: string, clientName: string) => {
        try {
            setSaving(true)
            const response = await fetch('/api/approve-and-send-budget', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    budgetId,
                    clientEmail,
                    clientName
                })
            })

            const result = await response.json()
            if (!response.ok) throw new Error(result.error || 'Error al aprobar y enviar')

            await loadBudget()
            return { success: true, result }
        } catch (err) {
            console.error('Error aprobando:', err)
            return { success: false, error: err }
        } finally {
            setSaving(false)
        }
    }

    const generatePDF = async (currentData: BudgetData) => {
        try {
            setSaving(true)
            // Guardar primero
            await saveBudget(currentData, 'Guardado automático antes de PDF')

            const response = await fetch('/api/generate-budget-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ budgetId })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Error al generar PDF')
            }

            const result = await response.json()
            await loadBudget()
            return { success: true, pdfUrl: result.pdfUrl }
        } catch (err) {
            console.error('Error generando PDF:', err)
            return { success: false, error: err }
        } finally {
            setSaving(false)
        }
    }

    return {
        budget,
        loading,
        error,
        saving,
        loadBudget,
        saveBudget,
        deleteBudget,
        approveAndSend,
        generatePDF
    }
}
