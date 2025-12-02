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
    totalHT: number
    tva: number
    tvaPct: number
    totalTTC: number
    notes?: string
  }
  deplacement?: {
    distance: number
    pricePerKm: number
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
}

export const BudgetEditor: React.FC<BudgetEditorProps> = ({ budgetId }) => {
  const [budget, setBudget] = useState<Budget | null>(null)
  const [editedData, setEditedData] = useState<BudgetData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [materialExpanded, setMaterialExpanded] = useState(false)

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
            budgetData.material.totalHT = materialHT
            budgetData.material.tva = materialHT * (budgetData.material.tvaPct / 100)
            budgetData.material.totalTTC = materialHT + budgetData.material.tva
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

    // Recalcular material (excluyendo "Serveurs")
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
      updated.material.totalHT = materialHT
      updated.material.tva = materialHT * (updated.material.tvaPct / 100)
      updated.material.totalTTC = materialHT + updated.material.tva
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
        </div>
      </div>

      {/* Información del Cliente */}
      <section className="budget-section">
        <h2>📋 Información del Cliente</h2>
        <div className="info-grid">
          <div className="info-item">
            <strong>Nombre:</strong> {editedData.clientInfo.name}
          </div>
          <div className="info-item">
            <strong>Email:</strong> {editedData.clientInfo.email}
          </div>
          <div className="info-item">
            <strong>Teléfono:</strong> {editedData.clientInfo.phone}
          </div>
          <div className="info-item">
            <strong>Evento:</strong> {editedData.clientInfo.eventType}
          </div>
          <div className="info-item">
            <strong>Fecha:</strong> {new Date(editedData.clientInfo.eventDate).toLocaleDateString('fr-FR')}
          </div>
          <div className="info-item">
            <strong>Invitados:</strong> {editedData.clientInfo.guestCount}
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
      {editedData.material && editedData.material.items && editedData.material.items.length > 0 && (
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
                  <div style={{ 
                    padding: '8px', 
                    backgroundColor: '#f9fafb', 
                    borderRadius: '6px', 
                    border: '1px solid #e5e7eb',
                    fontSize: '14px',
                    color: '#374151',
                    fontWeight: 500
                  }}>
                    {item.name}
                  </div>
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
          </div>
          <div className="totals-box">
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

