// Función para formatear nombres con guiones
export function formatItemName(name: string): string {
    if (!name) return ''

    // Casos específicos
    const replacements: { [key: string]: string } = {
        'verres-eau': 'Verres d\'eau',
        'verres-vin': 'Verres de vin',
        'verres-champagne': 'Verres de champagne',
        'mange-debout': 'Mange-debout',
        'assiettes-plates': 'Assiettes plates',
        'assiettes-creuses': 'Assiettes creuses',
    }

    const lowerName = name.toLowerCase()
    for (const [key, value] of Object.entries(replacements)) {
        if (lowerName.includes(key.toLowerCase())) {
            return value
        }
    }

    // Si no hay reemplazo específico, capitalizar palabras separadas por guiones
    return name
        .split(/([-_])/)
        .map((part) => {
            if (part === '-' || part === '_') {
                return part
            }
            if (part.length > 0) {
                return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
            }
            return part
        })
        .join('')
}
