import { BudgetData } from './types/budget'
import fs from 'fs'
import path from 'path'

// Función helper para convertir imagen a base64
function imageToBase64(imagePath: string): string {
  try {
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
  const possiblePaths = [
    path.join(process.cwd(), 'src', 'lib', filename),
    path.join(process.cwd(), '.next', 'server', 'src', 'lib', filename),
    path.join(process.cwd(), 'lib', filename),
  ]
  
  for (const imagePath of possiblePaths) {
    if (fs.existsSync(imagePath)) {
      return imagePath
    }
  }
  
  return path.join(process.cwd(), 'src', 'lib', filename)
}

// Función helper para limpiar texto (remover emojis)
function cleanText(text: string): string {
  if (!text) return ''
  return text
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
    .replace(/[\u{2600}-\u{26FF}]/gu, '')
    .replace(/[\u{2700}-\u{27BF}]/gu, '')
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
    .trim()
}

// Función helper para mejorar el formato de textos con guiones y otros casos
function formatText(text: string): string {
  if (!text) return ''
  
  // Limpiar emojis primero
  let formatted = cleanText(text)
  
  // Mejorar casos específicos comunes primero (antes de procesar guiones)
  const replacements: { [key: string]: string } = {
    'verres-eau': 'Verres d\'eau',
    'verres-vin': 'Verres de vin',
    'verres-champagne': 'Verres de champagne',
    'mange-debout': 'Mange-debout',
    'assiettes-plates': 'Assiettes plates',
    'assiettes-creuses': 'Assiettes creuses',
  }
  
  // Aplicar reemplazos específicos (case insensitive)
  const lowerText = formatted.toLowerCase()
  for (const [key, value] of Object.entries(replacements)) {
    if (lowerText.includes(key.toLowerCase())) {
      formatted = formatted.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), value)
      // Si se aplicó un reemplazo, retornar directamente
      if (formatted.toLowerCase() !== lowerText) {
        return formatted
      }
    }
  }
  
  // Si no hay reemplazo específico, capitalizar palabras separadas por guiones, manteniendo el guion
  formatted = formatted
    .split(/([-_])/) // Dividir manteniendo los separadores
    .map((part) => {
      // Si es un separador, mantenerlo
      if (part === '-' || part === '_') {
        return part
      }
      // Capitalizar primera letra de cada palabra
      if (part.length > 0) {
        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
      }
      return part
    })
    .join('')
  
  // Capitalizar primera letra de la frase completa
  if (formatted.length > 0) {
    formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1)
  }
  
  return formatted
}

