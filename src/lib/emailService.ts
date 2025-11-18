import { Resend } from 'resend'

// Inicializar Resend con la API Key
const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailParams {
  to: string
  toName: string
  subject: string
  content: string
  orderId?: string
}

/**
 * Servicio de envío de emails con Resend
 * Integrado con las plantillas de Supabase
 */
export async function sendEmail(params: EmailParams) {
  const { to, toName, subject, content, orderId } = params

  try {
    // Obtener configuración de email desde variables de entorno
    const fromEmail = process.env.EMAIL_FROM || 'contact@fuegosdazur.fr'
    const fromName = process.env.EMAIL_FROM_NAME || "Fuegos d'Azur"

    // Enviar email con Resend
    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: [to],
      subject: subject,
      html: formatEmailContent(content),
      // Tags para tracking (opcional)
      tags: orderId ? [
        { name: 'category', value: 'catering' },
        { name: 'order_id', value: orderId }
      ] : undefined
    })

    if (error) {
      console.error('Error enviando email con Resend:', error)
      throw new Error(`Error al enviar email: ${error.message}`)
    }

    console.log('✅ Email enviado correctamente:', data?.id)
    
    return {
      success: true,
      messageId: data?.id,
      recipient: to
    }
  } catch (error) {
    console.error('Error inesperado al enviar email:', error)
    throw error
  }
}

/**
 * Procesar plantilla de email reemplazando variables
 * Variables soportadas: {name}, {eventDate}, {guestCount}, {eventType}
 */
export function processEmailTemplate(
  template: string,
  variables: Record<string, string | number>
): string {
  let processed = template

  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{${key}}`
    processed = processed.replace(new RegExp(placeholder, 'g'), String(value))
  })

  return processed
}

/**
 * Formatear contenido del email con estilos básicos
 */
function formatEmailContent(content: string): string {
  // Convertir saltos de línea a <br>
  const formattedContent = content.replace(/\n/g, '<br>')

  // Envolver en template HTML básico
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Fuegos d'Azur</title>
      <style>
        body {
          font-family: 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f5f5f5;
        }
        .email-container {
          background-color: white;
          border-radius: 8px;
          padding: 30px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 3px solid #d97706;
        }
        .logo {
          font-size: 28px;
          font-weight: bold;
          color: #d97706;
          margin: 0;
        }
        .content {
          margin-bottom: 30px;
          white-space: pre-line;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          font-size: 12px;
          color: #6b7280;
        }
        .contact-info {
          margin-top: 10px;
        }
        .contact-info a {
          color: #d97706;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1 class="logo">🔥 Fuegos d'Azur</h1>
          <p style="color: #6b7280; margin: 5px 0 0 0;">Service Traiteur - Asado Argentin</p>
        </div>
        
        <div class="content">
          ${formattedContent}
        </div>
        
        <div class="footer">
          <p><strong>Fuegos d'Azur</strong></p>
          <div class="contact-info">
            <p>📞 07 50 85 35 99 • 06 70 65 97 84</p>
            <p>📧 <a href="mailto:contact@fuegosdazur.fr">contact@fuegosdazur.fr</a></p>
            <p>📍 Côte d'Azur, France</p>
          </div>
          <p style="margin-top: 20px; font-size: 11px;">
            © ${new Date().getFullYear()} Fuegos d'Azur. Tous droits réservés.
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

/**
 * Validar configuración de email
 */
export function validateEmailConfig(): { valid: boolean; error?: string } {
  if (!process.env.RESEND_API_KEY) {
    return {
      valid: false,
      error: 'RESEND_API_KEY no está configurada en las variables de entorno'
    }
  }

  if (!process.env.RESEND_API_KEY.startsWith('re_')) {
    return {
      valid: false,
      error: 'RESEND_API_KEY parece inválida (debe empezar con "re_")'
    }
  }

  return { valid: true }
}

