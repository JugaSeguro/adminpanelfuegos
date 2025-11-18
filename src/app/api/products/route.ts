import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

// GET - Obtener todos los productos
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching products:', error)
      return NextResponse.json(
        { error: 'Error al obtener productos', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ products: data || [] })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Error inesperado', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo producto
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, category, price, active = true } = body

    if (!name || !category || price === undefined) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: name, category, price' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('products')
      .insert([
        {
          name,
          category,
          price,
          active
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Error creating product:', error)
      return NextResponse.json(
        { error: 'Error al crear producto', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ product: data }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Error inesperado', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

