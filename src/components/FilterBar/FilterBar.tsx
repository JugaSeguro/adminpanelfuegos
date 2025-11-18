import { FilterOptions } from '@/types'
import styles from './FilterBar.module.css'

interface FilterBarProps {
  filters: FilterOptions
  onFiltersChange: (filters: FilterOptions) => void
  resultsCount: number
}

export default function FilterBar({ filters, onFiltersChange, resultsCount }: FilterBarProps) {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ ...filters, searchTerm: e.target.value })
  }

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const status = e.target.value as FilterOptions['status']
    onFiltersChange({ ...filters, status })
  }

  const handleDateFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ ...filters, dateFrom: e.target.value })
  }

  const handleDateToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ ...filters, dateTo: e.target.value })
  }

  const clearFilters = () => {
    onFiltersChange({
      status: 'all',
      dateFrom: '',
      dateTo: '',
      searchTerm: ''
    })
  }

  return (
    <div className={styles.filterBar}>
      <div className={styles.container}>
        <input
          type="text"
          placeholder="Buscar por nombre, email..."
          value={filters.searchTerm || ''}
          onChange={handleSearchChange}
          className={styles.searchInput}
        />
        
        <select
          value={filters.status || 'all'}
          onChange={handleStatusChange}
          className={styles.select}
        >
          <option value="all">Todos los estados</option>
          <option value="pending">Pendiente</option>
          <option value="sent">Enviado</option>
          <option value="approved">Aprobado</option>
          <option value="rejected">Rechazado</option>
        </select>
        
        <input
          type="date"
          value={filters.dateFrom || ''}
          onChange={handleDateFromChange}
          className={styles.dateInput}
          placeholder="Fecha desde"
        />
        
        <input
          type="date"
          value={filters.dateTo || ''}
          onChange={handleDateToChange}
          className={styles.dateInput}
          placeholder="Fecha hasta"
        />
        
        <button onClick={clearFilters} className={styles.clearButton}>
          Limpiar
        </button>
        
        <span className={styles.resultsCount}>
          {resultsCount} resultado{resultsCount !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  )
}