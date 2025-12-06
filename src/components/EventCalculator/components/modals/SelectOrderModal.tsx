import React from 'react'
import { CheckSquare, Square, X, Plus } from 'lucide-react'
import { CateringOrder } from '@/types'
import styles from './SelectOrderModal.module.css'

interface SelectOrderModalProps {
    isOpen: boolean
    onClose: () => void
    orders: CateringOrder[]
    selectedOrderIds: string[]
    onOrderToggle: (orderId: string) => void
    onSelectAll: (orderIds: string[]) => void
    onLoadOrders: () => void
}

export function SelectOrderModal({
    isOpen,
    onClose,
    orders,
    selectedOrderIds,
    onOrderToggle,
    onSelectAll,
    onLoadOrders
}: SelectOrderModalProps) {
    if (!isOpen) return null

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalLarge} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h3 className={styles.modalTitle}>
                        <CheckSquare size={24} />
                        Seleccionar Pedidos Aprobados
                    </h3>
                    <button
                        className={styles.closeButton}
                        onClick={onClose}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.modalBody}>
                    {orders.length === 0 ? (
                        <div className={styles.noOrders}>
                            <p>No hay pedidos aprobados disponibles.</p>
                            <p className={styles.noOrdersSubtext}>
                                Los pedidos deben estar en estado &quot;Aprobado&quot; y tener fecha de evento.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className={styles.ordersListHeader}>
                                <span>{selectedOrderIds.length} de {orders.length} seleccionados</span>
                                {selectedOrderIds.length < orders.length ? (
                                    <button
                                        className={styles.selectAllBtn}
                                        onClick={() => onSelectAll(orders.map(o => o.id))}
                                    >
                                        Seleccionar Todos
                                    </button>
                                ) : (
                                    <button
                                        className={styles.selectAllBtn}
                                        onClick={() => onSelectAll([])}
                                    >
                                        Deseleccionar Todos
                                    </button>
                                )}
                            </div>
                            <div className={styles.ordersList}>
                                {orders.map(order => (
                                    <div
                                        key={order.id}
                                        className={`${styles.orderItem} ${selectedOrderIds.includes(order.id) ? styles.selected : ''}`}
                                        onClick={() => onOrderToggle(order.id)}
                                    >
                                        <div className={styles.orderCheckbox}>
                                            {selectedOrderIds.includes(order.id) ? (
                                                <CheckSquare size={24} className={styles.checkedIcon} />
                                            ) : (
                                                <Square size={24} className={styles.uncheckedIcon} />
                                            )}
                                        </div>
                                        <div className={styles.orderInfo}>
                                            <div className={styles.orderName}>
                                                {order.contact.eventType} - {order.contact.name}
                                            </div>
                                            <div className={styles.orderDetails}>
                                                <span>📅 {new Date(order.contact.eventDate).toLocaleDateString()}</span>
                                                <span>👥 {order.contact.guestCount} invitados</span>
                                                <span>
                                                    🍽️ {order.entrees.length + order.viandes.length + (order.dessert ? 1 : 0)} productos
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <div className={styles.modalFooter}>
                    <button
                        className={styles.cancelButton}
                        onClick={() => {
                            onClose()
                            onSelectAll([])
                        }}
                    >
                        Cancelar
                    </button>
                    <button
                        className={styles.confirmButton}
                        onClick={onLoadOrders}
                        disabled={selectedOrderIds.length === 0}
                    >
                        <Plus size={18} />
                        Cargar {selectedOrderIds.length} Evento(s)
                    </button>
                </div>
            </div>
        </div>
    )
}
