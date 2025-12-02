import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Inicializar Resend solo si hay API key
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

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
    if (!resend || !process.env.RESEND_API_KEY) {
      console.warn('⚠️ RESEND_API_KEY no configurada. El presupuesto se aprobará pero no se enviará email.')
      
      return NextResponse.json({
        success: true,
        message: 'Presupuesto aprobado exitosamente',
        pdfUrl: budget.pdf_url,
        note: 'RESEND_API_KEY no está configurada. El presupuesto fue aprobado pero el email no se pudo enviar automáticamente. Descargue el PDF y envíelo manualmente al cliente.'
      })
    }

    // 5. Enviar email al cliente con el PDF adjunto
    try {
      const budgetData = budget.budget_data as any
      const totalTTC = budgetData?.totals?.totalTTC || 0
      const eventDate = budgetData?.clientInfo?.eventDate 
        ? new Date(budgetData.clientInfo.eventDate).toLocaleDateString('fr-FR')
        : ''

      // Usar dominio de prueba de Resend si no hay dominio verificado
      // onboarding@resend.dev permite enviar a cualquier destinatario
      const fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev'
      const fromName = process.env.EMAIL_FROM_NAME || "Fuegos d'Azur"

      const emailContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.8; color: #333; background-color: #f9fafb;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background-color: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
              <h1 style="color: #e2943a; font-size: 24px; margin-bottom: 20px;">Bonjour ${clientName},</h1>
              
              <p style="font-size: 16px; margin-bottom: 20px;">Nous avons le plaisir de vous envoyer votre devis personnalisé pour votre événement.</p>
              
              ${eventDate ? `<p style="font-size: 16px; margin-bottom: 20px;"><strong>Date de l'événement:</strong> ${eventDate}</p>` : ''}
              <p style="font-size: 16px; margin-bottom: 30px;"><strong>Montant total TTC:</strong> <span style="font-size: 22px; color: #e2943a; font-weight: bold;">${totalTTC.toFixed(2)} €</span></p>
              
              <div style="background-color: #fef3c7; border-left: 4px solid #e2943a; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <p style="font-size: 16px; font-weight: 600; color: #78350f; margin-bottom: 15px;">Notre offre inclut :</p>
                <p style="font-size: 16px; color: #78350f; margin-bottom: 10px; font-style: italic;">Une expérience gastronomique au brasero, 100 % sur mesure</p>
                <p style="font-size: 14px; color: #78350f; margin: 0;">La préparation, Le service, et les options complémentaires demandées</p>
              </div>
              
              <div style="margin: 30px 0;">
                <p style="font-size: 16px; font-weight: 600; color: #333; margin-bottom: 15px;">Pour confirmer votre date, il vous suffit de :</p>
                <ul style="font-size: 16px; line-height: 2; padding-left: 25px;">
                  <li style="margin-bottom: 10px;">Nous renvoyer le devis signé</li>
                  <li style="margin-bottom: 10px;">Verser un acompte de <strong style="color: #e2943a;">30 %</strong></li>
                </ul>
              </div>
              
              <p style="font-size: 16px; margin: 30px 0;">Nous restons à votre disposition pour toute modification ou précision complémentaire.</p>
              
              <p style="font-size: 16px; margin: 30px 0;">Notre objectif est de créer une expérience aussi fluide que mémorable, parfaitement adaptée à vos attentes.</p>
              
              <p style="font-size: 16px; margin: 30px 0;">Au plaisir de vous accompagner dans l'organisation de votre événement 🔥</p>
              
              <div style="margin-top: 40px; padding-top: 30px; border-top: 2px solid #e5e7eb;">
                <p style="font-size: 16px; margin-bottom: 10px;">Bien chaleureusement,</p>
                <p style="font-size: 18px; font-weight: 600; color: #e2943a; margin-bottom: 5px;">Jeronimo Negrotto</p>
                <p style="font-size: 18px; font-weight: 600; color: #e2943a; margin-bottom: 15px;">Fuegos d'Azur</p>
                <p style="font-size: 14px; color: #6b7280; font-style: italic; letter-spacing: 1px;">Authenticité — Élégance — Feu</p>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              <p style="font-size: 12px; color: #6b7280; text-align: center;">
                Tel: 07 50 85 35 99 • 06 70 65 97 84<br>
                Email: fuegosdazur@proton.me
              </p>
            </div>
          </div>
        </body>
        </html>
      `

      const emailOptions: any = {
        from: `${fromName} <${fromEmail}>`,
        to: ['fuegosdazur@proton.me'], // Enviar solo al email de prueba por ahora
        subject: `Votre Devis Fuegos d'Azur - ${totalTTC.toFixed(2)}€ (Cliente: ${clientEmail})`,
        html: emailContent
      }

      // Agregar PDF como adjunto si está disponible
      if (pdfBuffer) {
        const filename = budget.pdf_url.split('/').pop()?.split('?')[0] || 'devis.pdf'
        // Resend espera el adjunto en base64 o como Buffer
        emailOptions.attachments = [
          {
            filename: filename,
            content: pdfBuffer.toString('base64'),
            type: 'application/pdf'
          }
        ]
        console.log(`📎 Adjuntando PDF: ${filename} (${pdfBuffer.length} bytes)`)
      } else {
        console.warn('⚠️ No se pudo descargar el PDF para adjuntarlo')
      }

      console.log(`📧 Enviando email a ${clientEmail}...`)
      const { data: emailData, error: emailError } = await resend.emails.send(emailOptions)

      if (emailError) {
        console.error('❌ Error enviando email:', emailError)
        
        // Mensaje más amigable para errores comunes de Resend
        let errorMessage = emailError.message || JSON.stringify(emailError)
        
        if (errorMessage.includes('testing emails') || errorMessage.includes('verify a domain')) {
          errorMessage = 'Resend está en modo de prueba. Para enviar emails a clientes, necesitas verificar un dominio en resend.com/domains. Por ahora, el presupuesto se aprobó pero el email no se envió. Puedes descargar el PDF y enviarlo manualmente.'
        }
        
        throw new Error(errorMessage)
      }

      console.log('✅ Email con PDF adjunto enviado al cliente:', emailData?.id)
      
      return NextResponse.json({
        success: true,
        message: 'Presupuesto aprobado y enviado exitosamente',
        pdfUrl: budget.pdf_url,
        emailId: emailData?.id
      })

    } catch (emailError) {
      console.error('❌ Error enviando email:', emailError)
      
      // Rollback del estado si falla el envío
      await supabase
        .from('budgets')
        .update({
          status: 'pending_review',
          sent_at: null,
          approved_at: null,
          approved_by: null
        })
        .eq('id', budgetId)
      
      const errorMessage = emailError instanceof Error ? emailError.message : String(emailError)
      
      // Si el error es por dominio no verificado, aprobar el presupuesto de todas formas
      const isDomainError = errorMessage.includes('testing emails') || errorMessage.includes('verify a domain')
      
      if (isDomainError) {
        // No hacer rollback, dejar el presupuesto aprobado
        return NextResponse.json({
          success: true,
          message: 'Presupuesto aprobado exitosamente',
          pdfUrl: budget.pdf_url,
          note: 'El presupuesto fue aprobado pero el email no se pudo enviar automáticamente porque Resend está en modo de prueba. Para enviar emails a clientes, verifica un dominio en resend.com/domains. Por ahora, puedes descargar el PDF y enviarlo manualmente.',
          warning: true
        })
      }
      
      // Para otros errores, hacer rollback
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

