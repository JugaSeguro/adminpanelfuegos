import { NextResponse } from 'next/server'
import { sendEmail, processEmailTemplate } from '@/lib/emailService'
import { supabase } from '@/lib/supabaseClient'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { orderId, templateId, customSubject, customContent } = body

    // Validar datos requeridos
    if (!orderId) {
      return NextResponse.json(
        { error: 'orderId es requerido' },
        { status: 400 }
      )
    }

    // Obtener información del pedido
    const { data: order, error: orderError } = await supabase
      .from('catering_orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Pedido no encontrado' },
        { status: 404 }
      )
    }

    let subject = customSubject
    let content = customContent

    // Si se especificó una plantilla, usarla
    if (templateId) {
      const { data: template, error: templateError } = await supabase
        .from('email_templates')
        .select('*')
        .eq('id', templateId)
        .single()

      if (templateError || !template) {
        return NextResponse.json(
          { error: 'Plantilla no encontrada' },
          { status: 404 }
        )
      }

      subject = template.subject
      content = template.content
    }

    // Variables para reemplazar en la plantilla
    const variables = {
      name: order.name,
      eventDate: order.event_date || 'Por definir',
      guestCount: order.guest_count || 0,
      eventType: order.event_type || 'Evento'
    }

    // Procesar plantilla con variables
    const processedSubject = processEmailTemplate(subject, variables)
    const processedContent = processEmailTemplate(content, variables)

    // Enviar email
    const result = await sendEmail({
      to: order.email,
      toName: order.name,
      subject: processedSubject,
      content: processedContent,
      orderId: orderId
    })

    // Registrar en email_logs
    const { error: logError } = await supabase
      .from('email_logs')
      .insert([{
        order_id: orderId,
        template_id: templateId || null,
        recipient_email: order.email,
        recipient_name: order.name,
        subject: processedSubject,
        content: processedContent,
        status: 'sent'
      }])

    if (logError) {
      console.error('Error al registrar email en logs:', logError)
      // No fallar la petición por error en logs
    }

    return NextResponse.json({
      success: true,
      message: 'Email enviado correctamente',
      messageId: result.messageId,
      recipient: result.recipient
    })

  } catch (error) {
    console.error('Error en API send-email:', error)
    
    return NextResponse.json(
      { 
        error: 'Error al enviar email',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

