import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

// 数据类型定义
export interface Room {
  id: string
  name: string
  has_password: boolean
  password?: string
  created_at: string
  user_count: number
}

export interface User {
  username: string
  session_id: string
  room_id: string
  room_name: string
  joined_at: string
  last_activity: string
}

export interface Message {
  id: string
  room_id: string
  username: string
  message: string
  timestamp: string
  type: 'text' | 'file' | 'notification'
  file_info?: {
    original_name: string
    url: string
    size?: number
    filename: string
  }
}

export interface FileInfo {
  original_name: string
  url: string
  filename: string
  size?: number
  upload_time: string
  room_id: string
  username: string
}

// 持久化数据存储
class DataStore {
  private rooms: Map<string, Room> = new Map()
  private roomUsers: Map<string, User[]> = new Map()
  private roomMessages: Map<string, Message[]> = new Map()
  private uploadedFiles: Map<string, FileInfo> = new Map()
  private userSessions: Map<string, User> = new Map()
  private dataDir: string

  constructor() {
    this.dataDir = join(process.cwd(), 'data')
    this.ensureDataDirectory()
    this.loadData()
    this.initializeDefaultRoom()
    this.startUserCleanup()
  }

  private ensureDataDirectory() {
    if (!existsSync(this.dataDir)) {
      mkdirSync(this.dataDir, { recursive: true })
    }
  }

