'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { List, DollarSign, BarChart3, Calendar, Bell, Euro, FileText, Calculator } from 'lucide-react'
import styles from './Sidebar.module.css'

export default function Sidebar() {
    const pathname = usePathname()

    const links = [
        { href: '/orders', label: 'Pedidos', icon: List },
        { href: '/payments', label: 'Pagos', icon: DollarSign },
        { href: '/reports', label: 'Reportes', icon: BarChart3 },
        { href: '/calendar', label: 'Calendario', icon: Calendar },
        { href: '/reminders', label: 'Recordatorios', icon: Bell },
        { href: '/prices', label: 'Precios', icon: Euro },
        { href: '/budgets', label: 'Presupuestos', icon: FileText },
        { href: '/calculator', label: 'Calculadora', icon: Calculator }
    ]

    return (
        <aside className={styles.sidebar}>
            <div className={styles.logo}>
                <h2>Fuegos Admin</h2>
            </div>
            <nav className={styles.nav}>
                {links.map(link => {
                    const IconComponent = link.icon
                    const isActive = pathname.startsWith(link.href)

                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`${styles.link} ${isActive ? styles.active : ''}`}
                        >
                            <IconComponent size={20} />
                            <span>{link.label}</span>
                        </Link>
                    )
                })}
            </nav>
        </aside>
    )
}
