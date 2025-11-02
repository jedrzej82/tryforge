import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge' // Optional: Use edge runtime for better performance

// Type-safe response
interface HelloResponse {
  message: string
  timestamp: string
  method: string
}

// GET handler
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const name = searchParams.get('name') || 'World'

  const response: HelloResponse = {
    message: `Hello, ${name}!`,
    timestamp: new Date().toISOString(),
    method: 'GET',
  }

  return NextResponse.json(response, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, max-age=0',
    },
  })
}

// POST handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    const response: HelloResponse = {
      message: `Hello, ${name}!`,
      timestamp: new Date().toISOString(),
      method: 'POST',
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    )
  }
}

// OPTIONS handler for CORS
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }
  )
}
