import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { Product } from '@/types'

export const fetchProducts = async (): Promise<Product[]> => {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true })

    if (error) throw error
    return data || []
}

export const useProducts = () => {
    const {
        data: products = [],
        isLoading: loading,
        error
    } = useQuery({
        queryKey: ['products'],
        queryFn: fetchProducts,
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    })

    return {
        products,
        loading,
        error: error ? (error as Error).message : null
    }
}
