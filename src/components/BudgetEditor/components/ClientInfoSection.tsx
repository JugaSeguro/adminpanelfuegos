import React, { useState } from 'react'
import { BudgetData } from '../types'
import styles from './ClientInfoSection.module.css'

interface ClientInfoSectionProps {
    data: BudgetData['clientInfo']
    onUpdate: (path: string, value: any) => void
}

export function ClientInfoSection({ data, onUpdate }: ClientInfoSectionProps) {
    const [expanded, setExpanded] = useState(true)

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
                    <h2 className={styles.title}>📋 Información del Cliente</h2>
                </div>
            </div>
            {expanded && (
                <div className={styles.editGrid}>
                    <div className={styles.editField}>
                        <label>Nombre</label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={(e) => onUpdate('clientInfo.name', e.target.value)}
                        />
                    </div>
                    <div className={styles.editField}>
                        <label>Email</label>
                        <input
                            type="email"
                            value={data.email}
                            onChange={(e) => onUpdate('clientInfo.email', e.target.value)}
                        />
                    </div>
                    <div className={styles.editField}>
                        <label>Teléfono</label>
                        <input
                            type="text"
                            value={data.phone}
                            onChange={(e) => onUpdate('clientInfo.phone', e.target.value)}
                        />
                    </div>
                    <div className={styles.editField}>
                        <label>Fecha Evento</label>
                        <input
                            type="date"
                            value={data.eventDate ? data.eventDate.split('T')[0] : ''}
                            onChange={(e) => onUpdate('clientInfo.eventDate', e.target.value)}
                        />
                    </div>
                    <div className={styles.editField}>
                        <label>Tipo Evento</label>
                        <input
                            type="text"
                            value={data.eventType}
                            onChange={(e) => onUpdate('clientInfo.eventType', e.target.value)}
                        />
                    </div>
                    <div className={styles.editField}>
                        <label>Invitados</label>
                        <input
                            type="number"
                            value={data.guestCount}
                            onChange={(e) => onUpdate('clientInfo.guestCount', parseInt(e.target.value) || 0)}
                        />
                    </div>
                    <div className={styles.editField}>
                        <label>Dirección</label>
                        <input
                            type="text"
                            value={data.address}
                            onChange={(e) => onUpdate('clientInfo.address', e.target.value)}
                        />
                    </div>
                    <div className={styles.editField}>
                        <label>Tipo Menú</label>
                        <select
                            value={data.menuType}
                            onChange={(e) => onUpdate('clientInfo.menuType', e.target.value)}
                            className={styles.select}
                        >
                            <option value="dejeuner">Déjeuner</option>
                            <option value="diner">Dîner</option>
                        </select>
                    </div>
                </div>
            )}
        </section>
    )
}
