'use client'

import { useState, useEffect, memo } from 'react'
import { CateringOrder, EmailTemplate } from '@/types'
import { format, differenceInDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { Mail, Eye, Edit, ChevronDown, ChevronUp, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { emailTemplates } from '@/data/mockData'
import styles from './OrderCard.module.css'

interface OrderCardProps {
  order: CateringOrder
  isSelected: boolean
  onStatusChange: (orderId: string, newStatus: CateringOrder['status']) => void
  onSendEmail: (order: CateringOrder, template?: EmailTemplate) => void
  onViewDetails: (order: CateringOrder) => void
  onSelectionChange: (orderId: string, isSelected: boolean) => void
  onUpdateOrder?: (orderId: string, updates: Partial<CateringOrder>) => void
}

const OrderCard = ({
  order,
  isSelected,
  onStatusChange,
  onSendEmail,
  onViewDetails,
  onSelectionChange,
  onUpdateOrder
}: OrderCardProps) => {
  const [mounted, setMounted] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [relanceModalOpen, setRelanceModalOpen] = useState(false)
  const [lastRelanceDate, setLastRelanceDate] = useState<string | null>(null)
  const [extrasView, setExtrasView] = useState<'compact' | 'detailed'>('compact')

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isExpanded) {
      const fetchLastRelance = async () => {
        const { data } = await supabase
          .from('email_logs')
          .select('sent_at')
          .eq('order_id', order.id)
          .eq('subject', 'Relance - Votre devis Fuegos d\'Azur') // Asunto del template ID 5
          .order('sent_at', { ascending: false })
          .limit(1)

        if (data && data.length > 0) {
          setLastRelanceDate(data[0].sent_at)
        }
      }
      fetchLastRelance()
    }
  }, [isExpanded, order.id])



  const handleRelanceClick = () => {
    setRelanceModalOpen(true)
  }

  const confirmRelance = async () => {
    try {
      const template = emailTemplates.find(t => t.id === '5') // Relance devis
      if (!template) return

      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          templateId: template.id
        })
      })

      if (response.ok) {
        setLastRelanceDate(new Date().toISOString())
        setRelanceModalOpen(false)
        alert('Email de relance enviado correctamente')
      } else {
        alert('Error al enviar el email')
      }
    } catch (e) {
      console.error(e)
      alert('Error al enviar el email')
    }
  }

  const getDaysSinceRelance = () => {
    if (!lastRelanceDate) return null
    return differenceInDays(new Date(), new Date(lastRelanceDate))
  }
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: es })
    } catch {
      return dateString
    }
  }

  const getStatusText = (status: CateringOrder['status']) => {
    switch (status) {
      case 'pending': return 'Pendiente'
      case 'sent': return 'Enviado'
      case 'approved': return 'Aprobado'
      case 'rejected': return 'Rechazado'
      default: return status
    }
  }

  const getEventTypeText = (eventType: string) => {
    switch (eventType) {
      case 'mariage': return 'Boda'
      case 'anniversaire': return 'Cumpleaños'
      case 'bapteme': return 'Bautizo'
      case 'corporatif': return 'Corporativo'
      case 'autre': return 'Otro'
      default: return eventType
    }
  }

  return (
    <div className={`${styles.card} ${isExpanded ? styles.expanded : styles.collapsed}`}>
      {/* Vista compacta - siempre visible */}
      <div className={styles.compactView}>
        <div className={styles.compactHeader}>
          <div className={styles.clientInfo}>
            <h3>{order.contact.name}</h3>
            <p className={styles.email}>{order.contact.email}</p>
            <p className={styles.phone}>{order.contact.phone}</p>
            <p className={styles.eventDate}>📅 {formatDate(order.contact.eventDate)}</p>
          </div>
          <div className={styles.compactRight}>
            <span className={`${styles.status} ${styles[order.status]}`}>
              {getStatusText(order.status)}
            </span>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={styles.expandButton}
              aria-label={isExpanded ? 'Contraer tarjeta' : 'Expandir tarjeta'}
            >
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Vista expandida - solo visible cuando isExpanded es true */}
      {isExpanded && (
        <div className={styles.expandedContent}>
          <div className={styles.details}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Fecha del evento:</span>
              <span className={styles.detailValue}>{formatDate(order.contact.eventDate)}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Tipo de evento:</span>
              <span className={styles.detailValue}>{getEventTypeText(order.contact.eventType)}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Invitados:</span>
              <span className={styles.detailValue}>{order.contact.guestCount}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Tipo de menú:</span>
              <span className={styles.detailValue}>
                {order.menu.type === 'dejeuner' ? 'Almuerzo' : order.menu.type === 'diner' ? 'Cena' : 'No especificado'}
              </span>
            </div>
            {order.estimatedPrice && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Precio estimado:</span>
                <span className={`${styles.detailValue} ${styles.price}`}>
                  €{mounted ? order.estimatedPrice.toLocaleString() : order.estimatedPrice}
                </span>
              </div>
            )}
          </div>

          <div className={styles.menuItems}>
            {order.entrees.length > 0 && (
              <div className={styles.menuSection}>
                <h4>Entrantes</h4>
                <ul>
                  {order.entrees.map((entree, index) => (
                    <li key={index}>{entree}</li>
                  ))}
                </ul>
              </div>
            )}

            {order.viandes.length > 0 && (
              <div className={styles.menuSection}>
                <h4>Carnes</h4>
                <ul>
                  {order.viandes.map((viande, index) => (
                    <li key={index}>{viande}</li>
                  ))}
                </ul>
              </div>
            )}

            {order.dessert && (
              <div className={styles.menuSection}>
                <h4>Postre</h4>
                <ul>
                  <li>{order.dessert}</li>
                </ul>
              </div>
            )}

            {/* Extras */}
            <div className={styles.menuSection}>
              <h4>Extras</h4>
              <select
                className={styles.extrasSelect}
                value={extrasView}
                onChange={(e) => setExtrasView(e.target.value as 'compact' | 'detailed')}
              >
                <option value="compact">Vista compacta</option>
                <option value="detailed">Vista detallada</option>
              </select>

              {extrasView === 'detailed' ? (
                <div className={styles.extrasChips}>
                  {order.extras.wines && (
                    <span className={`${styles.chip} ${styles.wines}`}>🍷 Vinos incluidos</span>
                  )}
                  {order.extras.decoration && (
                    <span className={`${styles.chip} ${styles.decoration}`}>🎨 Decoración incluida</span>
                  )}
                  {order.extras.equipment.length > 0 && order.extras.equipment.map((equip, index) => (
                    <span key={index} className={`${styles.chip} ${styles.equipment}`}>🔧 {equip}</span>
                  ))}
                  {order.extras.specialRequest && (
                    <span className={`${styles.chip} ${styles.request}`}>📝 {order.extras.specialRequest}</span>
                  )}
                </div>
              ) : (
                <div className={styles.extrasChips}>
                  {order.extras.wines && (
                    <span className={`${styles.chip} ${styles.wines}`}>🍷 Vinos</span>
                  )}
                  {order.extras.decoration && (
                    <span className={`${styles.chip} ${styles.decoration}`}>🎨 Decoración</span>
                  )}
                  {order.extras.equipment.length > 0 && (
                    <span className={`${styles.chip} ${styles.equipment}`}>
                      🔧 <span className={styles.chipCount}>{order.extras.equipment.length}</span> ítems
                    </span>
                  )}
                  {order.extras.specialRequest && (
                    <span className={`${styles.chip} ${styles.request}`}>📝 {order.extras.specialRequest}</span>
                  )}
                  {!(order.extras.wines || order.extras.decoration || order.extras.equipment.length > 0 || order.extras.specialRequest) && (
                    <span className={styles.chip}>Sin extras</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {order.notes && (
            <div className={styles.notes}>
              <p>{order.notes}</p>
            </div>
          )}

          <div className={styles.actions}>
            {/* Sección de Estado - Botones en lugar de dropdown */}
            <div className={styles.statusSection}>
              <label className={styles.statusLabel}>Estado:</label>
              <div className={styles.statusButtons}>
                <button
                  onClick={() => onStatusChange(order.id, 'pending')}
                  className={`${styles.statusBtn} ${order.status === 'pending' ? `${styles.statusBtnActive} ${styles.pending}` : ''}`}
                  title="Marcar como Pendiente"
                >
                  Pendiente
                </button>
                <button
                  onClick={() => onStatusChange(order.id, 'sent')}
                  className={`${styles.statusBtn} ${order.status === 'sent' ? `${styles.statusBtnActive} ${styles.sent}` : ''}`}
                  title="Marcar como Enviado"
                >
                  Enviado
                </button>
                <button
                  onClick={() => onStatusChange(order.id, 'approved')}
                  className={`${styles.statusBtn} ${order.status === 'approved' ? `${styles.statusBtnActive} ${styles.approved}` : ''}`}
                  title="Marcar como Aprobado"
                >
                  Aprobado
                </button>
                <button
                  onClick={() => onStatusChange(order.id, 'rejected')}
                  className={`${styles.statusBtn} ${order.status === 'rejected' ? `${styles.statusBtnActive} ${styles.rejected}` : ''}`}
                  title="Marcar como Rechazado"
                >
                  Rechazado
                </button>
              </div>
            </div>

            {/* Sección de Acciones */}
            <div className={styles.actionButtons}>
              <button
                onClick={handleRelanceClick}
                className={`${styles.actionButton} ${styles.emailButton}`}
                title="Enviar email de relance"
              >
                <Mail size={16} />
                Relanzar Devis
              </button>

              {lastRelanceDate && (
                <div className={styles.relanceInfo}>
                  <Clock size={14} />
                  <span>Último envío: hace {getDaysSinceRelance()} días</span>
                </div>
              )}

              <button
                onClick={() => onViewDetails(order)}
                className={`${styles.actionButton} ${styles.viewButton}`}
                title="Ver detalles completos"
              >
                <Eye size={16} />
                Ver Detalles
              </button>
            </div>
          </div>
        </div>
      )}
      {relanceModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Confirmar Relanzamiento</h3>
            <p>¿Estás de acuerdo en enviar el email de relance a:</p>
            <p><strong>{order.contact.name}</strong> ({order.contact.email})?</p>
            <div className={styles.modalButtons}>
              <button onClick={() => setRelanceModalOpen(false)} className={styles.cancelButton}>Cancelar</button>
              <button onClick={confirmRelance} className={styles.confirmButton}>Sí, enviar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default memo(OrderCard)
