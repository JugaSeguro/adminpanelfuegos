import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { generateBudgetPDF, getBudgetPDFFilename } from '@/lib/budgetPDFService'
import { BudgetData } from '@/lib/types/budget'

export async function POST(request: NextRequest) {
  try {
    const { budgetId } = await request.json()

    if (!budgetId) {
      return NextResponse.json(
        { error: 'budgetId es requerido' },
        { status: 400 }
      )
    }

    console.log(`📄 Generando PDF para presupuesto ${budgetId}...`)

    // Obtener datos del presupuesto
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

    const budgetData = budget.budget_data as BudgetData

    // Generar PDF
    const pdfBlob = await generateBudgetPDF(budgetData)
    const filename = getBudgetPDFFilename(budgetData)

    // Subir a Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('budgets')
      .upload(`${budgetId}/${filename}`, pdfBlob, {
        contentType: 'application/pdf',
        upsert: true
      })

    if (uploadError) {
      console.error('Error subiendo PDF:', uploadError)
      return NextResponse.json(
        { error: 'Error al guardar PDF', details: uploadError.message },
        { status: 500 }
      )
    }

    // Obtener URL pública con timestamp para evitar cache
    const { data: urlData } = supabase
      .storage
      .from('budgets')
      .getPublicUrl(uploadData.path)

    // Agregar timestamp para forzar regeneración y evitar cache del navegador
    const timestamp = Date.now()
    const pdfUrl = `${urlData.publicUrl}?t=${timestamp}`

    // Actualizar registro
    const { error: updateError } = await supabase
      .from('budgets')
      .update({ pdf_url: pdfUrl })
      .eq('id', budgetId)

    if (updateError) {
      console.error('Error actualizando URL:', updateError)
    }

    console.log(`✅ PDF generado: ${pdfUrl}`)

    return NextResponse.json({
      success: true,
      pdfUrl,
      filename
    })

  } catch (error) {
    console.error('❌ Error generando PDF:', error)
    return NextResponse.json(
      { error: 'Error inesperado', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

