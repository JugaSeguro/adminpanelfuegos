'use client'

import { useState, useMemo, useEffect } from 'react'
import { CateringOrder } from '@/types'
import { format, isAfter, isBefore, addDays, differenceInDays, differenceInHours } from 'date-fns'
import { es } from 'date-fns/locale'
import { 
  Bell, 
  Settings, 
  User, 
  MapPin, 
  Eye, 
  Check, 
  X, 
  Clock,
  Calendar
} from 'lucide-react'
import styles from './EventReminders.module.css'

interface EventRemindersProps {
  orders: CateringOrder[]
}

interface ReminderSettings {
  enabled: boolean
  daysBeforeEvent: number[]
  hoursBeforeEvent: number[]
  emailNotifications: boolean
  browserNotifications: boolean
}

const defaultSettings: ReminderSettings = {
  enabled: true,
  daysBeforeEvent: [7, 3, 1],
  hoursBeforeEvent: [24, 2],
  emailNotifications: true,
  browserNotifications: true
}

export default function EventReminders({ orders }: EventRemindersProps) {
  const [settings, setSettings] = useState<ReminderSettings>(defaultSettings)
  const [showSettings, setShowSettings] = useState(false)
  const [dismissedReminders, setDismissedReminders] = useState<Set<string>>(new Set())

  // Generar recordatorios basados en eventos próximos
  type ActiveReminder = {
    id: string
    eventId: string
    type: 'event_reminder'
    title: string
    message: string
    scheduledFor: string
    isRead: boolean
    urgency: 'urgent' | 'soon' | 'normal'
    timeUntilEvent: string
    order: CateringOrder
  }

  const reminders = useMemo((): ActiveReminder[] => {
    if (!settings.enabled) return []

    const now = new Date()
    const activeReminders: ActiveReminder[] = []

    // Filtrar órdenes aprobadas con fechas de evento
    const upcomingOrders = orders.filter(order => 
      order.status === 'approved' && 
      order.contact.eventDate &&
      isAfter(new Date(order.contact.eventDate), now)
    )

    upcomingOrders.forEach(order => {
      const eventDate = new Date(order.contact.eventDate)
      const daysUntil = differenceInDays(eventDate, now)
      const hoursUntil = differenceInHours(eventDate, now)

      // Recordatorios por días
      settings.daysBeforeEvent.forEach(days => {
        if (daysUntil === days) {
          const reminderId = `${order.id}-${days}d`
          if (!dismissedReminders.has(reminderId)) {
            activeReminders.push({
              id: reminderId,
              eventId: `event-${order.id}`,
              type: 'event_reminder' as const,
              title: `Evento en ${days} día${days > 1 ? 's' : ''}`,
              message: `${order.contact.eventType} para ${order.contact.name}`,
              scheduledFor: now.toISOString(),
              isRead: false,
              urgency: days <= 1 ? 'urgent' : days <= 3 ? 'soon' : 'normal',
              timeUntilEvent: `${days} día${days > 1 ? 's' : ''}`,
              order
            })
          }
        }
      })

      // Recordatorios por horas (solo para eventos muy próximos)
      if (daysUntil <= 1) {
        settings.hoursBeforeEvent.forEach(hours => {
          if (hoursUntil <= hours && hoursUntil > 0) {
            const reminderId = `${order.id}-${hours}h`
            if (!dismissedReminders.has(reminderId)) {
              activeReminders.push({
                id: reminderId,
                eventId: `event-${order.id}`,
                type: 'event_reminder' as const,
                title: `Evento en ${hours} hora${hours > 1 ? 's' : ''}`,
                message: `${order.contact.eventType} para ${order.contact.name}`,
                scheduledFor: now.toISOString(),
                isRead: false,
                urgency: hours <= 2 ? 'urgent' : 'soon',
                timeUntilEvent: `${hours} hora${hours > 1 ? 's' : ''}`,
                order
              })
            }
          }
        })
      }
    })

    // Ordenar por urgencia y tiempo
    return activeReminders.sort((a, b) => {
      const urgencyOrder = { urgent: 0, soon: 1, normal: 2 }
      if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency]
      }
      return new Date(a.order.contact.eventDate).getTime() - new Date(b.order.contact.eventDate).getTime()
    })
  }, [orders, settings, dismissedReminders])

  // Solicitar permisos de notificación del navegador
  useEffect(() => {
    if (settings.browserNotifications && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission()
      }
    }
  }, [settings.browserNotifications])

  // Mostrar notificaciones del navegador para recordatorios urgentes
  useEffect(() => {
    if (settings.browserNotifications && 'Notification' in window && Notification.permission === 'granted') {
      reminders
        .filter(reminder => reminder.urgency === 'urgent')
        .forEach(reminder => {
          new Notification(`Fuegos d'Azur - ${reminder.title}`, {
            body: reminder.message,
            icon: '/favicon.ico',
            tag: reminder.id
          })
        })
    }
  }, [reminders, settings.browserNotifications])

  const handleDismissReminder = (reminderId: string) => {
    setDismissedReminders(prev => {
      const next = new Set(prev)
      next.add(reminderId)
      return next
    })
  }

  const handleMarkAsRead = (reminderId: string) => {
    // En una implementación real, esto actualizaría el estado en la base de datos
    console.log('Marcando recordatorio como leído:', reminderId)
  }

  const handleViewEvent = (order: CateringOrder) => {
    // En una implementación real, esto navegaría a los detalles del evento
    console.log('Ver detalles del evento:', order.id)
  }

  const formatEventDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return format(date, 'dd/MM/yyyy HH:mm', { locale: es })
    } catch {
      return 'Fecha inválida'
    }
  }

  const getUrgencyText = (urgency: string) => {
    switch (urgency) {
      case 'urgent': return 'Urgente'
      case 'soon': return 'Pronto'
      default: return ''
    }
  }

  const handleSaveSettings = () => {
    // En una implementación real, esto guardaría en localStorage o base de datos
    localStorage.setItem('reminderSettings', JSON.stringify(settings))
    setShowSettings(false)
  }

  // Cargar configuración guardada
  useEffect(() => {
    const savedSettings = localStorage.getItem('reminderSettings')
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings))
      } catch {
        // Usar configuración por defecto si hay error
      }
    }
  }, [])

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <Bell size={20} />
          Recordatorios de Eventos
          {reminders.length > 0 && (
            <span style={{ 
              background: '#ef4444', 
              color: 'white', 
              borderRadius: '12px', 
              padding: '2px 8px', 
              fontSize: '0.75rem',
              marginLeft: '8px'
            }}>
              {reminders.length}
            </span>
          )}
        </h2>
        <button 
          className={styles.settingsBtn}
          onClick={() => setShowSettings(true)}
        >
          <Settings size={14} />
          Configurar
        </button>
      </div>

      <div className={styles.remindersList}>
        {reminders.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🔔</div>
            <div className={styles.emptyText}>No hay recordatorios activos</div>
            <div className={styles.emptySubtext}>
              Los recordatorios aparecerán aquí cuando se acerquen las fechas de los eventos
            </div>
          </div>
        ) : (
          reminders.map(reminder => (
            <div 
              key={reminder.id} 
              className={`${styles.reminderItem} ${styles[reminder.urgency]}`}
            >
              {(reminder.urgency === 'urgent' || reminder.urgency === 'soon') && (
                <div className={`${styles.urgencyBadge} ${styles[reminder.urgency]}`}>
                  {getUrgencyText(reminder.urgency)}
                </div>
              )}

              <div className={styles.reminderHeader}>
                <h3 className={styles.reminderTitle}>{reminder.title}</h3>
                <div className={styles.reminderTime}>
                  <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                  {reminder.timeUntilEvent}
                </div>
              </div>

              <div className={styles.reminderMessage}>
                {reminder.message}
              </div>

              <div className={styles.reminderDetails}>
                <div className={styles.reminderClient}>
                  <User size={14} />
                  {reminder.order.contact.name}
                </div>
                <div className={styles.reminderLocation}>
                  <MapPin size={12} />
                  {reminder.order.contact.address}
                </div>
                <div className={styles.reminderLocation}>
                  <Calendar size={12} />
                  {formatEventDate(reminder.order.contact.eventDate)}
                </div>
              </div>

              <div className={styles.reminderActions}>
                <div className={styles.actionButtons}>
                  <button 
                    className={`${styles.actionBtn} ${styles.primary}`}
                    onClick={() => handleViewEvent(reminder.order)}
                  >
                    <Eye size={12} />
                    Ver Evento
                  </button>
                  <button 
                    className={styles.actionBtn}
                    onClick={() => handleMarkAsRead(reminder.id)}
                  >
                    <Check size={12} />
                    Marcar Leído
                  </button>
                  <button 
                    className={`${styles.actionBtn} ${styles.danger}`}
                    onClick={() => handleDismissReminder(reminder.id)}
                  >
                    <X size={12} />
                    Descartar
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de configuración */}
      {showSettings && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Configuración de Recordatorios</h3>
              <button 
                className={styles.closeBtn}
                onClick={() => setShowSettings(false)}
              >
                <X size={16} />
              </button>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={settings.enabled}
                  onChange={(e) => setSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                />
                Habilitar recordatorios
              </label>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Recordatorios por días antes del evento:</label>
              <input
                type="text"
                className={styles.input}
                value={settings.daysBeforeEvent.join(', ')}
                onChange={(e) => {
                  const days = e.target.value.split(',').map(d => parseInt(d.trim())).filter(d => !isNaN(d))
                  setSettings(prev => ({ ...prev, daysBeforeEvent: days }))
                }}
                placeholder="7, 3, 1"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Recordatorios por horas antes del evento:</label>
              <input
                type="text"
                className={styles.input}
                value={settings.hoursBeforeEvent.join(', ')}
                onChange={(e) => {
                  const hours = e.target.value.split(',').map(h => parseInt(h.trim())).filter(h => !isNaN(h))
                  setSettings(prev => ({ ...prev, hoursBeforeEvent: hours }))
                }}
                placeholder="24, 2"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={settings.emailNotifications}
                  onChange={(e) => setSettings(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                />
                Notificaciones por email
              </label>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={settings.browserNotifications}
                  onChange={(e) => setSettings(prev => ({ ...prev, browserNotifications: e.target.checked }))}
                />
                Notificaciones del navegador
              </label>
            </div>

            <div className={styles.modalActions}>
              <button 
                className={`${styles.modalBtn} ${styles.secondary}`}
                onClick={() => setShowSettings(false)}
              >
                Cancelar
              </button>
              <button 
                className={`${styles.modalBtn} ${styles.primary}`}
                onClick={handleSaveSettings}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}