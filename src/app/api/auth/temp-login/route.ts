import { NextRequest, NextResponse } from 'next/server'
import { userDatabase } from '@/lib/user-database'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, deviceId } = body

    if (!username?.trim()) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      )
    }

    const result = await userDatabase.createTemporaryUser(username.trim(), deviceId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, needsDeviceVerification: result.needsDeviceVerification },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: result.user!.id,
        username: result.user!.username,
        isTemporary: result.user!.isTemporary,
        accessToken: result.user!.accessToken,
        lastLogin: result.user!.lastLogin
      }
    })
  } catch (error) {
    console.error('Failed to create temporary user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}