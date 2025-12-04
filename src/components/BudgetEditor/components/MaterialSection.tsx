import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import { BudgetData } from '../types'
import styles from './MaterialSection.module.css'

interface MaterialSectionProps {
    data: BudgetData['material']
    onUpdate: (path: string, value: any) => void
    onDelete: () => void
    onOpenSelector: () => void
}

export function MaterialSection({ data, onUpdate, onDelete, onOpenSelector }: MaterialSectionProps) {
    const [expanded, setExpanded] = useState(false)
    const [newMatName, setNewMatName] = useState('')
    const [newMatQty, setNewMatQty] = useState<number>(1)
    const [newMatPrice, setNewMatPrice] = useState<number>(0)

    if (!data) return null

    const handleAddManual = () => {
        if (!newMatName) return

        const newItems = [...data.items]
        newItems.push({
            name: newMatName,
            quantity: newMatQty,
            pricePerUnit: newMatPrice,
            total: newMatQty * newMatPrice
        })

        onUpdate('material.items', newItems)
        setNewMatName('')
        setNewMatQty(1)
        setNewMatPrice(0)
    }

    const handleDeleteItem = (index: number) => {
        const newItems = [...data.items]
        newItems.splice(index, 1)
        onUpdate('material.items', newItems)
    }

    const handleUpdateItem = (index: number, field: string, value: any) => {
        const newItems = [...data.items]
        newItems[index] = { ...newItems[index], [field]: value }
        // Recalculate total for item
        if (field === 'quantity' || field === 'pricePerUnit') {
            newItems[index].total = newItems[index].quantity * newItems[index].pricePerUnit
        }
        onUpdate('material.items', newItems)
    }

    return (
        <section className={`${styles.section} ${styles.editable}`}>
            <div className={styles.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className={styles.toggleBtn}
                        title={expanded ? 'Colapsar' : 'Expandir'}
                    >
                        {expanded ? '▼' : '▶'}
                    </button>
                    <h2 className={styles.title}>📦 Material</h2>
                </div>
                <button
                    onClick={onDelete}
                    className={styles.deleteSectionBtn}
                    title="Eliminar sección de material"
                >
                    🗑️
                </button>
            </div>
            {expanded && (
                <>
                    <div className={styles.materialList}>
                        {data.items.map((item, index) => (
                            <div key={index} className={styles.materialRow}>
                                <div className={styles.editField}>
                                    <label>Nombre</label>
                                    <input
                                        type="text"
                                        value={item.name}
                                        onChange={(e) => handleUpdateItem(index, 'name', e.target.value)}
                                    />
                                </div>
                                <div className={styles.editField}>
                                    <label>Cant.</label>
                                    <input
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => handleUpdateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                                        min="0"
                                    />
                                </div>
                                <div className={styles.editField}>
                                    <label>Precio (€)</label>
                                    <input
                                        type="number"
                                        value={item.pricePerUnit}
                                        onChange={(e) => handleUpdateItem(index, 'pricePerUnit', parseFloat(e.target.value) || 0)}
                                        step="0.01"
                                    />
                                </div>
                                <div className={styles.editField}>
                                    <label>Total</label>
                                    <input
                                        type="number"
                                        value={item.total}
                                        disabled
                                        className={styles.disabledInput}
                                    />
                                </div>
                                <button
                                    onClick={() => handleDeleteItem(index)}
                                    className={styles.deleteItemBtn}
                                    title="Eliminar item"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className={styles.addMaterialBox}>
                        <h4>Agregar Item Manual</h4>
                        <div className={styles.addMaterialGrid}>
                            <input
                                type="text"
                                placeholder="Nombre del item"
                                value={newMatName}
                                onChange={(e) => setNewMatName(e.target.value)}
                                className={styles.input}
                            />
                            <input
                                type="number"
                                placeholder="Cant."
                                value={newMatQty}
                                onChange={(e) => setNewMatQty(parseInt(e.target.value) || 0)}
                                className={styles.input}
                                style={{ width: '80px' }}
                            />
                            <input
                                type="number"
                                placeholder="Precio"
                                value={newMatPrice}
                                onChange={(e) => setNewMatPrice(parseFloat(e.target.value) || 0)}
                                className={styles.input}
                                style={{ width: '80px' }}
                            />
                            <button
                                onClick={handleAddManual}
                                className={styles.addBtn}
                                disabled={!newMatName}
                            >
                                <Plus size={16} /> Agregar
                            </button>
                        </div>

                        <div style={{ marginTop: '15px', borderTop: '1px solid #e5e7eb', paddingTop: '15px' }}>
                            <button
                                onClick={onOpenSelector}
                                className={styles.selectorBtn}
                            >
                                <Plus size={16} /> Seleccionar de la lista
                            </button>
                        </div>
                    </div>

                    <div className={styles.totalsBox}>
                        <div className={styles.totalRow}>
                            <span>Subtotal Material:</span>
                            <strong>{((data.totalHT || 0) - (data.insuranceAmount || 0)).toFixed(2)} €</strong>
                        </div>
                        <div className={styles.totalRow}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span>Seguro (%):</span>
                                <input
                                    type="number"
                                    value={data.insurancePct}
                                    onChange={(e) => onUpdate('material.insurancePct', parseFloat(e.target.value) || 0)}
                                    style={{ width: '60px', padding: '4px', borderRadius: '4px', border: '1px solid #ccc' }}
                                    step="0.1"
                                />
                            </div>
                            <strong>{data.insuranceAmount?.toFixed(2)} €</strong>
                        </div>
                        <div className={styles.totalRow}>
                            <span>Total HT:</span>
                            <strong>{data.totalHT.toFixed(2)} €</strong>
                        </div>
                        <div className={styles.totalRow}>
                            <span>TVA ({data.tvaPct}%):</span>
                            <strong>{data.tva.toFixed(2)} €</strong>
                        </div>
                        <div className={`${styles.totalRow} ${styles.highlight}`}>
                            <span>Total TTC:</span>
                            <strong>{data.totalTTC.toFixed(2)} €</strong>
                        </div>
                    </div>
                </>
            )}
        </section>
    )
}
