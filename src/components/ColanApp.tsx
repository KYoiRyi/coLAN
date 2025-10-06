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

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Check if username exists in localStorage
    const savedUsername = localStorage.getItem('colan_username')
    const savedSessionId = localStorage.getItem('colan_session_id')

    if (savedUsername) {
      setUsername(savedUsername)
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

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username.trim()) {
      setError('Username is required')
      return
    }

    if (username.trim().length < 2) {
      setError('Username must be at least 2 characters')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Check username uniqueness
      const response = await fetch('/api/validate_username', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username.trim() }),
      })

      const validation = await response.json()

      if (!validation.available) {
        setError(validation.message || 'Username is not available')
        return
      }

      // Save to localStorage
      localStorage.setItem('colan_username', username.trim())

      setCurrentView('dashboard')
      fetchRooms()
    } catch (error) {
      setError('Failed to validate username')
    } finally {
      setLoading(false)
    }
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
            <CardDescription>Enter your username to start chatting</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUsernameSubmit} className="space-y-4">
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
              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
              <Button
                type="submit"
                className="w-full"
                disabled={loading || !username.trim()}
              >
                {loading ? 'Starting...' : 'Enter Chat'}
              </Button>
            </form>
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
          <Card className="glassmorphism-solid border-white/20 shadow-2xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <MessageSquare className="h-6 w-6 text-primary" />
                  <h1 className="text-xl font-bold">coLAN</h1>
                  <span className="text-sm text-muted-foreground">Welcome, {username}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ThemeSwitcher />
                  <Button
                    onClick={() => setShowCreateModal(true)}
                    size="sm"
                    className="gap-2"
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {rooms.map((room) => (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <Card
                    className="glassmorphism-solid hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer"
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
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{room.name}</CardTitle>
                        {room.has_password && (
                          <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded">
                            🔒
                          </span>
                        )}
                      </div>
                      <CardDescription className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {room.user_count} users
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        className="w-full"
                        size="sm"
                        onClick={(e) => handleJoinRoomClick(e, room)}
                        onTouchEnd={(e) => handleJoinRoomClick(e, room)}
                      >
                        Join Room
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>

            {rooms.length === 0 && (
              <div className="col-span-full text-center py-12">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No rooms yet</h3>
                <p className="text-muted-foreground mb-4">Create your first room to start chatting</p>
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Room
                </Button>
              </div>
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
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!connected || uploading}
                  size="icon"
                  className="bg-white/10 border-white/20 hover:bg-white/20"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button
                  onClick={sendMessage}
                  disabled={!connected || !messageInput.trim()}
                  size="icon"
                  className="bg-primary/80 hover:bg-primary"
                >
                  <Send className="h-4 w-4" />
                </Button>
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

  return null
}