import { useState, useMemo } from 'react'
import { CateringOrder, FilterOptions } from '@/types'

export const useOrderFilters = (orders: CateringOrder[]) => {
    const [filters, setFilters] = useState<FilterOptions>({
        searchTerm: '',
        status: 'all',
        dateFrom: '',
        dateTo: ''
    })

    // Ya no filtramos en el cliente, los filtros se pasan a la query
    // const filteredOrders = useMemo(() => { ... })

    return {
        filters,
        setFilters,
        // filteredOrders // Ya no se devuelve
    }
}
