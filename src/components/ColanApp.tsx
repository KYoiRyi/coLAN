"use client"

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'
import { cn } from '@/lib/utils'
import {
  Plus,
  Users,
  MessageSquare,
  Send,
  Paperclip,
  Download,
  File,
  FileText,
  ImageIcon,
  LogOut,
  Settings,
  X
} from 'lucide-react'
import FilePreview from '@/components/FilePreview'
import UserSettings from '@/components/UserSettings'
import { useKeyboardShortcuts, KeyboardShortcutsHelp, colanShortcuts, type Shortcut } from '@/components/KeyboardShortcuts'
import { TooltipWithShortcut, SimpleTooltip } from '@/components/ui/Tooltip'

interface Room {
  id: string
  name: string
  has_password: boolean
  user_count: number
  created_at: string
}

interface Message {
  id: string
  username: string
  message: string
  timestamp: string
  type: 'text' | 'file' | 'notification'
  file_info?: {
    original_name: string
    url: string
    size?: number
  }
}

interface User {
  username: string
  session_id: string
  room_id: string
  room_name: string
  joined_at: string
}

export default function ColanApp() {
  const [currentView, setCurrentView] = useState<'welcome' | 'dashboard' | 'chat'>('welcome')
  const [username, setUsername] = useState('')
  const [rooms, setRooms] = useState<Room[]>([])
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [userCount, setUserCount] = useState(0)
  const [connected, setConnected] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newRoomName, setNewRoomName] = useState('')
  const [newRoomPassword, setNewRoomPassword] = useState('')
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [joinPassword, setJoinPassword] = useState('')
  const [onlineUsers, setOnlineUsers] = useState<User[]>([])
  const [showFileUpload, setShowFileUpload] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null)
  const [sessionId, setSessionId] = useState<string>('')
  const [showOnlineUsers, setShowOnlineUsers] = useState(false)

  // Authentication states
  const [loginMode, setLoginMode] = useState<'temporary' | 'permanent'>('temporary')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [accessToken, setAccessToken] = useState<string>('')

  // UI states
  const [showSettings, setShowSettings] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Keyboard shortcuts configuration based on current view
  const shortcuts: Shortcut[] = [
    // Global shortcuts
    {
      key: '?',
      description: '显示键盘快捷键帮助',
      action: () => setShowKeyboardShortcuts(true),
      global: true
    },
    {
      key: 'Escape',
      description: '关闭模态框',
      action: () => {
        setShowKeyboardShortcuts(false)
        setShowSettings(false)
        setShowUserMenu(false)
        setShowCreateModal(false)
        setShowPasswordModal(false)
        setShowFileUpload(false)
      },
      global: true
    }
  ]

  // Add view-specific shortcuts
  if (currentView === 'welcome') {
    shortcuts.push(
      {
        key: 'Enter',
        description: '提交登录表单',
        action: () => {
          const form = document.querySelector('form') as HTMLFormElement
          form?.requestSubmit()
        }
      }
    )
  } else if (currentView === 'dashboard') {
    shortcuts.push(
      {
        key: 'n',
        ctrlKey: true,
        description: '创建新房间',
        action: () => setShowCreateModal(true)
      },
      {
        key: 'r',
        description: '刷新房间列表',
        action: () => fetchRooms()
      }
    )
  } else if (currentView === 'chat') {
    shortcuts.push(
      {
        key: 'Enter',
        description: '发送消息',
        action: () => {
          if (messageInput.trim()) {
            sendMessage()
          }
        }
      },
      {
        key: 'Enter',
        shiftKey: true,
        description: '换行输入',
        action: () => {
          // Allow default behavior for Shift+Enter
        }
      },
      {
        key: 'u',
        description: '显示在线用户',
        action: () => setShowOnlineUsers(!showOnlineUsers)
      },
      {
        key: 'f',
        description: '显示文件列表',
        action: () => setShowFileUpload(!showFileUpload)
      },
      {
        key: 's',
        ctrlKey: true,
        description: '打开设置',
        action: () => setShowSettings(true)
      },
      {
        key: 'l',
        description: '离开房间',
        action: () => leaveRoom()
      },
      {
        key: '/',
        description: '聚焦到输入框',
        action: () => {
          const input = document.querySelector('input[type="text"]') as HTMLInputElement
          input?.focus()
        }
      }
    )
  }

  useKeyboardShortcuts(shortcuts)

  useEffect(() => {
    // Check for existing authentication
    const savedUsername = localStorage.getItem('colan_username')
    const savedAccessToken = localStorage.getItem('colan_access_token')
    const savedSessionId = localStorage.getItem('colan_session_id')

    if (savedUsername && savedAccessToken) {
      setUsername(savedUsername)
      setAccessToken(savedAccessToken)
      if (savedSessionId) {
        setSessionId(savedSessionId)
      }
      setCurrentView('dashboard')
      fetchRooms()
    }
  }, [])

  useEffect(() => {
    if (currentView === 'dashboard') {
      fetchRooms()
      const interval = setInterval(fetchRooms, 3000)
      return () => clearInterval(interval)
    }
  }, [currentView])

  useEffect(() => {
    if (currentView === 'chat' && currentRoom) {
      fetchMessages()
      fetchRoomUsers()

      const messageInterval = setInterval(fetchMessages, 2000)
      const userInterval = setInterval(fetchRoomUsers, 5000)
      const heartbeatInterval = setInterval(sendHeartbeat, 30000) // Send heartbeat every 30 seconds

      return () => {
        clearInterval(messageInterval)
        clearInterval(userInterval)
        clearInterval(heartbeatInterval)
      }
    }
  }, [currentView, currentRoom, sessionId])

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchRooms = async () => {
    try {
      const response = await fetch('/api/rooms')
      const data = await response.json()
      setRooms(data)
    } catch (error) {
      console.error('Failed to fetch rooms:', error)
    }
  }

  const fetchMessages = async () => {
    if (!currentRoom) return

    try {
      const response = await fetch(`/api/messages?room_id=${currentRoom.id}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data)
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    }
  }

  const fetchRoomUsers = async () => {
    if (!currentRoom) return

    try {
      const response = await fetch(`/api/room/${currentRoom.id}/users`)
      if (response.ok) {
        const data = await response.json()
        setOnlineUsers(data)
        setUserCount(data.length)
      }
    } catch (error) {
      console.error('Failed to fetch room users:', error)
    }
  }

  const sendMessage = async () => {
    if (!messageInput.trim() || !currentRoom) return

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          room_id: currentRoom.id,
          username: username.trim(),
          message: messageInput.trim()
        }),
      })

      if (response.ok) {
        setMessageInput('')
        await fetchMessages()
        await sendHeartbeat() // Update activity when sending message
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const sendHeartbeat = async () => {
    if (!sessionId) return

    try {
      await fetch('/api/heartbeat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId
        }),
      })
    } catch (error) {
      console.error('Failed to send heartbeat:', error)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username.trim()) {
      setError('Username is required')
      return
    }

    if (username.trim().length < 2) {
      setError('Username must be at least 2 characters')
      return
    }

    if (loginMode === 'permanent' && !password.trim()) {
      setError('Password is required for permanent users')
      return
    }

    setLoading(true)
    setError('')

    try {
      let response
      let data

      if (loginMode === 'temporary') {
        // Temporary user login
        const deviceId = localStorage.getItem('colan_device_id') || generateDeviceId()
        localStorage.setItem('colan_device_id', deviceId)

        response = await fetch('/api/auth/temp-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: username.trim(),
            deviceId: deviceId
          }),
        })

        data = await response.json()

        if (!response.ok) {
          if (data.needsDeviceVerification) {
            setError('Username already exists on another device. Temporary accounts are device-specific.')
          } else {
            setError(data.error || 'Failed to create temporary account')
          }
          return
        }

        // Save temporary user data
        localStorage.setItem('colan_username', data.user.username)
        localStorage.setItem('colan_access_token', data.user.accessToken)
        localStorage.setItem('colan_is_temporary', 'true')
        setAccessToken(data.user.accessToken)
        setCurrentUser(data.user)
      } else {
        // Permanent user login/create
        response = await fetch('/api/auth/permanent-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: username.trim(),
            password: password.trim(),
            email: email.trim() || undefined
          }),
        })

        data = await response.json()

        if (!response.ok) {
          setError(data.error || 'Failed to login/create permanent account')
          return
        }

        // Save permanent user data
        localStorage.setItem('colan_username', data.user.username)
        localStorage.setItem('colan_access_token', data.user.accessToken)
        localStorage.setItem('colan_is_temporary', 'false')
        setAccessToken(data.user.accessToken)
        setCurrentUser(data.user)
      }

      setCurrentView('dashboard')
      fetchRooms()
    } catch (error) {
      setError('Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    if (!accessToken) return

    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessToken }),
      })
    } catch (error) {
      console.error('Logout failed:', error)
    }

    // Clear all auth data
    localStorage.removeItem('colan_username')
    localStorage.removeItem('colan_access_token')
    localStorage.removeItem('colan_session_id')
    localStorage.removeItem('colan_is_temporary')

    setUsername('')
    setAccessToken('')
    setCurrentUser(null)
    setSessionId('')
    setCurrentView('welcome')
  }

  const generateDeviceId = () => {
    return 'device_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
  }

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newRoomName.trim()) {
      setError('Room name is required')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newRoomName.trim(),
          password: newRoomPassword
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create room')
        return
      }

      setShowCreateModal(false)
      setNewRoomName('')
      setNewRoomPassword('')
      fetchRooms()
    } catch (error) {
      setError('Failed to create room')
    } finally {
      setLoading(false)
    }
  }

  const handleJoinRoom = async (room: Room) => {
    setSelectedRoom(room)

    if (room.has_password) {
      setShowPasswordModal(true)
    } else {
      await joinRoom(room)
    }
  }

  const handleJoinRoomClick = (e: React.MouseEvent | React.TouchEvent, room: Room) => {
    e.preventDefault()
    e.stopPropagation()
    handleJoinRoom(room)
  }

  const joinRoom = async (room: Room, password = '') => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/join_room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          room_id: room.id,
          password,
          username: username.trim()
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to join room')
        setShowPasswordModal(false)
        return
      }

      // Save session ID
      if (data.session_id) {
        setSessionId(data.session_id)
        localStorage.setItem('colan_session_id', data.session_id)
      }

      setCurrentRoom(room)
      setCurrentView('chat')
      setShowPasswordModal(false)
      setJoinPassword('')
      setSelectedRoom(null)

      // Clear messages for new room and fetch them
      setMessages([])
      await fetchMessages()
      await fetchRoomUsers()
    } catch (error) {
      setError('Failed to join room')
    } finally {
      setLoading(false)
    }
  }

  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      setSelectedFiles(files)
      setShowFileUpload(true)
    }
  }

  const uploadFiles = async () => {
    if (!selectedFiles || !currentRoom) return

    setUploading(true)
    setError('')

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]
        const formData = new FormData()
        formData.append('file', file)
        formData.append('room_id', currentRoom.id)
        formData.append('username', username)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || `Failed to upload ${file.name}`)
        }
      }

      // All files uploaded successfully
      setShowFileUpload(false)
      setSelectedFiles(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

      // Refresh messages to show uploaded files
      await fetchMessages()
    } catch (error) {
      setError('Failed to upload files')
    } finally {
      setUploading(false)
    }
  }

  const leaveRoom = async () => {
    if (sessionId) {
      try {
        await fetch('/api/leave_room', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            session_id: sessionId
          }),
        })
      } catch (error) {
        console.error('Failed to leave room:', error)
      }
    }

    // Clear session ID
    setSessionId('')
    localStorage.removeItem('colan_session_id')

    // Reset state
    setCurrentRoom(null)
    setMessages([])
    setUserCount(0)
    setOnlineUsers([])
    setCurrentView('dashboard')
  }

  
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase()
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      return <ImageIcon className="h-4 w-4" />
    }
    if (['pdf'].includes(ext || '')) {
      return <FileText className="h-4 w-4" />
    }
    return <File className="h-4 w-4" />
  }

  if (currentView === 'welcome') {
    return (
      <div className="min-h-screen bg-background/80 backdrop-blur-xl flex items-center justify-center p-4">
        <Card className="glassmorphism-solid w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <MessageSquare className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl">Welcome to coLAN</CardTitle>
            <CardDescription>
              {loginMode === 'temporary'
                ? 'Enter your name to start chatting (temporary account)'
                : 'Login or create permanent account'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="mt-1"
                  disabled={loading}
                />
              </div>

              {loginMode === 'permanent' && (
                <>
                  <div>
                    <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="mt-1"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium">Email (Optional)</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="mt-1"
                      disabled={loading}
                    />
                  </div>
                </>
              )}

              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading || !username.trim() || (loginMode === 'permanent' && !password.trim())}
              >
                {loading
                  ? 'Logging in...'
                  : loginMode === 'temporary'
                    ? 'Start Chatting'
                    : 'Login / Create Account'
                }
              </Button>
            </form>

            <div className="mt-6 text-center">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setLoginMode(loginMode === 'temporary' ? 'permanent' : 'temporary')
                  setError('')
                  setPassword('')
                  setEmail('')
                }}
                className="mt-3 text-xs"
              >
                {loginMode === 'temporary'
                  ? '🔑 Switch to Permanent Account'
                  : '⚡ Switch to Temporary Account'
                }
              </Button>
            </div>

            <div className="mt-4 text-center">
              <ThemeSwitcher />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (currentView === 'dashboard') {
    return (
      <div className="min-h-screen bg-background/80 backdrop-blur-xl">
        {/* Fixed Header */}
        <div className="fixed top-0 left-0 right-0 z-10 p-4">
          <Card className="glassmorphism-strong border-white/30 shadow-2xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <MessageSquare className="h-7 w-7 text-gradient-purple" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background pulse-glow" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gradient">coLAN</h1>
                    <p className="text-xs text-muted-foreground">Local Area Network Chat</p>
                  </div>
                  <div className="h-8 w-px bg-gradient-to-b from-transparent via-border to-transparent" />
                  <span className="text-sm text-muted-foreground">Welcome, <span className="font-medium text-foreground">{username}</span></span>
                </div>

                <div className="flex items-center gap-2">
                  <ThemeSwitcher />

                  {/* User Menu */}
                  <div className="relative" ref={userMenuRef}>
                    <Button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      size="sm"
                      variant="ghost"
                      className="gap-2 hover:bg-white/10 relative group"
                    >
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white group-hover:scale-110 transition-transform">
                        {username.charAt(0).toUpperCase()}
                      </div>
                    </Button>

                    <AnimatePresence>
                      {showUserMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          className="absolute right-0 mt-2 w-56 glassmorphism-strong border-white/30 rounded-lg shadow-2xl overflow-hidden"
                        >
                          <div className="p-2">
                            <button
                              onClick={() => {
                                setShowSettings(true)
                                setShowUserMenu(false)
                              }}
                              className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-white/10 rounded-lg transition-colors"
                            >
                              <Settings className="h-4 w-4" />
                              <span className="text-sm">用户设置</span>
                            </button>
                            <div className="h-px bg-white/20 my-1" />
                            <button
                              onClick={handleLogout}
                              className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-red-500/10 text-red-400 rounded-lg transition-colors"
                            >
                              <LogOut className="h-4 w-4" />
                              <span className="text-sm">退出登录</span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <Button
                    onClick={() => setShowCreateModal(true)}
                    size="sm"
                    className="gap-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 border-0 shadow-lg hover-lift"
                  >
                    <Plus className="h-4 w-4" />
                    Create Room
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="pt-24 pb-4 px-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {rooms.map((room, index) => (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -30, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="group"
                >
                  <Card
                    className="glassmorphism-card hover:shadow-2xl transition-all duration-500 cursor-pointer border-gradient hover-lift group-hover:border-purple-500/50"
                    onClick={(e) => handleJoinRoomClick(e, room)}
                    onTouchEnd={(e) => handleJoinRoomClick(e, room)}
                    role="button"
                    tabIndex={0}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleJoinRoom(room)
                      }
                    }}
                  >
                    <CardHeader className="relative">
                      <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full blur-xl -z-10 group-hover:scale-150 transition-transform duration-500" />
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl font-semibold group-hover:text-gradient transition-colors duration-300">
                          {room.name}
                        </CardTitle>
                        {room.has_password && (
                          <motion.span
                            className="text-xs bg-gradient-to-r from-yellow-400/20 to-orange-400/20 text-yellow-600 dark:text-yellow-400 px-2 py-1 rounded-full border border-yellow-400/30 backdrop-blur-sm"
                            whileHover={{ scale: 1.1 }}
                          >
                            🔒
                          </motion.span>
                        )}
                      </div>
                      <CardDescription className="flex items-center gap-2 mt-2">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-purple-500" />
                          <span className="text-sm">{room.user_count} users</span>
                        </div>
                        <div className="h-4 w-px bg-border/50" />
                        <span className="text-xs text-muted-foreground">
                          {new Date(room.created_at).toLocaleDateString()}
                        </span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Button
                        className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 border-0 shadow-lg group-hover:shadow-xl transition-all duration-300 hover-lift"
                        size="sm"
                        onClick={(e) => handleJoinRoomClick(e, room)}
                        onTouchEnd={(e) => handleJoinRoomClick(e, room)}
                      >
                        加入房间
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>

            {rooms.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="col-span-full text-center py-16"
              >
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full blur-3xl floating-animation" />
                  <div className="relative glassmorphism-card p-12 rounded-2xl border-gradient">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-2xl floating-animation">
                      <MessageSquare className="h-12 w-12 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gradient mb-3">还没有房间</h3>
                    <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                      创建你的第一个房间，开始与朋友们聊天吧！coLAN 让局域网沟通变得简单高效。
                    </p>
                    <TooltipWithShortcut
                      content="创建一个新的聊天房间"
                      shortcut="Ctrl+N"
                    >
                      <Button
                        onClick={() => setShowCreateModal(true)}
                        size="lg"
                        className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 border-0 shadow-xl hover-lift"
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        创建房间
                      </Button>
                    </TooltipWithShortcut>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Create Room Modal */}
        <AnimatePresence>
          {showCreateModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-full max-w-md"
              >
                <Card className="glassmorphism-solid">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Create New Room</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowCreateModal(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCreateRoom} className="space-y-4">
                      <div>
                        <Label htmlFor="roomName" className="text-sm font-medium">Room Name</Label>
                        <Input
                          id="roomName"
                          type="text"
                          value={newRoomName}
                          onChange={(e) => setNewRoomName(e.target.value)}
                          placeholder="Enter room name"
                          className="mt-1"
                          disabled={loading}
                        />
                      </div>
                      <div>
                        <Label htmlFor="roomPassword" className="text-sm font-medium">Password (Optional)</Label>
                        <Input
                          id="roomPassword"
                          type="password"
                          value={newRoomPassword}
                          onChange={(e) => setNewRoomPassword(e.target.value)}
                          placeholder="Enter password"
                          className="mt-1"
                          disabled={loading}
                        />
                      </div>
                      {error && (
                        <p className="text-sm text-red-600">{error}</p>
                      )}
                      <div className="flex gap-2">
                        <Button
                          type="submit"
                          className="flex-1"
                          disabled={loading || !newRoomName.trim()}
                        >
                          {loading ? 'Creating...' : 'Create Room'}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowCreateModal(false)}
                          disabled={loading}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Join Room Password Modal */}
        <AnimatePresence>
          {showPasswordModal && selectedRoom && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-full max-w-md"
              >
                <Card className="glassmorphism-solid">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Join Room</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowPasswordModal(false)
                          setSelectedRoom(null)
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardDescription>Enter password for "{selectedRoom.name}"</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={(e) => {
                      e.preventDefault()
                      joinRoom(selectedRoom, joinPassword)
                    }} className="space-y-4">
                      <div>
                        <Label htmlFor="joinPassword" className="text-sm font-medium">Password</Label>
                        <Input
                          id="joinPassword"
                          type="password"
                          value={joinPassword}
                          onChange={(e) => setJoinPassword(e.target.value)}
                          placeholder="Enter room password"
                          className="mt-1"
                          disabled={loading}
                        />
                      </div>
                      {error && (
                        <p className="text-sm text-red-600">{error}</p>
                      )}
                      <div className="flex gap-2">
                        <Button
                          type="submit"
                          className="flex-1"
                          disabled={loading || !joinPassword.trim()}
                        >
                          {loading ? 'Joining...' : 'Join Room'}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowPasswordModal(false)
                            setSelectedRoom(null)
                          }}
                          disabled={loading}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  if (currentView === 'chat' && currentRoom) {
    return (
      <div className="h-screen bg-background/80 backdrop-blur-xl">
        {/* Fixed Header */}
        <div className="fixed top-0 left-0 right-0 z-10 p-4">
          <Card className="glassmorphism-solid border-white/20 shadow-2xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowOnlineUsers(!showOnlineUsers)}
                      className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
                    >
                      <Users className="h-5 w-5 text-primary" />
                      <span>{onlineUsers.length} users</span>
                    </button>
                  </div>
                  <div className="h-6 w-px bg-border/50" />
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-sm font-medium text-muted-foreground">{username}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{currentRoom.name}</span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={leaveRoom}
                    className="gap-2 bg-red-500/20 hover:bg-red-500/30 border-red-500/30"
                  >
                    <LogOut className="h-4 w-4" />
                    Leave
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Messages Area */}
        <div className="pt-24 pb-32 px-4 h-full overflow-hidden">
          <Card className="h-full glassmorphism-solid border-white/10 shadow-2xl">
            <CardContent className="h-full p-4 overflow-hidden">
              <div className="h-full overflow-y-auto space-y-4 custom-scrollbar">
                {!connected && (
                  <div className="text-center text-muted-foreground">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2" />
                    Connecting to room...
                  </div>
                )}

                <AnimatePresence>
                  {messages.map((message) => {
                    // Handle notification messages (user joined/left)
                    if (message.type === 'notification') {
                      return (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="flex justify-center my-4"
                        >
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-200/30 dark:border-blue-800/30 rounded-full backdrop-blur-sm">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                            <span className="text-sm text-muted-foreground font-medium">
                              {message.message}
                            </span>
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                          </div>
                        </motion.div>
                      )
                    }

                    // Handle regular messages
                    const isOwnMessage = message.username === username
                    return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={cn(
                        "flex",
                        isOwnMessage ? "justify-end" : "justify-start"
                      )}
                    >
                      <div className={cn(
                        "max-w-xs lg:max-w-md",
                        isOwnMessage && "text-right"
                      )}>
                        {!isOwnMessage && message.username && (
                          <p className="text-xs text-muted-foreground mb-1">
                            {message.username}
                          </p>
                        )}
                        <div className={cn(
                          "rounded-lg p-3",
                          message.type === 'file' ? "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800" :
                          isOwnMessage ? "bg-primary/80 text-primary-foreground backdrop-blur-sm" : "bg-muted/80 backdrop-blur-sm"
                        )}>
                          {message.type === 'file' ? (
                            <div className="w-full">
                              <FilePreview
                                fileInfo={message.file_info!}
                                username={message.username}
                                timestamp={message.timestamp}
                                isOwn={isOwnMessage}
                              />
                            </div>
                          ) : (
                            <>
                              <p className="text-sm">{message.message}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatTime(message.timestamp)}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                    )
                  })}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fixed Input */}
        <div className="fixed bottom-0 left-0 right-0 z-10 p-4">
          <Card className="glassmorphism-solid border-white/20 shadow-2xl">
            <CardContent className="p-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type your message..."
                    disabled={!connected}
                    className="bg-white/10 border-white/20"
                  />
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <TooltipWithShortcut
                  content="上传文件"
                  shortcut="F"
                >
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!connected || uploading}
                    size="icon"
                    className="bg-white/10 border-white/20 hover:bg-white/20"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                </TooltipWithShortcut>
                <TooltipWithShortcut
                  content="发送消息"
                  shortcut="Enter"
                >
                  <Button
                    onClick={sendMessage}
                    disabled={!connected || !messageInput.trim()}
                    size="icon"
                    className="bg-primary/80 hover:bg-primary"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </TooltipWithShortcut>
              </div>
              {uploading && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Uploading file...
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* File Upload Modal */}
        <AnimatePresence>
          {showFileUpload && selectedFiles && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-full max-w-md"
              >
                <Card className="glassmorphism-solid">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Upload Files</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowFileUpload(false)
                          setSelectedFiles(null)
                          if (fileInputRef.current) {
                            fileInputRef.current.value = ""
                          }
                        }}
                        disabled={uploading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* File List */}
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {Array.from(selectedFiles).map((file, index) => (
                          <div key={index} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg">
                            <div className="flex-shrink-0">
                              {getFileIcon(file.name)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {(file.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                            <div className="flex-shrink-0">
                              {file.type.startsWith('image/') && (
                                <div className="w-8 h-8 rounded bg-muted/20 flex items-center justify-center">
                                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {error && (
                        <p className="text-sm text-red-600">{error}</p>
                      )}

                      <div className="flex gap-2">
                        <Button
                          onClick={uploadFiles}
                          disabled={uploading}
                          className="flex-1"
                        >
                          {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''}`}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowFileUpload(false)
                            setSelectedFiles(null)
                            if (fileInputRef.current) {
                              fileInputRef.current.value = ""
                            }
                          }}
                          disabled={uploading}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Online Users Modal */}
        <AnimatePresence>
          {showOnlineUsers && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-full max-w-md"
              >
                <Card className="glassmorphism-solid">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Online Users</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowOnlineUsers(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardDescription>
                      {onlineUsers.length} user{onlineUsers.length !== 1 ? 's' : ''} in {currentRoom.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {onlineUsers.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">No users online</p>
                      ) : (
                        onlineUsers.map((user, index) => (
                          <div key={index} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                              <span className="text-xs font-medium text-primary">
                                {user.username.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{user.username}</p>
                              <p className="text-xs text-muted-foreground">
                                Joined {new Date(user.joined_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            <div className="flex-shrink-0">
                              <div className="w-2 h-2 bg-green-500 rounded-full" />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <>
      {/* User Settings Modal */}
      <UserSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        username={username}
        isTemporary={!localStorage.getItem('colan_is_temporary')}
        onLogout={handleLogout}
      />

      {/* Keyboard Shortcuts Help Modal */}
      <KeyboardShortcutsHelp
        shortcuts={shortcuts}
        isOpen={showKeyboardShortcuts}
        onClose={() => setShowKeyboardShortcuts(false)}
      />
    </>
  )
}