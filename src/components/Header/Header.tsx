'use client'

import { useState, useEffect } from 'react'
import { useOrderStats } from '@/hooks/useOrderStats'
import styles from './Header.module.css'

export default function Header() {
  const [mounted, setMounted] = useState(false)
  const { data: stats, isLoading } = useOrderStats()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (isLoading || !stats) {
    return (
      <header className={styles.header}>
        <div className={styles.container}>
          <div className={styles.titleSection}>
            <h1 className={styles.title}>Panel de Administración</h1>
            <p className={styles.subtitle}>Cargando estadísticas...</p>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Panel de Administración</h1>
          <p className={styles.subtitle}>Gestión de pedidos de catering</p>
        </div>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <div className={styles.statValue}>{stats.pendingCount}</div>
            <div className={styles.statLabel}>Pedidos Pendientes</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statValue}>{stats.approvedCount}</div>
            <div className={styles.statLabel}>Pedidos Aprobados</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statValue}>
              €{mounted ? stats.totalRevenue.toLocaleString() : stats.totalRevenue}
            </div>
            <div className={styles.statLabel}>Ingresos Totales</div>
          </div>
        </div>
      </div>
    </header>
  )
}