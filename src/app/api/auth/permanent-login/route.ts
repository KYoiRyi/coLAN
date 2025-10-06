import { NextRequest, NextResponse } from 'next/server'
import { userDatabase } from '@/lib/user-database'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password, email } = body

    if (!username?.trim() || !password?.trim()) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    const result = await userDatabase.createPermanentUser(
      username.trim(),
      password.trim(),
      email?.trim()
    )

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
    console.error('Failed to create permanent user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}