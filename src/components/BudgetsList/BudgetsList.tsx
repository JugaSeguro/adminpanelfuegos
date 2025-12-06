import React, { useState } from 'react'
import { FileText, Eye, Clock, CheckCircle, Send, XCircle, Trash2 } from 'lucide-react'
import './BudgetsList.css'
import { useBudgets } from '@/hooks/useBudgets'
import { toast } from 'sonner'

interface Budget {
  id: string
  order_id: string
  version: number
  status: 'draft' | 'pending_review' | 'approved' | 'sent' | 'rejected'
  budget_data: any
  pdf_url?: string
  created_at: string
  updated_at: string
}

interface BudgetsListProps {
  onSelectBudget: (budgetId: string) => void
}

export default function BudgetsList({ onSelectBudget }: BudgetsListProps) {
  const { budgets, loading, deleteBudget, createManualBudget } = useBudgets()
  const [filter, setFilter] = useState<'all' | 'pending_review' | 'approved' | 'sent'>('all')

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <Clock className="status-icon" />
      case 'pending_review':
        return <Eye className="status-icon" />
      case 'approved':
        return <CheckCircle className="status-icon" />
      case 'sent':
        return <Send className="status-icon" />
      case 'rejected':
        return <XCircle className="status-icon" />
      default:
        return <FileText className="status-icon" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Borrador'
      case 'pending_review':
        return 'Pendiente Revisión'
      case 'approved':
        return 'Aprobado'
      case 'sent':
        return 'Enviado'
      case 'rejected':
        return 'Rechazado'
      default:
        return status
    }
  }

  const filteredBudgets = budgets.filter((budget: any) => {
    if (filter === 'all') return true
    return budget.status === filter
  })

  const handleDeleteBudget = async (e: React.MouseEvent, budgetId: string) => {
    e.stopPropagation()

    if (!window.confirm('⚠️ ¿Estás seguro de eliminar este presupuesto PERMANENTEMENTE?')) {
      return
    }

    try {
      await deleteBudget(budgetId)
      toast.success('Presupuesto eliminado correctamente')
    } catch (error) {
      console.error('Error eliminando:', error)
      toast.error('Error al eliminar el presupuesto')
    }
  }

  const handleCreateManual = async () => {
    try {
      const newBudget = await createManualBudget({
        status: 'draft',
        budget_data: {
          clientInfo: {
            name: '', email: '', phone: '', eventType: '', eventDate: '', guestCount: 0, address: '', menuType: 'dejeuner'
          },
          menu: { pricePerPerson: 0, totalPersons: 0, totalHT: 0, tvaPct: 10, tva: 0, totalTTC: 0 },
          service: null,
          material: { items: [], insurancePct: 6, insuranceAmount: 0, tvaPct: 20, totalHT: 0, tva: 0, totalTTC: 0 },
          deliveryReprise: { deliveryCost: 0, pickupCost: 0, tvaPct: 20, totalHT: 0, tva: 0, totalTTC: 0 },
          boissonsSoft: { pricePerPerson: 0, totalPersons: 0, totalHT: 0, tva: 0, tvaPct: 20, totalTTC: 0 },
          deplacement: null,
          totals: { totalHT: 0, totalTVA: 0, totalTTC: 0, discount: { percentage: 0, amount: 0, reason: '' } },
          validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          generatedBy: 'manual'
        }
      })
      onSelectBudget(newBudget.id)
      toast.success('Presupuesto creado')
    } catch (err) {
      toast.error('Error creando presupuesto')
    }
  }

  if (loading) {
    return (
      <div className="budgets-list-loading">
        <div className="spinner"></div>
        <p>Cargando presupuestos...</p>
      </div>
    )
  }

  return (
    <div className="budgets-list-container">
      <div className="budgets-list-header">
        <h2>💰 Presupuestos Generados</h2>
        <div className="budgets-list-stats">
          <span className="stat">
            Total: <strong>{budgets.length}</strong>
          </span>
          <span className="stat">
            Pendientes: <strong>{budgets.filter((b: any) => b.status === 'pending_review').length}</strong>
          </span>
          <span className="stat">
            Enviados: <strong>{budgets.filter((b: any) => b.status === 'sent').length}</strong>
          </span>
          <button
            className="create-manual-btn"
            onClick={handleCreateManual}
          >
            ➕ Crear Presupuesto Manual
          </button>
        </div>
      </div>

      <div className="budgets-list-filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Todos ({budgets.length})
        </button>
        <button
          className={`filter-btn ${filter === 'pending_review' ? 'active' : ''}`}
          onClick={() => setFilter('pending_review')}
        >
          Pendientes ({budgets.filter(b => b.status === 'pending_review').length})
        </button>
        <button
          className={`filter-btn ${filter === 'approved' ? 'active' : ''}`}
          onClick={() => setFilter('approved')}
        >
          Aprobados ({budgets.filter(b => b.status === 'approved').length})
        </button>
        <button
          className={`filter-btn ${filter === 'sent' ? 'active' : ''}`}
          onClick={() => setFilter('sent')}
        >
          Enviados ({budgets.filter(b => b.status === 'sent').length})
        </button>
      </div>

      {filteredBudgets.length === 0 ? (
        <div className="budgets-list-empty">
          <FileText size={48} />
          <h3>No hay presupuestos</h3>
          <p>Los presupuestos generados aparecerán aquí automáticamente</p>
        </div>
      ) : (
        <div className="budgets-list-grid">
          {filteredBudgets.map((budget) => {
            const clientInfo = budget.budget_data?.clientInfo || {}
            const totals = budget.budget_data?.totals || {}

            return (
              <div key={budget.id} className="budget-card">
                <div className="budget-card-header">
                  <div className={`budget-status status-${budget.status}`}>
                    {getStatusIcon(budget.status)}
                    <span>{getStatusLabel(budget.status)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="budget-version">v{budget.version}</span>
                    <button
                      className="btn-delete-card"
                      onClick={(e) => handleDeleteBudget(e, budget.id)}
                      title="Eliminar presupuesto"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="budget-card-body">
                  <h3 className="budget-client-name">
                    {clientInfo.name || 'Cliente'}
                  </h3>
                  <p className="budget-client-email">{clientInfo.email}</p>

                  <div className="budget-details">
                    <div className="budget-detail">
                      <span className="label">Evento:</span>
                      <span className="value">{clientInfo.eventType || '-'}</span>
                    </div>
                    <div className="budget-detail">
                      <span className="label">Invitados:</span>
                      <span className="value">{clientInfo.guestCount || 0} pers.</span>
                    </div>
                    <div className="budget-detail">
                      <span className="label">Fecha:</span>
                      <span className="value">
                        {clientInfo.eventDate ? new Date(clientInfo.eventDate).toLocaleDateString('fr-FR') : '-'}
                      </span>
                    </div>
                  </div>

                  <div className="budget-total">
                    <span className="total-label">Total TTC</span>
                    <span className="total-amount">
                      {totals.totalTTC ? `${totals.totalTTC.toFixed(2)} €` : '-'}
                    </span>
                  </div>
                </div>

                <div className="budget-card-footer">
                  <button
                    className="btn-view-budget"
                    onClick={() => onSelectBudget(budget.id)}
                  >
                    <Eye size={16} />
                    Ver y Editar
                  </button>
                  {budget.pdf_url && (
                    <a
                      href={budget.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-view-pdf"
                    >
                      <FileText size={16} />
                      Ver PDF
                    </a>
                  )}
                </div>

                <div className="budget-card-meta">
                  <span>Creado: {new Date(budget.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

