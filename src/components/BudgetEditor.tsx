'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import './BudgetEditor.css'

// Función para formatear nombres con guiones
function formatItemName(name: string): string {
  if (!name) return ''
  
  // Casos específicos
  const replacements: { [key: string]: string } = {
    'verres-eau': 'Verres d\'eau',
    'verres-vin': 'Verres de vin',
    'verres-champagne': 'Verres de champagne',
    'mange-debout': 'Mange-debout',
    'assiettes-plates': 'Assiettes plates',
    'assiettes-creuses': 'Assiettes creuses',
  }
  
  const lowerName = name.toLowerCase()
  for (const [key, value] of Object.entries(replacements)) {
    if (lowerName.includes(key.toLowerCase())) {
      return value
    }
  }
  
  // Si no hay reemplazo específico, capitalizar palabras separadas por guiones
  return name
    .split(/([-_])/)
    .map((part) => {
      if (part === '-' || part === '_') {
        return part
      }
      if (part.length > 0) {
        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
      }
      return part
    })
    .join('')
}

// Tipos (importa estos desde Fuegos/lib/types/budget.ts en producción)
interface BudgetData {
  clientInfo: {
    name: string
    email: string
    phone: string
    eventDate: string
    eventType: string
    guestCount: number
    address: string
    menuType: 'dejeuner' | 'diner'
  }
  menu: {
    pricePerPerson: number
    totalPersons: number
    totalHT: number
    tva: number
    tvaPct: number
    totalTTC: number
    notes?: string
  }
  material?: {
    items: Array<{
      name: string
      quantity: number
      pricePerUnit: number
      total: number
    }>
    insurancePct?: number
    insuranceAmount?: number
    totalHT: number
    tva: number
    tvaPct: number
    totalTTC: number
    notes?: string
  }
  deliveryReprise?: {
    deliveryCost: number
    pickupCost: number
    totalHT: number
    tva: number
    tvaPct: number
    totalTTC: number
  }
  deplacement?: {
    distance: number
    pricePerKm: number
    totalHT: number
    tva: number
    tvaPct: number
    totalTTC: number
  }
  boissonsSoft?: {
    pricePerPerson: number
    totalPersons: number
    totalHT: number
    tva: number
    tvaPct: number
    totalTTC: number
  }
  service?: {
    mozos: number
    hours: number
    pricePerHour: number
    totalHT: number
    tva: number
    tvaPct: number
    totalTTC: number
  }
  totals: {
    totalHT: number
    totalTVA: number
    totalTTC: number
    discount?: {
      reason: string
      percentage: number
      amount: number
    }
  }
  notes?: string
}

interface Budget {
  id: string
  order_id: string
  version: number
  status: 'draft' | 'pending_review' | 'approved' | 'sent' | 'rejected'
  budget_data: BudgetData
  pdf_url?: string
  created_at: string
  updated_at: string
}

interface BudgetEditorProps {
  budgetId: string
  onBudgetDeleted?: () => void
}