  private loadData() {
    try {
      // Load rooms
      if (existsSync(join(this.dataDir, 'rooms.json'))) {
        const roomsData = readFileSync(join(this.dataDir, 'rooms.json'), 'utf-8')
        const roomsArray = JSON.parse(roomsData)
        this.rooms = new Map(roomsArray.map((room: Room) => [room.id, room]))
      }

      // Load messages
      if (existsSync(join(this.dataDir, 'messages.json'))) {
        const messagesData = readFileSync(join(this.dataDir, 'messages.json'), 'utf-8')
        const messagesArray = JSON.parse(messagesData)
        this.roomMessages = new Map(messagesArray.map((item: { roomId: string, messages: Message[] }) => [item.roomId, item.messages]))
      }

      // Load files
      if (existsSync(join(this.dataDir, 'files.json'))) {
        const filesData = readFileSync(join(this.dataDir, 'files.json'), 'utf-8')
        const filesArray = JSON.parse(filesData)
        this.uploadedFiles = new Map(filesArray.map((file: FileInfo) => [file.filename, file]))
      }
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  private saveData() {
    try {
      // Save rooms
      const roomsArray = Array.from(this.rooms.values())
      writeFileSync(join(this.dataDir, 'rooms.json'), JSON.stringify(roomsArray, null, 2))

      // Save messages
      const messagesArray = Array.from(this.roomMessages.entries()).map(([roomId, messages]) => ({ roomId, messages }))
      writeFileSync(join(this.dataDir, 'messages.json'), JSON.stringify(messagesArray, null, 2))

      // Save files
      const filesArray = Array.from(this.uploadedFiles.values())
      writeFileSync(join(this.dataDir, 'files.json'), JSON.stringify(filesArray, null, 2))
    } catch (error) {
      console.error('Error saving data:', error)
    }
  }

  private initializeDefaultRoom() {
    // 只在默认房间不存在时创建
    if (!this.rooms.has('default-room')) {
      const defaultRoom: Room = {
        id: 'default-room',
        name: '公共聊天室',
        has_password: false,
        created_at: new Date().toISOString(),
        user_count: 0
      }
      this.rooms.set(defaultRoom.id, defaultRoom)
      this.roomUsers.set(defaultRoom.id, [])
      this.roomMessages.set(defaultRoom.id, [])
      this.saveData() // Save default room
    }
  }

  // 房间管理
  createRoom(name: string, password?: string): Room {
    const id = this.generateRoomId()
    const room: Room = {
      id,
      name: name.trim(),
      has_password: !!password,
      password,
      created_at: new Date().toISOString(),
      user_count: 0
    }
    this.rooms.set(id, room)
    this.roomUsers.set(id, [])
    this.roomMessages.set(id, [])
    this.saveData() // Save after creating room
    return room
  }

  getRoom(id: string): Room | null {
    return this.rooms.get(id) || null
  }

  getAllRooms(): Room[] {
    return Array.from(this.rooms.values()).map(room => ({
      ...room,
      user_count: this.roomUsers.get(room.id)?.length || 0
    }))
  }

  // 用户管理
  addUserToRoom(roomId: string, user: Omit<User, 'room_name' | 'joined_at' | 'last_activity'>): User {
    const room = this.getRoom(roomId)
    if (!room) {
      throw new Error('房间不存在')
    }

    const now = new Date().toISOString()
    const fullUser: User = {
      ...user,
      room_name: room.name,
      joined_at: now,
      last_activity: now
    }

    const users = this.roomUsers.get(roomId) || []
    users.push(fullUser)
    this.roomUsers.set(roomId, users)
    this.userSessions.set(user.session_id, fullUser)

    return fullUser
  }

  updateUserActivity(sessionId: string): void {
    const user = this.userSessions.get(sessionId)
    if (user) {
      user.last_activity = new Date().toISOString()
      this.userSessions.set(sessionId, user)

      // Update in room users as well
      const roomUsers = this.roomUsers.get(user.room_id) || []
      const userIndex = roomUsers.findIndex(u => u.session_id === sessionId)
      if (userIndex !== -1) {
        roomUsers[userIndex].last_activity = new Date().toISOString()
        this.roomUsers.set(user.room_id, roomUsers)
      }
    }
  }

  cleanupInactiveUsers(): void {
    const now = new Date()
    const inactiveThreshold = 5 * 60 * 1000 // 5 minutes in milliseconds

    for (const [sessionId, user] of this.userSessions.entries()) {
      const lastActivity = new Date(user.last_activity)
      const timeDiff = now.getTime() - lastActivity.getTime()

      if (timeDiff > inactiveThreshold) {
        this.removeUserFromRoom(sessionId)
        console.log(`Removed inactive user: ${user.username}`)
      }
    }
  }

  private startUserCleanup(): void {
    // Run cleanup every 2 minutes
    setInterval(() => {
      this.cleanupInactiveUsers()
    }, 2 * 60 * 1000)
  }

  removeUserFromRoom(sessionId: string): User | null {
    const user = this.userSessions.get(sessionId)
    if (!user) return null

    const users = this.roomUsers.get(user.room_id) || []
    const filteredUsers = users.filter(u => u.session_id !== sessionId)
    this.roomUsers.set(user.room_id, filteredUsers)
    this.userSessions.delete(sessionId)

    return user
  }

  getRoomUsers(roomId: string): User[] {
    return this.roomUsers.get(roomId) || []
  }

  getOnlineUsers(): User[] {
    return Array.from(this.userSessions.values())
  }

  getUserBySession(sessionId: string): User | null {
    return this.userSessions.get(sessionId) || null
  }

  isUsernameTaken(username: string): boolean {
    const users = this.getOnlineUsers()
    return users.some(user =>
      user.username.toLowerCase() === username.trim().toLowerCase()
    )
  }

  // 消息管理
  addMessage(message: Omit<Message, 'id' | 'timestamp'>): Message {
    const id = this.generateMessageId()
    const fullMessage: Message = {
      ...message,
      id,
      timestamp: new Date().toISOString()
    }

    const messages = this.roomMessages.get(message.room_id) || []
    messages.push(fullMessage)
    this.roomMessages.set(message.room_id, messages)
    this.saveData() // Save after adding message

    return fullMessage
  }

  getRoomMessages(roomId: string): Message[] {
    return this.roomMessages.get(roomId) || []
  }

  // 文件管理
  addFile(fileInfo: FileInfo): void {
    this.uploadedFiles.set(fileInfo.filename, fileInfo)
    this.saveData() // Save after adding file
  }

  getFile(filename: string): FileInfo | null {
    return this.uploadedFiles.get(filename) || null
  }

  getRoomFiles(roomId: string): FileInfo[] {
    return Array.from(this.uploadedFiles.values()).filter(file =>
      file.room_id === roomId
    )
  }

  // 工具方法
  private generateRoomId(): string {
    return Math.random().toString(36).substring(2, 15)
  }

  private generateMessageId(): string {
    return Math.random().toString(36).substring(2, 15) + Date.now()
  }
}

// 单例实例
export const dataStore = new DataStore()
export default dataStore