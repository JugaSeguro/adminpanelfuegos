
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

type OrderStats = {
    pendingCount: number
    approvedCount: number
    totalRevenue: number
}

export const useOrderStats = () => {
    return useQuery({
        queryKey: ['orderStats'],
        queryFn: async (): Promise<OrderStats> => {
            // We can run these in parallel or use a database function for better performance
            const pendingPromise = supabase
                .from('catering_orders')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending')

            const approvedPromise = supabase
                .from('catering_orders')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'approved')

            const revenuePromise = supabase
                .from('catering_orders')
                .select('estimated_price')
                .eq('status', 'approved')
                .not('estimated_price', 'is', null)

            const [pendingRes, approvedRes, revenueRes] = await Promise.all([
                pendingPromise,
                approvedPromise,
                revenuePromise
            ])

            const totalRevenue = (revenueRes.data || []).reduce(
                (sum, order) => sum + (order.estimated_price || 0),
                0
            )

            return {
                pendingCount: pendingRes.count || 0,
                approvedCount: approvedRes.count || 0,
                totalRevenue
            }
        }
    })
}
