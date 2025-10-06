import { NextRequest, NextResponse } from 'next/server'
import { dataStore } from '@/lib/data-store'

export async function GET() {
  try {
    const rooms = dataStore.getAllRooms()
    return NextResponse.json(rooms)
  } catch (error) {
    console.error('Failed to fetch rooms:', error)
    return NextResponse.json([], { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, password } = body

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Room name is required' },
        { status: 400 }
      )
    }

    // Check if room with same name already exists
    const rooms = dataStore.getAllRooms()
    const existingRoom = rooms.find(room =>
      room.name.toLowerCase() === name.trim().toLowerCase()
    )

    if (existingRoom) {
      return NextResponse.json(
        { error: 'A room with this name already exists' },
        { status: 409 }
      )
    }

    // Create room
    const room = dataStore.createRoom(name.trim(), password)
    return NextResponse.json(room)
  } catch (error) {
    console.error('Failed to create room:', error)
    return NextResponse.json(
      { error: 'Failed to create room' },
      { status: 500 }
    )
  }
}