export function generateBudgetHTML(budgetData: BudgetData): string {
  // Cargar imágenes
  const overlayPath = getImagePath('ground-overlay-01.png')
  const miniLogoPath = getImagePath('minilogo.webp')
  
  const overlayBase64 = imageToBase64(overlayPath)
  const miniLogoBase64 = imageToBase64(miniLogoPath)

  const eventDate = new Date(budgetData.clientInfo.eventDate).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })

  const validUntilDate = new Date(budgetData.validUntil).toLocaleDateString('fr-FR')
  const generatedDate = new Date(budgetData.generatedAt).toLocaleDateString('fr-FR')
  const menuTypeText = budgetData.clientInfo.menuType === 'dejeuner' ? 'Déjeuner' : 'Dîner'

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Devis - Fuegos d'Azur</title>
  <style>
    @page {
      size: A4;
      margin: 0;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Helvetica', Arial, sans-serif;
      background-color: #fed7aa;
      background-image: ${overlayBase64 ? `url('${overlayBase64}')` : 'none'};
      background-repeat: repeat;
      background-size: 50mm 50mm;
      background-attachment: fixed;
      color: #333333;
      line-height: 1.5;
      padding: 0;
      margin: 0;
      width: 210mm;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .page {
      width: 210mm;
      background-color: #fed7aa;
      background-image: ${overlayBase64 ? `url('${overlayBase64}')` : 'none'};
      background-repeat: repeat;
      background-size: 50mm 50mm;
      margin: 0 auto;
      padding: 0;
      position: relative;
    }

    /* HEADER */
    .header {
      background-color: #e2943a;
      color: white;
      padding: 10mm 20mm;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: relative;
    }

    .header-logo {
      width: 25mm;
      height: auto;
      object-fit: contain;
    }

    .header-text {
      flex: 1;
      text-align: center;
    }

    .header-title {
      font-size: 22pt;
      font-weight: bold;
      margin-bottom: 2mm;
    }

    .header-subtitle {
      font-size: 10pt;
      font-weight: normal;
    }

    /* CONTENT */
    .content {
      padding: 15mm 20mm;
      padding-top: 10mm;
      padding-bottom: 15mm;
      position: relative;
    }

    .title {
      font-size: 18pt;
      font-weight: bold;
      color: #333333;
      margin-bottom: 8mm;
    }

    /* CLIENT INFO */
    .client-info {
      font-size: 10pt;
      margin-bottom: 8mm;
      background-color: rgba(255, 255, 255, 0.6);
      padding: 6mm;
      border-radius: 4mm;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .client-info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 3mm;
    }

    .client-info-item {
      display: flex;
      align-items: flex-start;
      margin-bottom: 3mm;
    }

    .client-info-icon {
      font-size: 12pt;
      margin-right: 3mm;
      flex-shrink: 0;
    }

    .client-info-text {
      flex: 1;
    }

    .client-info-label {
      font-weight: 600;
      color: #e2943a;
      margin-right: 2mm;
    }

    .client-info-value {
      color: #333333;
    }

    /* MENU SECTIONS */
    .section {
      margin-bottom: 8mm;
      background-color: rgba(255, 255, 255, 0.6);
      padding: 6mm;
      border-radius: 4mm;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .section-title {
      font-size: 14pt;
      font-weight: bold;
      color: #e2943a;
      margin-bottom: 6mm;
      padding-bottom: 3mm;
      border-bottom: 2px solid #e2943a;
    }

    .menu-category {
      margin-bottom: 5mm;
    }

    .section-subtitle {
      font-size: 11pt;
      font-weight: bold;
      color: #e2943a;
      margin-bottom: 3mm;
      display: flex;
      align-items: center;
      gap: 2mm;
    }

    .menu-items-list {
      display: flex;
      flex-direction: column;
      gap: 2mm;
      margin-left: 4mm;
    }

    .menu-item {
      font-size: 10pt;
      padding: 2mm 3mm;
      background-color: rgba(255, 255, 255, 0.8);
      border-left: 3px solid #e2943a;
      border-radius: 2mm;
      margin-bottom: 0;
    }

    .menu-list {
      font-size: 10pt;
      margin-left: 10mm;
      margin-bottom: 5mm;
    }

    /* AMOUNTS */
    .amount-section {
      background-color: #e2943a;
      color: white;
      padding: 4mm;
      margin: 8mm 0;
      border-radius: 2mm;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .amount-title {
      font-size: 11pt;
      font-weight: bold;
      margin-bottom: 4mm;
    }

    .amount-row {
      font-size: 10pt;
      margin-bottom: 3mm;
      display: flex;
      justify-content: space-between;
    }

    .amount-total {
      font-size: 12pt;
      font-weight: bold;
      margin-top: 3mm;
      padding-top: 3mm;
      border-top: 1px solid rgba(255, 255, 255, 0.3);
    }

    .totals-section {
      background-color: #e2943a;
      color: white;
      padding: 4mm;
      margin: 8mm 0;
      border-radius: 2mm;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    /* UTILITIES */
    .clearfix::after {
      content: "";
      display: table;
      clear: both;
    }

    /* Evitar que elementos se corten entre páginas */
    .menu-category {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .client-info-grid {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    /* Asegurar que las imágenes no se sobrepongan */
    img {
      max-width: 100%;
      height: auto;
      display: block;
    }

    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      
      .page {
        page-break-after: always;
        page-break-before: always;
      }
      
      /* Asegurar que los colores se impriman correctamente */
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- HEADER -->
    <div class="header">
      ${miniLogoBase64 ? `<img src="${miniLogoBase64}" alt="Logo" class="header-logo">` : ''}
      <div class="header-text">
        <div class="header-title">Fuegos d'Azur</div>
        <div class="header-subtitle">Service Traiteur - Asado Argentin</div>
      </div>
    </div>

    <!-- CONTENT -->
    <div class="content">
      <h1 class="title">DEVIS</h1>

      <!-- CLIENT INFO -->
      <div class="client-info">
        <div class="client-info-grid">
          <div class="client-info-item">
            <span class="client-info-icon">👤</span>
            <div class="client-info-text">
              <span class="client-info-label">Nom :</span>
              <span class="client-info-value">${cleanText(budgetData.clientInfo.name)}</span>
            </div>
          </div>
          
          <div class="client-info-item">
            <span class="client-info-icon">📞</span>
            <div class="client-info-text">
              <span class="client-info-label">Téléphone :</span>
              <span class="client-info-value">${cleanText(budgetData.clientInfo.phone)}</span>
            </div>
          </div>
          
          <div class="client-info-item">
            <span class="client-info-icon">📧</span>
            <div class="client-info-text">
              <span class="client-info-label">Email :</span>
              <span class="client-info-value">${cleanText(budgetData.clientInfo.email)}</span>
            </div>
          </div>
          
          <div class="client-info-item">
            <span class="client-info-icon">🎉</span>
            <div class="client-info-text">
              <span class="client-info-label">Événement :</span>
              <span class="client-info-value">${cleanText(budgetData.clientInfo.eventType)}</span>
            </div>
          </div>
          
          ${budgetData.clientInfo.address ? `
          <div class="client-info-item">
            <span class="client-info-icon">📍</span>
            <div class="client-info-text">
              <span class="client-info-label">Lieu :</span>
              <span class="client-info-value">${cleanText(budgetData.clientInfo.address)}</span>
            </div>
          </div>
          ` : ''}
          
          <div class="client-info-item">
            <span class="client-info-icon">📅</span>
            <div class="client-info-text">
              <span class="client-info-label">Date :</span>
              <span class="client-info-value">${eventDate}</span>
            </div>
          </div>
          
          <div class="client-info-item">
            <span class="client-info-icon">👥</span>
            <div class="client-info-text">
              <span class="client-info-label">Nombre de convives :</span>
              <span class="client-info-value">${budgetData.clientInfo.guestCount} personnes</span>
            </div>
          </div>
          
          <div class="client-info-item">
            <span class="client-info-icon">🕓</span>
            <div class="client-info-text">
              <span class="client-info-label">Moment :</span>
              <span class="client-info-value">${menuTypeText}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- MENU -->
      <div class="section">
        <h2 class="section-title">🍽️ Menu Sélectionné</h2>

        ${budgetData.menu.entrees && budgetData.menu.entrees.length > 0 ? `
          <div class="menu-category">
            <div class="section-subtitle">
              <span>🥗</span>
              <span>Entrees :</span>
            </div>
            <div class="menu-items-list">
              ${budgetData.menu.entrees.map(entree => `
                <div class="menu-item">${formatText(entree.name)}</div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        ${budgetData.menu.viandes && budgetData.menu.viandes.length > 0 ? `
          <div class="menu-category">
            <div class="section-subtitle">
              <span>🥩</span>
              <span>Viandes :</span>
            </div>
            <div class="menu-items-list">
              ${budgetData.menu.viandes.map(viande => `
                <div class="menu-item">${formatText(viande.name)}</div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        ${budgetData.menu.accompagnements && budgetData.menu.accompagnements.length > 0 ? `
          <div class="menu-category">
            <div class="section-subtitle">
              <span>🥔</span>
              <span>Accompagnements et Sauces :</span>
            </div>
            <div class="menu-items-list">
              ${budgetData.menu.accompagnements.map(acc => `
                <div class="menu-item">${formatText(acc)}</div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        ${budgetData.menu.dessert ? `
          <div class="menu-category">
            <div class="section-subtitle">
              <span>🍰</span>
              <span>Dessert :</span>
            </div>
            <div class="menu-items-list">
              <div class="menu-item">${formatText(budgetData.menu.dessert.name)}</div>
            </div>
          </div>
        ` : ''}
      </div>

      <!-- MONTANT MENU -->
      <div class="amount-section">
        <div class="amount-title">Montant - Menu</div>
        <div class="amount-row">
          <span>Montant HT :</span>
          <span>${budgetData.menu.totalHT.toFixed(2)} €</span>
        </div>
        <div class="amount-row">
          <span>TVA (${budgetData.menu.tvaPct}%) :</span>
          <span>${budgetData.menu.tva.toFixed(2)} €</span>
        </div>
        <div class="amount-row amount-total">
          <span>Montant TTC :</span>
          <span>${budgetData.menu.totalTTC.toFixed(2)} €</span>
        </div>
      </div>

      ${budgetData.material && budgetData.material.items && budgetData.material.items.length > 0 ? `
        <!-- MATERIAL -->
        <div class="section">
          <h2 class="section-title">📦 Matériel demandé</h2>
          <div class="menu-items-list">
            ${budgetData.material.items
              .filter(item => {
                // Excluir items relacionados con "Serveurs" (case insensitive)
                const itemNameLower = item.name.toLowerCase()
                return !itemNameLower.includes('serveur') && 
                       !itemNameLower.includes('servicio') &&
                       !itemNameLower.includes('mozos')
              })
              .map(item => `
              <div class="menu-item">${formatText(item.name)}</div>
            `).join('')}
          </div>
        </div>

        <div class="amount-section">
          <div class="amount-title">Montant - Matériel</div>
          <div class="amount-row">
            <span>Montant HT :</span>
            <span>${budgetData.material.totalHT.toFixed(2)} €</span>
          </div>
          <div class="amount-row">
            <span>TVA (${budgetData.material.tvaPct}%) :</span>
            <span>${budgetData.material.tva.toFixed(2)} €</span>
          </div>
          <div class="amount-row amount-total">
            <span>Montant TTC :</span>
            <span>${budgetData.material.totalTTC.toFixed(2)} €</span>
          </div>
        </div>
      ` : ''}

      ${budgetData.deplacement && budgetData.deplacement.distance > 0 ? `
        <!-- DEPLACEMENT -->
        <div class="amount-section">
          <div class="amount-title">Montant – Déplacement</div>
          <div class="amount-row">
            <span>Distance :</span>
            <span>${budgetData.deplacement.distance} km</span>
          </div>
          <div class="amount-row">
            <span>Montant HT :</span>
            <span>${budgetData.deplacement.totalHT.toFixed(2)} €</span>
          </div>
          <div class="amount-row">
            <span>TVA (${budgetData.deplacement.tvaPct}%) :</span>
            <span>${budgetData.deplacement.tva.toFixed(2)} €</span>
          </div>
          <div class="amount-row amount-total">
            <span>Montant TTC :</span>
            <span>${budgetData.deplacement.totalTTC.toFixed(2)} €</span>
          </div>
        </div>
      ` : ''}

      ${budgetData.service && budgetData.service.mozos > 0 ? `
        <!-- SERVICE -->
        <div class="amount-section">
          <div class="amount-title">Montant – Service</div>
          <div class="amount-row">
            <span>${budgetData.service.mozos} serveur(s) x ${budgetData.service.hours} heures</span>
          </div>
          <div class="amount-row">
            <span>Montant HT :</span>
            <span>${budgetData.service.totalHT.toFixed(2)} €</span>
          </div>
          <div class="amount-row">
            <span>TVA (${budgetData.service.tvaPct}%) :</span>
            <span>${budgetData.service.tva.toFixed(2)} €</span>
          </div>
          <div class="amount-row amount-total">
            <span>Montant TTC :</span>
            <span>${budgetData.service.totalTTC.toFixed(2)} €</span>
          </div>
        </div>
      ` : ''}

      <!-- TOTALES FINALES -->
      <div class="totals-section">
        <div class="amount-title">Montant Général</div>
        <div class="amount-row">
          <span>Montant HT total :</span>
          <span>${budgetData.totals.totalHT.toFixed(2)} €</span>
        </div>
        <div class="amount-row">
          <span>TVA totale :</span>
          <span>${budgetData.totals.totalTVA.toFixed(2)} €</span>
        </div>
        <div class="amount-row amount-total">
          <span>Montant TTC total :</span>
          <span>${budgetData.totals.totalTTC.toFixed(2)} €</span>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim()
}

