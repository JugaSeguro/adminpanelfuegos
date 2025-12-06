import { BarChart3 } from 'lucide-react'
import styles from '../../EventCalculator.module.css'
import { useEventCalculator } from '../../context/EventCalculatorContext'

export const EventStatsView = () => {
    const { globalStats } = useEventCalculator()
    return (
        <div className={styles.statsView}>
            <h3 className={styles.viewTitle}>
                <BarChart3 size={24} />
                Estadísticas y Métricas
            </h3>
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>Total de Eventos</div>
                    <div className={styles.statValue}>{globalStats.totalEvents}</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>Total de Invitados</div>
                    <div className={styles.statValue}>{globalStats.totalGuests}</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>Costo Total</div>
                    <div className={styles.statValue}>€{globalStats.totalCost.toFixed(2)}</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>Costo Promedio por Invitado</div>
                    <div className={styles.statValue}>€{globalStats.avgCostPerGuest.toFixed(2)}</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>Costo Promedio por Evento</div>
                    <div className={styles.statValue}>€{globalStats.avgCostPerEvent.toFixed(2)}</div>
                </div>
            </div>
        </div>
    )
}
