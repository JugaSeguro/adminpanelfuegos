'use client'

import { useState, useEffect } from 'react'
import { CateringOrder } from '@/types'
import styles from './Header.module.css'

interface HeaderProps {
  orders: CateringOrder[]
}

export default function Header({ orders }: HeaderProps) {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  const pendingCount = orders.filter(order => order.status === 'pending').length
  const approvedCount = orders.filter(order => order.status === 'approved').length
  const totalRevenue = orders
    .filter(order => order.status === 'approved' && order.estimatedPrice)
    .reduce((sum, order) => sum + (order.estimatedPrice || 0), 0)

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Panel de Administración</h1>
          <p className={styles.subtitle}>Gestión de pedidos de catering</p>
        </div>
        
        <div className={styles.stats}>
          <div className={styles.stat}>
            <div className={styles.statValue}>{pendingCount}</div>
            <div className={styles.statLabel}>Pedidos Pendientes</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statValue}>{approvedCount}</div>
            <div className={styles.statLabel}>Pedidos Aprobados</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statValue}>
              €{mounted ? totalRevenue.toLocaleString() : totalRevenue}
            </div>
            <div className={styles.statLabel}>Ingresos Totales</div>
          </div>
        </div>
      </div>
    </header>
  )
}