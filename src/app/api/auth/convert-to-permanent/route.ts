import { NextRequest, NextResponse } from 'next/server'
import { userDatabase } from '@/lib/user-database'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, email, password } = body

    if (!userId || !email?.trim() || !password?.trim()) {
      return NextResponse.json(
        { error: 'User ID, email, and password are required' },
        { status: 400 }
      )
    }

    const result = await userDatabase.convertTemporaryToPermanent(userId, email.trim(), password.trim())

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: result.user!.id,
        username: result.user!.username,
        email: result.user!.email,
        isTemporary: result.user!.isTemporary,
        accessToken: result.user!.accessToken,
        lastLogin: result.user!.lastLogin
      }
    })
  } catch (error) {
    console.error('Failed to convert user to permanent:', error)
    return NextResponse.json(
      { error: 'Failed to convert account' },
      { status: 500 }
    )
  }
}