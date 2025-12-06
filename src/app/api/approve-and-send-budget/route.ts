import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { sendEmail, validateEmailConfig } from '@/lib/emails/service'
import { BudgetApprovedTemplate } from '@/lib/emails/templates/BudgetApproved'
import { BaseLayout } from '@/lib/emails/templates/BaseLayout'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest) {
  try {
    const { budgetId, clientEmail, clientName } = await request.json()

    if (!budgetId || !clientEmail) {
      return NextResponse.json(
        { error: 'Budget ID y email del cliente son requeridos' },
        { status: 400 }
      )
    }

    console.log(`📧 Aprobando y enviando presupuesto ${budgetId} a ${clientEmail}`)

    // 1. Obtener el presupuesto y su PDF
    const { data: budget, error: fetchError } = await supabase
      .from('budgets')
      .select('*')
      .eq('id', budgetId)
      .single()

    if (fetchError || !budget) {
      console.error('Error obteniendo presupuesto:', fetchError)
      return NextResponse.json(
        { error: 'Presupuesto no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que tenga PDF
    if (!budget.pdf_url) {
      return NextResponse.json(
        { error: 'El presupuesto no tiene PDF generado. Por favor, genere el PDF primero.' },
        { status: 400 }
      )
    }

    // 2. Actualizar estado a 'approved' y guardar timestamp
    const { error: updateError } = await supabase
      .from('budgets')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: 'admin',
        sent_at: new Date().toISOString()
      })
      .eq('id', budgetId)

    if (updateError) {
      console.error('Error actualizando presupuesto:', updateError)
      return NextResponse.json(
        { error: 'Error al actualizar estado del presupuesto' },
        { status: 500 }
      )
    }

    // 3. Descargar PDF desde Supabase Storage
    let pdfBuffer: Buffer | null = null
    try {
      // Extraer la ruta del PDF de la URL
      const pdfPath = budget.pdf_url.split('/storage/v1/object/public/budgets/')[1]?.split('?')[0]

      if (pdfPath) {
        const { data: pdfData, error: pdfError } = await supabase
          .storage
          .from('budgets')
          .download(pdfPath)

        if (!pdfError && pdfData) {
          const arrayBuffer = await pdfData.arrayBuffer()
          pdfBuffer = Buffer.from(arrayBuffer)
          console.log('✅ PDF descargado correctamente')
        } else {
          console.warn('⚠️ No se pudo descargar el PDF:', pdfError)
        }
      }
    } catch (pdfDownloadError) {
      console.error('Error descargando PDF:', pdfDownloadError)
    }

    // 4. Verificar configuración de Resend
    const config = validateEmailConfig()
    if (!config.valid) {
      console.warn(`⚠️ ${config.error}. El presupuesto se aprobará pero no se enviará email.`)

      return NextResponse.json({
        success: true,
        message: 'Presupuesto aprobado exitosamente',
        pdfUrl: budget.pdf_url,
        note: `${config.error}. El presupuesto fue aprobado pero el email no se pudo enviar automáticamente. Descargue el PDF y envíelo manualmente al cliente.`
      })
    }

    // 5. Enviar email al cliente con el PDF adjunto
    try {
      const budgetData = budget.budget_data as any
      const totalTTC = budgetData?.totals?.totalTTC || 0
      const eventDate = budgetData?.clientInfo?.eventDate
        ? new Date(budgetData.clientInfo.eventDate).toLocaleDateString('fr-FR')
        : ''

      // Cargar logo para adjuntar como inline image
      let logoAttachment = null
      let logoCid = undefined
      try {
        // Intentar cargar el logo desde src/lib/minilogo.webp
        const logoPath = path.join(process.cwd(), 'src', 'lib', 'minilogo.webp')
        if (fs.existsSync(logoPath)) {
          const logoBuffer = fs.readFileSync(logoPath)
          logoCid = 'minilogo'
          logoAttachment = {
            filename: 'minilogo.webp',
            content: logoBuffer.toString('base64'),
            content_id: logoCid,
            disposition: 'inline' as const
          }
          console.log('✅ Logo cargado para embedding')
        } else {
          console.warn('⚠️ No se encontró el logo en:', logoPath)
        }
      } catch (logoError) {
        console.warn('⚠️ Error cargando logo:', logoError)
      }

      // Preparar contenido HTML usando plantillas
      const innerContent = BudgetApprovedTemplate({
        clientName,
        totalTTC,
        eventDate,
        logoCid
      })
      const finalHtml = BaseLayout(innerContent)

      // Preparar adjuntos
      const attachments = []

      // Agregar PDF
      if (pdfBuffer) {
        const filename = budget.pdf_url.split('/').pop()?.split('?')[0] || 'devis.pdf'
        attachments.push({
          filename: filename,
          content: pdfBuffer.toString('base64'),
          type: 'application/pdf'
        })
        console.log(`📎 Adjuntando PDF: ${filename} (${pdfBuffer.length} bytes)`)
      }

      // Agregar Logo
      if (logoAttachment) {
        attachments.push(logoAttachment)
      }

      const subject = `Votre Devis Fuegos d'Azur - ${totalTTC.toFixed(2)}€ (Cliente: ${clientEmail})`

      console.log(`📧 Enviando email a ${clientEmail}...`)

      const result = await sendEmail({
        to: clientEmail, // Usar el email REAL del cliente
        subject: subject,
        html: finalHtml,
        attachments: attachments
      })

      if (!result.success) {
        throw new Error(result.error)
      }

      console.log('✅ Email con PDF adjunto enviado al cliente:', result.messageId)

      return NextResponse.json({
        success: true,
        message: 'Presupuesto aprobado y enviado exitosamente',
        pdfUrl: budget.pdf_url,
        emailId: result.messageId
      })

    } catch (emailError: any) {
      console.error('❌ Error enviando email:', emailError)

      // Rollback del estado si falla el envío
      // NOTA: Para errores de dominio (modo testing), no hacemos rollback
      const isDomainError = emailError.message?.includes('testing emails') || emailError.message?.includes('verify a domain')

      if (!isDomainError) {
        await supabase
          .from('budgets')
          .update({
            status: 'pending_review',
            sent_at: null,
            approved_at: null,
            approved_by: null
          })
          .eq('id', budgetId)
      }

      const errorMessage = emailError instanceof Error ? emailError.message : String(emailError)

      if (isDomainError) {
        return NextResponse.json({
          success: true,
          message: 'Presupuesto aprobado exitosamente',
          pdfUrl: budget.pdf_url,
          note: 'El presupuesto fue aprobado pero el email no se pudo enviar automáticamente porque Resend está en modo de prueba. Para enviar emails a clientes, verifica un dominio en resend.com/domains. Por ahora, puedes descargar el PDF y enviarlo manualmente.',
          warning: true
        })
      }

      return NextResponse.json({
        success: false,
        error: 'Error al enviar el email. El presupuesto no se marcó como enviado.',
        details: errorMessage,
        pdfUrl: budget.pdf_url,
        note: 'El PDF está disponible pero el email no se pudo enviar. Puede descargarlo y enviarlo manualmente.'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error en approve-and-send-budget:', error)
    return NextResponse.json(
      { error: 'Error inesperado al procesar la solicitud' },
      { status: 500 }
    )
  }
}
