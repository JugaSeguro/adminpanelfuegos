import { Wrench } from 'lucide-react'
import styles from './WarningBox.module.css'

interface WarningBoxProps {
    message: string
    onRepair: () => void
    isSaving: boolean
}

/**
 * Componente que muestra una advertencia cuando hay items no encontrados
 * en el evento y permite repararlos.
 */
export const WarningBox = ({ message, onRepair, isSaving }: WarningBoxProps) => {
    return (
        <div className={styles.warningBox}>
            <svg
                className={styles.icon}
                xmlns="http://www.w3.org/2000/svg"
                width={18}
                height={18}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <p>{message}</p>
            <button
                className={styles.repairBtn}
                onClick={onRepair}
                disabled={isSaving}
            >
                <Wrench size={16} />
                {isSaving ? 'Reparando...' : 'Reparar Evento'}
            </button>
        </div>
    )
}
