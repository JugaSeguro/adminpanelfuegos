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
          </div>

          {order.notes && (
            <div className={styles.notes}>
              <p>{order.notes}</p>
            </div>
          )}

          <div className={styles.actions}>
            <select
              value={order.status}
              onChange={(e) => onStatusChange(order.id, e.target.value as CateringOrder['status'])}
              className={`${styles.actionButton} ${styles.statusButton}`}
            >
              <option value="pending">Pendiente</option>
              <option value="sent">Enviado</option>
              <option value="approved">Aprobado</option>
              <option value="rejected">Rechazado</option>
            </select>
            
            <button
              onClick={() => onSendEmail(order)}
              className={`${styles.actionButton} ${styles.emailButton}`}
            >
              <Mail size={16} />
              Enviar Email
            </button>
            
            <button
              onClick={() => onViewDetails(order)}
              className={`${styles.actionButton} ${styles.viewButton}`}
            >
              <Eye size={16} />
              Ver Detalles
            </button>
          </div>
        </div>
      )}
    </div>
  )
}