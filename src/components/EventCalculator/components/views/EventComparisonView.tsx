import { TrendingUp } from 'lucide-react'
import styles from '../../EventCalculator.module.css'
import { calculateEventCost } from '../../utils/calculations'
import { useEventCalculator } from '../../context/EventCalculatorContext'

export const EventComparisonView = () => {
    const {
        filteredEvents,
        events,
        selectedEventIds,
        handleSelectEvent
    } = useEventCalculator()

    const handleCheckboxChange = (eventId: string, checked: boolean) => {
        handleSelectEvent(eventId, checked)
    }

    return (
        <div className={styles.comparisonView}>
            <h3 className={styles.viewTitle}>
                <TrendingUp size={24} />
                Comparación de Eventos
            </h3>
            <div className={styles.comparisonControls}>
                <p>Selecciona eventos para comparar:</p>
                <div className={styles.comparisonCheckboxes}>
                    {filteredEvents.map(event => (
                        <label key={event.id} className={styles.comparisonCheckbox}>
                            <input
                                type="checkbox"
                                checked={selectedEventIds.includes(event.id)}
                                onChange={(e) => handleCheckboxChange(event.id, e.target.checked)}
                            />
                            {event.name}
                        </label>
                    ))}
                </div>
            </div>
            {selectedEventIds.length > 0 && (
                <div className={styles.comparisonTable}>
                    <table>
                        <thead>
                            <tr>
                                <th>Métrica</th>
                                {selectedEventIds.map(id => {
                                    const event = events.find(e => e.id === id)
                                    return event ? <th key={id}>{event.name}</th> : null
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Invitados</td>
                                {selectedEventIds.map(id => {
                                    const event = events.find(e => e.id === id)
                                    return <td key={id}>{event?.guestCount || 0}</td>
                                })}
                            </tr>
                            <tr>
                                <td>Costo Total</td>
                                {selectedEventIds.map(id => {
                                    const event = events.find(e => e.id === id)
                                    const costs = event ? calculateEventCost(event) : null
                                    return <td key={id}>€{costs?.totalCost.toFixed(2) || '0.00'}</td>
                                })}
                            </tr>
                            <tr>
                                <td>Costo por Invitado</td>
                                {selectedEventIds.map(id => {
                                    const event = events.find(e => e.id === id)
                                    const costs = event ? calculateEventCost(event) : null
                                    return <td key={id}>€{costs?.avgCostPerGuest.toFixed(2) || '0.00'}</td>
                                })}
                            </tr>
                            <tr>
                                <td>Número de Ingredientes</td>
                                {selectedEventIds.map(id => {
                                    const event = events.find(e => e.id === id)
                                    return <td key={id}>{event?.ingredients.length || 0}</td>
                                })}
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
