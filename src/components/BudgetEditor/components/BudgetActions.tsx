import React from 'react'
import { Save, CheckCircle2, FileText } from 'lucide-react'
import styles from './BudgetActions.module.css'

interface BudgetActionsProps {
    onSave: () => void
    onApproveAndSend: () => void
    onGeneratePDF: () => void
    saving: boolean
    hasPdf: boolean
}

export function BudgetActions({ onSave, onApproveAndSend, onGeneratePDF, saving, hasPdf }: BudgetActionsProps) {
    return (
        <div className={styles.budgetActions}>
            <button
                onClick={onSave}
                className={`${styles.btn} ${styles.btnSecondary}`}
                disabled={saving}
            >
                <Save size={18} />
                {saving ? 'Guardando...' : 'Guardar Borrador'}
            </button>

            <button
                onClick={onGeneratePDF}
                className={`${styles.btn} ${styles.btnPrimary}`}
                disabled={saving}
            >
                <FileText size={18} />
                {saving ? 'Generando...' : 'Generar PDF'}
            </button>

            <button
                onClick={onApproveAndSend}
                className={`${styles.btn} ${styles.btnSuccess}`}
                disabled={saving || !hasPdf}
                title={!hasPdf ? 'Primero debes generar el PDF' : ''}
            >
                <CheckCircle2 size={18} />
                Aprobar y Enviar
            </button>
        </div>
    )
}
