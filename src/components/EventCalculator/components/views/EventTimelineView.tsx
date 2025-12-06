import { Calendar } from 'lucide-react'
import styles from '../../EventCalculator.module.css'
import { calculateEventCost } from '../../utils/calculations'
import { useEventCalculator } from '../../context/EventCalculatorContext'

export const EventTimelineView = () => {
    const { filteredEvents } = useEventCalculator()
    return (
        <div className={styles.timelineView}>
            <h3 className={styles.viewTitle}>
                <Calendar size={24} />
                Timeline de Eventos
            </h3>
            <div className={styles.timelineContainer}>
                {filteredEvents
                    .filter(e => e.eventDate)
                    .sort((a, b) => new Date(a.eventDate!).getTime() - new Date(b.eventDate!).getTime())
                    .map(event => (
                        <div key={event.id} className={styles.timelineItem}>
                            <div className={styles.timelineDate}>
                                {new Date(event.eventDate!).toLocaleDateString()}
                            </div>
                            <div className={styles.timelineContent}>
                                <h4>{event.name}</h4>
                                <div className={styles.timelineDetails}>
                                    <span>👥 {event.guestCount} invitados</span>
                                    <span>🍽️ {event.ingredients.length} ingredientes</span>
                                    {(() => {
                                        const costs = calculateEventCost(event)
                                        return <span>💰 €{costs.totalCost.toFixed(2)}</span>
                                    })()}
                                </div>
                            </div>
                        </div>
                    ))}
            </div>
        </div>
    )
}
