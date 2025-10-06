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

    const user = dataStore.removeUserFromRoom(session_id)

    if (!user) {
      return NextResponse.json(
        { error: 'User session not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `User ${user.username} left room ${user.room_name}`
    })
  } catch (error) {
    console.error('Failed to leave room:', error)
    return NextResponse.json(
      { error: 'Failed to leave room' },
      { status: 500 }
    )
  }
}