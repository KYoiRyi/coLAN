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

    const room = dataStore.getRoom(roomId)

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: room.id,
      name: room.name,
      has_password: room.has_password,
      created_at: room.created_at,
      user_count: dataStore.getRoomUsers(roomId).length
    })
  } catch (error) {
    console.error('Failed to fetch room info:', error)
    return NextResponse.json(
      { error: 'Room not found' },
      { status: 404 }
    )
  }
}