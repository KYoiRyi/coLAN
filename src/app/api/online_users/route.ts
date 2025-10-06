import { NextResponse } from 'next/server'
import { dataStore } from '@/lib/data-store'

export async function GET() {
  try {
    const users = dataStore.getOnlineUsers()
    return NextResponse.json(users)
  } catch (error) {
    console.error('Failed to fetch online users:', error)
    return NextResponse.json([], { status: 500 })
  }
}