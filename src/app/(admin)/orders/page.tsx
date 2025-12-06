'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import FilterBar from '@/components/FilterBar/FilterBar'
import OrderCard from '@/components/OrderCard/OrderCard'
import EmailModal from '@/components/EmailModal/EmailModal'
import OrderDetails from '@/components/OrderDetails/OrderDetails'
import { CateringOrder, EmailTemplate } from '@/types'
import { emailTemplates } from '@/data/mockData'
import styles from './orders.module.css'
import { useOrders } from '@/hooks/useOrders'
import { useOrderFilters } from '@/hooks/useOrderFilters'
import { useCallback, useEffect } from 'react'

export default function OrdersPage() {
    const {
        orders,
        handleStatusChange,
        handleUpdateOrder,
        page,
        setPage,
        totalCount,
        pageSize
    } = useOrders()
    // Passing initial filters state if we wanted to persist URL logic later
    const { filters, setFilters } = useOrderFilters(orders) // passed orders just to satisfy old signature? No, updated signature.

    // Effect: Reset page to 1 when filters change
    useEffect(() => {
        setPage(1)
    }, [filters, setPage])

    // Use `orders` (which is now filtered from server) instead of local `filteredOrders`
    const dataToDisplay = orders


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

    // Manejar selección de pedidos
    const handleOrderSelection = (orderId: string, isSelected: boolean) => {
        setSelectedOrders(prev =>
            isSelected
                ? [...prev, orderId]
                : prev.filter(id => id !== orderId)
        )
    }

    // Seleccionar/deseleccionar todos
    const handleSelectAll = useCallback((isSelected: boolean) => {
        setSelectedOrders(isSelected ? dataToDisplay.map(order => order.id) : [])
    }, [dataToDisplay])

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
            const promise = fetch('/api/send-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderId,
                    customSubject: subject,
                    customContent: content
                })
            }).then(async res => {
                const data = await res.json()
                if (!res.ok) throw new Error(data.error || 'Error al enviar email')
                return data
            })

            toast.promise(promise, {
                loading: 'Enviando email...',
                success: 'Email enviado correctamente',
                error: (err) => `Error: ${err.message}`
            })

            await promise
            handleCloseEmailModal()
        } catch (error) {
            console.error('Error al enviar email:', error)
        }
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
            toast.error('Por favor selecciona al menos un pedido')
            return
        }

        const template = emailTemplates.find(t => t.type === templateType)
        if (!template) {
            toast.error('Plantilla no encontrada')
            return
        }

        const selectedOrdersData = orders.filter(order => selectedOrders.includes(order.id))

        if (!confirm(`¿Enviar ${template.name} a ${selectedOrdersData.length} cliente(s)?`)) {
            // We can keep confirm native for destructive/bulk actions or build a custom modal. 
            // For speed, let's keep native confirm for now or use a toast action but native confirm is safer for bulk.
            // Ideally we'd use a proper ConfirmModal.
            return
        }

        let successCount = 0
        let errorCount = 0

        toast.message(`Enviando masivamente...`, {
            description: `Procesando ${selectedOrdersData.length} emails. Por favor espera.`
        })

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
                } else {
                    errorCount++
                }

                // Pequeño delay entre emails para no saturar
                await new Promise(resolve => setTimeout(resolve, 500))
            } catch (error) {
                errorCount++
            }
        }

        if (errorCount > 0) {
            toast.warning(`Envío completado con observaciones`, {
                description: `Enviados: ${successCount} | Errores: ${errorCount}`
            })
        } else {
            toast.success(`Envío masivo exitoso`, {
                description: `Se enviaron ${successCount} emails correctamente.`
            })
        }

        setSelectedOrders([])
    }

    return (
        <>
            <FilterBar
                filters={filters}
                onFiltersChange={setFilters}
                resultsCount={totalCount} // Display total server count instead of current page
            />

            {selectedOrders.length > 0 && (
                <div className={styles.bulkActions}>
                    <label className={styles.selectAll}>
                        <input
                            type="checkbox"
                            checked={dataToDisplay.length > 0 && selectedOrders.length === dataToDisplay.length}
                            onChange={(e) => handleSelectAll(e.target.checked)}
                        />
                        Seleccionar todos ({dataToDisplay.length})
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

            {dataToDisplay.length === 0 ? (
                <div className={styles.noResults}>
                    <div className={styles.noResultsIcon}>🔍</div>
                    <h3 className={styles.noResultsTitle}>No se encontraron pedidos</h3>
                    <p className={styles.noResultsText}>
                        Intenta ajustar los filtros de búsqueda para encontrar los pedidos que buscas.
                    </p>
                </div>
            ) : (
                <div className={styles.ordersGrid}>
                    {dataToDisplay.map(order => (
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

            {/* Pagination Controls */}
            {totalCount > pageSize && (
                <div className={styles.pagination}>
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        className={styles.pageButton}
                    >
                        Anterior
                    </button>
                    <span className={styles.pageInfo}>
                        Página {page} de {Math.ceil(totalCount / pageSize)}
                    </span>
                    <button
                        disabled={page >= Math.ceil(totalCount / pageSize)}
                        onClick={() => setPage(p => p + 1)}
                        className={styles.pageButton}
                    >
                        Siguiente
                    </button>
                </div>
            )}

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
        </>
    )
}
