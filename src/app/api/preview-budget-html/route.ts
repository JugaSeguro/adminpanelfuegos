import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { generateBudgetHTML } from '@/lib/budgetPDFTemplate'
import { BudgetData } from '@/lib/types/budget'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const budgetId = searchParams.get('budgetId')

    if (!budgetId) {
      return NextResponse.json(
        { error: 'budgetId es requerido como query parameter' },
        { status: 400 }
      )
    }

    console.log(`📄 Generando HTML preview para presupuesto ${budgetId}...`)

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

    // Generar HTML
    const html = generateBudgetHTML(budgetData)

    // Devolver HTML como respuesta
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    })

  } catch (error) {
    console.error('❌ Error generando HTML preview:', error)
    return NextResponse.json(
      { 
        error: 'Error inesperado', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    )
  }
}

