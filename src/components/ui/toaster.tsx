'use client'

import { Toaster as Sonner } from 'sonner'

export function Toaster() {
    return (
        <Sonner
            position="top-right"
            richColors
            expand={true}
            toastOptions={{
                style: {
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                },
            }}
        />
    )
}
