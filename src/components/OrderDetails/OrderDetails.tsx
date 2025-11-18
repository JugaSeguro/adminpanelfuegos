import { CateringOrder } from '@/types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import styles from './OrderDetails.module.css'

interface OrderDetailsProps {
  order: CateringOrder
  isOpen: boolean
  onClose: () => void
}

export default function OrderDetails({ order, isOpen, onClose }: OrderDetailsProps) {
  if (!isOpen) return null

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: es })
    } catch {
      return dateString
    }
  }

  const formatEventDate = (dateString: string) => {
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
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Detalles del Pedido</h2>
          <p className={styles.subtitle}>ID: {order.id}</p>
        </div>

        <div className={styles.content}>
          {/* Información del Cliente */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Información del Cliente</h3>
            <div className={styles.grid}>
              <div className={styles.field}>
                <p className={styles.fieldLabel}>Nombre</p>
                <p className={styles.fieldValue}>{order.contact.name}</p>
              </div>
              <div className={styles.field}>
                <p className={styles.fieldLabel}>Email</p>
                <p className={styles.fieldValue}>{order.contact.email}</p>
              </div>
              <div className={styles.field}>
                <p className={styles.fieldLabel}>Teléfono</p>
                <p className={styles.fieldValue}>{order.contact.phone}</p>
              </div>
              <div className={styles.field}>
                <p className={styles.fieldLabel}>Dirección</p>
                <p className={styles.fieldValue}>{order.contact.address}</p>
              </div>
            </div>
          </div>

          {/* Información del Evento */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Información del Evento</h3>
            <div className={styles.grid}>
              <div className={styles.field}>
                <p className={styles.fieldLabel}>Fecha del Evento</p>
                <p className={styles.fieldValue}>{formatEventDate(order.contact.eventDate)}</p>
              </div>
              <div className={styles.field}>
                <p className={styles.fieldLabel}>Tipo de Evento</p>
                <p className={styles.fieldValue}>{getEventTypeText(order.contact.eventType)}</p>
              </div>
              <div className={styles.field}>
                <p className={styles.fieldLabel}>Número de Invitados</p>
                <p className={styles.fieldValue}>{order.contact.guestCount}</p>
              </div>
              <div className={styles.field}>
                <p className={styles.fieldLabel}>Tipo de Menú</p>
                <p className={styles.fieldValue}>
                  {order.menu.type === 'dejeuner' ? 'Almuerzo' : order.menu.type === 'diner' ? 'Cena' : 'No especificado'}
                </p>
              </div>
            </div>
          </div>

          {/* Selección de Menú */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Selección de Menú</h3>
            <div className={styles.menuGrid}>
              {order.entrees.length > 0 && (
                <div className={styles.menuSection}>
                  <h4 className={styles.menuSectionTitle}>Entrantes</h4>
                  <ul className={styles.menuList}>
                    {order.entrees.map((entree, index) => (
                      <li key={index} className={styles.menuItem}>{entree}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {order.viandes.length > 0 && (
                <div className={styles.menuSection}>
                  <h4 className={styles.menuSectionTitle}>Carnes</h4>
                  <ul className={styles.menuList}>
                    {order.viandes.map((viande, index) => (
                      <li key={index} className={styles.menuItem}>{viande}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {order.dessert && (
                <div className={styles.menuSection}>
                  <h4 className={styles.menuSectionTitle}>Postre</h4>
                  <ul className={styles.menuList}>
                    <li className={styles.menuItem}>{order.dessert}</li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Servicios Extras */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Servicios Extras</h3>
            <div className={styles.extrasGrid}>
              <div className={styles.extraItem}>
                <span className={`${styles.checkmark} ${order.extras.wines ? styles.yes : styles.no}`}>
                  {order.extras.wines ? '✓' : '✗'}
                </span>
                Vinos incluidos
              </div>
              <div className={styles.extraItem}>
                <span className={`${styles.checkmark} ${order.extras.decoration ? styles.yes : styles.no}`}>
                  {order.extras.decoration ? '✓' : '✗'}
                </span>
                Decoración
              </div>
            </div>
            
            {order.extras.equipment.length > 0 && (
              <div className={styles.field}>
                <p className={styles.fieldLabel}>Equipamiento solicitado</p>
                <p className={styles.fieldValue}>{order.extras.equipment.join(', ')}</p>
              </div>
            )}
            
            {order.extras.specialRequest && (
              <div className={styles.specialRequest}>
                <p className={styles.specialRequestTitle}>Solicitud Especial</p>
                <p className={styles.specialRequestText}>{order.extras.specialRequest}</p>
              </div>
            )}
          </div>

          {/* Estado y Precio */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Estado del Pedido</h3>
            <div className={styles.grid}>
              <div className={styles.field}>
                <p className={styles.fieldLabel}>Estado Actual</p>
                <p className={styles.fieldValue}>{getStatusText(order.status)}</p>
              </div>
              {order.estimatedPrice && (
                <div className={styles.field}>
                  <p className={styles.fieldLabel}>Precio Estimado</p>
                  <p className={styles.fieldValue}>€{order.estimatedPrice.toLocaleString()}</p>
                </div>
              )}
            </div>
            
            {order.notes && (
              <div className={styles.field}>
                <p className={styles.fieldLabel}>Notas</p>
                <p className={styles.fieldValue}>{order.notes}</p>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Historial</h3>
            <div className={styles.timeline}>
              <div className={styles.timelineItem}>
                <p className={styles.timelineDate}>{formatDate(order.createdAt)}</p>
                <p className={styles.timelineEvent}>Pedido creado</p>
              </div>
              {order.updatedAt !== order.createdAt && (
                <div className={styles.timelineItem}>
                  <p className={styles.timelineDate}>{formatDate(order.updatedAt)}</p>
                  <p className={styles.timelineEvent}>Última actualización</p>
                </div>
              )}
            </div>
          </div>

          <div className={styles.actions}>
            <button onClick={onClose} className={`${styles.button} ${styles.closeButton}`}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}