import { NextRequest, NextResponse } from 'next/server'
import { dataStore } from '@/lib/data-store'

// Get messages for a room
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const room_id = searchParams.get('room_id')

    if (!room_id) {
      return NextResponse.json(
        { error: 'Room ID is required' },
        { status: 400 }
      )
    }

    const messages = dataStore.getRoomMessages(room_id)
    return NextResponse.json(messages)
  } catch (error) {
    console.error('Failed to fetch messages:', error)
    return NextResponse.json([], { status: 500 })
  }
}

// Send a message to a room
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { room_id, username, message, type = 'text', file_info } = body

    if (!room_id || !username || !message) {
      return NextResponse.json(
        { error: 'Room ID, username, and message are required' },
        { status: 400 }
      )
    }

    // Check if room exists
    const room = dataStore.getRoom(room_id)
    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      )
    }

    const newMessage = dataStore.addMessage({
      room_id,
      username: username.trim(),
      message: message.trim(),
      type,
      file_info
    })

    return NextResponse.json(newMessage)
  } catch (error) {
    console.error('Failed to send message:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}