import { BudgetData } from './types/budget'
import fs from 'fs'
import path from 'path'
import { generateBudgetHTML } from './budgetPDFTemplate'

// Función helper para convertir imagen a base64
function imageToBase64(imagePath: string): string {
  try {
    // Verificar si el archivo existe
    if (!fs.existsSync(imagePath)) {
      console.warn(`⚠️ Imagen no encontrada: ${imagePath}`)
      return ''
    }
    
    const imageBuffer = fs.readFileSync(imagePath)
    const ext = path.extname(imagePath).toLowerCase()
    let mimeType = 'image/png'
    
    if (ext === '.webp') {
      mimeType = 'image/webp'
    } else if (ext === '.jpg' || ext === '.jpeg') {
      mimeType = 'image/jpeg'
    }
    
    return `data:${mimeType};base64,${imageBuffer.toString('base64')}`
  } catch (error) {
    console.error(`❌ Error leyendo imagen ${imagePath}:`, error)
    return ''
  }
}

// Función helper para obtener la ruta de las imágenes
function getImagePath(filename: string): string {
  // Intentar diferentes rutas posibles
  const possiblePaths = [
    path.join(process.cwd(), 'src', 'lib', filename), // Desarrollo
    path.join(process.cwd(), '.next', 'server', 'src', 'lib', filename), // Producción Next.js
    path.join(process.cwd(), 'lib', filename), // Alternativa
  ]
  
  for (const imagePath of possiblePaths) {
    if (fs.existsSync(imagePath)) {
      return imagePath
    }
  }
  
  // Si no se encuentra, devolver la ruta más probable
  return path.join(process.cwd(), 'src', 'lib', filename)
}

// Nueva función que usa HTML + Puppeteer (más fácil de maquetar)
export async function generateBudgetPDFFromHTML(budgetData: BudgetData): Promise<Blob> {
  const puppeteer = await import('puppeteer')
  
  const html = generateBudgetHTML(budgetData)
  
  const browser = await puppeteer.default.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    
    // Configurar el viewport para A4
    await page.setViewport({
      width: 794, // A4 width in pixels at 96 DPI
      height: 1123, // A4 height in pixels at 96 DPI
    })
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: false, // Usar el formato A4 estándar
      margin: {
        top: '0mm',
        right: '0mm',
        bottom: '0mm',
        left: '0mm'
      },
      displayHeaderFooter: false
    })
    
    // Convertir Buffer a Blob correctamente
    const buffer = Buffer.from(pdfBuffer)
    return new Blob([buffer], { type: 'application/pdf' })
  } finally {
    await browser.close()
  }
}

// Función principal - ahora usa HTML por defecto
export async function generateBudgetPDF(budgetData: BudgetData): Promise<Blob> {
  return generateBudgetPDFFromHTML(budgetData)
}

