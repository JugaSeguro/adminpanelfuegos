import styles from './NotesPanel.module.css'
import type { Event } from '../../../../types'
import type { EventCalculationNote } from '@/types'

interface NotesPanelProps {
    event: Event
    eventNotes?: EventCalculationNote[]
}

/**
 * Panel que muestra las notas y observaciones del evento.
 * Incluye notas del evento, observaciones y notas adicionales de la BD.
 */
export const NotesPanel = ({ event, eventNotes }: NotesPanelProps) => {
    return (
        <div className={styles.notesSection}>
            {/* Notas del evento */}
            {event.notes && (
                <div className={styles.noteBox}>
                    <h5>Notas:</h5>
                    <p>{event.notes}</p>
                </div>
            )}

            {/* Observaciones */}
            {event.observations && (
                <div className={styles.noteBox}>
                    <h5>Observaciones:</h5>
                    <p>{event.observations}</p>
                </div>
            )}

            {/* Notas adicionales de la BD */}
            {eventNotes && eventNotes.length > 0 && (
                <div className={styles.notesList}>
                    <h5>Notas Adicionales:</h5>
                    {eventNotes.map(note => (
                        <div key={note.id} className={styles.noteItem}>
                            <div className={styles.noteHeader}>
                                <span className={styles.noteType}>{note.note_type}</span>
                                {note.priority !== 'normal' && (
                                    <span className={`${styles.priorityBadge} ${styles[note.priority]}`}>
                                        {note.priority}
                                    </span>
                                )}
                            </div>
                            {note.title && <strong>{note.title}</strong>}
                            <p>{note.content}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
