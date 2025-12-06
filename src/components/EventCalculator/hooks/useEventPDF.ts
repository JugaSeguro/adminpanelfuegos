import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { Event, EventIngredient, IngredientTotal } from '../types'
import { Product } from '@/types'
import { convertToDisplayUnit, convertToDisplayUnitForSummary } from '../utils/unitConversions'

declare module 'jspdf' {
    interface jsPDF {
        autoTable: (options: any) => jsPDF
        lastAutoTable: { finalY: number }
    }
}

interface UseEventPDFProps {
    filteredEvents: Event[]
    products: Product[]
    comboIngredientsMap: { [key: string]: { combo_id: string, ingredient_id: string, quantity: number }[] }
    totalsByCategory: { [key: string]: IngredientTotal[] }
    grandTotals: IngredientTotal[]
}

export const useEventPDF = ({
    filteredEvents,
    products,
    comboIngredientsMap,
    totalsByCategory,
    grandTotals
}: UseEventPDFProps) => {

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

                yPos = doc.lastAutoTable.finalY + 8
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

        const byCategory = totalsByCategory

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

            yPos = doc.lastAutoTable.finalY + 10
        })

        // Resumen total sin categorías
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

    const downloadPDF = () => {
        try {
            const doc = generatePDFDoc()
            doc.save(`lista-compras-${new Date().toISOString().split('T')[0]}.pdf`)
        } catch (error) {
            console.error('Error generating PDF:', error)
            alert('Error al generar el PDF. Por favor, intenta de nuevo.')
        }
    }

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

    return { downloadPDF, sharePDF }
}
