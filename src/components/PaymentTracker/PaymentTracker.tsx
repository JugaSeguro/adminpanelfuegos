'use client'

import { useState, useEffect, useMemo } from 'react'
import { CateringOrder, PaymentRecord, PaymentInfo } from '@/types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Plus, Edit, Eye, CreditCard } from 'lucide-react'
import styles from './PaymentTracker.module.css'

interface PaymentTrackerProps {
  orders: CateringOrder[]
  onUpdatePayment: (orderId: string, payment: PaymentInfo) => void
}

interface PaymentFormData {
  amount: number
  method: 'cash' | 'card' | 'transfer' | 'check'
  paymentType: 'blanco' | 'negro'
  reference: string
  notes: string
}

export default function PaymentTracker({ orders, onUpdatePayment }: PaymentTrackerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<CateringOrder | null>(null)
  const [formData, setFormData] = useState<PaymentFormData>({
    amount: 0,
    method: 'card',
    paymentType: 'blanco',
    reference: '',
    notes: ''
  })
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Calcular estadísticas de pagos (memoizado para evitar recálculos innecesarios)
  const paymentStats = useMemo(() => {
    return orders.reduce((stats, order) => {
      if (!order.payment || !order.estimatedPrice) return stats

      const payment = order.payment
      
      if (payment.paymentStatus === 'pending') {
        stats.pending.amount += payment.pendingAmount
        stats.pending.count++
      } else if (payment.paymentStatus === 'partial') {
        stats.partial.amount += payment.pendingAmount
        stats.partial.count++
      } else if (payment.paymentStatus === 'completed') {
        stats.completed.amount += payment.totalAmount
        stats.completed.count++
      }

      return stats
    }, {
      pending: { amount: 0, count: 0 },
      partial: { amount: 0, count: 0 },
      completed: { amount: 0, count: 0 }
    })
  }, [orders])

  // Filtrar órdenes que necesitan seguimiento de pagos (memoizado)
  const ordersWithPayments = useMemo(() => {
    return orders.filter(order => 
      order.estimatedPrice && order.status === 'approved'
    )
  }, [orders])

  const handleAddPayment = (order: CateringOrder) => {
    setSelectedOrder(order)
    setFormData({
      amount: order.payment?.pendingAmount || order.estimatedPrice || 0,
      method: 'card',
      paymentType: 'blanco',
      reference: '',
      notes: ''
    })
    setIsModalOpen(true)
  }

  const handleSubmitPayment = () => {
    if (!selectedOrder) return

    const newPaymentRecord: PaymentRecord = {
      id: Date.now().toString(),
      amount: formData.amount,
      date: new Date().toISOString(),
      method: formData.method,
      paymentType: formData.paymentType,
      reference: formData.reference,
      notes: formData.notes
    }

    const currentPayment = selectedOrder.payment || {
      totalAmount: selectedOrder.estimatedPrice || 0,
      paidAmount: 0,
      pendingAmount: selectedOrder.estimatedPrice || 0,
      paymentStatus: 'pending' as const,
      paymentHistory: []
    }

    const newPaidAmount = currentPayment.paidAmount + formData.amount
    const newPendingAmount = currentPayment.totalAmount - newPaidAmount

    const updatedPayment: PaymentInfo = {
      ...currentPayment,
      paidAmount: newPaidAmount,
      pendingAmount: Math.max(0, newPendingAmount),
      paymentStatus: newPendingAmount <= 0 ? 'completed' : 
                   newPaidAmount > 0 ? 'partial' : 'pending',
      paymentHistory: [...currentPayment.paymentHistory, newPaymentRecord]
    }

    onUpdatePayment(selectedOrder.id, updatedPayment)
    setIsModalOpen(false)
    setSelectedOrder(null)
  }

  const formatCurrency = (amount: number) => {
    if (!isMounted) return amount.toString()
    return amount.toLocaleString('es-ES', {
      style: 'currency',
      currency: 'EUR'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'pending'
      case 'partial': return 'partial'
      case 'completed': return 'completed'
      default: return 'pending'
    }
  }

  const isOverdue = (order: CateringOrder) => {
    if (!order.payment?.dueDate) return false
    return new Date(order.payment.dueDate) < new Date()
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Seguimiento de Pagos</h2>
      </div>

      {/* Resumen de pagos */}
      <div className={styles.summary}>
        <div className={`${styles.summaryCard} ${styles.pending}`}>
          <div className={styles.summaryLabel}>Pendientes</div>
          <div className={styles.summaryValue}>
            {formatCurrency(paymentStats.pending.amount)}
          </div>
          <div className={styles.summaryCount}>
            {paymentStats.pending.count} pedidos
          </div>
        </div>

        <div className={`${styles.summaryCard} ${styles.partial}`}>
          <div className={styles.summaryLabel}>Parciales</div>
          <div className={styles.summaryValue}>
            {formatCurrency(paymentStats.partial.amount)}
          </div>
          <div className={styles.summaryCount}>
            {paymentStats.partial.count} pedidos
          </div>
        </div>

        <div className={`${styles.summaryCard} ${styles.completed}`}>
          <div className={styles.summaryLabel}>Completados</div>
          <div className={styles.summaryValue}>
            {formatCurrency(paymentStats.completed.amount)}
          </div>
          <div className={styles.summaryCount}>
            {paymentStats.completed.count} pedidos
          </div>
        </div>
      </div>

      {/* Lista de pagos */}
      <div className={styles.paymentsList}>
        <h3 className={styles.sectionTitle}>Pagos por Gestionar</h3>
        
        {ordersWithPayments.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>💳</div>
            <div className={styles.emptyText}>No hay pagos por gestionar</div>
            <div className={styles.emptySubtext}>
              Los pagos aparecerán aquí cuando tengas pedidos aprobados
            </div>
          </div>
        ) : (
          ordersWithPayments.map(order => {
            const payment = order.payment
            const paymentStatus = payment?.paymentStatus || 'pending'
            const pendingAmount = payment?.pendingAmount || order.estimatedPrice || 0
            
            return (
              <div key={order.id} className={styles.paymentItem}>
                <div className={styles.paymentInfo}>
                  <div className={styles.clientName}>{order.contact.name}</div>
                  <div className={styles.paymentDetails}>
                    Evento: {format(new Date(order.contact.eventDate), 'dd/MM/yyyy', { locale: es })} • 
                    {order.contact.eventType}
                    {payment?.paymentHistory.length ? (
                      <span> • {payment.paymentHistory.length} pagos registrados</span>
                    ) : null}
                  </div>
                </div>

                <div className={styles.paymentAmount}>
                  <div className={styles.amount}>
                    {formatCurrency(pendingAmount)}
                  </div>
                  {isOverdue(order) && (
                    <div className={styles.dueDate}>Vencido</div>
                  )}
                </div>

                <div className={`${styles.status} ${styles[getStatusColor(paymentStatus)]}`}>
                  {paymentStatus === 'pending' ? 'Pendiente' :
                   paymentStatus === 'partial' ? 'Parcial' : 'Completado'}
                </div>

                <div className={styles.actions}>
                  <button
                    className={styles.actionBtn}
                    onClick={() => handleAddPayment(order)}
                    title="Registrar pago"
                  >
                    <Plus size={16} />
                  </button>
                  <button
                    className={styles.actionBtn}
                    title="Ver historial"
                  >
                    <Eye size={16} />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Modal para agregar pago */}
      {isModalOpen && selectedOrder && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Registrar Pago</h3>
              <button
                className={styles.closeBtn}
                onClick={() => setIsModalOpen(false)}
              >
                ×
              </button>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Cliente</label>
              <div style={{ padding: '8px 12px', background: '#f9fafb', borderRadius: '6px' }}>
                {selectedOrder.contact.name}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Monto Pendiente</label>
              <div style={{ padding: '8px 12px', background: '#f9fafb', borderRadius: '6px' }}>
                {formatCurrency(selectedOrder.payment?.pendingAmount || selectedOrder.estimatedPrice || 0)}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Monto del Pago *</label>
              <input
                type="number"
                className={styles.input}
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Método de Pago *</label>
              <select
                className={styles.select}
                value={formData.method}
                onChange={(e) => setFormData({ ...formData, method: e.target.value as any })}
                required
              >
                <option value="card">Tarjeta</option>
                <option value="cash">Efectivo</option>
                <option value="transfer">Transferencia</option>
                <option value="check">Cheque</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Tipo de Pago *</label>
              <select
                className={styles.select}
                value={formData.paymentType}
                onChange={(e) => setFormData({ ...formData, paymentType: e.target.value as any })}
                required
              >
                <option value="blanco">Blanco</option>
                <option value="negro">Negro</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Referencia</label>
              <input
                type="text"
                className={styles.input}
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                placeholder="Número de transacción, cheque, etc."
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Notas</label>
              <textarea
                className={styles.textarea}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notas adicionales sobre el pago..."
              />
            </div>

            <div className={styles.modalActions}>
              <button
                className={styles.cancelBtn}
                onClick={() => setIsModalOpen(false)}
              >
                Cancelar
              </button>
              <button
                className={styles.saveBtn}
                onClick={handleSubmitPayment}
                disabled={!formData.amount || formData.amount <= 0}
              >
                Registrar Pago
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}