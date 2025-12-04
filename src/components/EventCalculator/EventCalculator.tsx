'use client'

import { useState, useEffect, useMemo } from 'react'
import { Product, CateringOrder, EventCalculation, EventCalculationIngredient, EventCalculationNote, EventCalculationVersion, EventCalculationStats } from '@/types'
import { supabase } from '@/lib/supabaseClient'
import {
  Plus, X, Download, Calculator, Users, Trash2, ChevronDown, ChevronUp,
  CheckSquare, Square, Save, History, Calendar, BarChart3, FileText,
  StickyNote, Eye, Copy, Filter, Search, TrendingUp, Clock, AlertCircle, List, RefreshCw, CheckCircle2, Wrench, Share2, ChevronRight, Package
} from 'lucide-react'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import styles from './EventCalculator.module.css'

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

interface EventIngredient {
  id: string
  product: Product
  quantityPerPerson: number
  notes?: string
  dbId?: string // ID en la base de datos
  isFixedQuantity?: boolean
  totalQuantity?: number
}

interface Event {
  id: string
  dbId?: string // ID en la base de datos
  name: string
  eventDate: string | null
  guestCount: number
  orderId: string | null
  ingredients: EventIngredient[]
  expanded: boolean
  showCosts: boolean
  showNotes: boolean
  notes: string
  observations: string
  versionNumber: number
  isSaved: boolean
  stats?: EventCalculationStats
}

interface EventCalculatorProps {
  products: Product[]
  orders: CateringOrder[]
}

type ViewMode = 'list' | 'timeline' | 'comparison' | 'stats'

