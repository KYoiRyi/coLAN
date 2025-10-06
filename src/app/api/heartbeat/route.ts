import { NextRequest, NextResponse } from 'next/server'
import { dataStore } from '@/lib/data-store'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { session_id } = body

    if (!session_id) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    dataStore.updateUserActivity(session_id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update heartbeat:', error)
    return NextResponse.json(
      { error: 'Failed to update heartbeat' },
      { status: 500 }
    )
  }
}