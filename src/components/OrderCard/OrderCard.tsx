'use client'

import { useState, useEffect } from 'react'
import { CateringOrder, EmailTemplate } from '@/types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Mail, Eye, Edit, ChevronDown, ChevronUp } from 'lucide-react'
import styles from './OrderCard.module.css'

interface OrderCardProps {
  order: CateringOrder
  isSelected: boolean
  onStatusChange: (orderId: string, newStatus: CateringOrder['status']) => void
  onSendEmail: (order: CateringOrder, template?: EmailTemplate) => void
  onViewDetails: (order: CateringOrder) => void
  onSelectionChange: (orderId: string, isSelected: boolean) => void
}

export default function OrderCard({
  order,
  isSelected,
  onStatusChange,
  onSendEmail,
  onViewDetails,
  onSelectionChange
}: OrderCardProps) {
  const [mounted, setMounted] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
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
            {(order.extras.wines || order.extras.equipment.length > 0 || order.extras.decoration || order.extras.specialRequest) && (
              <div className={styles.menuSection}>
                <h4>Extras</h4>
                <ul>
                  {order.extras.wines && <li>🍷 Vinos incluidos</li>}
                  {order.extras.decoration && <li>🎨 Decoración incluida</li>}
                  {order.extras.equipment.length > 0 && order.extras.equipment.map((equip, index) => (
                    <li key={index}>🔧 {equip}</li>
                  ))}
                  {order.extras.specialRequest && <li>📝 {order.extras.specialRequest}</li>}
                </ul>
              </div>
            )}
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
                onClick={() => onSendEmail(order)}
                className={`${styles.actionButton} ${styles.emailButton}`}
                title="Enviar email de relance"
              >
                <Mail size={16} />
                Relanzar Devis
              </button>
              
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
    </div>
  )
}