export default function EventCalculator({ products, orders }: EventCalculatorProps) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [regeneratingCosts, setRegeneratingCosts] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [showAddEventModal, setShowAddEventModal] = useState(false)
  const [showSelectOrderModal, setShowSelectOrderModal] = useState(false)
  const [showNotesModal, setShowNotesModal] = useState<string | null>(null)
  const [showHistoryModal, setShowHistoryModal] = useState<string | null>(null)
  const [showComparisonModal, setShowComparisonModal] = useState(false)
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([])
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([])
  const [newEventName, setNewEventName] = useState('')
  const [newEventGuests, setNewEventGuests] = useState(0)
  const [newEventDate, setNewEventDate] = useState('')
  const [filters, setFilters] = useState({
    search: '',
    dateFrom: '',
    dateTo: ''
  })
  const [eventVersions, setEventVersions] = useState<{ [key: string]: EventCalculationVersion[] }>({})
  const [eventNotes, setEventNotes] = useState<{ [key: string]: EventCalculationNote[] }>({})
  const [showSummary, setShowSummary] = useState(false)
  const [showMaterialSelectorModal, setShowMaterialSelectorModal] = useState(false)
  const [currentEventIdForSelector, setCurrentEventIdForSelector] = useState<string | null>(null)
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([])
  const [comboIngredientsMap, setComboIngredientsMap] = useState<{ [comboId: string]: any[] }>({})

  // Cargar ingredientes de combos al inicio
  useEffect(() => {
    const loadAllComboIngredients = async () => {
      const { data, error } = await supabase
        .from('combo_ingredients')
        .select('combo_id, ingredient_id, quantity')
      
      if (data) {
        const map: { [key: string]: any[] } = {}
        data.forEach(item => {
          if (!map[item.combo_id]) map[item.combo_id] = []
          map[item.combo_id].push(item)
        })
        setComboIngredientsMap(map)
      }
    }
    loadAllComboIngredients()
  }, [])


  // Filtrar pedidos aprobados con fecha de evento
  const availableOrders = orders.filter(order =>
    order.status === 'approved' &&
    order.contact.eventDate &&
    order.contact.guestCount > 0
  )

  // Productos disponibles (sin combos) - solo para el selector de agregar ingredientes
  const availableProducts = products.filter(p => !p.is_combo && p.active)

  // TODOS los productos (incluyendo combos) para búsqueda desde pedidos
  const allProducts = products.filter(p => p.active)

  // Función para convertir portion_per_person a número
  // Maneja formatos como: "1/4", "1/2", "30 gr", "83,3 gr", "1 feta", "1", etc.
  const parsePortionPerPerson = (portionStr: string | null | undefined): number => {
    if (!portionStr) return 1 // Valor por defecto

    // Reemplazar comas por puntos para manejar formato europeo
    const normalized = portionStr.trim().replace(/,/g, '.')
    const trimmed = normalized.toLowerCase()

    // Manejar fracciones (1/4, 1/2, etc.)
    if (trimmed.includes('/')) {
      const [numerator, denominator] = trimmed.split('/').map(s => parseFloat(s.trim().replace(/,/g, '.')))
      if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
        return numerator / denominator
      }
    }

    // Manejar números con unidades (30 gr, 50 gr, 83,3 gr, etc.)
    // Acepta tanto punto como coma como separador decimal
    const numberMatch = trimmed.match(/^([\d.,]+)/)
    if (numberMatch) {
      // Reemplazar coma por punto para parseFloat
      const numberStr = numberMatch[1].replace(/,/g, '.')
      const number = parseFloat(numberStr)
      if (!isNaN(number)) {
        // Si tiene "gr" o "g", convertir a kg (30 gr = 0.03 kg, 83,3 gr = 0.0833 kg)
        if (trimmed.includes('gr') || trimmed.includes('g')) {
          return number / 1000 // 30 gr = 0.03 kg, 83,3 gr = 0.0833 kg
        }
        // Si es solo un número, usarlo directamente
        return number
      }
    }

    // Si tiene "feta", "bolsa", "unidad", etc., asumir 1
    if (trimmed.includes('feta') || trimmed.includes('bolsa') || trimmed.includes('unidad') || trimmed.includes('paquete')) {
      return 1
    }

    // Valor por defecto
    return 1
  }

  // Función para determinar la unidad correcta a mostrar
  const getDisplayUnit = (product: Product, quantity: number): string => {
    // Si el unit_type es "unidad", siempre mostrar "unidad"
    if (product.unit_type === 'unidad') {
      return 'unidad'
    }

    // Si portion_per_person contiene "gr" o "g", mostrar en gr (independientemente del unit_type)
    if (product.portion_per_person) {
      const portionLower = product.portion_per_person.toLowerCase().replace(/,/g, '.')
      if (portionLower.includes('gr') || portionLower.includes('g')) {
        return 'gr'
      }
    }

    // Si el unit_type es "porcion" y no tiene "gr" en portion_per_person
    if (product.unit_type === 'porcion') {
      // Si portion_per_person es una fracción o número simple, mostrar "unidad" (cambio solicitado)
      return 'unidad'
    }

    // Si el unit_type es "kg", verificar si debe mostrarse en gr
    if (product.unit_type === 'kg') {
      // Si la cantidad es menor a 1 kg, mostrar en gr
      if (quantity < 1) {
        return 'gr'
      }
      return 'kg'
    }

    // Por defecto, usar el unit_type del producto
    return product.unit_type
  }

  // Función para convertir cantidad a la unidad de visualización
  const convertToDisplayUnit = (product: Product, quantity: number): { value: number, unit: string } => {
    // Primero determinar la unidad de visualización
    const displayUnit = getDisplayUnit(product, quantity)

    // Si la unidad de visualización es "gr", convertir de kg a gr
    if (displayUnit === 'gr') {
      return { value: quantity * 1000, unit: 'gr' }
    }

    // Si la unidad de visualización es "kg", usar el valor tal cual
    if (displayUnit === 'kg') {
      return { value: quantity, unit: 'kg' }
    }

    // Para otras unidades (unidad, porcion), usar el valor tal cual
    return { value: quantity, unit: displayUnit }
  }

  // Función específica para el resumen general (totales)
  // Prioriza mostrar en kg cuando la cantidad es >= 1 kg
  const convertToDisplayUnitForSummary = (product: Product, quantity: number): { value: number, unit: string } => {
    // Si el producto usa kg como unidad base
    if (product.unit_type === 'kg') {
      // Siempre mostrar en kg para el resumen total (cambio solicitado)
      return { value: quantity, unit: 'kg' }
    }

    // Para productos con unit_type 'unidad', siempre mostrar en unidad
    if (product.unit_type === 'unidad') {
      return { value: quantity, unit: 'unidad' }
    }

    // Para productos con unit_type 'porcion'
    if (product.unit_type === 'porcion') {
      // Si tiene portion_per_person con "gr", mostrar en kg para el resumen
      if (product.portion_per_person) {
        const portionLower = product.portion_per_person.toLowerCase().replace(/,/g, '.')
        if (portionLower.includes('gr') || portionLower.includes('g')) {
          return { value: quantity, unit: 'kg' }
        }
      }
      // De lo contrario, mostrar en unidad
      return { value: quantity, unit: 'unidad' }
    }

    // Por defecto, usar el unit_type del producto
    return { value: quantity, unit: product.unit_type }
  }

  // Función para obtener el valor a mostrar en el input según la unidad de visualización
  const getInputValue = (product: Product, quantityInKg: number): number => {
    const displayUnit = getDisplayUnit(product, quantityInKg)

    // Si la unidad de visualización es "gr", convertir de kg a gr
    // Esto aplica tanto para productos con unit_type 'kg' como 'porcion' que tienen "gr" en portion_per_person
    if (displayUnit === 'gr') {
      return quantityInKg * 1000
    }

    // Para otros casos (kg, unidad, porcion sin gr), usar el valor tal cual
    return quantityInKg
  }

  // Función para convertir el valor del input de vuelta a kg para guardar
  const parseInputValue = (product: Product, inputValue: number, displayUnit: string): number => {
    // Si el input está en gr, convertir a kg (independientemente del unit_type del producto)
    if (displayUnit === 'gr') {
      return inputValue / 1000
    }

    // Para otros casos (kg, unidad, porcion), usar el valor tal cual
    return inputValue
  }

  // Cargar eventos desde la base de datos
  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    try {
      setLoading(true)

      // Cargar eventos calculados
      const { data: calculations, error } = await supabase
        .from('event_calculations')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (calculations && calculations.length > 0) {
        // Cargar ingredientes para cada evento
        const eventIds = calculations.map(c => c.id)
        const { data: ingredients, error: ingError } = await supabase
          .from('event_calculation_ingredients')
          .select('*, product:products(*)')
          .in('event_calculation_id', eventIds)
          .order('display_order', { ascending: true })

        if (ingError) throw ingError

        // Cargar notas
        const { data: notes, error: notesError } = await supabase
          .from('event_calculation_notes')
          .select('*')
          .in('event_calculation_id', eventIds)
          .order('created_at', { ascending: false })

        if (notesError) throw notesError

        // Cargar estadísticas
        const { data: stats, error: statsError } = await supabase
          .from('event_calculation_stats')
          .select('*')
          .in('event_calculation_id', eventIds)

        if (statsError) throw statsError

        // Mapear datos
        console.log(`📊 Total de eventos encontrados: ${calculations.length}`)
        console.log(`📊 Total de ingredientes encontrados: ${ingredients?.length || 0}`)

        const mappedEvents: Event[] = calculations.map(calc => {
          const allEventIngredients = (ingredients || [])
            .filter(ing => ing.event_calculation_id === calc.id)

          console.log(`🔍 Evento "${calc.name}" (ID: ${calc.id}) tiene ${allEventIngredients.length} ingredientes en BD`)

          const eventIngredients: EventIngredient[] = allEventIngredients
            .map(ing => {
              const product = ing.product as Product
              if (!product) {
                console.error(`⚠️ Ingrediente sin producto (ID: ${ing.id}, product_id: ${ing.product_id}):`, ing)
                return null
              }
              return {
                id: ing.id,
                dbId: ing.id,
                product: product,
                quantityPerPerson: ing.quantity_per_person,
                notes: ing.notes || undefined,
                isFixedQuantity: ing.is_fixed_quantity
              } as EventIngredient
            })
            .filter((ing): ing is EventIngredient => ing !== null) // Filtrar nulls

          console.log(`📦 Cargando evento "${calc.name}" con ${eventIngredients.length} ingredientes válidos:`,
            eventIngredients.map(i => i ? `${i.product.name} (${i.quantityPerPerson})` : 'NULL').join(', '))

          if (eventIngredients.length === 0) {
            console.warn(`⚠️ Evento "${calc.name}" no tiene ingredientes válidos cargados`)
          }

          if (allEventIngredients.length > eventIngredients.length) {
            console.warn(`⚠️ Evento "${calc.name}" tiene ${allEventIngredients.length - eventIngredients.length} ingredientes sin producto válido`)
          }

          const eventNotesList = (notes || []).filter(n => n.event_calculation_id === calc.id)
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

        // Organizar notas por evento
        const notesByEvent: { [key: string]: EventCalculationNote[] } = {}
        notes?.forEach(note => {
          if (!notesByEvent[note.event_calculation_id]) {
            notesByEvent[note.event_calculation_id] = []
          }
          notesByEvent[note.event_calculation_id].push(note)
        })
        setEventNotes(notesByEvent)
      }
    } catch (err) {
      console.error('Error loading events:', err)
    } finally {
      setLoading(false)
    }
  }

  // Función para mapear nombre de producto del formulario a producto de la BD
  const findProductByName = (itemName: string): Product | undefined => {
    if (!itemName) {
      console.warn('⚠️ findProductByName recibió un itemName vacío')
      return undefined
    }

    const normalizedInput = itemName.toLowerCase().trim()
    console.log(`🔎 Buscando producto: "${itemName}" (normalizado: "${normalizedInput}")`)

    // Mapeo completo de nombres del formulario a nombres en la BD
    const nameMapping: { [key: string]: string[] } = {
      'empanadas': ['empanadas', 'empanada'],
      'tapas-chorizo': ['chorizo', 'choripan', 'tapa chorizo', 'tapas chorizo'],
      'miniburger': ['burguer', 'burger', 'miniburger', 'mini burger', 'mini-burger'],
      'saumon': ['salmon', 'salmón', 'saumon'],
      'bife-chorizo': ['bife de chorizo', 'bife chorizo', 'bife'],
      'entrecote-france': ['entrecot fr', 'entrecote fr', 'entrecot france', 'entrecote france', 'entrecot'],
      'entrecote-arg': ['entrecot arg', 'entrecote arg', 'entrecot argentino'],
      'entrecote-argentine': ['entrecot arg', 'entrecote arg', 'entrecot argentino', 'entrecote argentine', 'entrecote argentina'],
      'magret-canard': ['magret de canard', 'magret', 'canard'],
      'vacio': ['vacio', 'vacío'],
      'costillar': ['costillar', 'costilla'],
      'cote-boeuf': ['cote de boeuf', 'cote boeuf', 'cote'],
      'picanha': ['picanha', 'picaña'],
      'fruits-flambes': ['fruits flambes', 'fruits flambés', 'frutas flambeadas', 'fruit flambe'],
    }

    // Estrategia 1: Buscar en el mapeo directo
    const mappedNames = nameMapping[normalizedInput] || [normalizedInput]

    // Estrategia 2: Buscar coincidencia exacta o parcial
    for (const mappedName of mappedNames) {
      const exactMatch = allProducts.find(p =>
        p.name.toLowerCase() === mappedName.toLowerCase()
      )
      if (exactMatch) {
        console.log(`✅ Encontrado exacto: "${itemName}" → "${exactMatch.name}" (activo: ${exactMatch.active})`)
        return exactMatch
      }
    }

    // Estrategia 3: Buscar por inclusión (más flexible)
    for (const mappedName of mappedNames) {
      const partialMatch = allProducts.find(p => {
        const productName = p.name.toLowerCase()
        return productName.includes(mappedName) || mappedName.includes(productName)
      })
      if (partialMatch) {
        console.log(`✅ Encontrado parcial: "${itemName}" → "${partialMatch.name}" (activo: ${partialMatch.active})`)
        return partialMatch
      }
    }

    // Estrategia 4: Buscar sin guiones ni espacios
    const cleanInput = normalizedInput.replace(/[-_]/g, ' ').replace(/\s+/g, ' ')
    const cleanMatch = allProducts.find(p => {
      const cleanProductName = p.name.toLowerCase().replace(/[-_]/g, ' ').replace(/\s+/g, ' ')
      return cleanProductName.includes(cleanInput) || cleanInput.includes(cleanProductName)
    })
    if (cleanMatch) {
      console.log(`✅ Encontrado limpio: "${itemName}" → "${cleanMatch.name}" (activo: ${cleanMatch.active})`)
      return cleanMatch
    }

    // Estrategia 5: Búsqueda por palabras clave (para casos como "entrecote-argentine" → "entrecot arg")
    const keywords = cleanInput.split(/\s+/).filter(w => w.length > 2)
    if (keywords.length > 0) {
      const keywordMatch = allProducts.find(p => {
        const productName = p.name.toLowerCase()
        // Buscar si todas las palabras clave están en el nombre del producto
        return keywords.some(keyword => productName.includes(keyword))
      })
      if (keywordMatch) {
        console.log(`✅ Encontrado por palabras clave: "${itemName}" → "${keywordMatch.name}" (activo: ${keywordMatch.active})`)
        return keywordMatch
      }
    }

    // Estrategia 6: Búsqueda por similitud (para casos como "miniburger" → "burguer")
    const inputWords = normalizedInput.split(/[-_\s]+/).filter(w => w.length > 2)
    const similarityMatch = allProducts.find(p => {
      const productName = p.name.toLowerCase()
      const productWords = productName.split(/[-_\s]+/).filter(w => w.length > 2)

      // Verificar si hay palabras comunes (más estricto)
      const commonWords = inputWords.filter(iw =>
        productWords.some(pw => pw.includes(iw) || iw.includes(pw) || pw === iw)
      )

      // Si al menos una palabra coincide, es un match
      return commonWords.length > 0
    })
    if (similarityMatch) {
      console.log(`✅ Encontrado por similitud: "${itemName}" → "${similarityMatch.name}" (activo: ${similarityMatch.active})`)
      return similarityMatch
    }

    // Estrategia 7: Búsqueda muy flexible - solo por palabras clave principales
    // Para "miniburger" buscar "burger", para "entrecote-argentine" buscar "entrecot" y "arg"
    if (normalizedInput.includes('burger') || normalizedInput.includes('miniburger')) {
      const burgerMatch = allProducts.find(p => {
        const productName = p.name.toLowerCase()
        return productName.includes('burger') || productName.includes('burguer')
      })
      if (burgerMatch) {
        console.log(`✅ Encontrado por búsqueda flexible (burger): "${itemName}" → "${burgerMatch.name}"`)
        return burgerMatch
      }
    }

    if (normalizedInput.includes('entrecot') || normalizedInput.includes('entrecote')) {
      const entrecotMatch = allProducts.find(p => {
        const productName = p.name.toLowerCase()
        // Buscar "entrecot" y si tiene "arg" o "argentine" en el input, buscar también "arg" en el producto
        if (productName.includes('entrecot')) {
          if (normalizedInput.includes('arg') || normalizedInput.includes('argentine') || normalizedInput.includes('argentina')) {
            return productName.includes('arg')
          }
          // Si no especifica origen, buscar cualquier entrecot
          return true
        }
        return false
      })
      if (entrecotMatch) {
        console.log(`✅ Encontrado por búsqueda flexible (entrecot): "${itemName}" → "${entrecotMatch.name}"`)
        return entrecotMatch
      }
    }

    // Si no se encuentra, loguear para debugging
    console.warn(`⚠️ Producto no encontrado: "${itemName}". Productos disponibles (activos):`,
      allProducts.map(p => `${p.name}${p.is_combo ? ' (combo)' : ''}`).join(', '))

    return undefined
  }

  // Guardar evento en la base de datos
  const saveEvent = async (event: Event, changeType: 'created' | 'updated' | 'duplicated' | 'restored' = 'updated') => {
    try {
      setSaving(event.id)

      const costs = calculateEventCost(event)
      const totalIngredients = event.ingredients.length

      // Guardar o actualizar evento principal
      let eventDbId = event.dbId

      if (!eventDbId) {
        // Crear nuevo evento
        const { data: newCalc, error: createError } = await supabase
          .from('event_calculations')
          .insert([{
            name: event.name,
            event_date: event.eventDate || null,
            guest_count: event.guestCount,
            order_id: event.orderId || null,
            version_number: 1,
            total_cost: costs.totalCost,
            cost_per_guest: costs.avgCostPerGuest,
            total_ingredients_count: totalIngredients,
            notes: event.notes || null,
            observations: event.observations || null
          }])
          .select()
          .single()

        if (createError) throw createError
        eventDbId = newCalc.id
      } else {
        // Actualizar evento existente
        const { error: updateError } = await supabase
          .from('event_calculations')
          .update({
            name: event.name,
            event_date: event.eventDate || null,
            guest_count: event.guestCount,
            total_cost: costs.totalCost,
            cost_per_guest: costs.avgCostPerGuest,
            total_ingredients_count: totalIngredients,
            notes: event.notes || null,
            observations: event.observations || null,
            version_number: event.versionNumber + 1
          })
          .eq('id', eventDbId)

        if (updateError) throw updateError

        // Crear versión del historial
        await supabase
          .from('event_calculation_versions')
          .insert([{
            event_calculation_id: eventDbId,
            version_number: event.versionNumber + 1,
            version_data: {
              name: event.name,
              eventDate: event.eventDate,
              guestCount: event.guestCount,
              ingredients: event.ingredients.map(ing => ({
                productId: ing.product.id,
                productName: ing.product.name,
                quantityPerPerson: ing.quantityPerPerson,
                notes: ing.notes
              })),
              notes: event.notes,
              observations: event.observations
            },
            change_type: changeType,
            change_description: `Evento ${changeType === 'created' ? 'creado' : 'actualizado'}`
          }])
      }

      // Guardar ingredientes
      if (eventDbId) {
        // Eliminar ingredientes antiguos
        await supabase
          .from('event_calculation_ingredients')
          .delete()
          .eq('event_calculation_id', eventDbId)

        // Insertar ingredientes nuevos
        if (event.ingredients.length > 0) {
          console.log(`💾 Guardando ${event.ingredients.length} ingredientes para evento ${event.name}:`,
            event.ingredients.map(i => `${i.product.name} (${i.quantityPerPerson})`).join(', '))

          const ingredientsToInsert = event.ingredients.map((ing, index) => {
            if (!ing.product || !ing.product.id) {
              console.error(`❌ Ingrediente sin producto válido en índice ${index}:`, ing)
              return null
            }
            
            const isFixed = ing.isFixedQuantity || false
            const totalQuantity = isFixed ? ing.quantityPerPerson : ing.quantityPerPerson * event.guestCount

            return {
              event_calculation_id: eventDbId,
              product_id: ing.product.id,
              quantity_per_person: ing.quantityPerPerson,
              total_quantity: totalQuantity,
              unit_price: ing.product.price_per_portion,
              total_cost: ing.product.price_per_portion * totalQuantity,
              notes: ing.notes || null,
              display_order: index,
              is_fixed_quantity: isFixed
            }
          }).filter((ing): ing is NonNullable<typeof ing> => ing !== null)

          if (ingredientsToInsert.length === 0) {
            console.error('❌ No hay ingredientes válidos para guardar')
            throw new Error('No hay ingredientes válidos para guardar')
          }

          console.log(`💾 Insertando ${ingredientsToInsert.length} ingredientes válidos de ${event.ingredients.length} totales`)

          const { data: insertedData, error: ingError } = await supabase
            .from('event_calculation_ingredients')
            .insert(ingredientsToInsert)
            .select()

          if (ingError) {
            console.error('❌ Error guardando ingredientes:', ingError)
            console.error('❌ Ingredientes que se intentaron guardar:', ingredientsToInsert)
            throw ingError
          }

          console.log(`✅ ${insertedData?.length || ingredientsToInsert.length} ingredientes guardados exitosamente`)
        } else {
          console.warn('⚠️ El evento no tiene ingredientes para guardar')
        }

        // Calcular y guardar estadísticas
        await calculateAndSaveStats(eventDbId, event)

        // Actualizar estado local
        setEvents(prev => prev.map(e =>
          e.id === event.id
            ? { ...e, dbId: eventDbId, isSaved: true, versionNumber: e.versionNumber + 1 }
            : e
        ))
      }
    } catch (err) {
      console.error('Error saving event:', err)
      alert('Error al guardar el evento. Por favor, intenta nuevamente.')
    } finally {
      setSaving(null)
    }
  }

  // Calcular y guardar estadísticas
  const calculateAndSaveStats = async (eventDbId: string, event: Event) => {
    try {
      const costs = calculateEventCost(event)

      // Agrupar por categoría
      const costByCategory: { [key: string]: number } = {}
      const ingredientsByCategory: { [key: string]: number } = {}

      event.ingredients.forEach(ing => {
        const category = ing.product.category
        const totalQuantity = ing.isFixedQuantity
          ? ing.quantityPerPerson
          : ing.quantityPerPerson * event.guestCount
        
        const cost = ing.product.price_per_portion * totalQuantity

        costByCategory[category] = (costByCategory[category] || 0) + cost
        ingredientsByCategory[category] = (ingredientsByCategory[category] || 0) + 1
      })

      // Encontrar ingrediente más caro y más usado
      const mostExpensive = costs.ingredientCosts.reduce((max, item) =>
        item.cost > max.cost ? item : max, costs.ingredientCosts[0] || { product: {} as Product, quantity: 0, cost: 0 }
      )

      const mostUsed = event.ingredients.reduce((max, ing) => {
        const totalQty = ing.isFixedQuantity
          ? ing.quantityPerPerson
          : ing.quantityPerPerson * event.guestCount
        
        const maxQty = max.isFixedQuantity
          ? max.quantityPerPerson
          : max.quantityPerPerson * event.guestCount
          
        return totalQty > maxQty ? ing : max
      }, event.ingredients[0] || { product: {} as Product, quantityPerPerson: 0, isFixedQuantity: false })

      // Eliminar estadísticas existentes para este evento
      await supabase
        .from('event_calculation_stats')
        .delete()
        .eq('event_calculation_id', eventDbId)

      // Insertar nuevas estadísticas
      const { error } = await supabase
        .from('event_calculation_stats')
        .insert([{
          event_calculation_id: eventDbId,
          total_cost: costs.totalCost,
          cost_per_guest: costs.avgCostPerGuest,
          total_ingredients: event.ingredients.length,
          cost_by_category: costByCategory,
          ingredients_by_category: ingredientsByCategory,
          most_expensive_ingredient: mostExpensive ? {
            name: mostExpensive.product.name,
            cost: mostExpensive.cost
          } : null,
          most_used_ingredient: mostUsed ? {
            name: mostUsed.product.name,
            quantity: mostUsed.quantityPerPerson * event.guestCount
          } : null
        }])

      if (error) throw error
    } catch (err) {
      console.error('Error calculating stats:', err)
    }
  }

  // Función para crear evento desde un pedido
  const createEventFromOrder = (order: CateringOrder): Event => {
    const ingredients: EventIngredient[] = []
    const notFoundItems: string[] = []

    console.log('🔍 Creando evento desde pedido:', {
      orderId: order.id,
      entrees: order.entrees,
      viandes: order.viandes,
      dessert: order.dessert
    })

    // Procesar entrantes
    order.entrees.forEach((entree, index) => {
      const product = findProductByName(entree)
      if (product) {
        // Usar portion_per_person del producto si está disponible
        const quantityPerPerson = product.portion_per_person
          ? parsePortionPerPerson(product.portion_per_person)
          : 1
        ingredients.push({
          id: `${Date.now()}-entree-${index}-${entree}`,
          product,
          quantityPerPerson,
          notes: product.clarifications || undefined
        })
        console.log(`  ✅ Entrante agregado: ${entree} → ${product.name} (${quantityPerPerson} por persona)`)
      } else {
        notFoundItems.push(`Entrante: ${entree}`)
        console.error(`  ❌ Entrante no encontrado: ${entree}`)
      }
    })

    // Procesar carnes
    order.viandes.forEach((viande, index) => {
      const product = findProductByName(viande)
      if (product) {
        // Usar portion_per_person del producto si está disponible
        const quantityPerPerson = product.portion_per_person
          ? parsePortionPerPerson(product.portion_per_person)
          : 1
        ingredients.push({
          id: `${Date.now()}-viande-${index}-${viande}`,
          product,
          quantityPerPerson,
          notes: product.clarifications || undefined
        })
        console.log(`  ✅ Carne agregada: ${viande} → ${product.name} (${quantityPerPerson} por persona)`)
      } else {
        notFoundItems.push(`Carne: ${viande}`)
        console.error(`  ❌ Carne no encontrada: ${viande}`)
      }
    })

    // Procesar postre
    if (order.dessert) {
      const product = findProductByName(order.dessert)
      if (product) {
        // Usar portion_per_person del producto si está disponible
        const quantityPerPerson = product.portion_per_person
          ? parsePortionPerPerson(product.portion_per_person)
          : 1
        ingredients.push({
          id: `${Date.now()}-dessert-${order.dessert}`,
          product,
          quantityPerPerson,
          notes: product.clarifications || undefined
        })
        console.log(`  ✅ Postre agregado: ${order.dessert} → ${product.name} (${quantityPerPerson} por persona)`)
      } else {
        notFoundItems.push(`Postre: ${order.dessert}`)
        console.error(`  ❌ Postre no encontrado: ${order.dessert}`)
      }
    }

    // Procesar equipamiento/materiales extra
    if (order.extras && order.extras.equipment && Array.isArray(order.extras.equipment)) {
      order.extras.equipment.forEach((item, index) => {
        const product = findProductByName(item)
        if (product) {
          const isMaterial = product.category === 'material'
          // Si es material, es cantidad fija (default 1). Si no, lógica estándar.
          const quantityPerPerson = isMaterial ? 1 : (product.portion_per_person
            ? parsePortionPerPerson(product.portion_per_person)
            : 1)

          ingredients.push({
            id: `${Date.now()}-extra-${index}-${item}`,
            product,
            quantityPerPerson,
            notes: product.clarifications || undefined,
            isFixedQuantity: isMaterial
          })
          console.log(`  ✅ Extra agregado: ${item} → ${product.name} (${quantityPerPerson} ${isMaterial ? 'total fijo' : 'por persona'})`)
        } else {
          notFoundItems.push(`Extra: ${item}`)
          console.error(`  ❌ Extra no encontrado: ${item}`)
        }
      })
    }

    // TODO: Si hay acompañamientos fijos que siempre deben estar (ej. Pan, Salsas), agregarlos aquí.
    // Actualmente no se agregan porque no están explícitos en la orden y no hay una lista definida.
    // Ejemplo de implementación futura:
    /*
    const standardSides = ['Pan', 'Salsa Criolla', 'Chimichurri']
    standardSides.forEach(name => {
      const product = findProductByName(name)
      if (product) {
        ingredients.push({
          id: `${Date.now()}-standard-${name}`,
          product,
          quantityPerPerson: 1, // o product.portion_per_person
          notes: 'Acompañamiento estándar'
        })
      }
    })
    */

    // Mostrar advertencia si hay items no encontrados
    if (notFoundItems.length > 0) {
      console.warn('⚠️ Items no encontrados en la base de datos:', notFoundItems)
      alert(`Advertencia: Los siguientes items no se encontraron en la base de datos:\n${notFoundItems.join('\n')}\n\nPor favor, verifica que estos productos existan en la sección de PRECIOS.`)
    }

    const eventName = `${order.contact.eventType} - ${order.contact.name} (${new Date(order.contact.eventDate).toLocaleDateString()})`

    console.log(`✅ Evento creado con ${ingredients.length} ingredientes:`, ingredients.map(i => i.product.name).join(', '))

    if (ingredients.length === 0) {
      console.error('⚠️ ADVERTENCIA: El evento no tiene ingredientes!', {
        entrees: order.entrees,
        viandes: order.viandes,
        dessert: order.dessert,
        notFoundItems
      })
    }

    return {
      id: `temp-${Date.now()}`,
      name: eventName,
      eventDate: order.contact.eventDate,
      guestCount: order.contact.guestCount,
      orderId: order.id,
      ingredients,
      expanded: true,
      showCosts: false,
      showNotes: false,
      notes: notFoundItems.length > 0 ? `⚠️ Items no encontrados: ${notFoundItems.join(', ')}` : '',
      observations: '',
      versionNumber: 1,
      isSaved: false
    }
  }

  // Reparar evento existente agregando ingredientes faltantes desde el pedido original
  const repairEvent = async (eventId: string) => {
    const event = events.find(e => e.id === eventId)
    if (!event || !event.orderId) {
      alert('Este evento no tiene un pedido asociado para reparar')
      return
    }

    const originalOrder = orders.find(o => o.id === event.orderId)
    if (!originalOrder) {
      alert('No se encontró el pedido original')
      return
    }

    if (!confirm(`¿Reparar evento "${event.name}"?\n\nEsto agregará los ingredientes faltantes desde el pedido original.`)) {
      return
    }

    try {
      setSaving(eventId)

      // Crear un nuevo evento desde el pedido (esto incluirá todos los ingredientes)
      const repairedEvent = createEventFromOrder(originalOrder)

      // Mantener el ID y datos del evento existente
      const updatedEvent: Event = {
        ...event,
        ingredients: repairedEvent.ingredients,
        notes: repairedEvent.notes, // Actualizar notas para remover advertencias
        isSaved: false
      }

      // Actualizar en la UI
      setEvents(events.map(e => e.id === eventId ? updatedEvent : e))

      // Guardar en BD
      await saveEvent(updatedEvent, 'updated')

      setSuccessMessage(`✅ Evento reparado. Se agregaron ${repairedEvent.ingredients.length - event.ingredients.length} ingredientes faltantes.`)
      setTimeout(() => setSuccessMessage(null), 5000)
    } catch (err) {
      console.error('Error reparando evento:', err)
      setError('Error al reparar el evento. Por favor, intenta nuevamente.')
      setTimeout(() => setError(null), 5000)
    } finally {
      setSaving(null)
    }
  }

  // Cargar eventos desde pedidos seleccionados
  const handleLoadOrdersAsEvents = async () => {
    const ordersToLoad = availableOrders.filter(order =>
      selectedOrderIds.includes(order.id)
    )

    console.log('📦 Pedidos seleccionados para cargar:', ordersToLoad.length)
    console.log('📋 Productos disponibles en BD:', products.map(p => p.name).join(', '))

    // Verificar qué pedidos ya tienen eventos activos en la BD
    const orderIdsToCheck = ordersToLoad.map(o => o.id)
    const { data: existingCalculations } = await supabase
      .from('event_calculations')
      .select('order_id')
      .in('order_id', orderIdsToCheck)
      .eq('is_active', true)

    const activeOrderIds = new Set(
      (existingCalculations || [])
        .map(c => c.order_id)
        .filter(Boolean) as string[]
    )

    // Filtrar pedidos que ya tienen eventos activos
    const ordersToCreate = ordersToLoad.filter(order => !activeOrderIds.has(order.id))

    if (ordersToCreate.length === 0) {
      alert('Los pedidos seleccionados ya tienen eventos activos. Elimina el evento existente primero si quieres recrearlo.')
      return
    }

    if (ordersToCreate.length < ordersToLoad.length) {
      const skipped = ordersToLoad.length - ordersToCreate.length
      alert(`${skipped} pedido(s) ya tienen eventos activos y fueron omitidos.`)
    }

    const newEvents = ordersToCreate.map(order => {
      console.log('\n🔄 Procesando pedido:', {
        id: order.id,
        name: order.contact.name,
        entrees: Array.isArray(order.entrees) ? order.entrees : [],
        viandes: Array.isArray(order.viandes) ? order.viandes : [],
        dessert: order.dessert
      })
      return createEventFromOrder(order)
    })

    console.log(`✅ ${newEvents.length} eventos nuevos creados de ${ordersToCreate.length} pedidos procesados`)

    setEvents([...events, ...newEvents])
    setSelectedOrderIds([])
    setShowSelectOrderModal(false)

    // Guardar automáticamente los nuevos eventos
    for (const event of newEvents) {
      await saveEvent(event, 'created')
    }
  }

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrderIds(prev => {
      if (prev.includes(orderId)) {
        return prev.filter(id => id !== orderId)
      } else {
        return [...prev, orderId]
      }
    })
  }

  const handleAddEvent = async () => {
    if (!newEventName.trim() || newEventGuests <= 0) return

    const newEvent: Event = {
      id: `temp-${Date.now()}`,
      name: newEventName.trim(),
      eventDate: newEventDate || null,
      guestCount: newEventGuests,
      orderId: null,
      ingredients: [],
      expanded: true,
      showCosts: false,
      showNotes: false,
      notes: '',
      observations: '',
      versionNumber: 1,
      isSaved: false
    }

    setEvents([...events, newEvent])
    setNewEventName('')
    setNewEventGuests(0)
    setNewEventDate('')
    setShowAddEventModal(false)

    // Guardar en BD
    await saveEvent(newEvent, 'created')
  }

  const handleRemoveEvent = async (eventId: string) => {
    if (!confirm('¿Estás seguro de eliminar este evento?')) return

    const event = events.find(e => e.id === eventId)
    if (event?.dbId) {
      try {
        const { error } = await supabase
          .from('event_calculations')
          .update({ is_active: false })
          .eq('id', event.dbId)

        if (error) throw error
      } catch (err) {
        console.error('Error deleting event:', err)
        alert('Error al eliminar el evento')
        return
      }
    }

    setEvents(events.filter(e => e.id !== eventId))
  }

  const toggleEventExpanded = (eventId: string) => {
    setEvents(events.map(e =>
      e.id === eventId ? { ...e, expanded: !e.expanded } : e
    ))
  }

  const toggleEventCosts = (eventId: string) => {
    setEvents(events.map(e =>
      e.id === eventId ? { ...e, showCosts: !e.showCosts } : e
    ))
  }

  const toggleEventNotes = (eventId: string) => {
    setEvents(events.map(e =>
      e.id === eventId ? { ...e, showNotes: !e.showNotes } : e
    ))
  }

  // Calcular costos por evento
  const calculateEventCost = (event: Event) => {
    let totalCost = 0
    const ingredientCosts: { product: Product; quantity: number; cost: number }[] = []

    event.ingredients.forEach(ing => {
      const totalQuantity = ing.isFixedQuantity 
        ? ing.quantityPerPerson 
        : ing.quantityPerPerson * event.guestCount
      
      const cost = ing.product.price_per_portion * totalQuantity
      totalCost += cost
      ingredientCosts.push({
        product: ing.product,
        quantity: totalQuantity,
        cost
      })
    })

    const avgCostPerGuest = event.guestCount > 0 ? totalCost / event.guestCount : 0

    return {
      totalCost,
      avgCostPerGuest,
      ingredientCosts
    }
  }

  // Regenerar costos de todos los eventos
  const regenerateAllCosts = async () => {
    if (events.length === 0) {
      alert('No hay eventos para regenerar costos')
      return
    }

    if (!confirm(`¿Regenerar costos de ${events.length} evento(s)? Esto actualizará todos los costos en la base de datos.`)) {
      return
    }

    try {
      setRegeneratingCosts(true)
      setError(null)
      setSuccessMessage(null)

      let successCount = 0
      let errorCount = 0

      // Regenerar costos de cada evento
      for (const event of events) {
        try {
          // Recalcular costos
          const costs = calculateEventCost(event)

          // Actualizar en la base de datos si el evento está guardado
          if (event.dbId) {
            // Actualizar evento principal con nuevos costos
            const { error: updateError } = await supabase
              .from('event_calculations')
              .update({
                total_cost: costs.totalCost,
                cost_per_guest: costs.avgCostPerGuest,
                total_ingredients_count: event.ingredients.length,
                updated_at: new Date().toISOString()
              })
              .eq('id', event.dbId)

            if (updateError) throw updateError

            // Actualizar ingredientes con nuevos costos
            if (event.ingredients.length > 0) {
              // Eliminar ingredientes antiguos
              await supabase
                .from('event_calculation_ingredients')
                .delete()
                .eq('event_calculation_id', event.dbId)

              // Insertar ingredientes actualizados
              const ingredientsToInsert = event.ingredients.map((ing, index) => {
                const isFixed = ing.isFixedQuantity || false
                const totalQuantity = isFixed ? ing.quantityPerPerson : ing.quantityPerPerson * event.guestCount

                return {
                  event_calculation_id: event.dbId,
                  product_id: ing.product.id,
                  quantity_per_person: ing.quantityPerPerson,
                  total_quantity: totalQuantity,
                  unit_price: ing.product.price_per_portion,
                  total_cost: ing.product.price_per_portion * totalQuantity,
                  notes: ing.notes || null,
                  display_order: index,
                  is_fixed_quantity: isFixed
                }
              })

              const { error: ingError } = await supabase
                .from('event_calculation_ingredients')
                .insert(ingredientsToInsert)

              if (ingError) throw ingError
            }

            // Recalcular y guardar estadísticas
            await calculateAndSaveStats(event.dbId, event)

            successCount++
          } else {
            // Si el evento no está guardado, solo actualizar en memoria
            console.log(`Evento "${event.name}" no está guardado, actualizando solo en memoria`)
            successCount++
          }
        } catch (err) {
          console.error(`Error regenerando costos para evento "${event.name}":`, err)
          errorCount++
        }
      }

      // Actualizar eventos en memoria con nuevos costos
      setEvents(prevEvents =>
        prevEvents.map(event => {
          const costs = calculateEventCost(event)
          return {
            ...event,
            // Los costos se calculan dinámicamente, pero podemos forzar actualización
          }
        })
      )

      // Mostrar mensaje de resultado
      if (errorCount === 0) {
        setSuccessMessage(`✅ Costos regenerados exitosamente para ${successCount} evento(s)`)
        setTimeout(() => setSuccessMessage(null), 5000)
      } else {
        setError(`⚠️ Se regeneraron ${successCount} evento(s), pero ${errorCount} tuvieron errores`)
        setTimeout(() => setError(null), 5000)
      }

      // Recargar eventos desde la BD para asegurar sincronización
      await loadEvents()

    } catch (err) {
      console.error('Error regenerando costos:', err)
      setError('Error al regenerar costos. Por favor, intenta nuevamente.')
      setTimeout(() => setError(null), 5000)
    } finally {
      setRegeneratingCosts(false)
    }
  }

  const handleOpenMaterialSelector = (eventId: string) => {
    setCurrentEventIdForSelector(eventId)
    setSelectedMaterialIds([])
    setShowMaterialSelectorModal(true)
  }

  const handleToggleMaterialSelection = (productId: string) => {
    setSelectedMaterialIds(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  const handleAddSelectedMaterials = async () => {
    if (!currentEventIdForSelector) return

    const event = events.find(e => e.id === currentEventIdForSelector)
    if (!event) return

    const materialsToAdd = availableProducts.filter(p => selectedMaterialIds.includes(p.id))
    if (materialsToAdd.length === 0) {
      setShowMaterialSelectorModal(false)
      return
    }

    // Filtrar los que ya existen en el evento
    const newMaterials = materialsToAdd.filter(p => !event.ingredients.some(ing => ing.product.id === p.id))

    if (newMaterials.length === 0) {
      setShowMaterialSelectorModal(false)
      return
    }

    const newIngredients: EventIngredient[] = newMaterials.map((product, index) => {
      // Asumimos que son materiales si se agregan desde este modal
      const quantityPerPerson = 1 
      
      return {
        id: `${Date.now()}-material-${index}-${product.id}`,
        product,
        quantityPerPerson,
        notes: product.clarifications || undefined,
        isFixedQuantity: true
      }
    })

    const updatedEvent = {
      ...event,
      ingredients: [...event.ingredients, ...newIngredients],
      isSaved: false
    }

    setEvents(events.map(e => e.id === currentEventIdForSelector ? updatedEvent : e))
    await saveEvent(updatedEvent)
    
    setShowMaterialSelectorModal(false)
    setSelectedMaterialIds([])
    setCurrentEventIdForSelector(null)
  }

  const handleAddIngredient = async (eventId: string, productId: string) => {
    const product = availableProducts.find(p => p.id === productId)
    if (!product) return

    const event = events.find(e => e.id === eventId)
    if (!event) return

    if (event.ingredients.some(ing => ing.product.id === productId)) {
      return
    }

    // Usar portion_per_person del producto si está disponible, sino usar 1 por defecto
    // Si es material, usar cantidad fija (isFixedQuantity = true) y cantidad 1
    const isMaterial = product.category === 'material'
    
    const quantityPerPerson = isMaterial 
      ? 1 
      : (product.portion_per_person
          ? parsePortionPerPerson(product.portion_per_person)
          : 1)

    const newIngredient: EventIngredient = {
      id: `${Date.now()}`,
      product,
      quantityPerPerson,
      notes: product.clarifications || undefined,
      isFixedQuantity: isMaterial
    }

    const updatedEvent = {
      ...event,
      ingredients: [...event.ingredients, newIngredient],
      isSaved: false
    }

    setEvents(events.map(e => e.id === eventId ? updatedEvent : e))
    await saveEvent(updatedEvent)
  }

  const handleRemoveIngredient = async (eventId: string, ingredientId: string) => {
    const event = events.find(e => e.id === eventId)
    if (!event) return

    const updatedEvent = {
      ...event,
      ingredients: event.ingredients.filter(ing => ing.id !== ingredientId),
      isSaved: false
    }

    setEvents(events.map(e => e.id === eventId ? updatedEvent : e))
    await saveEvent(updatedEvent)
  }

  const handleUpdateQuantity = async (eventId: string, ingredientId: string, quantity: number) => {
    if (quantity < 0) return

    const event = events.find(e => e.id === eventId)
    if (!event) return

    const updatedEvent = {
      ...event,
      ingredients: event.ingredients.map(ing =>
        ing.id === ingredientId ? { ...ing, quantityPerPerson: quantity } : ing
      ),
      isSaved: false
    }

    setEvents(events.map(e => e.id === eventId ? updatedEvent : e))

    // Guardar después de un pequeño delay para no hacer demasiadas llamadas
    setTimeout(() => saveEvent(updatedEvent), 1000)
  }

  const handleUpdateGuestCount = async (eventId: string, count: number) => {
    if (count < 0) return

    const event = events.find(e => e.id === eventId)
    if (!event) return

    const updatedEvent = {
      ...event,
      guestCount: count,
      isSaved: false
    }

    setEvents(events.map(e => e.id === eventId ? updatedEvent : e))
    await saveEvent(updatedEvent)
  }

  const handleUpdateNotes = async (eventId: string, notes: string, observations: string) => {
    const event = events.find(e => e.id === eventId)
    if (!event) return

    const updatedEvent = {
      ...event,
      notes,
      observations,
      isSaved: false
    }

    setEvents(events.map(e => e.id === eventId ? updatedEvent : e))
    await saveEvent(updatedEvent)
  }

  // Calcular totales por ingrediente sumando todos los eventos (agrupado por categoría)
  const calculateGrandTotals = () => {
    const totals: { [key: string]: { product: Product; total: number } } = {}

    events.forEach(event => {
      event.ingredients.forEach(ing => {
        const totalForEvent = ing.isFixedQuantity
          ? ing.quantityPerPerson
          : ing.quantityPerPerson * event.guestCount

        // Si es combo, desglosar ingredientes
        if (ing.product.is_combo) {
          const subIngs = comboIngredientsMap[ing.product.id]
          if (subIngs && subIngs.length > 0) {
            subIngs.forEach(sub => {
              const subProduct = products.find(p => p.id === sub.ingredient_id)
              if (subProduct) {
                const subTotal = totalForEvent * sub.quantity
                if (totals[subProduct.id]) {
                  totals[subProduct.id].total += subTotal
                } else {
                  totals[subProduct.id] = {
                    product: subProduct,
                    total: subTotal
                  }
                }
              }
            })
            return // No agregar el producto combo en sí mismo
          }
        }

        if (totals[ing.product.id]) {
          totals[ing.product.id].total += totalForEvent
        } else {
          totals[ing.product.id] = {
            product: ing.product,
            total: totalForEvent
          }
        }
      })
    })

    return Object.values(totals)
  }

  // Agrupar por categoría
  const calculateTotalsByCategory = () => {
    const totals = calculateGrandTotals()
    const byCategory: { [key: string]: { product: Product; total: number }[] } = {}

    totals.forEach(item => {
      const category = item.product.category
      if (!byCategory[category]) {
        byCategory[category] = []
      }
      byCategory[category].push(item)
    })

    return byCategory
  }

  // Eventos filtrados
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        if (!event.name.toLowerCase().includes(searchLower)) {
          return false
        }
      }

      if (filters.dateFrom && event.eventDate) {
        if (new Date(event.eventDate) < new Date(filters.dateFrom)) {
          return false
        }
      }

      if (filters.dateTo && event.eventDate) {
        if (new Date(event.eventDate) > new Date(filters.dateTo)) {
          return false
        }
      }

      return true
    })
  }, [events, filters])

  // Cargar historial de versiones
  const loadEventHistory = async (eventId: string) => {
    const event = events.find(e => e.id === eventId)
    if (!event?.dbId) return

    try {
      const { data, error } = await supabase
        .from('event_calculation_versions')
        .select('*')
        .eq('event_calculation_id', event.dbId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setEventVersions(prev => ({ ...prev, [eventId]: data || [] }))
    } catch (err) {
      console.error('Error loading history:', err)
    }
  }

  // Restaurar versión
  const restoreVersion = async (eventId: string, version: EventCalculationVersion) => {
    if (!confirm('¿Restaurar esta versión? Se creará una nueva versión del evento.')) return

    const event = events.find(e => e.id === eventId)
    if (!event) return

    const versionData = version.version_data
    const restoredIngredients: EventIngredient[] = []

    // Restaurar ingredientes
    for (const ingData of versionData.ingredients || []) {
      const product = products.find(p => p.id === ingData.productId)
      if (product) {
        restoredIngredients.push({
          id: `${Date.now()}-${ingData.productId}`,
          product,
          quantityPerPerson: ingData.quantityPerPerson,
          notes: ingData.notes
        })
      }
    }

    const restoredEvent: Event = {
      ...event,
      name: versionData.name,
      eventDate: versionData.eventDate,
      guestCount: versionData.guestCount,
      ingredients: restoredIngredients,
      notes: versionData.notes || '',
      observations: versionData.observations || '',
      isSaved: false
    }

    setEvents(events.map(e => e.id === eventId ? restoredEvent : e))
    await saveEvent(restoredEvent, 'restored')
    setShowHistoryModal(null)
  }

  // Duplicar evento
  const duplicateEvent = async (eventId: string) => {
    const event = events.find(e => e.id === eventId)
    if (!event) return

    const duplicated: Event = {
      ...event,
      id: `temp-${Date.now()}`,
      name: `${event.name} (Copia)`,
      dbId: undefined,
      expanded: true,
      isSaved: false,
      versionNumber: 1
    }

    setEvents([...events, duplicated])
    await saveEvent(duplicated, 'duplicated')
  }

  // Generar documento PDF (reutilizable)
  const generatePDFDoc = () => {
    const doc = new jsPDF()

    doc.setFontSize(20)
    doc.text('Lista de Compras - Eventos', 14, 22)

    let yPos = 35

    const categoryNames: { [key: string]: string } = {
      'entradas': 'Entradas',
      'carnes_clasicas': 'Carnes Clásicas',
      'carnes_premium': 'Carnes Premium',
      'verduras': 'Acompañamiento',
      'postres': 'Postres',
      'pan': 'Pan',
      'extras': 'Extras',
      'material': 'Material'
    }

    // Para cada evento
    filteredEvents.forEach((event) => {
      if (yPos > 250) {
        doc.addPage()
        yPos = 20
      }

      doc.setFontSize(16)
      doc.setTextColor(217, 119, 6)
      doc.text(`${event.name} (${event.guestCount} invitados)`, 14, yPos)
      yPos += 10

      if (event.eventDate) {
        doc.setFontSize(10)
        doc.setTextColor(100, 100, 100)
        doc.text(`Fecha: ${new Date(event.eventDate).toLocaleDateString()}`, 14, yPos)
        yPos += 8
      }

      // Agrupar ingredientes por categoría
      const ingredientsByCategory: { [key: string]: EventIngredient[] } = {}
      event.ingredients.forEach(ing => {
        const cat = ing.product.category
        if (!ingredientsByCategory[cat]) ingredientsByCategory[cat] = []
        ingredientsByCategory[cat].push(ing)
      })

      // Iterar categorías
      Object.keys(categoryNames).forEach(catKey => {
        const catIngredients = ingredientsByCategory[catKey]
        if (!catIngredients || catIngredients.length === 0) return

        if (yPos > 250) {
          doc.addPage()
          yPos = 20
        }

        doc.setFontSize(12)
        doc.setTextColor(102, 126, 234)
        doc.text(categoryNames[catKey], 14, yPos)
        yPos += 6

        const eventData: any[] = []

        catIngredients.forEach(ing => {
          const processIngredient = (product: Product, quantityPerPerson: number, isFixed: boolean, parentName?: string) => {
            const portionInfo = product.portion_per_person && !isFixed
              ? ` (Estándar: ${product.portion_per_person})`
              : ''
            
            const fixedInfo = isFixed ? ' (Fijo)' : ''
            const name = parentName ? `${parentName} -> ${product.name}` : product.name
            
            const perPersonDisplay = convertToDisplayUnit(product, quantityPerPerson)
            
            const totalQuantity = isFixed
              ? quantityPerPerson
              : quantityPerPerson * event.guestCount
              
            const totalDisplay = convertToDisplayUnitForSummary(product, totalQuantity)
            
            // Formateo: sin decimales para unidad
            const perPersonVal = perPersonDisplay.unit === 'unidad' ? perPersonDisplay.value.toFixed(0) : perPersonDisplay.value.toFixed(2)
            const totalVal = totalDisplay.unit === 'unidad' ? totalDisplay.value.toFixed(0) : totalDisplay.value.toFixed(2)

            eventData.push([
              name + portionInfo + fixedInfo,
              isFixed ? '-' : `${perPersonVal} ${perPersonDisplay.unit}`,
              `${totalVal} ${totalDisplay.unit}`
            ])
          }

          if (ing.product.is_combo) {
            const subIngs = comboIngredientsMap[ing.product.id]
            if (subIngs && subIngs.length > 0) {
              subIngs.forEach(sub => {
                const subProduct = products.find(p => p.id === sub.ingredient_id)
                if (subProduct) {
                   processIngredient(subProduct, sub.quantity * ing.quantityPerPerson, !!ing.isFixedQuantity, ing.product.name)
                }
              })
            } else {
              processIngredient(ing.product, ing.quantityPerPerson, !!ing.isFixedQuantity)
            }
          } else {
            processIngredient(ing.product, ing.quantityPerPerson, !!ing.isFixedQuantity)
          }
        })

        doc.autoTable({
          startY: yPos,
          head: [['Ingrediente', 'Cantidad/Persona', 'Total']],
          body: eventData,
          theme: 'striped',
          headStyles: { fillColor: [102, 126, 234] },
          margin: { left: 14, right: 14 },
          styles: { fontSize: 10 }
        })

        yPos = (doc as any).lastAutoTable.finalY + 8
      })

      yPos += 10
    })

    // Resumen general agrupado por categoría
    if (yPos > 200) {
      doc.addPage()
      yPos = 20
    }

    doc.setFontSize(16)
    doc.setTextColor(16, 185, 129)
    doc.text('RESUMEN GENERAL - TOTAL DE COMPRAS', 14, yPos)
    yPos += 10

    const byCategory = calculateTotalsByCategory()
    
    Object.keys(categoryNames).forEach(category => {
      if (!byCategory[category] || byCategory[category].length === 0) return

      if (yPos > 250) {
        doc.addPage()
        yPos = 20
      }

      doc.setFontSize(12)
      doc.setTextColor(102, 126, 234)
      doc.text(categoryNames[category] || category, 14, yPos)
      yPos += 8

      const categoryData = byCategory[category].map(item => {
        const display = convertToDisplayUnitForSummary(item.product, item.total)
        const val = display.unit === 'unidad' ? display.value.toFixed(0) : display.value.toFixed(2)
        return [
          item.product.name,
          `${val} ${display.unit}`
        ]
      })

      doc.autoTable({
        startY: yPos,
        head: [['Ingrediente', 'Cantidad Total']],
        body: categoryData,
        theme: 'grid',
        headStyles: { fillColor: [102, 126, 234] },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 10 }
      })

      yPos = (doc as any).lastAutoTable.finalY + 10
    })

    // Resumen total sin categorías
    const grandTotals = calculateGrandTotals()
    const summaryData = grandTotals.map(item => {
      const display = convertToDisplayUnitForSummary(item.product, item.total)
      const val = display.unit === 'unidad' ? display.value.toFixed(0) : display.value.toFixed(2)
      return [
        item.product.name,
        `${val} ${display.unit}`
      ]
    })

    if (yPos > 220) {
      doc.addPage()
      yPos = 20
    }

    doc.setFontSize(14)
    doc.setTextColor(16, 185, 129)
    doc.text('TOTAL GENERAL', 14, yPos)
    yPos += 8

    doc.autoTable({
      startY: yPos,
      head: [['Ingrediente', 'Cantidad Total']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129], fontStyle: 'bold' },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 11, fontStyle: 'bold' }
    })

    return doc
  }

  // Generar PDF y descargar
  const generatePDF = () => {
    const doc = generatePDFDoc()
    doc.save(`lista-compras-${new Date().toISOString().split('T')[0]}.pdf`)
  }

  // Compartir PDF
  const sharePDF = async () => {
    try {
      const doc = generatePDFDoc()
      const blob = doc.output('blob')
      const filename = `lista-compras-${new Date().toISOString().split('T')[0]}.pdf`
      const file = new File([blob], filename, { type: 'application/pdf' })

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Lista de Compras',
          text: 'Adjunto la lista de compras generada.',
        })
      } else {
        // Fallback: Abrir en nueva pestaña
        const blobUrl = URL.createObjectURL(blob)
        window.open(blobUrl, '_blank')
        alert('Tu navegador no soporta compartir archivos directamente. Se ha abierto el PDF en una nueva pestaña.')
      }
    } catch (err) {
      console.error('Error sharing PDF:', err)
      alert('Error al compartir el PDF: ' + (err instanceof Error ? err.message : String(err)))
    }
  }

  // Calcular estadísticas globales
  const calculateGlobalStats = () => {
    const totalEvents = filteredEvents.length
    const totalGuests = filteredEvents.reduce((sum, e) => sum + e.guestCount, 0)
    const totalCost = filteredEvents.reduce((sum, e) => {
      const costs = calculateEventCost(e)
      return sum + costs.totalCost
    }, 0)
    const avgCostPerGuest = totalGuests > 0 ? totalCost / totalGuests : 0
    const avgCostPerEvent = totalEvents > 0 ? totalCost / totalEvents : 0

    return {
      totalEvents,
      totalGuests,
      totalCost,
      avgCostPerGuest,
      avgCostPerEvent
    }
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Calculator size={48} className={styles.spinner} />
        <p>Cargando eventos...</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
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
              onClick={() => setShowSelectOrderModal(true)}
              title="Seleccionar Pedidos"
            >
              <CheckSquare size={18} />
              <span className={styles.btnText}>Seleccionar</span>
            </button>

            <button
              className={styles.secondaryBtn}
              onClick={() => setShowAddEventModal(true)}
              title="Crear Evento Manual"
            >
              <Plus size={18} />
              <span className={styles.btnText}>Manual</span>
            </button>
          </div>

          {events.length > 0 && (
            <>
              <div className={styles.separator} />

              <button
                className={styles.iconActionBtn}
                onClick={regenerateAllCosts}
                disabled={regeneratingCosts}
                title="Regenerar costos de todos los eventos"
              >
                <RefreshCw size={18} className={regeneratingCosts ? styles.spinning : ''} />
              </button>

              <div className={styles.exportGroup}>
                <button
                  className={styles.exportBtn}
                  onClick={generatePDF}
                  title="Descargar PDF"
                >
                  <Download size={18} />
                </button>
                <button
                  className={styles.shareBtn}
                  onClick={sharePDF}
                  title="Compartir PDF"
                >
                  <Share2 size={18} />
                </button>
              </div>
              
              <div className={styles.viewToggle}>
                <button
                  className={`${styles.toggleBtn} ${viewMode === 'list' ? styles.active : ''}`}
                  onClick={() => setViewMode('list')}
                  title="Vista Lista"
                >
                  <List size={18} />
                </button>
                <button
                  className={`${styles.toggleBtn} ${viewMode === 'timeline' ? styles.active : ''}`}
                  onClick={() => setViewMode('timeline')}
                  title="Vista Timeline"
                >
                  <BarChart3 size={18} />
                </button>
                <button
                  className={`${styles.toggleBtn} ${viewMode === 'comparison' ? styles.active : ''}`}
                  onClick={() => setViewMode('comparison')}
                  title="Vista Comparar"
                >
                  <TrendingUp size={18} />
                </button>
                <button
                  className={`${styles.toggleBtn} ${viewMode === 'stats' ? styles.active : ''}`}
                  onClick={() => setViewMode('stats')}
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
      {events.length > 0 && (
        <div className={styles.filtersBar}>
          <div className={styles.searchBox}>
            <Search size={18} />
            <input
              type="text"
              placeholder="Buscar eventos..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className={styles.searchInput}
            />
          </div>
          <div className={styles.dateFilters}>
            <input
              type="date"
              placeholder="Desde"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className={styles.dateInput}
            />
            <input
              type="date"
              placeholder="Hasta"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className={styles.dateInput}
            />
            {(filters.search || filters.dateFrom || filters.dateTo) && (
              <button
                className={styles.clearFiltersBtn}
                onClick={() => setFilters({ search: '', dateFrom: '', dateTo: '' })}
              >
                <X size={16} />
                Limpiar
              </button>
            )}
          </div>
        </div>
      )}

      {filteredEvents.length === 0 ? (
        <div className={styles.emptyState}>
          <Calculator size={64} className={styles.emptyIcon} />
          <h3 className={styles.emptyTitle}>
            {events.length === 0 ? 'No hay eventos cargados' : 'No se encontraron eventos'}
          </h3>
          <p className={styles.emptyText}>
            {events.length === 0
              ? <>Selecciona pedidos <strong>APROBADOS</strong> existentes o crea un evento manual para calcular ingredientes</>
              : 'Intenta ajustar los filtros de búsqueda'
            }
          </p>

          {events.length === 0 && (
            <div className={styles.emptyActions}>
              <button
                className={styles.emptyActionBtn}
                onClick={() => setShowSelectOrderModal(true)}
              >
                <CheckSquare size={20} />
                Seleccionar Pedidos
              </button>
              <button
                className={styles.emptyActionBtn}
                onClick={() => setShowAddEventModal(true)}
              >
                <Plus size={20} />
                Evento Manual
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Vista de Lista */}
          {viewMode === 'list' && (
            <div className={styles.eventsContainer}>
              {filteredEvents.map(event => (
                <div key={event.id} className={styles.eventCard}>
                  <div className={styles.eventHeader} onClick={() => toggleEventExpanded(event.id)}>
                    <div className={styles.eventTitleRow}>
                      <div>
                        <h3 className={styles.eventName}>{event.name}</h3>
                        {event.eventDate && (
                          <div className={styles.eventDate}>
                            <Calendar size={14} />
                            {new Date(event.eventDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      <div className={styles.guestCount}>
                        <Users size={16} />
                        <input
                          type="number"
                          min="1"
                          value={event.guestCount}
                          onChange={(e) => handleUpdateGuestCount(event.id, parseInt(e.target.value) || 0)}
                          onClick={(e) => e.stopPropagation()}
                          className={styles.guestInput}
                        />
                        invitados
                      </div>
                    </div>
                    <div className={styles.eventHeaderActions}>
                      {!event.isSaved && (
                        <span className={styles.unsavedBadge} title="Cambios sin guardar">
                          <AlertCircle size={14} />
                        </span>
                      )}
                      {saving === event.id && (
                        <span className={styles.savingBadge}>
                          <Save size={14} />
                        </span>
                      )}
                      <button
                        className={styles.iconBtn}
                        onClick={(e) => {
                          e.stopPropagation()
                          duplicateEvent(event.id)
                        }}
                        title="Duplicar evento"
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        className={styles.iconBtn}
                        onClick={(e) => {
                          e.stopPropagation()
                          loadEventHistory(event.id)
                          setShowHistoryModal(event.id)
                        }}
                        title="Ver historial"
                      >
                        <History size={16} />
                      </button>
                      <button
                        className={styles.deleteEventBtn}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveEvent(event.id)
                        }}
                        title="Eliminar evento"
                      >
                        <Trash2 size={16} />
                      </button>
                      <span className={styles.expandIcon}>
                        {event.expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </span>
                    </div>
                  </div>

                  {event.expanded && (
                    <div className={styles.eventBody}>
                      {/* Botones de acción */}
                      <div className={styles.eventActionsBar}>
                        {event.orderId && event.notes?.includes('⚠️ Items no encontrados') && (
                          <button
                            className={styles.repairButton}
                            onClick={(e) => {
                              e.stopPropagation()
                              repairEvent(event.id)
                            }}
                            title="Reparar evento agregando ingredientes faltantes desde el pedido original"
                            disabled={saving === event.id}
                          >
                            <Wrench size={16} />
                            {saving === event.id ? 'Reparando...' : 'Reparar Evento'}
                          </button>
                        )}
                        {event.ingredients.length > 0 && (
                          <button
                            className={styles.actionBtn}
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleEventCosts(event.id)
                            }}
                          >
                            <Calculator size={16} />
                            {event.showCosts ? 'Ocultar' : 'Analizar'} Costos
                          </button>
                        )}
                        <button
                          className={styles.actionBtn}
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleEventNotes(event.id)
                          }}
                        >
                          <StickyNote size={16} />
                          {event.showNotes ? 'Ocultar' : 'Ver'} Notas
                        </button>
                        <button
                          className={styles.actionBtn}
                          onClick={(e) => {
                            e.stopPropagation()
                            setShowNotesModal(event.id)
                          }}
                        >
                          <FileText size={16} />
                          Editar Notas
                        </button>
                      </div>

                      {/* Análisis de costos */}
                      {event.showCosts && event.ingredients.length > 0 && (
                        <div className={styles.costsAnalysis}>
                          {(() => {
                            const costs = calculateEventCost(event)
                            return (
                              <>
                                <div className={styles.costsHeader}>
                                  <h4 className={styles.costsTitle}>Análisis de Costos</h4>
                                  <div className={styles.costsSummary}>
                                    <div className={styles.costCard}>
                                      <div className={styles.costLabel}>Costo Total</div>
                                      <div className={styles.costValue}>€{costs.totalCost.toFixed(2)}</div>
                                    </div>
                                    <div className={styles.costCard}>
                                      <div className={styles.costLabel}>Costo por Invitado</div>
                                      <div className={styles.costValue}>€{costs.avgCostPerGuest.toFixed(2)}</div>
                                    </div>
                                  </div>
                                </div>

                                <div className={styles.costsBreakdown}>
                                  <h5 className={styles.breakdownTitle}>Desglose por Ingrediente:</h5>
                                  <table className={styles.costsTable}>
                                    <thead>
                                      <tr>
                                        <th>Ingrediente</th>
                                        <th>Cantidad Total</th>
                                        <th>Precio Unit.</th>
                                        <th>Costo Total</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {costs.ingredientCosts.map((item, idx) => (
                                        <tr key={idx}>
                                          <td className={styles.ingredientName}>{item.product.name}</td>
                                          {(() => {
                                            const display = convertToDisplayUnit(item.product, item.quantity)
                                            return <td>{display.value.toFixed(2)} {display.unit}</td>
                                          })()}
                                          {(() => {
                                            const displayUnit = getDisplayUnit(item.product, item.quantity)
                                            return <td>€{item.product.price_per_portion.toFixed(2)}/{displayUnit}</td>
                                          })()}
                                          <td className={styles.costAmount}>€{item.cost.toFixed(2)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </>
                            )
                          })()}
                        </div>
                      )}

                      {/* Notas y observaciones */}
                      {event.showNotes && (
                        <div className={styles.notesSection}>
                          {event.notes && (
                            <div className={styles.noteBox}>
                              <h5>Notas:</h5>
                              <p>{event.notes}</p>
                            </div>
                          )}
                          {event.observations && (
                            <div className={styles.noteBox}>
                              <h5>Observaciones:</h5>
                              <p>{event.observations}</p>
                            </div>
                          )}
                          {eventNotes[event.id] && eventNotes[event.id].length > 0 && (
                            <div className={styles.notesList}>
                              <h5>Notas Adicionales:</h5>
                              {eventNotes[event.id].map(note => (
                                <div key={note.id} className={styles.noteItem}>
                                  <div className={styles.noteHeader}>
                                    <span className={styles.noteType}>{note.note_type}</span>
                                    {note.priority !== 'normal' && (
                                      <span className={`${styles.priorityBadge} ${styles[note.priority]}`}>
                                        {note.priority}
                                      </span>
                                    )}
                                  </div>
                                  {note.title && <strong>{note.title}</strong>}
                                  <p>{note.content}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Lista de ingredientes */}
                      <div className={styles.ingredientsList}>
                        {event.ingredients.length === 0 ? (
                          <div className={styles.noIngredients}>
                            No hay ingredientes agregados
                          </div>
                        ) : (
                          <table className={styles.ingredientsTable}>
                            <thead>
                              <tr>
                                <th>Ingrediente</th>
                                <th>Cant./Persona</th>
                                <th>Total</th>
                                <th></th>
                              </tr>
                            </thead>
                            <tbody>
                              {event.ingredients.map(ing => {
                                const portionFromProduct = ing.product.portion_per_person
                                const isUsingDefault = !portionFromProduct || parsePortionPerPerson(portionFromProduct) !== ing.quantityPerPerson

                                return (
                                  <tr key={ing.id}>
                                    <td className={styles.ingredientName}>
                                      <div>
                                        <strong>{ing.product.name}</strong>
                                        {ing.isFixedQuantity && (
                                          <span className={styles.fixedQuantityBadge} title="Cantidad fija por evento (no se multiplica por invitados)">
                                            🔒 Fijo
                                          </span>
                                        )}
                                        {!ing.isFixedQuantity && portionFromProduct && (
                                          <div className={styles.portionInfo}>
                                            <span className={styles.portionLabel}>
                                              Porción estándar: {portionFromProduct}
                                            </span>
                                            {ing.product.clarifications && (
                                              <span className={styles.clarificationHint} title={ing.product.clarifications}>
                                                💡 {ing.product.clarifications}
                                              </span>
                                            )}
                                          </div>
                                        )}
                                        {/* Mostrar ing.notes solo si es diferente de clarifications (nota personalizada) */}
                                        {ing.notes && ing.notes !== ing.product.clarifications && (
                                          <span className={styles.ingredientNote} title={ing.notes}>
                                            📝 {ing.notes}
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    <td>
                                      {(() => {
                                        const displayUnit = getDisplayUnit(ing.product, ing.quantityPerPerson)
                                        const inputValue = getInputValue(ing.product, ing.quantityPerPerson)

                                        return (
                                          <>
                                            <input
                                              type="number"
                                              min="0"
                                              step={displayUnit === 'gr' ? '1' : '0.1'}
                                              value={inputValue}
                                              onChange={(e) => {
                                                const newInputValue = parseFloat(e.target.value) || 0
                                                const newQuantityInKg = parseInputValue(ing.product, newInputValue, displayUnit)
                                                handleUpdateQuantity(event.id, ing.id, newQuantityInKg)
                                              }}
                                              className={styles.quantityInput}
                                              title={portionFromProduct ? `Valor estándar: ${portionFromProduct}` : 'Cantidad personalizada'}
                                            />
                                            <span className={styles.unit}>{displayUnit}</span>
                                            {portionFromProduct && isUsingDefault && (
                                              <button
                                                className={styles.useDefaultBtn}
                                                onClick={() => handleUpdateQuantity(event.id, ing.id, parsePortionPerPerson(portionFromProduct))}
                                                title={`Usar valor estándar: ${portionFromProduct}`}
                                              >
                                                Usar estándar
                                              </button>
                                            )}
                                          </>
                                        )
                                      })()}
                                    </td>
                                    <td className={styles.total}>
                                      {(() => {
                                        const totalQuantity = ing.isFixedQuantity 
                                          ? ing.quantityPerPerson 
                                          : ing.quantityPerPerson * event.guestCount
                                        
                                        const display = convertToDisplayUnitForSummary(ing.product, totalQuantity)
                                        return `${display.value.toFixed(2)} ${display.unit}`
                                      })()}
                                    </td>
                                    <td>
                                      <button
                                        className={styles.removeBtn}
                                        onClick={() => handleRemoveIngredient(event.id, ing.id)}
                                        title="Eliminar"
                                      >
                                        <X size={16} />
                                      </button>
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        )}
                      </div>

                      <div className={styles.addIngredientSection}>
                        <select
                          className={styles.productSelect}
                          onChange={(e) => {
                            if (e.target.value) {
                              handleAddIngredient(event.id, e.target.value)
                              e.target.value = ''
                            }
                          }}
                        >
                          <option value="">Seleccionar ingrediente...</option>
                          {availableProducts
                            .filter(p => !event.ingredients.some(ing => ing.product.id === p.id))
                            .map(product => (
                              <option key={product.id} value={product.id}>
                                {product.name}
                                {product.portion_per_person && ` - ${product.portion_per_person} por persona`}
                                {product.clarifications && ` (${product.clarifications.substring(0, 30)}...)`}
                              </option>
                            ))}
                        </select>

                        <button
                          className={styles.addMaterialsBtn}
                          onClick={() => handleOpenMaterialSelector(event.id)}
                          title="Seleccionar múltiples materiales"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 16px',
                            backgroundColor: '#f1f5f9',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            color: '#475569',
                            cursor: 'pointer',
                            fontWeight: 500,
                            marginLeft: '10px'
                          }}
                        >
                          <Package size={18} />
                          Materiales
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Resumen General Agrupado por Categoría */}
              {filteredEvents.length > 0 && (
                <div className={styles.summaryCard}>
                  <div 
                    onClick={() => setShowSummary(!showSummary)}
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showSummary ? '20px' : '0' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Calculator size={24} />
                      <h3 className={styles.summaryTitle} style={{ margin: 0 }}>
                        Resumen General - Total de Compras
                      </h3>
                    </div>
                    {showSummary ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                  </div>

                  {showSummary && (() => {
                    const byCategory = calculateTotalsByCategory()
                    const categoryNames: { [key: string]: string } = {
                      'entradas': 'Entradas',
                      'carnes_clasicas': 'Carnes Clásicas',
                      'carnes_premium': 'Carnes Premium',
                      'verduras': 'Acompañamiento',
                      'postres': 'Postres',
                      'pan': 'Pan',
                      'extras': 'Extras'
                    }

                    return (
                      <div className={styles.summaryByCategory}>
                        {Object.keys(byCategory).map(category => (
                          <div key={category} className={styles.categoryGroup}>
                            <h4 className={styles.categoryTitle}>
                              {categoryNames[category] || category}
                            </h4>
                            <table className={styles.ingredientsTable}>
                              <thead>
                                <tr>
                                  <th>Ingrediente</th>
                                  <th>Cantidad Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {byCategory[category].map(item => (
                                  <tr key={item.product.id}>
                                    <td className={styles.ingredientName}>{item.product.name}</td>
                                    <td className={styles.grandTotal}>
                                      {(() => {
                                        const display = convertToDisplayUnitForSummary(item.product, item.total)
                                        return `${display.value.toFixed(2)} ${display.unit}`
                                      })()}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ))}
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
          )}

          {/* Vista Timeline */}
          {viewMode === 'timeline' && (
            <div className={styles.timelineView}>
              <h3 className={styles.viewTitle}>
                <Calendar size={24} />
                Timeline de Eventos
              </h3>
              <div className={styles.timelineContainer}>
                {filteredEvents
                  .filter(e => e.eventDate)
                  .sort((a, b) => new Date(a.eventDate!).getTime() - new Date(b.eventDate!).getTime())
                  .map(event => (
                    <div key={event.id} className={styles.timelineItem}>
                      <div className={styles.timelineDate}>
                        {new Date(event.eventDate!).toLocaleDateString()}
                      </div>
                      <div className={styles.timelineContent}>
                        <h4>{event.name}</h4>
                        <div className={styles.timelineDetails}>
                          <span>👥 {event.guestCount} invitados</span>
                          <span>🍽️ {event.ingredients.length} ingredientes</span>
                          {(() => {
                            const costs = calculateEventCost(event)
                            return <span>💰 €{costs.totalCost.toFixed(2)}</span>
                          })()}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Vista Comparación */}
          {viewMode === 'comparison' && (
            <div className={styles.comparisonView}>
              <h3 className={styles.viewTitle}>
                <TrendingUp size={24} />
                Comparación de Eventos
              </h3>
              <div className={styles.comparisonControls}>
                <p>Selecciona eventos para comparar:</p>
                <div className={styles.comparisonCheckboxes}>
                  {filteredEvents.map(event => (
                    <label key={event.id} className={styles.comparisonCheckbox}>
                      <input
                        type="checkbox"
                        checked={selectedEventIds.includes(event.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedEventIds([...selectedEventIds, event.id])
                          } else {
                            setSelectedEventIds(selectedEventIds.filter(id => id !== event.id))
                          }
                        }}
                      />
                      {event.name}
                    </label>
                  ))}
                </div>
              </div>
              {selectedEventIds.length > 0 && (
                <div className={styles.comparisonTable}>
                  <table>
                    <thead>
                      <tr>
                        <th>Métrica</th>
                        {selectedEventIds.map(id => {
                          const event = events.find(e => e.id === id)
                          return event ? <th key={id}>{event.name}</th> : null
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Invitados</td>
                        {selectedEventIds.map(id => {
                          const event = events.find(e => e.id === id)
                          return <td key={id}>{event?.guestCount || 0}</td>
                        })}
                      </tr>
                      <tr>
                        <td>Costo Total</td>
                        {selectedEventIds.map(id => {
                          const event = events.find(e => e.id === id)
                          const costs = event ? calculateEventCost(event) : null
                          return <td key={id}>€{costs?.totalCost.toFixed(2) || '0.00'}</td>
                        })}
                      </tr>
                      <tr>
                        <td>Costo por Invitado</td>
                        {selectedEventIds.map(id => {
                          const event = events.find(e => e.id === id)
                          const costs = event ? calculateEventCost(event) : null
                          return <td key={id}>€{costs?.avgCostPerGuest.toFixed(2) || '0.00'}</td>
                        })}
                      </tr>
                      <tr>
                        <td>Número de Ingredientes</td>
                        {selectedEventIds.map(id => {
                          const event = events.find(e => e.id === id)
                          return <td key={id}>{event?.ingredients.length || 0}</td>
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Vista Estadísticas */}
          {viewMode === 'stats' && (
            <div className={styles.statsView}>
              <h3 className={styles.viewTitle}>
                <BarChart3 size={24} />
                Estadísticas y Métricas
              </h3>
              {(() => {
                const globalStats = calculateGlobalStats()
                return (
                  <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                      <div className={styles.statLabel}>Total de Eventos</div>
                      <div className={styles.statValue}>{globalStats.totalEvents}</div>
                    </div>
                    <div className={styles.statCard}>
                      <div className={styles.statLabel}>Total de Invitados</div>
                      <div className={styles.statValue}>{globalStats.totalGuests}</div>
                    </div>
                    <div className={styles.statCard}>
                      <div className={styles.statLabel}>Costo Total</div>
                      <div className={styles.statValue}>€{globalStats.totalCost.toFixed(2)}</div>
                    </div>
                    <div className={styles.statCard}>
                      <div className={styles.statLabel}>Costo Promedio por Invitado</div>
                      <div className={styles.statValue}>€{globalStats.avgCostPerGuest.toFixed(2)}</div>
                    </div>
                    <div className={styles.statCard}>
                      <div className={styles.statLabel}>Costo Promedio por Evento</div>
                      <div className={styles.statValue}>€{globalStats.avgCostPerEvent.toFixed(2)}</div>
                    </div>
                  </div>
                )
              })()}
            </div>
          )}
        </>
      )}

      {/* Modal para seleccionar pedidos */}
      {showSelectOrderModal && (
        <div className={styles.modalOverlay} onClick={() => setShowSelectOrderModal(false)}>
          <div className={styles.modalLarge} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <CheckSquare size={24} />
                Seleccionar Pedidos Aprobados
              </h3>
              <button
                className={styles.closeButton}
                onClick={() => setShowSelectOrderModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              {availableOrders.length === 0 ? (
                <div className={styles.noOrders}>
                  <p>No hay pedidos aprobados disponibles.</p>
                  <p className={styles.noOrdersSubtext}>
                    Los pedidos deben estar en estado &quot;Aprobado&quot; y tener fecha de evento.
                  </p>
                </div>
              ) : (
                <>
                  <div className={styles.ordersListHeader}>
                    <span>{selectedOrderIds.length} de {availableOrders.length} seleccionados</span>
                    {selectedOrderIds.length < availableOrders.length ? (
                      <button
                        className={styles.selectAllBtn}
                        onClick={() => setSelectedOrderIds(availableOrders.map(o => o.id))}
                      >
                        Seleccionar Todos
                      </button>
                    ) : (
                      <button
                        className={styles.selectAllBtn}
                        onClick={() => setSelectedOrderIds([])}
                      >
                        Deseleccionar Todos
                      </button>
                    )}
                  </div>
                  <div className={styles.ordersList}>
                    {availableOrders.map(order => (
                      <div
                        key={order.id}
                        className={`${styles.orderItem} ${selectedOrderIds.includes(order.id) ? styles.selected : ''}`}
                        onClick={() => toggleOrderSelection(order.id)}
                      >
                        <div className={styles.orderCheckbox}>
                          {selectedOrderIds.includes(order.id) ? (
                            <CheckSquare size={24} className={styles.checkedIcon} />
                          ) : (
                            <Square size={24} className={styles.uncheckedIcon} />
                          )}
                        </div>
                        <div className={styles.orderInfo}>
                          <div className={styles.orderName}>
                            {order.contact.eventType} - {order.contact.name}
                          </div>
                          <div className={styles.orderDetails}>
                            <span>📅 {new Date(order.contact.eventDate).toLocaleDateString()}</span>
                            <span>👥 {order.contact.guestCount} invitados</span>
                            <span>
                              🍽️ {order.entrees.length + order.viandes.length + (order.dessert ? 1 : 0)} productos
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.cancelButton}
                onClick={() => {
                  setShowSelectOrderModal(false)
                  setSelectedOrderIds([])
                }}
              >
                Cancelar
              </button>
              <button
                className={styles.confirmButton}
                onClick={handleLoadOrdersAsEvents}
                disabled={selectedOrderIds.length === 0}
              >
                <Plus size={18} />
                Cargar {selectedOrderIds.length} Evento(s)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para agregar evento manual */}
      {showAddEventModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddEventModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <Plus size={24} />
                Agregar Evento Manual
              </h3>
              <button
                className={styles.closeButton}
                onClick={() => setShowAddEventModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Nombre del Evento *</label>
                <input
                  type="text"
                  className={styles.input}
                  value={newEventName}
                  onChange={(e) => setNewEventName(e.target.value)}
                  placeholder="Ej: Evento Viernes, Boda Juan y María..."
                  autoFocus
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Fecha del Evento</label>
                <input
                  type="date"
                  className={styles.input}
                  value={newEventDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Número de Invitados *</label>
                <input
                  type="number"
                  min="1"
                  className={styles.input}
                  value={newEventGuests || ''}
                  onChange={(e) => setNewEventGuests(parseInt(e.target.value) || 0)}
                  placeholder="Ej: 50"
                />
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.cancelButton}
                onClick={() => setShowAddEventModal(false)}
              >
                Cancelar
              </button>
              <button
                className={styles.confirmButton}
                onClick={handleAddEvent}
                disabled={!newEventName.trim() || newEventGuests <= 0}
              >
                <Plus size={18} />
                Crear Evento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para editar notas */}
      {showNotesModal && (
        <div className={styles.modalOverlay} onClick={() => setShowNotesModal(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <StickyNote size={24} />
                Notas y Observaciones
              </h3>
              <button
                className={styles.closeButton}
                onClick={() => setShowNotesModal(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              {(() => {
                const event = events.find(e => e.id === showNotesModal)
                if (!event) return null

                return (
                  <>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Notas Generales</label>
                      <textarea
                        className={styles.textarea}
                        value={event.notes}
                        onChange={(e) => {
                          const updated = { ...event, notes: e.target.value, isSaved: false }
                          setEvents(events.map(e => e.id === showNotesModal ? updated : e))
                        }}
                        placeholder="Notas generales sobre el evento..."
                        rows={4}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Observaciones</label>
                      <textarea
                        className={styles.textarea}
                        value={event.observations}
                        onChange={(e) => {
                          const updated = { ...event, observations: e.target.value, isSaved: false }
                          setEvents(events.map(e => e.id === showNotesModal ? updated : e))
                        }}
                        placeholder="Observaciones importantes..."
                        rows={4}
                      />
                    </div>
                  </>
                )
              })()}
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.cancelButton}
                onClick={() => setShowNotesModal(null)}
              >
                Cancelar
              </button>
              <button
                className={styles.confirmButton}
                onClick={async () => {
                  const event = events.find(e => e.id === showNotesModal)
                  if (event) {
                    await handleUpdateNotes(event.id, event.notes, event.observations)
                    setShowNotesModal(null)
                  }
                }}
              >
                <Save size={18} />
                Guardar Notas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para historial de versiones */}
      {showHistoryModal && (
        <div className={styles.modalOverlay} onClick={() => setShowHistoryModal(null)}>
          <div className={styles.modalLarge} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <History size={24} />
                Historial de Versiones
              </h3>
              <button
                className={styles.closeButton}
                onClick={() => setShowHistoryModal(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              {(() => {
                const versions = eventVersions[showHistoryModal] || []
                const event = events.find(e => e.id === showHistoryModal)

                if (versions.length === 0) {
                  return (
                    <div className={styles.noHistory}>
                      <History size={48} />
                      <p>No hay historial de versiones para este evento.</p>
                    </div>
                  )
                }

                return (
                  <div className={styles.versionsList}>
                    {versions.map(version => (
                      <div key={version.id} className={styles.versionItem}>
                        <div className={styles.versionHeader}>
                          <div>
                            <strong>Versión {version.version_number}</strong>
                            <span className={styles.versionDate}>
                              {new Date(version.created_at).toLocaleString()}
                            </span>
                          </div>
                          <div className={styles.versionActions}>
                            <button
                              className={styles.restoreBtn}
                              onClick={() => restoreVersion(showHistoryModal, version)}
                            >
                              <Clock size={16} />
                              Restaurar
                            </button>
                          </div>
                        </div>
                        <div className={styles.versionInfo}>
                          <p><strong>Tipo:</strong> {version.change_type}</p>
                          {version.change_description && (
                            <p><strong>Descripción:</strong> {version.change_description}</p>
                          )}
                          {version.version_data && (
                            <details className={styles.versionDetails}>
                              <summary>Ver datos de la versión</summary>
                              <pre>{JSON.stringify(version.version_data, null, 2)}</pre>
                            </details>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.cancelButton}
                onClick={() => setShowHistoryModal(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para agregar materiales */}
      {showMaterialSelectorModal && (
        <div className={styles.modalOverlay} onClick={() => setShowMaterialSelectorModal(false)}>
          <div className={styles.modalLarge} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <Package size={24} />
                Agregar Materiales
              </h3>
              <button
                className={styles.closeButton}
                onClick={() => setShowMaterialSelectorModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <p style={{ marginBottom: '15px', color: '#64748b' }}>
                Selecciona los materiales que deseas agregar al evento. Se agregarán como cantidad fija (1 unidad por defecto).
              </p>
              
              <div className={styles.materialsGrid} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px', maxHeight: '400px', overflowY: 'auto' }}>
                {availableProducts
                  .filter(p => p.category === 'material')
                  .map(product => {
                    const isSelected = selectedMaterialIds.includes(product.id)
                    const event = events.find(e => e.id === currentEventIdForSelector)
                    const alreadyInEvent = event?.ingredients.some(ing => ing.product.id === product.id)

                    return (
                      <div 
                        key={product.id}
                        onClick={() => !alreadyInEvent && handleToggleMaterialSelection(product.id)}
                        style={{
                          border: isSelected ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                          backgroundColor: isSelected ? '#eff6ff' : alreadyInEvent ? '#f1f5f9' : 'white',
                          borderRadius: '8px',
                          padding: '12px',
                          cursor: alreadyInEvent ? 'default' : 'pointer',
                          opacity: alreadyInEvent ? 0.6 : 1,
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ 
                          width: '20px', 
                          height: '20px', 
                          border: isSelected ? 'none' : '1px solid #cbd5e1',
                          backgroundColor: isSelected ? '#3b82f6' : 'white',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: '2px'
                        }}>
                          {isSelected && <CheckSquare size={14} color="white" />}
                          {alreadyInEvent && !isSelected && <CheckCircle2 size={14} color="#94a3b8" />}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '4px' }}>{product.name}</div>
                          {product.clarifications && (
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{product.clarifications}</div>
                          )}
                          {alreadyInEvent && (
                            <div style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '4px', fontWeight: 500 }}>
                              Ya agregado
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.cancelButton}
                onClick={() => setShowMaterialSelectorModal(false)}
              >
                Cancelar
              </button>
              <button
                className={styles.confirmButton}
                onClick={handleAddSelectedMaterials}
                disabled={selectedMaterialIds.length === 0}
              >
                <Plus size={18} />
                Agregar {selectedMaterialIds.length} Material(es)
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
