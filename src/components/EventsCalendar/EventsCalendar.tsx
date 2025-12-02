'use client'

import { useState, useMemo } from 'react'
import Calendar from 'react-calendar'
import { CateringOrder, CalendarEvent } from '@/types'
import { format, isSameDay, isAfter, isBefore, addDays, differenceInDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar as CalendarIcon, Clock, MapPin, User, Eye, Plus } from 'lucide-react'
import AddEventModal from '../AddEventModal'
import 'react-calendar/dist/Calendar.css'
import styles from './EventsCalendar.module.css'

interface EventsCalendarProps {
  orders: CateringOrder[]
  manualEvents?: CalendarEvent[]
  onAddEvent?: (event: CalendarEvent) => void
}

type ViewMode = 'calendar' | 'upcoming'

export default function EventsCalendar({ orders, manualEvents = [], onAddEvent }: EventsCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('calendar')
  const [addEventModal, setAddEventModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  // Convertir órdenes a eventos de calendario
  const orderEvents = useMemo((): CalendarEvent[] => {
    return orders
      .filter(order => order.contact.eventDate) // Mostrar TODOS los pedidos que tengan fecha
      .map(order => {
        // Determinar el status del evento según el estado del pedido
        let eventStatus: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled' = 'Pending'
        if (order.status === 'approved') eventStatus = 'Confirmed'
        else if (order.status === 'rejected') eventStatus = 'Cancelled'
        else if (order.status === 'sent') eventStatus = 'Pending'
        
        // Mapear el tipo de evento del formulario al tipo del calendario
        let eventType: CalendarEvent['type'] = 'Otros'
        if (order.contact.eventType === 'mariage') eventType = 'Casamiento'
        else if (order.contact.eventType === 'anniversaire') eventType = 'Aniversario'
        else if (order.contact.eventType === 'bapteme') eventType = 'Bautismo'
        else if (order.contact.eventType === 'corporatif') eventType = 'Empresarial'
        else if (order.contact.eventType === 'autre') eventType = 'Otros'
        
        return {
          id: `event-${order.id}`,
          orderId: order.id,
          title: `${eventType} - ${order.contact.name}`,
          date: order.contact.eventDate,
          time: order.contact.eventTime || '12:00',
          type: eventType,
          status: eventStatus,
          clientName: order.contact.name,
          location: order.contact.address,
          notes: order.notes || ''
        }
      })
  }, [orders])

  // Combinar eventos de órdenes con eventos manuales
  const calendarEvents = useMemo(() => {
    return [...orderEvents, ...manualEvents]
  }, [orderEvents, manualEvents])

  // Eventos del día seleccionado
  const selectedDateEvents = calendarEvents.filter(event =>
    isSameDay(new Date(event.date), selectedDate)
  )

  // Eventos próximos (próximos 30 días)
  const upcomingEvents = useMemo(() => {
    const now = new Date()
    const thirtyDaysFromNow = addDays(now, 30)
    
    return calendarEvents
      .filter(event => {
        const eventDate = new Date(event.date)
        return isAfter(eventDate, now) && isBefore(eventDate, thirtyDaysFromNow)
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(event => {
        const eventDate = new Date(event.date)
        const daysUntil = differenceInDays(eventDate, now)
        
        return {
          ...event,
          daysUntil,
          urgency: daysUntil <= 3 ? 'urgent' : daysUntil <= 7 ? 'soon' : 'normal'
        }
      })
  }, [calendarEvents])

  // Verificar si una fecha tiene eventos
  const hasEvents = (date: Date) => {
    return calendarEvents.some(event => isSameDay(new Date(event.date), date))
  }

  // Personalizar la apariencia de las fechas en el calendario
  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      if (hasEvents(date)) {
        return `react-calendar__tile--hasEvent ${styles.hasEvent}`
      }
    }
    return null
  }

  // Agregar contenido personalizado para fechas con eventos
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month' && hasEvents(date)) {
      return <div className={styles.eventIndicator}></div>
    }
    return null
  }

  const formatEventTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return format(date, 'HH:mm', { locale: es })
    } catch {
      return '00:00'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'scheduled'
      case 'Confirmed': return 'confirmed'
      case 'Completed': return 'completed'
      case 'Cancelled': return 'cancelled'
      default: return 'scheduled'
    }
  }

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'Casamiento': return 'casamiento'
      case 'Aniversario': return 'aniversario'
      case 'Bautismo': return 'bautismo'
      case 'Empresarial': return 'empresarial'
      case 'Otros': return 'otros'
      case 'Recordatorio': return 'reminder'
      case 'Pago Pendiente': return 'paymentDue'
      default: return 'otros'
    }
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'Casamiento': return '💍'
      case 'Aniversario': return '🎂'
      case 'Bautismo': return '👼'
      case 'Empresarial': return '💼'
      case 'Otros': return '🎉'
      case 'Recordatorio': return '⏰'
      case 'Pago Pendiente': return '💰'
      default: return '📅'
    }
  }

  const handleAddEvent = (eventData: Omit<CalendarEvent, 'id'>) => {
    const newEvent: CalendarEvent = {
      ...eventData,
      id: `manual-${Date.now()}`
    }
    
    if (onAddEvent) {
      onAddEvent(newEvent)
    }
    
    setAddEventModal(false)
  }

  const getUrgencyClass = (urgency: string) => {
    switch (urgency) {
      case 'urgent': return 'urgent'
      case 'soon': return 'soon'
      default: return ''
    }
  }

  const getUrgencyText = (daysUntil: number) => {
    if (daysUntil === 0) return 'Hoy'
    if (daysUntil === 1) return 'Mañana'
    if (daysUntil <= 3) return `${daysUntil} días`
    return format(addDays(new Date(), daysUntil), 'dd/MM', { locale: es })
  }

  const handleViewDetails = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setShowDetailsModal(true)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Calendario de Eventos</h2>
        <div className={styles.headerActions}>
          <button
            className={styles.addEventBtn}
            onClick={() => setAddEventModal(true)}
          >
            <Plus size={16} />
            Agregar Evento
          </button>
          <div className={styles.viewToggle}>
            <button
              className={`${styles.viewBtn} ${viewMode === 'calendar' ? styles.active : ''}`}
              onClick={() => setViewMode('calendar')}
            >
              <CalendarIcon size={16} />
              Calendario
            </button>
            <button
              className={`${styles.viewBtn} ${viewMode === 'upcoming' ? styles.active : ''}`}
              onClick={() => setViewMode('upcoming')}
            >
              <Clock size={16} />
              Próximos
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <div className={styles.calendarSection}>
          {/* Calendario */}
          <div className={styles.calendarContainer}>
            <Calendar
              onChange={(value) => setSelectedDate(value as Date)}
              value={selectedDate}
              locale="es-ES"
              tileClassName={tileClassName}
              tileContent={tileContent}
              className={styles.calendar}
              prev2Label={null}
              next2Label={null}
              formatShortWeekday={(locale, date) => 
                format(date, 'EEE', { locale: es }).toUpperCase()
              }
            />
          </div>

          {/* Panel de eventos del día seleccionado */}
          <div className={styles.eventsPanel}>
            <h3 className={styles.panelTitle}>Eventos del Día</h3>
            <div className={styles.selectedDate}>
              {format(selectedDate, 'EEEE, dd \'de\' MMMM \'de\' yyyy', { locale: es })}
            </div>

            <div className={styles.eventsList}>
              {selectedDateEvents.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>📅</div>
                  <div className={styles.emptyText}>No hay eventos</div>
                  <div className={styles.emptySubtext}>
                    No hay eventos programados para este día
                  </div>
                </div>
              ) : (
                selectedDateEvents.map(event => (
                  <div key={event.id} className={`${styles.eventItem} ${styles[getStatusColor(event.status)]} ${styles[getEventTypeColor(event.type)]}`}>
                    <div className={styles.eventHeader}>
                      <div className={styles.eventTitle}>
                        <span className={styles.eventIcon}>{getEventIcon(event.type)}</span>
                        {event.title}
                      </div>
                      <div className={styles.eventTime}>
                        {event.time || formatEventTime(event.date)}
                      </div>
                    </div>
                    
                    <div className={styles.eventDetails}>
                      <div className={styles.eventClient}>
                        <User size={14} style={{ display: 'inline', marginRight: '4px' }} />
                        {event.clientName}
                      </div>
                      {event.location && (
                        <div className={styles.eventLocation}>
                          <MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} />
                          {event.location}
                        </div>
                      )}
                    </div>

                    <div className={styles.eventActions}>
                      <button className={styles.actionBtn} onClick={() => handleViewDetails(event)}>
                        <Eye size={12} />
                        Ver Detalles
                      </button>
                      <div className={`${styles.status} ${styles[getStatusColor(event.status)]}`}>
                        {event.status === 'Confirmed' ? 'Confirmado' : 
                         event.status === 'Pending' ? 'Pendiente' :
                         event.status === 'Completed' ? 'Completado' : 'Cancelado'}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Vista de eventos próximos */
        <div className={styles.upcomingEvents}>
          <h3 className={styles.panelTitle}>Eventos Próximos (30 días)</h3>
          
          {upcomingEvents.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🗓️</div>
              <div className={styles.emptyText}>No hay eventos próximos</div>
              <div className={styles.emptySubtext}>
                No hay eventos programados en los próximos 30 días
              </div>
            </div>
          ) : (
            <div className={styles.upcomingList}>
              {upcomingEvents.map(event => (
                <div 
                  key={event.id} 
                  className={`${styles.upcomingItem} ${styles[getUrgencyClass(event.urgency)]} ${styles[getEventTypeColor(event.type)]}`}
                >
                  {(event.urgency === 'urgent' || event.urgency === 'soon') && (
                    <div className={`${styles.urgencyBadge} ${styles[event.urgency]}`}>
                      {event.urgency === 'urgent' ? 'Urgente' : 'Pronto'}
                    </div>
                  )}
                  
                  <div className={styles.upcomingHeader}>
                    <div className={styles.upcomingTitle}>
                      <span className={styles.eventIcon}>{getEventIcon(event.type)}</span>
                      {event.title}
                    </div>
                    <div className={styles.upcomingDate}>
                      {getUrgencyText(event.daysUntil)}
                    </div>
                  </div>
                  
                  <div className={styles.upcomingClient}>
                    <User size={14} style={{ display: 'inline', marginRight: '4px' }} />
                    {event.clientName}
                  </div>
                  
                  {event.location && (
                    <div className={styles.upcomingLocation}>
                      <MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} />
                      {event.location}
                    </div>
                  )}
                  
                  <div className={styles.eventActions}>
                    <button className={styles.actionBtn} onClick={() => handleViewDetails(event)}>
                      <Eye size={12} />
                      Ver Detalles
                    </button>
                    <div className={`${styles.status} ${styles[getStatusColor(event.status)]}`}>
                      {event.status === 'Confirmed' ? 'Confirmado' :
                       event.status === 'Pending' ? 'Pendiente' :
                       event.status === 'Completed' ? 'Completado' : 'Cancelado'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal para agregar eventos */}
      {addEventModal && (
        <AddEventModal
          isOpen={addEventModal}
          onClose={() => setAddEventModal(false)}
          onSave={handleAddEvent}
          selectedDate={selectedDate}
        />
      )}

      {/* Modal para ver detalles del evento */}
      {showDetailsModal && selectedEvent && (
        <div className={styles.modal} onClick={() => setShowDetailsModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <span className={styles.eventIcon}>{getEventIcon(selectedEvent.type)}</span>
                Detalles del Evento
              </h3>
              <button
                className={styles.closeBtn}
                onClick={() => setShowDetailsModal(false)}
              >
                ×
              </button>
            </div>

            <div className={styles.detailsContent}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Título:</span>
                <span className={styles.detailValue}>{selectedEvent.title}</span>
              </div>

              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Fecha:</span>
                <span className={styles.detailValue}>
                  {format(new Date(selectedEvent.date), 'dd/MM/yyyy', { locale: es })}
                </span>
              </div>

              {selectedEvent.time && (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Hora:</span>
                  <span className={styles.detailValue}>{selectedEvent.time}</span>
                </div>
              )}

              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Tipo:</span>
                <span className={styles.detailValue}>{selectedEvent.type}</span>
              </div>

              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Estado:</span>
                <span className={`${styles.statusBadge} ${styles[getStatusColor(selectedEvent.status)]}`}>
                  {selectedEvent.status === 'Confirmed' ? 'Confirmado' : 
                   selectedEvent.status === 'Pending' ? 'Pendiente' :
                   selectedEvent.status === 'Completed' ? 'Completado' : 'Cancelado'}
                </span>
              </div>

              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Cliente:</span>
                <span className={styles.detailValue}>{selectedEvent.clientName}</span>
              </div>

              {selectedEvent.location && (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Ubicación:</span>
                  <span className={styles.detailValue}>{selectedEvent.location}</span>
                </div>
              )}

              {selectedEvent.notes && (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Notas:</span>
                  <span className={styles.detailValue}>{selectedEvent.notes}</span>
                </div>
              )}

              {selectedEvent.orderId && (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>ID de Pedido:</span>
                  <span className={styles.detailValue}>{selectedEvent.orderId}</span>
                </div>
              )}
            </div>

            <div className={styles.modalActions}>
              <button
                className={styles.closeButton}
                onClick={() => setShowDetailsModal(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}