// Función original con jsPDF (comentada - descomentar si necesitas volver)
/*
export async function generateBudgetPDF_OLD(budgetData: BudgetData): Promise<Blob> {
  const { default: jsPDF } = await import('jspdf')

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const topMargin = 15 // Margen superior adicional para evitar cortes
  const headerHeight = 35
  const footerHeight = 25
  const bottomMargin = 30 // Espacio para el footer

  const primaryColor: [number, number, number] = [226, 148, 58] // #e2943a
  const darkGray: [number, number, number] = [51, 51, 51]
  const backgroundColor: [number, number, number] = [254, 215, 170] // #fed7aa

  // Cargar imágenes usando función helper
  const overlayPath = getImagePath('ground-overlay-01.png')
  const traiteurLogoPath = getImagePath('Traiteur.webp')
  const miniLogoPath = getImagePath('minilogo.webp')

  // Cargar imágenes en base64 una sola vez
  const overlayBase64 = imageToBase64(overlayPath)
  const traiteurLogoBase64 = imageToBase64(traiteurLogoPath)
  const miniLogoBase64 = imageToBase64(miniLogoPath)

  // Tamaño de la imagen overlay para repetirla (asumimos que es un patrón pequeño)
  // Si no conocemos el tamaño exacto, usaremos un tamaño estimado
  const overlayTileWidth = 50 // mm - ajustar según el tamaño real de la imagen
  const overlayTileHeight = 50 // mm

  // Función para agregar fondo y overlay repetitivo en una página
  const addPageBackground = (pageNumber: number = 0) => {
    // FONDO DE COLOR #fed7aa EN TODA LA PÁGINA
    doc.setFillColor(...backgroundColor)
    doc.rect(0, 0, pageWidth, pageHeight, 'F')

    // Agregar imagen overlay repetida como textura
    if (overlayBase64) {
      try {
        // Repetir la imagen en toda la página
        for (let y = 0; y < pageHeight; y += overlayTileHeight) {
          for (let x = 0; x < pageWidth; x += overlayTileWidth) {
            doc.addImage(
              overlayBase64, 
              'PNG', 
              x, 
              y, 
              overlayTileWidth, 
              overlayTileHeight, 
              undefined, 
              'FAST'
            )
          }
        }
      } catch (error) {
        console.error('Error agregando overlay repetitivo:', error)
      }
    }
  }

  // Función para agregar header en una página
  const addPageHeader = () => {
    // HEADER - Fondo #e2943a con logo
  doc.setFillColor(...primaryColor)
  doc.rect(0, 0, pageWidth, headerHeight, 'F')
    
    // Agregar logo Traiteur.webp en la cabecera (a la izquierda)
    if (traiteurLogoBase64) {
      try {
        const logoWidth = 30
        const logoHeight = logoWidth * 0.75 // Mantener proporción
        doc.addImage(traiteurLogoBase64, 'WEBP', margin, 5, logoWidth, logoHeight, undefined, 'FAST')
      } catch (error) {
        console.error('Error agregando logo Traiteur:', error)
      }
    }

    // Texto centrado en la cabecera
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  const headerText = "Fuegos d'Azur"
    const headerTextWidth = doc.getTextWidth(headerText)
    const headerX = (pageWidth - headerTextWidth) / 2 // Centrar horizontalmente
    doc.text(headerText, headerX, topMargin + 12)
    
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  const subtitleText = 'Service Traiteur - Asado Argentin'
    const subtitleTextWidth = doc.getTextWidth(subtitleText)
    const subtitleX = (pageWidth - subtitleTextWidth) / 2 // Centrar horizontalmente
    doc.text(subtitleText, subtitleX, topMargin + 20)
  }

  // Función para agregar footer en una página
  const addPageFooter = () => {
    const footerY = pageHeight - footerHeight
    doc.setDrawColor(...primaryColor)
    doc.line(margin, footerY, pageWidth - margin, footerY)
    doc.setTextColor(...darkGray)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text('Fuegos d\'Azur - Service Traiteur', margin, footerY + 5)
    doc.text('Tel: 07 50 85 35 99 • 06 70 65 97 84', margin, footerY + 9)
    doc.text('Email: fuegosdazur@proton.me', margin, footerY + 13)
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(7)
    const validUntilDate = new Date(budgetData.validUntil).toLocaleDateString('fr-FR')
    const generatedDate = new Date(budgetData.generatedAt).toLocaleDateString('fr-FR')
    doc.text(`Devis valable jusqu'au: ${validUntilDate}`, pageWidth - margin - 45, footerY + 5)
    doc.text(`Généré le: ${generatedDate}`, pageWidth - margin - 45, footerY + 9)
  }

  // Función para verificar si necesitamos una nueva página
  const checkPageBreak = (requiredHeight: number): boolean => {
    return (yPosition + requiredHeight) > (pageHeight - bottomMargin)
  }

  // Función para agregar nueva página con fondo y header
  const addNewPage = () => {
    doc.addPage()
    addPageBackground()
    addPageHeader()
    return topMargin + 10 // Retornar posición Y inicial
  }

  // Agregar primera página con fondo y header
  addPageBackground()
  addPageHeader()

  let yPosition = headerHeight + topMargin + 10

  // Función helper para agregar texto con manejo automático de paginación
  const addTextWithPageBreak = (text: string, x: number, y: number, lineHeight: number, maxWidth?: number): number => {
    // Verificar si necesitamos nueva página
    if (y + lineHeight > pageHeight - bottomMargin) {
      yPosition = addNewPage()
      y = yPosition
    }
    
    const cleanedText = cleanText(text)
    if (maxWidth) {
      const lines = doc.splitTextToSize(cleanedText, maxWidth)
      doc.text(lines, x, y)
      return y + (lines.length * lineHeight)
    } else {
      doc.text(cleanedText, x, y)
      return y + lineHeight
    }
  }

  // TÍTULO
  if (checkPageBreak(15)) {
    yPosition = addNewPage()
  }
  doc.setTextColor(...darkGray)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('DEVIS', margin, yPosition)
  yPosition += 15

  // INFO CLIENTE - Sin emojis para evitar problemas de codificación
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  
  // Función helper para limpiar texto (solo remover emojis, mantener acentos)
  // Nota: jsPDF con Helvetica tiene soporte limitado para Unicode
  // Esta función remueve emojis pero mantiene caracteres latinos básicos
  const cleanText = (text: string): string => {
    if (!text) return ''
    // Remover emojis pero mantener acentos y caracteres especiales latinos
    return text
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Remover emojis
      .replace(/[\u{2600}-\u{26FF}]/gu, '') // Remover símbolos misceláneos
      .replace(/[\u{2700}-\u{27BF}]/gu, '') // Remover símbolos Dingbats
      .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Remover emojis de caras
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Remover emojis de transporte
      .trim()
  }
  
  // Función helper para agregar texto con manejo de caracteres especiales
  const addText = (text: string, x: number, y: number, maxWidth?: number) => {
    const cleanedText = cleanText(text)
    if (maxWidth) {
      const lines = doc.splitTextToSize(cleanedText, maxWidth)
      doc.text(lines, x, y)
      return lines.length
    } else {
      doc.text(cleanedText, x, y)
      return 1
    }
  }
  
  // INFO CLIENTE con paginación
  const clientInfoLines = [
    `Nom : ${cleanText(budgetData.clientInfo.name)}`,
    `Téléphone : ${cleanText(budgetData.clientInfo.phone)}`,
    `Email : ${cleanText(budgetData.clientInfo.email)}`,
    `Événement : ${cleanText(budgetData.clientInfo.eventType)}`,
    ...(budgetData.clientInfo.address ? [`Lieu : ${cleanText(budgetData.clientInfo.address)}`] : []),
    `Date : ${new Date(budgetData.clientInfo.eventDate).toLocaleDateString('fr-FR', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
    })}`,
    `Nombre de convives : ${budgetData.clientInfo.guestCount} personnes`,
    `Moment : ${budgetData.clientInfo.menuType === 'dejeuner' ? 'Déjeuner' : 'Dîner'}`
  ]

  clientInfoLines.forEach((line) => {
    if (checkPageBreak(6)) {
      yPosition = addNewPage()
    }
    doc.text(line, margin, yPosition)
    yPosition += 6
  })
  yPosition += 6

  // MENÚ DETALLADO
  if (checkPageBreak(8)) {
    yPosition = addNewPage()
  }
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(...primaryColor)
  doc.text('Menu Sélectionné', margin, yPosition)
  yPosition += 8

  doc.setTextColor(...darkGray)
  doc.setFontSize(10)

  // Entrées
  if (budgetData.menu.entrees && budgetData.menu.entrees.length > 0) {
    if (checkPageBreak(5)) {
      yPosition = addNewPage()
    }
    doc.setFont('helvetica', 'bold')
    doc.text('Entrees :', margin, yPosition)
    yPosition += 5
    doc.setFont('helvetica', 'normal')
    budgetData.menu.entrees.forEach((entree) => {
      if (checkPageBreak(5)) {
        yPosition = addNewPage()
      }
      const text = cleanText(entree.name)
      doc.text(`  ${text}`, margin, yPosition)
      yPosition += 5
    })
    yPosition += 2
  }

  // Viandes
  if (budgetData.menu.viandes && budgetData.menu.viandes.length > 0) {
    if (checkPageBreak(5)) {
      yPosition = addNewPage()
    }
    doc.setFont('helvetica', 'bold')
    doc.text('Viandes :', margin, yPosition)
    yPosition += 5
    doc.setFont('helvetica', 'normal')
    budgetData.menu.viandes.forEach((viande) => {
      if (checkPageBreak(5)) {
        yPosition = addNewPage()
      }
      const text = cleanText(viande.name)
      doc.text(`  ${text}`, margin, yPosition)
      yPosition += 5
    })
    yPosition += 2
  }

  // Accompagnements
  if (budgetData.menu.accompagnements && budgetData.menu.accompagnements.length > 0) {
    if (checkPageBreak(5)) {
      yPosition = addNewPage()
    }
    doc.setFont('helvetica', 'bold')
    doc.text('Accompagnements et Sauces :', margin, yPosition)
    yPosition += 5
    doc.setFont('helvetica', 'normal')
    budgetData.menu.accompagnements.forEach((acc) => {
      if (checkPageBreak(5)) {
        yPosition = addNewPage()
      }
      const text = cleanText(acc)
      doc.text(`  ${text}`, margin, yPosition)
      yPosition += 5
    })
    yPosition += 2
  }

  // Dessert
  if (budgetData.menu.dessert) {
    if (checkPageBreak(8)) {
      yPosition = addNewPage()
    }
    doc.setFont('helvetica', 'bold')
    doc.text('Dessert :', margin, yPosition)
    yPosition += 5
    doc.setFont('helvetica', 'normal')
    const dessertText = cleanText(budgetData.menu.dessert.name)
    doc.text(`  ${dessertText}`, margin, yPosition)
    yPosition += 8
  }

  // Montant Menu
  if (checkPageBreak(18)) {
    yPosition = addNewPage()
  }
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...primaryColor)
  doc.text('Montant - Menu', margin, yPosition)
  yPosition += 6

  doc.setFontSize(10)
  doc.setTextColor(...darkGray)
  doc.setFont('helvetica', 'normal')
  doc.text(`Montant HT : ${budgetData.menu.totalHT.toFixed(2)} €`, margin, yPosition)
  yPosition += 5
  doc.text(`TVA (${budgetData.menu.tvaPct}%) : ${budgetData.menu.tva.toFixed(2)} €`, margin, yPosition)
  yPosition += 5
  doc.setFont('helvetica', 'bold')
  doc.text(`Montant TTC : ${budgetData.menu.totalTTC.toFixed(2)} €`, margin, yPosition)
  yPosition += 12

  // Material
  if (budgetData.material && budgetData.material.items && budgetData.material.items.length > 0) {
    if (checkPageBreak(6)) {
      yPosition = addNewPage()
    }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(...primaryColor)
    doc.text('Matériel demandé :', margin, yPosition)
    yPosition += 6

    doc.setFontSize(10)
    doc.setTextColor(...darkGray)
    doc.setFont('helvetica', 'normal')
    
    budgetData.material.items.forEach((item) => {
      if (checkPageBreak(5)) {
        yPosition = addNewPage()
      }
      const text = cleanText(item.name)
      doc.text(`  ${text}`, margin, yPosition)
      yPosition += 5
    })
    yPosition += 3

    if (checkPageBreak(15)) {
      yPosition = addNewPage()
    }
    doc.text(`Montant HT : ${budgetData.material.totalHT.toFixed(2)} €`, margin, yPosition)
    yPosition += 5
    doc.text(`TVA (${budgetData.material.tvaPct}%) : ${budgetData.material.tva.toFixed(2)} €`, margin, yPosition)
    yPosition += 5
    doc.setFont('helvetica', 'bold')
    doc.text(`Montant TTC : ${budgetData.material.totalTTC.toFixed(2)} €`, margin, yPosition)
    yPosition += 12
  }

  // Déplacement
  if (budgetData.deplacement && budgetData.deplacement.distance > 0) {
    if (checkPageBreak(18)) {
      yPosition = addNewPage()
    }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(...primaryColor)
    doc.text('Montant – Déplacement', margin, yPosition)
    yPosition += 6

    doc.setFontSize(10)
    doc.setTextColor(...darkGray)
    doc.setFont('helvetica', 'normal')
    doc.text(`Distance : ${budgetData.deplacement.distance} km`, margin, yPosition)
    yPosition += 5
    doc.text(`Montant HT : ${budgetData.deplacement.totalHT.toFixed(2)} €`, margin, yPosition)
    yPosition += 5
    doc.text(`TVA (${budgetData.deplacement.tvaPct}%) : ${budgetData.deplacement.tva.toFixed(2)} €`, margin, yPosition)
    yPosition += 5
    doc.setFont('helvetica', 'bold')
    doc.text(`Montant TTC : ${budgetData.deplacement.totalTTC.toFixed(2)} €`, margin, yPosition)
    yPosition += 12
  }

  // Service
  if (budgetData.service && budgetData.service.mozos > 0) {
    if (checkPageBreak(18)) {
      yPosition = addNewPage()
    }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(...primaryColor)
    doc.text('Montant – Service', margin, yPosition)
    yPosition += 6

    doc.setFontSize(10)
    doc.setTextColor(...darkGray)
    doc.setFont('helvetica', 'normal')
    doc.text(`${budgetData.service.mozos} serveur(s) x ${budgetData.service.hours} heures`, margin, yPosition)
    yPosition += 5
    doc.text(`Montant HT : ${budgetData.service.totalHT.toFixed(2)} €`, margin, yPosition)
    yPosition += 5
    doc.text(`TVA (${budgetData.service.tvaPct}%) : ${budgetData.service.tva.toFixed(2)} €`, margin, yPosition)
    yPosition += 5
    doc.setFont('helvetica', 'bold')
    doc.text(`Montant TTC : ${budgetData.service.totalTTC.toFixed(2)} €`, margin, yPosition)
    yPosition += 12
  }

  // TOTALES FINALES - Asegurar que quepa en la página
  if (checkPageBreak(30)) {
    yPosition = addNewPage()
  }
  
  doc.setFillColor(...primaryColor)
  doc.rect(margin, yPosition, pageWidth - 2 * margin, 25, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  
  // Agregar minilogo.webp a la derecha de "Montant Général"
  if (miniLogoBase64) {
    try {
      const logoWidth = 15
      const logoHeight = logoWidth * 0.75 // Mantener proporción
      const logoX = pageWidth - margin - logoWidth - 5
      const logoY = yPosition + 5
      doc.addImage(miniLogoBase64, 'WEBP', logoX, logoY, logoWidth, logoHeight, undefined, 'FAST')
    } catch (error) {
      console.error('Error agregando minilogo:', error)
    }
  }
  
  doc.text('Montant Général', margin + 5, yPosition + 8)
  doc.setFontSize(11)
  doc.text(`Montant HT total : ${budgetData.totals.totalHT.toFixed(2)} €`, margin + 5, yPosition + 14)
  doc.text(`TVA totale : ${budgetData.totals.totalTVA.toFixed(2)} €`, margin + 5, yPosition + 19)
  doc.setFontSize(13)
  doc.text(`Montant TTC total : ${budgetData.totals.totalTTC.toFixed(2)} €`, margin + 5, yPosition + 24)

  yPosition += 30

  // Agregar footer en todas las páginas
  // jsPDF usa pages array en internal
  const totalPages = (doc as any).internal.pages.length
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addPageFooter()
  }

  // Generar PDF - jsPDF maneja la codificación internamente
  // El problema de caracteres extraños suele ser por la fuente Helvetica
  // que no soporta bien Unicode. Para una solución completa, se necesitaría
  // cargar una fuente personalizada que soporte Unicode.
  const pdfArrayBuffer = doc.output('arraybuffer')
  const pdfBlob = new Blob([pdfArrayBuffer], { type: 'application/pdf' })
  return pdfBlob
}
*/

export function getBudgetPDFFilename(budgetData: BudgetData): string {
  const clientName = budgetData.clientInfo.name.replace(/\s+/g, '_')
  const date = new Date(budgetData.generatedAt).toISOString().split('T')[0]
  return `Devis_Fuegos_${clientName}_${date}.pdf`
}

