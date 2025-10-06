import { NextRequest, NextResponse } from 'next/server'
import { dataStore } from '@/lib/data-store'

// Handle username validation
export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json()

    if (!username?.trim()) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      )
    }

    const isTaken = dataStore.isUsernameTaken(username.trim())

    return NextResponse.json({
      available: !isTaken,
      message: isTaken ? 'This username is already taken. Please choose another.' : null
    })
  } catch (error) {
    console.error('Username validation error:', error)
    // On error, allow the username to avoid blocking users
    return NextResponse.json({ available: true })
  }
}

// Handle getting online users
export async function GET() {
  try {
    const users = dataStore.getOnlineUsers()
    return NextResponse.json(users)
  } catch (error) {
    console.error('Failed to fetch online users:', error)
    return NextResponse.json([], { status: 500 })
  }
}