export function BudgetEditor({ budgetId, onBudgetDeleted }: BudgetEditorProps) {
  const [budget, setBudget] = useState<Budget | null>(null)
  const [editedData, setEditedData] = useState<BudgetData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [materialExpanded, setMaterialExpanded] = useState(false)
  const [newMatName, setNewMatName] = useState('')
  const [newMatQty, setNewMatQty] = useState<number>(1)
  const [newMatPrice, setNewMatPrice] = useState<number>(0)

  // Cargar presupuesto
  useEffect(() => {
    loadBudget()
  }, [budgetId])

  const loadBudget = async () => {
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
        const budgetData = { ...data.budget_data } as BudgetData
        // Asegurar valores fijos para servicio si existe
        if (budgetData.service) {
          budgetData.service.pricePerHour = 40
          budgetData.service.tvaPct = 20
          // Recalcular con valores fijos
          const serviceHT = budgetData.service.mozos * budgetData.service.hours * 40
          budgetData.service.totalHT = serviceHT
          budgetData.service.tva = serviceHT * 0.20
          budgetData.service.totalTTC = serviceHT + budgetData.service.tva
        }
        // Formatear nombres de items de material y filtrar "Serveurs"
        if (budgetData.material && budgetData.material.items) {
          budgetData.material.items = budgetData.material.items
            .filter(item => {
              // Excluir items relacionados con "Serveurs" (case insensitive)
              const itemNameLower = item.name.toLowerCase()
              return !itemNameLower.includes('serveur') && 
                     !itemNameLower.includes('servicio') &&
                     !itemNameLower.includes('mozos')
            })
            .map(item => ({
              ...item,
              name: formatItemName(item.name)
            }))
          
          // Recalcular totales de material sin "Serveurs"
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
            // Si no quedan items, eliminar la sección de material
            delete budgetData.material
          }
        }
        setEditedData(budgetData)
      }
    } catch (err) {
      setError('Error cargando presupuesto')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Actualizar campo del presupuesto
  const updateField = (path: string, value: any) => {
    if (!editedData) return

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
  }

  // Recalcular totales automáticamente
  const recalculateTotals = (data: BudgetData): BudgetData => {
    const updated = { ...data }

    // Recalcular menú
    if (updated.menu) {
      const menuHT = updated.menu.pricePerPerson * updated.menu.totalPersons
      updated.menu.totalHT = menuHT
      updated.menu.tva = menuHT * (updated.menu.tvaPct / 100)
      updated.menu.totalTTC = menuHT + updated.menu.tva
    }

    // Recalcular servicio (valores fijos: 40€/hora HT, TVA 20%)
    if (updated.service) {
      // Asegurar valores fijos
      updated.service.pricePerHour = 40
      updated.service.tvaPct = 20
      const serviceHT = updated.service.mozos * updated.service.hours * updated.service.pricePerHour
      updated.service.totalHT = serviceHT
      updated.service.tva = serviceHT * (updated.service.tvaPct / 100)
      updated.service.totalTTC = serviceHT + updated.service.tva
    }

    // Recalcular material (excluyendo "Serveurs") y aplicar Seguro
    if (updated.material && updated.material.items) {
      let materialHT = 0
      updated.material.items
        .filter(item => {
          // Excluir items relacionados con "Serveurs"
          const itemNameLower = item.name.toLowerCase()
          return !itemNameLower.includes('serveur') && 
                 !itemNameLower.includes('servicio') &&
                 !itemNameLower.includes('mozos')
        })
        .forEach(item => {
          item.total = item.quantity * item.pricePerUnit
          materialHT += item.total
        })
      const insPct = (updated.material.insurancePct ?? 6) / 100
      const insurance = materialHT * insPct
      updated.material.insurancePct = insPct * 100
      updated.material.insuranceAmount = insurance
      const materialHTWithInsurance = materialHT + insurance
      updated.material.totalHT = materialHTWithInsurance
      updated.material.tva = materialHTWithInsurance * (updated.material.tvaPct / 100)
      updated.material.totalTTC = updated.material.totalHT + updated.material.tva
    }

    // Recalcular Livraison et Reprise
    if (updated.deliveryReprise) {
      const lrHT = (updated.deliveryReprise.deliveryCost || 0) + (updated.deliveryReprise.pickupCost || 0)
      updated.deliveryReprise.totalHT = lrHT
      updated.deliveryReprise.tva = lrHT * ((updated.deliveryReprise.tvaPct || 0) / 100)
      updated.deliveryReprise.totalTTC = updated.deliveryReprise.totalHT + updated.deliveryReprise.tva
    }

    // Recalcular Boissons Soft
    if (updated.boissonsSoft) {
      const bsHT = updated.boissonsSoft.pricePerPerson * updated.boissonsSoft.totalPersons
      updated.boissonsSoft.totalHT = bsHT
      // Asegurar TVA fijo del 20%
      updated.boissonsSoft.tvaPct = 20
      updated.boissonsSoft.tva = bsHT * 0.20
      updated.boissonsSoft.totalTTC = bsHT + updated.boissonsSoft.tva
    }

    // Recalcular desplazamiento
    if (updated.deplacement) {
      const deplacementHT = updated.deplacement.distance * updated.deplacement.pricePerKm
      updated.deplacement.totalHT = deplacementHT
      updated.deplacement.tva = deplacementHT * (updated.deplacement.tvaPct / 100)
      updated.deplacement.totalTTC = deplacementHT + updated.deplacement.tva
    }

    // Recalcular totales generales
    let totalHT = updated.menu.totalHT
    let totalTVA = updated.menu.tva

    if (updated.material) {
      totalHT += updated.material.totalHT
      totalTVA += updated.material.tva
    }

    if (updated.deliveryReprise) {
      totalHT += updated.deliveryReprise.totalHT
      totalTVA += updated.deliveryReprise.tva
    }

    if (updated.boissonsSoft) {
      totalHT += updated.boissonsSoft.totalHT
      totalTVA += updated.boissonsSoft.tva
    }

    if (updated.deplacement) {
      totalHT += updated.deplacement.totalHT
      totalTVA += updated.deplacement.tva
    }

    if (updated.service) {
      totalHT += updated.service.totalHT
      totalTVA += updated.service.tva
    }

    updated.totals = {
      ...updated.totals,
      totalHT,
      totalTVA,
      totalTTC: totalHT + totalTVA
    }

    return updated
  }

  // Guardar cambios
  const saveChanges = async () => {
    if (!editedData) return

    try {
      setSaving(true)
      
      const response = await fetch('/api/update-budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          budgetId,
          budgetData: editedData,
          editedBy: 'admin', // Aquí deberías usar el usuario actual
          changesSummary: 'Presupuesto editado manualmente desde Panel Admin'
        })
      })

      if (!response.ok) {
        throw new Error('Error al guardar')
      }

      const result = await response.json()
      console.log('✅ Cambios guardados:', result)
      alert('Cambios guardados exitosamente')
      
      // Recargar presupuesto
      await loadBudget()
    } catch (err) {
      console.error('Error guardando:', err)
      alert('Error al guardar cambios')
    } finally {
      setSaving(false)
    }
  }

  // Aprobar y enviar
  const approveAndSend = async () => {
    if (!editedData) return

    if (!budget?.pdf_url) {
      alert('⚠️ Por favor genera el PDF antes de aprobar y enviar')
      return
    }

    const confirmMessage = `¿Estás seguro de aprobar y enviar este presupuesto?\n\nCliente: ${editedData.clientInfo.name}\nEmail: ${editedData.clientInfo.email}\nTotal: ${editedData.totals.totalTTC.toFixed(2)}€`
    
    if (!window.confirm(confirmMessage)) {
      return
    }

    try {
      setSaving(true)
      
      const response = await fetch('/api/approve-and-send-budget', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          budgetId: budgetId,
          clientEmail: editedData.clientInfo.email,
          clientName: editedData.clientInfo.name
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al aprobar y enviar')
      }

      if (result.note) {
        // Mostrar nota si el email no se envió automáticamente
        const message = result.warning 
          ? `✅ Presupuesto aprobado exitosamente!\n\n⚠️ ${result.note}`
          : `✅ Presupuesto aprobado exitosamente!\n\n⚠️ ${result.note}\n\nPDF: ${result.pdfUrl}`
        alert(message)
      } else {
        alert('✅ Presupuesto aprobado y enviado al cliente por email')
      }
      
      await loadBudget()
    } catch (err) {
      console.error('Error aprobando:', err)
      alert(`❌ Error al aprobar presupuesto: ${err instanceof Error ? err.message : 'Error desconocido'}`)
    } finally {
      setSaving(false)
    }
  }

  // Eliminar presupuesto
  const deleteBudget = async () => {
    if (!window.confirm('⚠️ ¿Estás seguro de que quieres eliminar este presupuesto PERMANENTEMENTE?\n\nEsta acción no se puede deshacer.')) {
      return
    }

    try {
      setSaving(true)
      
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', budgetId)

      if (error) throw error

      alert('✅ Presupuesto eliminado correctamente')
      
      if (onBudgetDeleted) {
        onBudgetDeleted()
      } else {
        window.location.reload()
      }
      
    } catch (err) {
      console.error('Error eliminando:', err)
      alert('❌ Error al eliminar el presupuesto')
    } finally {
      setSaving(false)
    }
  }

  // Generar PDF (usa los datos editados actuales)
  const generatePDF = async () => {
    if (!editedData) return
    
    try {
      setSaving(true)
      
      // Primero guardar los cambios actuales para que el PDF use los datos editados
      const saveResponse = await fetch('/api/update-budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          budgetId,
          budgetData: editedData,
          editedBy: 'admin',
          changesSummary: 'Presupuesto editado antes de generar PDF'
        })
      })
      
      if (!saveResponse.ok) {
        console.warn('No se pudieron guardar cambios antes de generar PDF, continuando...')
      }
      
      const response = await fetch('/api/generate-budget-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ budgetId })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error del servidor:', errorData)
        throw new Error(errorData.error || 'Error al generar PDF')
      }

      const result = await response.json()
      console.log('✅ PDF generado:', result.pdfUrl)
      
      // Abrir PDF en nueva pestaña con cache-busting
      // Agregar timestamp adicional para forzar recarga
      const pdfUrlWithCache = `${result.pdfUrl}${result.pdfUrl.includes('?') ? '&' : '?'}_=${Date.now()}`
      window.open(pdfUrlWithCache, '_blank')
      
      await loadBudget()
    } catch (err) {
      console.error('Error generando PDF:', err)
      alert(`Error al generar PDF: ${err instanceof Error ? err.message : 'Error desconocido'}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="budget-editor-loading">Cargando presupuesto...</div>
  }

  if (error) {
    return <div className="budget-editor-error">{error}</div>
  }

  if (!editedData) {
    return <div className="budget-editor-error">No se pudo cargar el presupuesto</div>
  }

  return (
    <div className="budget-editor">
  
      <div className="budget-editor-header">
        <h1>Editor de Presupuesto</h1>
        <div className="budget-editor-status">
          <span className={`status-badge status-${budget?.status}`}>
            {budget?.status}
          </span>
          <span className="version-badge">v{budget?.version}</span>
          <button 
            onClick={deleteBudget}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '18px',
              marginLeft: '10px',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ef4444',
              borderRadius: '4px'
            }}
            title="Eliminar presupuesto"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Información del Cliente */}
      <section className="budget-section editable">
        <h2>📋 Información del Cliente</h2>
        <div className="edit-grid">
          <div className="edit-field">
            <label>Nombre</label>
            <input type="text" value={editedData.clientInfo.name} onChange={(e)=>updateField('clientInfo.name', e.target.value)} />
          </div>
          <div className="edit-field">
            <label>Email</label>
            <input type="email" value={editedData.clientInfo.email} onChange={(e)=>updateField('clientInfo.email', e.target.value)} />
          </div>
          <div className="edit-field">
            <label>Teléfono</label>
            <input type="text" value={editedData.clientInfo.phone} onChange={(e)=>updateField('clientInfo.phone', e.target.value)} />
          </div>
          <div className="edit-field">
            <label>Tipo de evento</label>
            <input type="text" value={editedData.clientInfo.eventType} onChange={(e)=>updateField('clientInfo.eventType', e.target.value)} />
          </div>
          <div className="edit-field">
            <label>Fecha</label>
            <input type="date" value={editedData.clientInfo.eventDate ? editedData.clientInfo.eventDate.substring(0,10) : ''} onChange={(e)=>updateField('clientInfo.eventDate', e.target.value)} />
          </div>
          <div className="edit-field">
            <label>Invitados</label>
            <input type="number" value={editedData.clientInfo.guestCount} min={0} onChange={(e)=>updateField('clientInfo.guestCount', parseInt(e.target.value)||0)} />
          </div>
        </div>
      </section>

      {/* MENÚ - EDITABLE */}
      <section className="budget-section editable">
        <h2>🍽️ Menú</h2>
        <div className="edit-grid">
          <div className="edit-field">
            <label>Precio por Persona (€)</label>
            <input
              type="number"
              value={editedData.menu.pricePerPerson}
              onChange={(e) => updateField('menu.pricePerPerson', parseFloat(e.target.value) || 0)}
              step="0.01"
              min="0"
            />
          </div>
          <div className="edit-field">
            <label>Total Personas</label>
            <input
              type="number"
              value={editedData.menu.totalPersons}
              onChange={(e) => updateField('menu.totalPersons', parseInt(e.target.value) || 0)}
              min="0"
            />
          </div>
          <div className="edit-field">
            <label>TVA (%)</label>
            <input
              type="number"
              value={editedData.menu.tvaPct}
              onChange={(e) => updateField('menu.tvaPct', parseFloat(e.target.value) || 0)}
              step="0.1"
              min="0"
              max="100"
            />
          </div>
        </div>
        <div className="totals-box">
          <div className="total-row">
            <span>Total HT:</span>
            <strong>{editedData.menu.totalHT.toFixed(2)} €</strong>
          </div>
          <div className="total-row">
            <span>TVA ({editedData.menu.tvaPct}%):</span>
            <strong>{editedData.menu.tva.toFixed(2)} €</strong>
          </div>
          <div className="total-row highlight">
            <span>Total TTC:</span>
            <strong>{editedData.menu.totalTTC.toFixed(2)} €</strong>
          </div>
        </div>
      </section>

      {/* SERVICIO (SERVEURS) - EDITABLE */}
      <section className="budget-section editable">
        <div className="section-header-with-delete">
          <h2>👔 Serveurs</h2>
          {editedData.service && (
            <button
              className="btn-delete-section"
              onClick={() => {
                if (window.confirm('¿Eliminar sección de Serveurs?')) {
                  setEditedData(prev => {
                    if (!prev) return prev
                    const newData = { ...prev }
                    delete newData.service
                    return recalculateTotals(newData)
                  })
                }
              }}
              title="Eliminar sección"
            >
              ✕
            </button>
          )}
        </div>
        
        {!editedData.service ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
            <p>No hay servicio configurado</p>
            <button
              className="btn btn-primary"
              onClick={() => {
                const newData = { ...editedData! }
                newData.service = {
                  mozos: 1,
                  hours: 1,
                  pricePerHour: 40,
                  totalHT: 40,
                  tva: 8,
                  tvaPct: 20,
                  totalTTC: 48
                }
                setEditedData(recalculateTotals(newData))
              }}
              style={{ marginTop: '10px' }}
            >
              ➕ Agregar Serveurs
            </button>
          </div>
        ) : (
          <>
            <div className="edit-grid">
              <div className="edit-field">
                <label>Mozos (Serveurs)</label>
                <input
                  type="number"
                  value={editedData.service.mozos}
                  onChange={(e) => {
                    const mozos = parseInt(e.target.value) || 0
                    updateField('service.mozos', mozos)
                    // Asegurar valores fijos
                    if (editedData.service) {
                      updateField('service.pricePerHour', 40)
                      updateField('service.tvaPct', 20)
                    }
                  }}
                  min="0"
                />
              </div>
              <div className="edit-field">
                <label>Horas</label>
                <input
                  type="number"
                  value={editedData.service.hours}
                  onChange={(e) => {
                    const hours = parseInt(e.target.value) || 0
                    updateField('service.hours', hours)
                    // Asegurar valores fijos
                    if (editedData.service) {
                      updateField('service.pricePerHour', 40)
                      updateField('service.tvaPct', 20)
                    }
                  }}
                  min="0"
                />
              </div>
            </div>
            <div className="info-display" style={{ marginTop: '10px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                <span style={{ color: '#6b7280', fontWeight: 600 }}>Precio por hora (HT):</span>
                <strong style={{ color: '#e2943a', fontSize: '16px' }}>40,00 €</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#6b7280', fontWeight: 600 }}>TVA:</span>
                <strong style={{ color: '#e2943a', fontSize: '16px' }}>20%</strong>
              </div>
              <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e5e7eb', fontSize: '12px', color: '#9ca3af', fontStyle: 'italic' }}>
                ⚙️ Valores fijos (no editables)
              </div>
            </div>
            <div className="totals-box">
              <div className="total-row">
                <span>Total HT:</span>
                <strong>{editedData.service.totalHT.toFixed(2)} €</strong>
              </div>
              <div className="total-row">
                <span>TVA (20%):</span>
                <strong>{editedData.service.tva.toFixed(2)} €</strong>
              </div>
              <div className="total-row highlight">
                <span>Total TTC:</span>
                <strong>{editedData.service.totalTTC.toFixed(2)} €</strong>
              </div>
            </div>
          </>
        )}
      </section>

      {/* MATERIAL - EDITABLE */}
      <section className="budget-section editable">
          <div className="section-header-with-delete">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
              <button
                onClick={() => setMaterialExpanded(!materialExpanded)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '18px',
                  color: '#e2943a',
                  padding: '0',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title={materialExpanded ? 'Colapsar' : 'Expandir'}
              >
                {materialExpanded ? '▼' : '▶'}
              </button>
              <h2 style={{ margin: 0 }}>📦 Material</h2>
            </div>
            <button
              className="btn-delete-section"
              onClick={() => {
                if (window.confirm('¿Eliminar sección de Material?')) {
                  setEditedData(prev => {
                    if (!prev) return prev
                    const newData = { ...prev }
                    delete newData.material
                    return recalculateTotals(newData)
                  })
                }
              }}
              title="Eliminar sección"
            >
              ✕
            </button>
          </div>
          {materialExpanded && (
            <>
          {!editedData.material ? (
            <div style={{ padding: '10px', textAlign: 'center', color: '#6b7280' }}>
              <p>No hay materiales configurados</p>
              <button
                className="btn btn-primary"
                onClick={() => {
                  const newData = { ...editedData! }
                  newData.material = { items: [], tvaPct: 20, totalHT: 0, tva: 0, totalTTC: 0, insurancePct: 6, insuranceAmount: 0 }
                  setEditedData(recalculateTotals(newData))
                }}
              >
                ➕ Agregar Material
              </button>
            </div>
          ) : (
            <>
          <div className="material-items-list">
            {editedData.material.items
              .filter(item => {
                // Excluir items relacionados con "Serveurs" (case insensitive)
                const itemNameLower = item.name.toLowerCase()
                return !itemNameLower.includes('serveur') && 
                       !itemNameLower.includes('servicio') &&
                       !itemNameLower.includes('mozos')
              })
              .map((item, filteredIndex) => {
                // Encontrar el índice real en el array original
                const realIndex = editedData.material!.items.findIndex(i => i === item)
                return (
              <div key={realIndex} className="material-item-row">
                <div className="edit-field">
                  <label>Item</label>
                  <input type="text" value={item.name} onChange={(e)=>{
                    const newData = { ...editedData! }
                    if (newData.material && newData.material.items) {
                      newData.material.items[realIndex].name = e.target.value
                      setEditedData(recalculateTotals(newData))
                    }
                  }} />
                </div>
                <div className="edit-field">
                  <label>Cantidad</label>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => {
                      const newData = { ...editedData! }
                      if (newData.material && newData.material.items) {
                        newData.material.items[realIndex].quantity = parseFloat(e.target.value) || 0
                        setEditedData(recalculateTotals(newData))
                      }
                    }}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="edit-field">
                  <label>Precio Unit. (€)</label>
                  <input
                    type="number"
                    value={item.pricePerUnit}
                    onChange={(e) => {
                      const newData = { ...editedData! }
                      if (newData.material && newData.material.items) {
                        newData.material.items[realIndex].pricePerUnit = parseFloat(e.target.value) || 0
                        setEditedData(recalculateTotals(newData))
                      }
                    }}
                    step="0.01"
                    min="0"
                  />
                </div>
                <div className="edit-field">
                  <label>Total</label>
                  <input
                    type="number"
                    value={item.total.toFixed(2)}
                    disabled
                    className="disabled-input"
                  />
                </div>
                <button
                  className="btn-delete-item"
                  onClick={() => {
                    const newData = { ...editedData! }
                    if (newData.material && newData.material.items) {
                      newData.material.items.splice(realIndex, 1)
                      if (newData.material.items.length === 0) {
                        delete newData.material
                      }
                      setEditedData(recalculateTotals(newData))
                    }
                  }}
                  title="Eliminar item"
                >
                  ✕
                </button>
              </div>
                )
              })}
          </div>
          <div className="material-item-row">
            <div className="edit-field">
              <label>Autre-Matériel (Nombre/Descripción)</label>
              <input type="text" value={newMatName} onChange={(e)=>setNewMatName(e.target.value)} placeholder="Ej. Centro de mesa personalizado" />
            </div>
            <div className="edit-field">
              <label>Cantidad</label>
              <input type="number" min="0" step="0.01" value={newMatQty} onChange={(e)=>setNewMatQty(parseFloat(e.target.value)||0)} />
            </div>
            <div className="edit-field">
              <label>Precio Unit. (€)</label>
              <input type="number" min="0" step="0.01" value={newMatPrice} onChange={(e)=>setNewMatPrice(parseFloat(e.target.value)||0)} />
            </div>
            <div className="edit-field">
              <label>&nbsp;</label>
              <button className="btn btn-primary" onClick={()=>{
                if (!editedData.material) return
                if (!newMatName.trim()) { alert('Ingresa un nombre'); return }
                const newData = { ...editedData! }
                if (newData.material) {
                  newData.material.items.push({ name: newMatName.trim(), quantity: newMatQty || 1, pricePerUnit: newMatPrice || 0, total: 0 })
                  setEditedData(recalculateTotals(newData))
                  setNewMatName(''); setNewMatQty(1); setNewMatPrice(0)
                }
              }}>Agregar otro material</button>
            </div>
          </div>
          <div className="edit-grid" style={{ marginTop: '10px' }}>
            <div className="edit-field">
              <label>TVA (%)</label>
              <input
                type="number"
                value={editedData.material.tvaPct}
                onChange={(e) => updateField('material.tvaPct', parseFloat(e.target.value) || 0)}
                step="0.1"
                min="0"
                max="100"
              />
            </div>
            <div className="edit-field">
              <label>Seguro (%)</label>
              <input
                type="number"
                value={editedData.material.insurancePct || 6}
                onChange={(e)=> updateField('material.insurancePct', parseFloat(e.target.value) || 0)}
                step="0.1"
                min="0"
                max="100"
              />
            </div>
          </div>
          <div className="totals-box">
            <div className="total-row">
              <span>Seguro ( {editedData.material.insurancePct || 6}% ):</span>
              <strong>{((editedData.material.insuranceAmount || 0)).toFixed(2)} €</strong>
            </div>
            <div className="total-row">
              <span>Total HT:</span>
              <strong>{editedData.material.totalHT.toFixed(2)} €</strong>
            </div>
            <div className="total-row">
              <span>TVA ({editedData.material.tvaPct}%):</span>
              <strong>{editedData.material.tva.toFixed(2)} €</strong>
            </div>
            <div className="total-row highlight">
              <span>Total TTC:</span>
              <strong>{editedData.material.totalTTC.toFixed(2)} €</strong>
            </div>
          </div>
            </>
          )}
          </>
        )}
      </section>

      {/* 🚚 Livraison et Reprise - EDITABLE */}
      {editedData.deliveryReprise && (
        <section className="budget-section editable">
          <div className="section-header-with-delete">
            <h2>🚚 Livraison et Reprise</h2>
            <button
              className="btn-delete-section"
              onClick={() => {
                if (window.confirm('¿Eliminar sección de Livraison et Reprise?')) {
                  setEditedData(prev => {
                    if (!prev) return prev
                    const newData = { ...prev }
                    delete newData.deliveryReprise
                    return recalculateTotals(newData)
                  })
                }
              }}
              title="Eliminar sección"
            >
              ✕
            </button>
          </div>
          <div className="edit-grid">
            <div className="edit-field">
              <label>Coste de entrega (€)</label>
              <input type="number" value={editedData.deliveryReprise.deliveryCost} onChange={(e)=>updateField('deliveryReprise.deliveryCost', parseFloat(e.target.value) || 0)} min="0" step="0.01" />
            </div>
            <div className="edit-field">
              <label>Coste de recogida (€)</label>
              <input type="number" value={editedData.deliveryReprise.pickupCost} onChange={(e)=>updateField('deliveryReprise.pickupCost', parseFloat(e.target.value) || 0)} min="0" step="0.01" />
            </div>
            <div className="edit-field">
              <label>TVA (%)</label>
              <input type="number" value={editedData.deliveryReprise.tvaPct} onChange={(e)=>updateField('deliveryReprise.tvaPct', parseFloat(e.target.value) || 0)} min="0" max="100" step="0.1" />
            </div>
          </div>
          <div className="totals-box">
            <div className="total-row">
              <span>Total HT:</span>
              <strong>{editedData.deliveryReprise.totalHT.toFixed(2)} €</strong>
            </div>
            <div className="total-row">
              <span>TVA ({editedData.deliveryReprise.tvaPct}%):</span>
              <strong>{editedData.deliveryReprise.tva.toFixed(2)} €</strong>
            </div>
            <div className="total-row highlight">
              <span>Total TTC:</span>
              <strong>{editedData.deliveryReprise.totalTTC.toFixed(2)} €</strong>
            </div>
          </div>
        </section>
      )}

      {!editedData.deliveryReprise && (
        <section className="budget-section editable">
          <div style={{ padding: '10px', textAlign: 'center', color: '#6b7280' }}>
            <p>No hay sección de Livraison et Reprise</p>
            <button className="btn btn-primary" onClick={()=>{
              const newData = { ...editedData! }
              newData.deliveryReprise = { deliveryCost: 0, pickupCost: 0, totalHT: 0, tva: 0, tvaPct: 20, totalTTC: 0 }
              setEditedData(recalculateTotals(newData))
            }}>➕ Agregar Livraison et Reprise</button>
          </div>
        </section>
      )}

      {/* BOISSONS SOFT - EDITABLE */}
      {editedData.boissonsSoft && (
        <section className="budget-section editable">
          <div className="section-header-with-delete">
            <h2>🥤 Boissons Soft</h2>
            <button
              className="btn-delete-section"
              onClick={() => {
                if (window.confirm('¿Eliminar sección de Boissons Soft?')) {
                  setEditedData(prev => {
                    if (!prev) return prev
                    const newData = { ...prev }
                    delete newData.boissonsSoft
                    return recalculateTotals(newData)
                  })
                }
              }}
              title="Eliminar sección"
            >
              ✕
            </button>
          </div>
          <div className="edit-grid">
            <div className="edit-field">
              <label>Precio por Persona (€)</label>
              <input
                type="number"
                value={editedData.boissonsSoft.pricePerPerson}
                onChange={(e) => updateField('boissonsSoft.pricePerPerson', parseFloat(e.target.value) || 0)}
                step="0.01"
                min="0"
              />
            </div>
            <div className="edit-field">
              <label>Total Personas</label>
              <input
                type="number"
                value={editedData.boissonsSoft.totalPersons}
                onChange={(e) => updateField('boissonsSoft.totalPersons', parseInt(e.target.value) || 0)}
                min="0"
              />
            </div>
          </div>
          <div className="info-display" style={{ marginTop: '10px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#6b7280', fontWeight: 600 }}>TVA:</span>
              <strong style={{ color: '#e2943a', fontSize: '16px' }}>20%</strong>
            </div>
            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e5e7eb', fontSize: '12px', color: '#9ca3af', fontStyle: 'italic' }}>
              ⚙️ Valor fijo (no editable)
            </div>
          </div>
          <div className="totals-box">
            <div className="total-row">
              <span>Total HT:</span>
              <strong>{editedData.boissonsSoft.totalHT.toFixed(2)} €</strong>
            </div>
            <div className="total-row">
              <span>TVA (20%):</span>
              <strong>{editedData.boissonsSoft.tva.toFixed(2)} €</strong>
            </div>
            <div className="total-row highlight">
              <span>Total TTC:</span>
              <strong>{editedData.boissonsSoft.totalTTC.toFixed(2)} €</strong>
            </div>
          </div>
        </section>
      )}

      {!editedData.boissonsSoft && (
        <section className="budget-section editable">
          <div style={{ padding: '10px', textAlign: 'center', color: '#6b7280' }}>
            <p>No hay sección de Boissons Soft</p>
            <button className="btn btn-primary" onClick={()=>{
              const newData = { ...editedData! }
              newData.boissonsSoft = {
                pricePerPerson: 0,
                totalPersons: 0,
                totalHT: 0,
                tva: 0,
                tvaPct: 20,
                totalTTC: 0
              }
              setEditedData(recalculateTotals(newData))
            }}>➕ Agregar Boissons Soft</button>
          </div>
        </section>
      )}

      {/* DESPLAZAMIENTO - EDITABLE */}
      {editedData.deplacement && editedData.deplacement.distance > 0 && (
        <section className="budget-section editable">
          <div className="section-header-with-delete">
            <h2>🚗 Desplazamiento</h2>
            <button
              className="btn-delete-section"
              onClick={() => {
                if (window.confirm('¿Eliminar sección de Desplazamiento?')) {
                  setEditedData(prev => {
                    if (!prev) return prev
                    const newData = { ...prev }
                    delete newData.deplacement
                    return recalculateTotals(newData)
                  })
                }
              }}
              title="Eliminar sección"
            >
              ✕
            </button>
          </div>
          <div className="edit-grid">
            <div className="edit-field">
              <label>Distancia (km)</label>
              <input
                type="number"
                value={editedData.deplacement.distance}
                onChange={(e) => updateField('deplacement.distance', parseFloat(e.target.value) || 0)}
                step="0.1"
                min="0"
              />
            </div>
            <div className="edit-field">
              <label>Precio por km (€)</label>
              <input
                type="number"
                value={editedData.deplacement.pricePerKm}
                onChange={(e) => updateField('deplacement.pricePerKm', parseFloat(e.target.value) || 0)}
                step="0.01"
                min="0"
              />
            </div>
            <div className="edit-field">
              <label>TVA (%)</label>
              <input
                type="number"
                value={editedData.deplacement.tvaPct}
                onChange={(e) => updateField('deplacement.tvaPct', parseFloat(e.target.value) || 0)}
                step="0.1"
                min="0"
                max="100"
              />
            </div>
          </div>
          <div className="totals-box">
            <div className="total-row">
              <span>Total HT:</span>
              <strong>{editedData.deplacement.totalHT.toFixed(2)} €</strong>
            </div>
            <div className="total-row">
              <span>TVA ({editedData.deplacement.tvaPct}%):</span>
              <strong>{editedData.deplacement.tva.toFixed(2)} €</strong>
            </div>
            <div className="total-row highlight">
              <span>Total TTC:</span>
              <strong>{editedData.deplacement.totalTTC.toFixed(2)} €</strong>
            </div>
          </div>
        </section>
      )}

      {/* TOTALES FINALES */}
      <section className="budget-section totals-final">
        <h2>💰 Totales Finales</h2>
        <div className="final-totals-box">
          <div className="total-row">
            <span>Total HT:</span>
            <strong>{editedData.totals.totalHT.toFixed(2)} €</strong>
          </div>
          <div className="total-row">
            <span>TVA Total:</span>
            <strong>{editedData.totals.totalTVA.toFixed(2)} €</strong>
          </div>
          <div className="total-row highlight-green">
            <span>TOTAL TTC:</span>
            <strong className="final-amount">{editedData.totals.totalTTC.toFixed(2)} €</strong>
          </div>
        </div>
      </section>

      {/* ACCIONES */}
      <div className="budget-actions">
        <button 
          className="btn btn-danger"
          onClick={deleteBudget}
          disabled={saving}
          style={{ backgroundColor: '#ef4444', color: 'white' }}
        >
          🗑️ Eliminar
        </button>
        <button 
          className="btn btn-secondary"
          onClick={() => window.open(`/api/preview-budget-html?budgetId=${budgetId}`, '_blank')}
          disabled={saving}
        >
          🎨 Vista Previa HTML
        </button>
        <button 
          className="btn btn-secondary"
          onClick={generatePDF}
          disabled={saving}
        >
          👁️ Vista Previa PDF
        </button>
        <button 
          className="btn btn-primary"
          onClick={saveChanges}
          disabled={saving}
        >
          💾 Guardar Cambios
        </button>
        <button 
          className="btn btn-success"
          onClick={approveAndSend}
          disabled={saving}
        >
          ✅ Aprobar y Enviar
        </button>
      </div>
      </div>
  )
}

