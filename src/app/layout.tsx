import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Fuegos d\'Azur - Panel de Administración',
  description: 'Panel de administración para gestionar pedidos de catering',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>
        {children}
      </body>
    </html>
  )
}