"use client"

import { useState, useEffect, useRef, use } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import {
  Send,
  Users,
  Paperclip,
  LogOut,
  Download,
  FileText,
  Image as ImageIcon,
  File
} from "lucide-react"
import { io, Socket } from "socket.io-client"
import { cn } from "@/lib/utils"
import { useSearchParams } from "next/navigation"

interface Message {
  id: string
  username: string
  message: string
  timestamp: string
  type: "text" | "file"
  file_info?: {
    filename: string
    original_name: string
    url: string
  }
  own?: boolean
}

interface User {
  sid: string
  username: string
}

interface RoomPageProps {
  params: Promise<{
    roomId: string
  }>
}

export default function RoomPage({ params }: RoomPageProps) {
  const { roomId } = use(params)
  const searchParams = useSearchParams()
  const initialUsername = searchParams.get('username') || "User"

  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageInput, setMessageInput] = useState("")
  const [username, setUsername] = useState(initialUsername)
  const [userCount, setUserCount] = useState(0)
  const [roomName, setRoomName] = useState("")
  const [uploading, setUploading] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Initialize socket connection to Python backend with better mobile support
    const newSocket = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      autoConnect: true
    })
    setSocket(newSocket)

    // Fetch room info
    fetch(`/api/room/${roomId}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          window.location.href = "/"
        } else {
          setRoomName(data.name)
        }
      })
      .catch(() => {
        window.location.href = "/"
      })

    // Socket event listeners
    newSocket.on('connect', () => {
      setConnected(true)
      newSocket.emit('join', { room: roomId, username })
    })

    newSocket.on('disconnect', () => {
      setConnected(false)
    })

    newSocket.on('join_success', () => {
      console.log('Joined room successfully')
    })

    newSocket.on('username_taken', (data) => {
      const newUsername = prompt(data.message)
      if (newUsername) {
        setUsername(newUsername)
        newSocket.emit('join', { room: roomId, username: newUsername })
      } else {
        window.location.href = "/"
      }
    })

    newSocket.on('error', (data) => {
      alert('Error: ' + data.message)
      window.location.href = "/"
    })

    newSocket.on('message', (data) => {
      const message: Message = {
        ...data,
        id: Math.random().toString(36).substr(2, 9),
        own: false // Will be determined dynamically during render
      }
      setMessages(prev => [...prev, message])
    })

    newSocket.on('message_history', (history: Message[]) => {
      setMessages(history.map(msg => ({
        ...msg,
        id: Math.random().toString(36).substr(2, 9),
        own: false // Will be determined dynamically during render
      })))
    })

    newSocket.on('user_joined', (data) => {
      setUserCount(data.user_count)
      setMessages(prev => [...prev, {
        id: Math.random().toString(36).substr(2, 9),
        username: "System",
        message: `${data.username} joined the room`,
        timestamp: new Date().toISOString(),
        type: "text",
        own: false
      }])
    })

    newSocket.on('user_left', (data) => {
      setUserCount(data.user_count)
    })

    return () => {
      newSocket.emit('leave', { room: roomId })
      newSocket.close()
    }
  }, [roomId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const sendMessage = () => {
    if (messageInput.trim() && socket && connected) {
      socket.emit('message', {
        room: roomId,
        username,
        message: messageInput.trim()
      })
      setMessageInput("")
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)

    for (const file of files) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('room_id', roomId)

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })

        const data = await response.json()

        if (response.ok && socket) {
          socket.emit('file_shared', {
            room: roomId,
            username,
            file_info: data
          })
        }
      } catch (error) {
        console.error('Upload failed:', error)
      }
    }

    setUploading(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleUsernameChange = (newUsername: string) => {
    setUsername(newUsername)
    if (socket && connected) {
      socket.emit('leave', { room: roomId })
      socket.emit('join', { room: roomId, username: newUsername })
    }
  }

  const leaveRoom = () => {
    window.location.href = "/"
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

  return (
    <div className="h-screen bg-background/80 backdrop-blur-xl">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-10 p-4">
        <Card className="glassmorphism-solid border-white/20 shadow-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">{userCount} users</span>
                </div>
                <div className="h-6 w-px bg-border/50" />
                <div className="flex items-center gap-2">
                  <Label htmlFor="username" className="text-sm font-medium">Username:</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    className="w-32 h-8 text-sm bg-white/10 border-white/20"
                  />
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={leaveRoom}
                className="gap-2 bg-red-500/20 hover:bg-red-500/30 border-red-500/30"
              >
                <LogOut className="h-4 w-4" />
                Leave Room
              </Button>
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
                      {!isOwnMessage && (
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
                          <div className="flex items-center gap-2">
                            {getFileIcon(message.file_info?.original_name || "")}
                            <a
                              href={message.file_info?.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={cn(
                                "hover:underline flex items-center gap-2",
                                message.own ? "text-primary-foreground" : "text-foreground"
                              )}
                            >
                              <span className="text-sm">{message.file_info?.original_name}</span>
                              <Download className="h-3 w-3" />
                            </a>
                          </div>
                        ) : (
                          <p className="text-sm">{message.message}</p>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTime(message.timestamp)}
                      </p>
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
                onChange={handleFileUpload}
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
    </div>
  )
}