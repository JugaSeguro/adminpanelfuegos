import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Event, EventIngredient } from '../types'
import { Product, EventCalculationVersion, EventCalculationNote, EventCalculationStats } from '@/types'
import { calculateEventCost } from '../utils/calculations'

export function useEvents(allProducts: Product[]) {
    const [events, setEvents] = useState<Event[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [eventVersions, setEventVersions] = useState<{ [key: string]: EventCalculationVersion[] }>({})
    const [eventNotes, setEventNotes] = useState<{ [key: string]: EventCalculationNote[] }>({})

    const loadEvents = useCallback(async () => {
        try {
            setLoading(true)
            const { data: calculations, error } = await supabase
                .from('event_calculations')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false })

            if (error) throw error

            if (calculations && calculations.length > 0) {
                const eventIds = calculations.map(c => c.id)

                // Parallel fetching
                const [ingredientsRes, notesRes, statsRes] = await Promise.all([
                    supabase
                        .from('event_calculation_ingredients')
                        .select('*, product:products(*)')
                        .in('event_calculation_id', eventIds)
                        .order('display_order', { ascending: true }),
                    supabase
                        .from('event_calculation_notes')
                        .select('*')
                        .in('event_calculation_id', eventIds)
                        .order('created_at', { ascending: false }),
                    supabase
                        .from('event_calculation_stats')
                        .select('*')
                        .in('event_calculation_id', eventIds)
                ])

                if (ingredientsRes.error) throw ingredientsRes.error
                if (notesRes.error) throw notesRes.error
                if (statsRes.error) throw statsRes.error

                const ingredients = ingredientsRes.data
                const notes = notesRes.data
                const stats = statsRes.data

                const mappedEvents: Event[] = calculations.map(calc => {
                    const allEventIngredients = (ingredients || [])
                        .filter(ing => ing.event_calculation_id === calc.id)

                    const eventIngredients: EventIngredient[] = allEventIngredients
                        .map(ing => {
                            const product = ing.product as unknown as Product
                            if (!product) return null
                            return {
                                id: ing.id,
                                dbId: ing.id,
                                product: product,
                                quantityPerPerson: ing.quantity_per_person,
                                notes: ing.notes || undefined,
                                isFixedQuantity: ing.is_fixed_quantity
                            } as EventIngredient
                        })
                        .filter((ing): ing is EventIngredient => ing !== null)

                    const eventStats = (stats || []).find(s => s.event_calculation_id === calc.id)

                    return {
                        id: calc.id,
                        dbId: calc.id,
                        name: calc.name,
                        eventDate: calc.event_date,
                        guestCount: calc.guest_count,
                        orderId: calc.order_id,
                        ingredients: eventIngredients,
                        expanded: false,
                        showCosts: false,
                        showNotes: false,
                        notes: calc.notes || '',
                        observations: calc.observations || '',
                        versionNumber: calc.version_number,
                        isSaved: true,
                        stats: eventStats
                    }
                })

                setEvents(mappedEvents)

                const notesByEvent: { [key: string]: EventCalculationNote[] } = {}
                notes?.forEach(note => {
                    if (!notesByEvent[note.event_calculation_id]) {
                        notesByEvent[note.event_calculation_id] = []
                    }
                    notesByEvent[note.event_calculation_id].push(note)
                })
                setEventNotes(notesByEvent)
            } else {
                setEvents([])
            }
        } catch (err) {
            console.error('Error loading events:', err)
            setError('Error al cargar eventos')
        } finally {
            setLoading(false)
        }
    }, []) // No dependencies needed as supabase is external

    // Load on mount
    useEffect(() => {
        loadEvents()
    }, [loadEvents])

    const saveEvent = async (event: Event, changeType: 'created' | 'updated' | 'duplicated' | 'restored' = 'updated') => {
        try {
            setSaving(event.id)
            const costs = calculateEventCost(event)
            const totalIngredients = event.ingredients.length

            // 1. Upsert Event Calculation
            const eventData = {
                name: event.name,
                event_date: event.eventDate,
                guest_count: event.guestCount,
                order_id: event.orderId,
                version_number: (event.versionNumber || 0) + 1,
                is_active: true,
                total_cost: costs.totalCost,
                cost_per_guest: costs.avgCostPerGuest,
                total_ingredients_count: totalIngredients,
                notes: event.notes,
                observations: event.observations,
                updated_at: new Date().toISOString()
            }

            let eventDbId = event.dbId
            let data, error

            if (eventDbId) {
                const res = await supabase
                    .from('event_calculations')
                    .update(eventData)
                    .eq('id', eventDbId)
                    .select()
                    .single()
                data = res.data
                error = res.error
            } else {
                const res = await supabase
                    .from('event_calculations')
                    .insert({ ...eventData, created_at: new Date().toISOString() })
                    .select()
                    .single()
                data = res.data
                error = res.error
            }

            if (error) throw error
            eventDbId = data.id

            // 2. Create Version History
            const versionData = {
                event_calculation_id: eventDbId,
                version_number: data.version_number,
                version_data: event, // Save full event state
                change_type: changeType,
                change_description: `Event ${changeType}`,
                created_at: new Date().toISOString()
            }

            await supabase.from('event_calculation_versions').insert(versionData)

            // 3. Update Ingredients
            // First delete existing (simplest strategy for now, or use upsert if careful)
            if (event.dbId) {
                await supabase
                    .from('event_calculation_ingredients')
                    .delete()
                    .eq('event_calculation_id', eventDbId)
            }

            if (event.ingredients.length > 0) {
                const ingredientsToInsert = event.ingredients.map((ing, index) => ({
                    event_calculation_id: eventDbId,
                    product_id: ing.product.id,
                    quantity_per_person: ing.quantityPerPerson,
                    total_quantity: ing.isFixedQuantity ? ing.quantityPerPerson : ing.quantityPerPerson * event.guestCount,
                    unit_price: ing.product.price_per_portion,
                    total_cost: 0, // Calculate if needed or DB trigger
                    notes: ing.notes,
                    display_order: index,
                    is_fixed_quantity: ing.isFixedQuantity
                }))

                const { error: ingError } = await supabase
                    .from('event_calculation_ingredients')
                    .insert(ingredientsToInsert)

                if (ingError) throw ingError
            }

            // 4. Save Stats
            const statsData = {
                event_calculation_id: eventDbId,
                total_cost: costs.totalCost,
                cost_per_guest: costs.avgCostPerGuest,
                total_ingredients: totalIngredients,
                calculated_at: new Date().toISOString()
            }

            // Check if stats exist
            const { data: existingStats } = await supabase
                .from('event_calculation_stats')
                .select('id')
                .eq('event_calculation_id', eventDbId)
                .single()

            if (existingStats) {
                await supabase.from('event_calculation_stats').update(statsData).eq('id', existingStats.id)
            } else {
                await supabase.from('event_calculation_stats').insert(statsData)
            }

            // Update local state to reflect saved status and new version
            setEvents(prev => prev.map(e => {
                if (e.id === event.id) {
                    return {
                        ...e,
                        dbId: eventDbId,
                        versionNumber: data.version_number,
                        isSaved: true
                    }
                }
                return e
            }))

            // If it was a new event being created (no dbId initially), we might need to reload or update ID mapping
            if (!event.dbId) {
                await loadEvents() // Reload to get everything synced correctly for new events
            }

            return eventDbId
        } catch (err) {
            console.error('Error saving event:', err)
            setError('Error al guardar el evento')
            throw err
        } finally {
            setSaving(null)
        }
    }

    const deleteEvent = async (eventId: string) => {
        try {
            setLoading(true)
            const event = events.find(e => e.id === eventId)
            if (!event || !event.dbId) return

            // Soft delete
            const { error } = await supabase
                .from('event_calculations')
                .update({ is_active: false })
                .eq('id', event.dbId)

            if (error) throw error

            setEvents(prev => prev.filter(e => e.id !== eventId))
        } catch (err) {
            console.error('Error deleting event:', err)
            setError('Error al eliminar el evento')
        } finally {
            setLoading(false)
        }
    }

    return {
        events,
        setEvents,
        loading,
        saving,
        error,
        setError,
        eventVersions,
        setEventVersions,
        eventNotes,
        setEventNotes,
        loadEvents,
        saveEvent,
        deleteEvent
    }
}
