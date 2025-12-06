import React from 'react'
import {
    Calculator, CheckSquare, Plus, RefreshCw, Download, Share2,
    List, BarChart3, TrendingUp, Search, X, CheckCircle2, AlertCircle
} from 'lucide-react'
import { ViewMode } from '../types'
import styles from './EventCalculatorHeader.module.css'

interface EventCalculatorHeaderProps {
    eventsCount: number
    regeneratingCosts: boolean
    viewMode: ViewMode
    filters: {
        search: string
        dateFrom: string
        dateTo: string
    }
    successMessage: string | null
    error: string | null
    onSelectOrders: () => void
    onAddManualEvent: () => void
    onRegenerateCosts: () => void
    onGeneratePDF: () => void
    onSharePDF: () => void
    onViewModeChange: (mode: ViewMode) => void
    onFiltersChange: (filters: { search: string; dateFrom: string; dateTo: string }) => void
}

export function EventCalculatorHeader({
    eventsCount,
    regeneratingCosts,
    viewMode,
    filters,
    successMessage,
    error,
    onSelectOrders,
    onAddManualEvent,
    onRegenerateCosts,
    onGeneratePDF,
    onSharePDF,
    onViewModeChange,
    onFiltersChange
}: EventCalculatorHeaderProps) {
    return (
        <>
            <div className={styles.header}>
                <div className={styles.titleSection}>
                    <h2 className={styles.title}>
                        <Calculator size={28} />
                        Calculadora de Ingredientes por Eventos
                    </h2>
                    <p className={styles.subtitle}>
                        Gestiona múltiples eventos y calcula las cantidades totales de ingredientes necesarios
                    </p>
                </div>

                <div className={styles.headerActions}>
                    <div className={styles.buttonGroup}>
                        <button
                            className={styles.primaryBtn}
                            onClick={onSelectOrders}
                            title="Seleccionar Pedidos"
                        >
                            <CheckSquare size={18} />
                            <span className={styles.btnText}>Seleccionar</span>
                        </button>

                        <button
                            className={styles.secondaryBtn}
                            onClick={onAddManualEvent}
                            title="Crear Evento Manual"
                        >
                            <Plus size={18} />
                            <span className={styles.btnText}>Manual</span>
                        </button>
                    </div>

                    {eventsCount > 0 && (
                        <>
                            <button
                                className={styles.regenerateBtn}
                                onClick={onRegenerateCosts}
                                disabled={regeneratingCosts}
                                title="Regenerar costos desde productos actualizados"
                            >
                                <RefreshCw size={18} className={regeneratingCosts ? styles.spinning : ''} />
                            </button>

                            <div className={styles.exportGroup}>
                                <button
                                    className={styles.exportBtn}
                                    onClick={onGeneratePDF}
                                    title="Descargar PDF"
                                >
                                    <Download size={18} />
                                </button>
                                <button
                                    className={styles.shareBtn}
                                    onClick={onSharePDF}
                                    title="Compartir PDF"
                                >
                                    <Share2 size={18} />
                                </button>
                            </div>

                            <div className={styles.viewToggle}>
                                <button
                                    className={`${styles.toggleBtn} ${viewMode === 'list' ? styles.active : ''}`}
                                    onClick={() => onViewModeChange('list')}
                                    title="Vista Lista"
                                >
                                    <List size={18} />
                                </button>
                                <button
                                    className={`${styles.toggleBtn} ${viewMode === 'timeline' ? styles.active : ''}`}
                                    onClick={() => onViewModeChange('timeline')}
                                    title="Vista Timeline"
                                >
                                    <BarChart3 size={18} />
                                </button>
                                <button
                                    className={`${styles.toggleBtn} ${viewMode === 'comparison' ? styles.active : ''}`}
                                    onClick={() => onViewModeChange('comparison')}
                                    title="Vista Comparar"
                                >
                                    <TrendingUp size={18} />
                                </button>
                                <button
                                    className={`${styles.toggleBtn} ${viewMode === 'stats' ? styles.active : ''}`}
                                    onClick={() => onViewModeChange('stats')}
                                    title="Vista Estadísticas"
                                >
                                    <Calculator size={18} />
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Mensajes de éxito/error */}
            {successMessage && (
                <div className={styles.successMessage}>
                    <CheckCircle2 size={18} />
                    {successMessage}
                </div>
            )}
            {error && (
                <div className={styles.errorMessage}>
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            {/* Filtros */}
            {eventsCount > 0 && (
                <div className={styles.filtersBar}>
                    <div className={styles.searchBox}>
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Buscar eventos..."
                            value={filters.search}
                            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
                            className={styles.searchInput}
                        />
                    </div>
                    <div className={styles.dateFilters}>
                        <input
                            type="date"
                            placeholder="Desde"
                            value={filters.dateFrom}
                            onChange={(e) => onFiltersChange({ ...filters, dateFrom: e.target.value })}
                            className={styles.dateInput}
                        />
                        <input
                            type="date"
                            placeholder="Hasta"
                            value={filters.dateTo}
                            onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value })}
                            className={styles.dateInput}
                        />
                        {(filters.search || filters.dateFrom || filters.dateTo) && (
                            <button
                                className={styles.clearFiltersBtn}
                                onClick={() => onFiltersChange({ search: '', dateFrom: '', dateTo: '' })}
                            >
                                <X size={16} />
                                Limpiar
                            </button>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}
