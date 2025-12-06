import React from 'react'
import { Package, X, CheckSquare, CheckCircle2, Plus } from 'lucide-react'
import { Product } from '@/types'
import { Event } from '@/components/EventCalculator/types'
import styles from './MaterialSelectorModal.module.css'

interface MaterialSelectorModalProps {
    isOpen: boolean
    onClose: () => void
    availableProducts: Product[]
    selectedMaterialIds: string[]
    onMaterialToggle: (productId: string) => void
    onAddMaterials: () => void
    events: Event[]
    currentEventId: string | null
}

export function MaterialSelectorModal({
    isOpen,
    onClose,
    availableProducts,
    selectedMaterialIds,
    onMaterialToggle,
    onAddMaterials,
    events,
    currentEventId
}: MaterialSelectorModalProps) {
    if (!isOpen) return null

    // Filter products to only show materials
    const materialProducts = availableProducts.filter(p => p.category === 'material')

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalLarge} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h3 className={styles.modalTitle}>
                        <Package size={24} />
                        Agregar Materiales
                    </h3>
                    <button
                        className={styles.closeButton}
                        onClick={onClose}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.modalBody}>
                    <p className={styles.helperText}>
                        Selecciona los materiales que deseas agregar al evento. Se agregarán como cantidad fija (1 unidad por defecto).
                    </p>

                    <div className={styles.materialsGrid}>
                        {materialProducts.map(product => {
                            const isSelected = selectedMaterialIds.includes(product.id)
                            const event = events.find(e => e.id === currentEventId)
                            const alreadyInEvent = event?.ingredients.some(ing => ing.product.id === product.id)

                            return (
                                <div
                                    key={product.id}
                                    onClick={() => !alreadyInEvent && onMaterialToggle(product.id)}
                                    className={`${styles.materialItem} ${isSelected ? styles.selected : ''} ${alreadyInEvent ? styles.disabled : ''}`}
                                >
                                    <div className={`${styles.checkbox} ${isSelected ? styles.checked : ''}`}>
                                        {isSelected && <CheckSquare size={14} color="white" />}
                                        {alreadyInEvent && !isSelected && <CheckCircle2 size={14} color="#94a3b8" />}
                                    </div>
                                    <div>
                                        <div className={styles.productName}>{product.name}</div>
                                        {product.clarifications && (
                                            <div className={styles.productClarifications}>{product.clarifications}</div>
                                        )}
                                        {alreadyInEvent && (
                                            <div className={styles.alreadyAddedBadge}>
                                                Ya agregado
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className={styles.modalFooter}>
                    <button
                        className={styles.cancelButton}
                        onClick={onClose}
                    >
                        Cancelar
                    </button>
                    <button
                        className={styles.confirmButton}
                        onClick={onAddMaterials}
                        disabled={selectedMaterialIds.length === 0}
                    >
                        <Plus size={18} />
                        Agregar {selectedMaterialIds.length} Material(es)
                    </button>
                </div>
            </div>
        </div>
    )
}
