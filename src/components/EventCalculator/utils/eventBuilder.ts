import { CateringOrder, Product } from '@/types'
import { Event, EventIngredient } from '../types'
import { parsePortionPerPerson } from './unitConversions'
import { findProductByName } from './productMapping'

export const createEventFromOrder = (order: CateringOrder, allProducts: Product[]): Event => {
    const ingredients: EventIngredient[] = []
    const notFoundItems: string[] = []

    console.log('🔍 Creando evento desde pedido:', {
        orderId: order.id,
        entrees: order.entrees,
        viandes: order.viandes,
        dessert: order.dessert
    })

    // Helper to add ingredient
    const addIngredient = (name: string, type: string, index?: number) => {
        const product = findProductByName(name, allProducts)
        if (product) {
            const quantityPerPerson = product.portion_per_person
                ? parsePortionPerPerson(product.portion_per_person)
                : 1

            const idPrefix = index !== undefined ? `${type}-${index}` : type

            ingredients.push({
                id: `${Date.now()}-${idPrefix}-${name.replace(/\s+/g, '-')}`,
                product,
                quantityPerPerson,
                notes: product.clarifications || undefined
            })
            console.log(`  ✅ ${type} agregado: ${name} → ${product.name}`)
        } else {
            notFoundItems.push(`${type}: ${name}`)
            console.error(`  ❌ ${type} no encontrado: ${name}`)
        }
    }

    // Procesar entrantes
    order.entrees.forEach((entree, index) => addIngredient(entree, 'Entrante', index))

    // Procesar carnes
    order.viandes.forEach((viande, index) => addIngredient(viande, 'Carne', index))

    // Procesar postre
    if (order.dessert) {
        addIngredient(order.dessert, 'Postre')
    }

    // Procesar equipamiento/materiales extra
    if (order.extras && order.extras.equipment && Array.isArray(order.extras.equipment)) {
        order.extras.equipment.forEach((item, index) => {
            const product = findProductByName(item, allProducts)
            if (product) {
                const isMaterial = product.category === 'material'
                const quantityPerPerson = isMaterial ? 1 : (product.portion_per_person
                    ? parsePortionPerPerson(product.portion_per_person)
                    : 1)

                ingredients.push({
                    id: `${Date.now()}-extra-${index}-${item.replace(/\s+/g, '-')}`,
                    product,
                    quantityPerPerson,
                    notes: product.clarifications || undefined,
                    isFixedQuantity: isMaterial
                })
                console.log(`  ✅ Extra agregado: ${item} → ${product.name}`)
            } else {
                notFoundItems.push(`Extra: ${item}`)
                console.error(`  ❌ Extra no encontrado: ${item}`)
            }
        })
    }

    // Mostrar advertencia si hay items no encontrados
    if (notFoundItems.length > 0) {
        console.warn('⚠️ Items no encontrados en la base de datos:', notFoundItems)
        // We don't alert here to keep function pure-ish, the caller can handle alerts if needed via the returned note
    }

    const eventName = `${order.contact.eventType} - ${order.contact.name} (${new Date(order.contact.eventDate).toLocaleDateString()})`

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
