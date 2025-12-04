'use client'

import { useState, useMemo, useEffect } from 'react'
import Header from '@/components/Header/Header'
import FilterBar from '@/components/FilterBar/FilterBar'
import OrderCard from '@/components/OrderCard/OrderCard'
import EmailModal from '@/components/EmailModal/EmailModal'
import OrderDetails from '@/components/OrderDetails/OrderDetails'
import PaymentTracker from '@/components/PaymentTracker/PaymentTracker'
import FinancialReports from '@/components/FinancialReports/FinancialReports'
import EventsCalendar from '@/components/EventsCalendar/EventsCalendar'
import EventReminders from '@/components/EventReminders/EventReminders'
import PriceManager from '@/components/PriceManager'
import BudgetsManager from '@/components/BudgetsManager/BudgetsManager'
import EventCalculator from '@/components/EventCalculator/EventCalculator'
import { CateringOrder, FilterOptions, EmailTemplate, CalendarEvent, PaymentInfo, Product } from '@/types'
import { emailTemplates } from '@/data/mockData'
import { supabase } from '@/lib/supabaseClient'
import { List, DollarSign, BarChart3, Calendar, Bell, Euro, FileText, Calculator } from 'lucide-react'
import styles from './page.module.css'

type TabType = 'orders' | 'payments' | 'reports' | 'calendar' | 'reminders' | 'prices' | 'budgets' | 'eventcalc'

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<TabType>('orders')
  const [orders, setOrders] = useState<CateringOrder[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [manualEvents, setManualEvents] = useState<CalendarEvent[]>([])
  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: '',
    status: 'all',
    dateFrom: '',
    dateTo: ''
  })
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [emailModal, setEmailModal] = useState<{
    isOpen: boolean
    order?: CateringOrder
    template?: EmailTemplate
  }>({ isOpen: false })
  const [detailsModal, setDetailsModal] = useState<{
    isOpen: boolean
    order?: CateringOrder
  }>({ isOpen: false })

  // Cargar pedidos desde Supabase
  useEffect(() => {
    const loadOrders = async () => {
      const { data, error } = await supabase
        .from('catering_orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error cargando pedidos:', error)
        return
      }

      const mapped: CateringOrder[] = (data || []).map((row: any) => {
        console.log('📦 Cargando pedido:', { id: row.id, status: row.status, name: row.name })
        return {
          id: row.id,
          contact: {
            email: row.email,
            name: row.name,
            phone: row.phone || '',
            eventDate: row.event_date || '',
            eventType: row.event_type || '',
            eventTime: row.event_time || undefined,
            address: row.address || '',
            guestCount: row.guest_count || 0
          },
          menu: { type: row.menu_type },
          entrees: row.entrees || [],
          viandes: row.viandes || [],
          dessert: row.dessert || null,
          extras: row.extras || { wines: false, equipment: [], decoration: false, specialRequest: '' },
          status: row.status || 'pending',
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          estimatedPrice: row.estimated_price || undefined,
          notes: row.notes || undefined
        }
      })

      setOrders(mapped)
    }

    loadOrders()
  }, [])

  // Cargar productos desde Supabase
  useEffect(() => {
    const loadProducts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true })

      if (error) {
        console.error('Error cargando productos:', error)
        return
      }

      setProducts(data || [])
    }

    loadProducts()
  }, [])

  // Filtrar pedidos basado en los filtros aplicados
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Filtro de búsqueda
      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase()
        const matchesSearch =
          order.contact.name.toLowerCase().includes(searchTerm) ||
          order.contact.email.toLowerCase().includes(searchTerm)
        if (!matchesSearch) return false
      }

      // Filtro de estado
      if (filters.status !== 'all' && order.status !== filters.status) {
        return false
      }

      // Filtro de fecha de inicio
      if (filters.dateFrom) {
        const orderDate = new Date(order.contact.eventDate)
        const startDate = new Date(filters.dateFrom)
        if (orderDate < startDate) return false
      }

      // Filtro de fecha de fin
      if (filters.dateTo) {
        const orderDate = new Date(order.contact.eventDate)
        const endDate = new Date(filters.dateTo)
        if (orderDate > endDate) return false
      }

      return true
    })
  }, [orders, filters])

  // Manejar cambio de estado de pedido
  const handleStatusChange = async (orderId: string, newStatus: CateringOrder['status']) => {
    try {
      console.log('🔄 Cambiando estado del pedido:', { orderId, newStatus })

      // Actualizar en la base de datos
      const { data, error } = await supabase
        .from('catering_orders')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select()

      if (error) {
        console.error('❌ Error actualizando estado del pedido:', error)
        alert(`Error al actualizar el estado del pedido: ${error.message}`)
        return
      }

      console.log('✅ Estado actualizado en BD:', data)

      // Verificar que el valor se guardó correctamente
      const { data: verifyData, error: verifyError } = await supabase
        .from('catering_orders')
        .select('id, status, updated_at')
        .eq('id', orderId)
        .single()

      if (verifyError) {
        console.error('❌ Error verificando estado:', verifyError)
      } else {
        console.log('✅ Estado verificado en BD:', verifyData)
      }

      // Actualizar el estado local solo si la actualización en BD fue exitosa
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId
            ? { ...order, status: newStatus, updatedAt: new Date().toISOString() }
            : order
        )
      )
    } catch (error) {
      console.error('❌ Error al actualizar estado del pedido:', error)
      alert(`Error al actualizar el estado del pedido: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }
  }

  // Actualizar información de pago de un pedido
  const handleUpdatePayment = (orderId: string, updatedPayment: PaymentInfo) => {
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === orderId
          ? { ...order, payment: updatedPayment, updatedAt: new Date().toISOString() }
          : order
      )
    )
  }

  // Actualizar cualquier campo del pedido
  const handleUpdateOrder = (orderId: string, updates: Partial<CateringOrder>) => {
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === orderId
          ? { ...order, ...updates, updatedAt: new Date().toISOString() }
          : order
      )
    )
  }

  // Manejar selección de pedidos
  const handleOrderSelection = (orderId: string, isSelected: boolean) => {
    setSelectedOrders(prev =>
      isSelected
        ? [...prev, orderId]
        : prev.filter(id => id !== orderId)
    )
  }

  // Seleccionar/deseleccionar todos
  const handleSelectAll = (isSelected: boolean) => {
    setSelectedOrders(isSelected ? filteredOrders.map(order => order.id) : [])
  }

  // Abrir modal de email
  const handleOpenEmailModal = (order: CateringOrder, template?: EmailTemplate) => {
    setEmailModal({ isOpen: true, order, template })
  }

  // Cerrar modal de email
  const handleCloseEmailModal = () => {
    setEmailModal({ isOpen: false })
  }

  // Manejar envío de email
  const handleSendEmail = async (orderId: string, subject: string, content: string) => {
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          customSubject: subject,
          customContent: content
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar email')
      }

      console.log('✅ Email enviado correctamente:', data)
      alert('Email enviado correctamente')

      // Cerrar modal después del envío exitoso
      handleCloseEmailModal()
    } catch (error) {
      console.error('Error al enviar email:', error)
      alert(`Error al enviar email: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }
  }

  // Manejar adición de eventos manuales
  const handleAddEvent = (event: CalendarEvent) => {
    setManualEvents(prevEvents => [...prevEvents, event])
  }

  // Abrir detalles del pedido
  const handleOpenDetails = (order: CateringOrder) => {
    setDetailsModal({ isOpen: true, order })
  }

  // Cerrar detalles del pedido
  const handleCloseDetails = () => {
    setDetailsModal({ isOpen: false })
  }

  // Envío masivo de emails
  const handleBulkEmail = async (templateType: string) => {
    if (selectedOrders.length === 0) {
      alert('Por favor selecciona al menos un pedido')
      return
    }

    const template = emailTemplates.find(t => t.type === templateType)
    if (!template) {
      alert('Plantilla no encontrada')
      return
    }

    const selectedOrdersData = orders.filter(order => selectedOrders.includes(order.id))

    if (!confirm(`¿Enviar ${template.name} a ${selectedOrdersData.length} cliente(s)?`)) {
      return
    }

    let successCount = 0
    let errorCount = 0

    // Enviar emails de forma secuencial para no sobrecargar la API
    for (const order of selectedOrdersData) {
      try {
        const response = await fetch('/api/send-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId: order.id,
            templateId: template.id
          })
        })

        if (response.ok) {
          successCount++
          console.log(`✅ Email enviado a: ${order.contact.email}`)
        } else {
          errorCount++
          console.error(`❌ Error enviando a: ${order.contact.email}`)
        }

        // Pequeño delay entre emails para no saturar
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (error) {
        errorCount++
        console.error(`❌ Error enviando a: ${order.contact.email}`, error)
      }
    }

    alert(`Envío masivo completado:\n✅ Enviados: ${successCount}\n❌ Errores: ${errorCount}`)
    setSelectedOrders([])
  }

  // Eliminar evento del calendario
  const handleDeleteEvent = async (eventId: string) => {
    if (eventId.startsWith('manual-')) {
      setManualEvents(prev => prev.filter(e => e.id !== eventId))
    } else if (eventId.startsWith('event-')) {
      const orderId = eventId.replace('event-', '')
      if (confirm('Este evento está vinculado a un pedido. ¿Deseas cancelar el pedido?')) {
        await handleStatusChange(orderId, 'rejected')
      }
    }
  }

  const tabs = [
    { id: 'orders' as TabType, label: 'Pedidos', icon: List },
    { id: 'payments' as TabType, label: 'Pagos', icon: DollarSign },
    { id: 'reports' as TabType, label: 'Reportes', icon: BarChart3 },
    { id: 'calendar' as TabType, label: 'Calendario', icon: Calendar },
    { id: 'reminders' as TabType, label: 'Recordatorios', icon: Bell },
    { id: 'prices' as TabType, label: 'Precios', icon: Euro },
    { id: 'budgets' as TabType, label: 'Presupuestos', icon: FileText },
    { id: 'eventcalc' as TabType, label: 'Calculadora', icon: Calculator }
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'orders':
        return (
          <>
            <FilterBar
              filters={filters}
              onFiltersChange={setFilters}
              resultsCount={filteredOrders.length}
            />

            {selectedOrders.length > 0 && (
              <div className={styles.bulkActions}>
                <label className={styles.selectAll}>
                  <input
                    type="checkbox"
                    checked={selectedOrders.length === filteredOrders.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                  Seleccionar todos ({filteredOrders.length})
                </label>

                <span className={styles.bulkActionsText}>
                  {selectedOrders.length} pedido(s) seleccionado(s)
                </span>

                <button
                  className={styles.bulkButton}
                  onClick={() => handleBulkEmail('payment_reminder')}
                >
                  📧 Recordatorio de Pago
                </button>

                <button
                  className={styles.bulkButton}
                  onClick={() => handleBulkEmail('quote_update')}
                >
                  💰 Presupuesto Actualizado
                </button>
              </div>
            )}

            {filteredOrders.length === 0 ? (
              <div className={styles.noResults}>
                <div className={styles.noResultsIcon}>🔍</div>
                <h3 className={styles.noResultsTitle}>No se encontraron pedidos</h3>
                <p className={styles.noResultsText}>
                  Intenta ajustar los filtros de búsqueda para encontrar los pedidos que buscas.
                </p>
              </div>
            ) : (
              <div className={styles.ordersGrid}>
                {filteredOrders.map(order => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    isSelected={selectedOrders.includes(order.id)}
                    onStatusChange={handleStatusChange}
                    onSendEmail={handleOpenEmailModal}
                    onViewDetails={handleOpenDetails}
                    onSelectionChange={handleOrderSelection}
                    onUpdateOrder={handleUpdateOrder}
                  />
                ))}
              </div>
            )}
          </>
        )
      case 'payments':
        return <PaymentTracker orders={orders} onUpdatePayment={handleUpdatePayment} />
      case 'reports':
        return <FinancialReports orders={orders} />
      case 'calendar':
        return <EventsCalendar
          orders={orders}
          manualEvents={manualEvents}
          onAddEvent={handleAddEvent}
          onDeleteEvent={handleDeleteEvent}
        />
      case 'reminders':
        return <EventReminders orders={orders} />
      case 'prices':
        return <PriceManager />
      case 'budgets':
        return <BudgetsManager />
      case 'eventcalc':
        return <EventCalculator products={products} orders={orders} />
      default:
        return null
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.main}>
        <Header orders={orders} />

        {/* Navegación por pestañas */}
        <div className={styles.tabNavigation}>
          {tabs.map(tab => {
            const IconComponent = tab.icon
            return (
              <button
                key={tab.id}
                className={`${styles.tabButton} ${activeTab === tab.id ? styles.active : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <IconComponent size={18} />
                {tab.label}
              </button>
            )
          })}
        </div>

        <div className={styles.content}>
          {renderTabContent()}
        </div>

        {/* Modal de Email */}
        {emailModal.isOpen && emailModal.order && (
          <EmailModal
            isOpen={emailModal.isOpen}
            order={emailModal.order}
            onClose={handleCloseEmailModal}
            onSend={handleSendEmail}
          />
        )}

        {/* Modal de Detalles */}
        {detailsModal.isOpen && detailsModal.order && (
          <OrderDetails
            isOpen={detailsModal.isOpen}
            order={detailsModal.order}
            onClose={handleCloseDetails}
          />
        )}
      </div>
    </div>
  )
}