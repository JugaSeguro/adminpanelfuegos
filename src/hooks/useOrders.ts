import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { CateringOrder, PaymentInfo } from '@/types'
import { fetchOrders, OrdersFilters } from '@/services/ordersService'
import { useState } from 'react'
import { toast } from 'sonner'

export const useOrders = (initialFilters?: OrdersFilters) => {
    const queryClient = useQueryClient()
    const [page, setPage] = useState(1)
    const [pageSize] = useState(50)
    const [filters, setFilters] = useState<OrdersFilters>(initialFilters || {})

    const {
        data: ordersData,
        isLoading: loading,
        error
    } = useQuery({
        queryKey: ['orders', page, pageSize, filters],
        queryFn: () => fetchOrders({ page, pageSize, filters }),
        placeholderData: (previousData) => previousData
    })

    // Reset page to 1 whenever filters change
    // Note: This logic might cause a double render or need a better place, 
    // but typically we want to go back to page 1 if we search/filter.
    // However, since `page` is in dependency array of useQuery, we need to be careful.
    // A better pattern is to handle setPage(1) in the UI when filters change.


    const orders = ordersData?.data || []
    const totalCount = ordersData?.count || 0

    // Mutation for status update
    const updateStatusMutation = useMutation({
        mutationFn: async ({ orderId, newStatus }: { orderId: string, newStatus: CateringOrder['status'] }) => {
            const { data, error } = await supabase
                .from('catering_orders')
                .update({ status: newStatus, updated_at: new Date().toISOString() })
                .eq('id', orderId)
                .select()
                .single()

            if (error) throw error
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] })
            toast.success('Estado actualizado correctamente')
        },
        onError: (err: any) => {
            console.error('❌ Error al actualizar estado:', err)
            toast.error(`Error al actualizar: ${err.message}`)
        }
    })

    const handleStatusChange = async (orderId: string, newStatus: CateringOrder['status']) => {
        updateStatusMutation.mutate({ orderId, newStatus })
    }

    const handleUpdatePayment = (orderId: string, updatedPayment: PaymentInfo) => {
        // Optimistic update or just invalidate for now
        queryClient.invalidateQueries({ queryKey: ['orders'] })
    }

    const handleUpdateOrder = (orderId: string, updates: Partial<CateringOrder>) => {
        queryClient.invalidateQueries({ queryKey: ['orders'] })
    }

    return {
        orders,
        totalCount,
        loading,
        error,
        page,
        setPage,
        pageSize,
        filters,
        setFilters,
        handleStatusChange,
        handleUpdatePayment,
        handleUpdateOrder
    }
}
