import React from 'react'
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react'

// You can customize these styles or move them to a CSS module
const styles = {
    overlay: {
        position: 'fixed' as 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
    },
    modal: {
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px',
        maxWidth: '400px',
        width: '90%',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb'
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '16px'
    },
    title: {
        fontSize: '1.25rem',
        fontWeight: 600,
        margin: 0,
        color: '#111827'
    },
    message: {
        color: '#4b5563',
        marginBottom: '24px',
        lineHeight: '1.5',
        fontSize: '0.95rem'
    },
    actions: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px'
    },
    button: {
        padding: '8px 16px',
        borderRadius: '6px',
        fontSize: '0.875rem',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.2s',
        border: 'none'
    },
    cancelButton: {
        backgroundColor: '#f3f4f6',
        color: '#374151',
    },
    confirmButton: {
        backgroundColor: '#2563eb',
        color: 'white',
    },
    dangerButton: {
        backgroundColor: '#dc2626',
        color: 'white'
    },
    warningButton: {
        backgroundColor: '#d97706',
        color: 'white'
    }
}

interface ConfirmationModalProps {
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
    onCancel: () => void
    type: 'confirm' | 'alert'
    variant?: 'danger' | 'warning' | 'info' | 'success'
}

export const ConfirmationModal = ({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    type,
    variant = 'info'
}: ConfirmationModalProps) => {
    if (!isOpen) return null

    const getIcon = () => {
        switch (variant) {
            case 'danger': return <AlertCircle color="#dc2626" />
            case 'warning': return <AlertCircle color="#d97706" />
            case 'success': return <CheckCircle color="#059669" />
            default: return <Info color="#2563eb" />
        }
    }

    const getConfirmButtonStyle = () => {
        switch (variant) {
            case 'danger': return styles.dangerButton
            case 'warning': return styles.warningButton
            default: return styles.confirmButton
        }
    }

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <div style={styles.header}>
                    {getIcon()}
                    <h3 style={styles.title}>{title}</h3>
                </div>

                <div style={styles.message}>
                    {message.split('\n').map((line, i) => (
                        <p key={i} style={{ margin: '0 0 8px 0' }}>{line}</p>
                    ))}
                </div>

                <div style={styles.actions}>
                    {type === 'confirm' && (
                        <button
                            style={{ ...styles.button, ...styles.cancelButton }}
                            onClick={onCancel}
                        >
                            Cancelar
                        </button>
                    )}
                    <button
                        style={{ ...styles.button, ...getConfirmButtonStyle() }}
                        onClick={onConfirm}
                    >
                        {type === 'alert' ? 'Entendido' : 'Confirmar'}
                    </button>
                </div>
            </div>
        </div>
    )
}
