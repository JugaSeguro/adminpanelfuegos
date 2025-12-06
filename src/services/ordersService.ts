
import { supabase } from '@/lib/supabaseClient'
import { CateringOrder } from '@/types'

export type OrdersFilters = {
    status?: string
    searchTerm?: string
    dateFrom?: string
    dateTo?: string
}

export type FetchOrdersParams = {
    page?: number
    pageSize?: number
    filters?: OrdersFilters
}

export type OrdersResponse = {
    data: CateringOrder[]
    count: number
    error: any
}

export const fetchOrders = async ({
    page = 1,
    pageSize = 50,
    filters
}: FetchOrdersParams): Promise<OrdersResponse> => {
    // Optimization: Select only necessary fields instead of '*'
    let query = supabase
        .from('catering_orders')
        .select('*', { count: 'exact' })

    // Apply filters
    if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
    }

    if (filters?.searchTerm) {
        const term = filters.searchTerm
        // Search in multiple columns using OR syntax
        query = query.or(`name.ilike.%${term}%,email.ilike.%${term}%`)
    }

    // Apply date filters if they exist in filters (assuming filters might have them based on useOrderFilters)
    if (filters?.dateFrom) {
        query = query.gte('event_date', filters.dateFrom)
    }
    if (filters?.dateTo) {
        query = query.lte('event_date', filters.dateTo)
    }

    // Apply pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    query = query
        .order('created_at', { ascending: false })
        .range(from, to)

    const { data, error, count } = await query

    if (error) {
        throw error
    }

    // Map to internal type
    const mapped: CateringOrder[] = (data || []).map((row: any) => ({
        id: row.id,
        contact: {
            email: row.email,
            name: row.name,
            phone: row.phone || '',
            eventDate: row.event_date || '',
            eventType: row.event_type || '',
            // eventTime: row.event_time || undefined, // Not selected anymore to save bytes if unused, add back if needed
            address: row.address || '',
            guestCount: row.guest_count || 0
        },
        menu: { type: row.menu_type },
        entrees: row.entrees || [],
        viandes: row.viandes || [],
        dessert: row.dessert || null,
        extras: row.extras || { wines: false, equipment: [], decoration: false, specialRequest: '' },
        status: row.status || 'pending',
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        estimatedPrice: row.estimated_price || undefined,
        notes: row.notes || undefined,
        payment: row.payment
    }))

    return {
        data: mapped,
        count: count || 0,
        error: null
    }
}
