"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'

interface UsernameManagerProps {
  onUsernameSet: (username: string) => void
}

export function UsernameManager({ onUsernameSet }: UsernameManagerProps) {
  const [username, setUsername] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Check if username is already stored in cookie
    const storedUsername = getCookie('colan_username')
    if (storedUsername) {
      setUsername(storedUsername)
      onUsernameSet(storedUsername)
    }
  }, [onUsernameSet])

  const getCookie = (name: string): string | null => {
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) {
      const cookieValue = parts.pop()?.split(';').shift()
      return cookieValue || null
    }
    return null
  }

  const setCookie = (name: string, value: string, days: number = 30) => {
    const expires = new Date()
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000))
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username.trim()) {
      setError('Username is required')
      return
    }

    if (username.trim().length < 2) {
      setError('Username must be at least 2 characters')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const trimmedUsername = username.trim()

      // Validate username uniqueness
      const response = await fetch('/api/validate_username', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: trimmedUsername }),
      })

      const validation = await response.json()

      if (!validation.available) {
        setError(validation.message || 'Username is not available')
        return
      }

      // Store in cookie
      setCookie('colan_username', trimmedUsername, 30)

      onUsernameSet(trimmedUsername)
    } catch (error) {
      setError('Failed to validate username')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value)
    setError('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md glassmorphism">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gradient">
            Welcome to coLAN
          </CardTitle>
          <CardDescription>
            Choose a username to join the collaboration space
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={handleUsernameChange}
                placeholder="Enter your username"
                className="w-full"
                disabled={isLoading}
                maxLength={20}
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !username.trim()}
            >
              {isLoading ? 'Setting username...' : 'Continue'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}