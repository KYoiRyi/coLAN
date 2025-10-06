import { NextRequest, NextResponse } from 'next/server'
import { dataStore } from '@/lib/data-store'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { room_id, password, username } = body

    if (!room_id || !username) {
      return NextResponse.json(
        { error: 'Room ID and username are required' },
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

    // Check password if room has one
    if (room.has_password && room.password !== password) {
      return NextResponse.json(
        { error: 'Incorrect password' },
        { status: 401 }
      )
    }

    // Generate session ID
    const sessionId = uuidv4()

    // Add user to room
    const user = dataStore.addUserToRoom(room_id, {
      username: username.trim(),
      session_id: sessionId,
      room_id
    })

    return NextResponse.json({
      room,
      user,
      session_id: sessionId
    })
  } catch (error) {
    console.error('Failed to join room:', error)
    return NextResponse.json(
      { error: 'Failed to join room' },
      { status: 500 }
    )
  }
}