import { NextRequest, NextResponse } from 'next/server'
import { userDatabase } from '@/lib/user-database'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { accessToken } = body

    if (!accessToken?.trim()) {
      return NextResponse.json(
        { error: 'Access token is required' },
        { status: 400 }
      )
    }

    const user = await userDatabase.getUserByAccessToken(accessToken.trim())
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid access token' },
        { status: 401 }
      )
    }

    // For temporary users, delete the account
    // For permanent users, we could invalidate the token or just log them out
    if (user.isTemporary) {
      await userDatabase.deleteUser(user.id)
      return NextResponse.json({
        success: true,
        message: 'Temporary account deleted'
      })
    } else {
      return NextResponse.json({
        success: true,
        message: 'Logged out successfully'
      })
    }
  } catch (error) {
    console.error('Failed to logout user:', error)
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    )
  }
}