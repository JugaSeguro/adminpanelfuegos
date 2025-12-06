import React, { useState, useCallback, useRef } from 'react'
import { ConfirmationModal } from '@/components/common/ConfirmationModal'

interface ConfirmationOptions {
    title: string
    message: string
    variant?: 'danger' | 'warning' | 'info' | 'success'
    type?: 'confirm' | 'alert'
}

export const useConfirmation = () => {
    const [confirmationState, setConfirmationState] = useState<{
        isOpen: boolean
        options: ConfirmationOptions
    }>({
        isOpen: false,
        options: { title: '', message: '' }
    })

    const resolver = useRef<((value: boolean) => void) | null>(null)

    const confirm = useCallback((options: ConfirmationOptions): Promise<boolean> => {
        setConfirmationState({
            isOpen: true,
            options: { ...options, type: 'confirm' }
        })

        return new Promise((resolve) => {
            resolver.current = resolve
        })
    }, [])

    const alert = useCallback((options: ConfirmationOptions): Promise<void> => {
        setConfirmationState({
            isOpen: true,
            options: { ...options, type: 'alert' }
        })

        return new Promise((resolve) => {
            // For alert, we just resolve true when closed
            // We cast strictly for TS, treating void as a boolean true effectively for the resolver
            resolver.current = (val: boolean) => resolve()
        })
    }, [])

    const handleConfirm = useCallback(() => {
        if (resolver.current) {
            resolver.current(true)
        }
        setConfirmationState(prev => ({ ...prev, isOpen: false }))
    }, [])

    const handleCancel = useCallback(() => {
        if (resolver.current) {
            // If it's an alert, cancel acts like confirm (close)
            if (confirmationState.options.type === 'alert') {
                resolver.current(true)
            } else {
                resolver.current(false)
            }
        }
        setConfirmationState(prev => ({ ...prev, isOpen: false }))
    }, [confirmationState.options.type])

    // Component to render in the tree
    const ConfirmationDialog = () => (
        <ConfirmationModal
            isOpen={confirmationState.isOpen}
            title={confirmationState.options.title}
            message={confirmationState.options.message}
            variant={confirmationState.options.variant}
            type={confirmationState.options.type || 'confirm'}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
        />
    )

    return {
        confirm,
        alert,
        ConfirmationDialog
    }
}
