import { NextRequest, NextResponse } from 'next/server'
import { dataStore } from '@/lib/data-store'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params

    if (!roomId) {
      return NextResponse.json(
        { error: 'Room ID is required' },
        { status: 400 }
      )
    }

    const users = dataStore.getRoomUsers(roomId)

    return NextResponse.json(users)
  } catch (error) {
    console.error('Failed to fetch room users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch room users' },
      { status: 500 }
    )
  }
}