import React, { useState } from 'react'
import { Product } from '@/types'
import { X, Loader2 } from 'lucide-react'
import styles from './AddProductModal.module.css'

interface AddProductModalProps {
    isOpen: boolean
    onClose: () => void
    onAdd: (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => Promise<boolean>
}

const CATEGORIES = [
    { id: 'entradas', name: 'entradas', displayName: 'Entradas' },
    { id: 'carnes_clasicas', name: 'carnes_clasicas', displayName: 'Carnes Clásicas' },
    { id: 'carnes_premium', name: 'carnes_premium', displayName: 'Carnes Premium' },
    { id: 'verduras', name: 'verduras', displayName: 'Acompañamiento' },
    { id: 'postres', name: 'postres', displayName: 'Postres' },
    { id: 'pan', name: 'pan', displayName: 'Pan' },
    { id: 'extras', name: 'extras', displayName: 'Extras' },
    { id: 'material', name: 'material', displayName: 'Material' }
]

export function AddProductModal({ isOpen, onClose, onAdd }: AddProductModalProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [newProduct, setNewProduct] = useState({
        name: '',
        category: 'entradas' as Product['category'],
        price_per_kg: null as number | null,
        price_per_portion: 0,
        unit_type: 'porcion' as Product['unit_type'],
        is_combo: false,
        notes: '',
        portion_per_person: '',
        clarifications: '',
        active: true
    })

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!newProduct.name.trim()) {
            setError('El nombre es requerido')
            return
        }

        try {
            setLoading(true)
            setError(null)
            const success = await onAdd(newProduct)
            if (success) {
                // Reset form
                setNewProduct({
                    name: '',
                    category: 'entradas',
                    price_per_kg: null,
                    price_per_portion: 0,
                    unit_type: 'porcion',
                    is_combo: false,
                    notes: '',
                    portion_per_person: '',
                    clarifications: '',
                    active: true
                })
                onClose()
            }
        } catch (err) {
            setError('Error al crear producto')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modal}>
                <div className={styles.modalHeader}>
                    <h3 className={styles.modalTitle}>Agregar Nuevo Producto</h3>
                    <button onClick={onClose} className={styles.closeButton}>
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.modalBody}>
                    {error && <div className={styles.errorAlert}>{error}</div>}

                    <div className={styles.formGroup}>
                        <label>Nombre del Producto</label>
                        <input
                            type="text"
                            value={newProduct.name}
                            onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                            placeholder="Ej: Chorizo Bombón"
                            className={styles.input}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Categoría</label>
                        <select
                            value={newProduct.category}
                            onChange={e => setNewProduct({ ...newProduct, category: e.target.value as Product['category'] })}
                            className={styles.select}
                        >
                            {CATEGORIES.map(cat => (
                                <option key={cat.id} value={cat.name}>{cat.displayName}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.row}>
                        <div className={styles.formGroup}>
                            <label>Precio por Porción (€)</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={newProduct.price_per_portion}
                                onChange={e => setNewProduct({ ...newProduct, price_per_portion: parseFloat(e.target.value) || 0 })}
                                className={styles.input}
                                disabled={newProduct.is_combo}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Precio por KG (€) (Opcional)</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={newProduct.price_per_kg === null ? '' : newProduct.price_per_kg}
                                onChange={e => setNewProduct({ ...newProduct, price_per_kg: e.target.value ? parseFloat(e.target.value) : null })}
                                className={styles.input}
                                disabled={newProduct.is_combo}
                            />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={newProduct.is_combo}
                                onChange={e => setNewProduct({ ...newProduct, is_combo: e.target.checked })}
                            />
                            Es un Combo (precio calculado por ingredientes)
                        </label>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Porción por Persona</label>
                        <input
                            type="text"
                            value={newProduct.portion_per_person}
                            onChange={e => setNewProduct({ ...newProduct, portion_per_person: e.target.value })}
                            placeholder="Ej: 1 unidad, 150gr"
                            className={styles.input}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Aclaraciones</label>
                        <textarea
                            value={newProduct.clarifications}
                            onChange={e => setNewProduct({ ...newProduct, clarifications: e.target.value })}
                            placeholder="Información adicional..."
                            className={styles.textarea}
                            rows={3}
                        />
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className={styles.submitButton}
                    >
                        {loading ? <Loader2 className={styles.spinner} size={20} /> : 'Crear Producto'}
                    </button>
                </div>
            </div>
        </div>
    )
}
