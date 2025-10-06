import sqlite3 from 'sqlite3'
import { Database, open } from 'sqlite'
import { promisify } from 'util'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'

export interface User {
  id: string
  username: string
  email?: string
  password?: string
  accessToken: string
  isTemporary: boolean
  deviceId?: string
  lastLogin: string
  createdAt: string
}

export interface AuthResult {
  success: boolean
  user?: User
  error?: string
  needsDeviceVerification?: boolean
}

export class UserDatabase {
  private db: Database | null = null
  private dbPath: string

  constructor() {
    this.dbPath = path.join(process.cwd(), 'data', 'users.db')
    this.initDatabase()
  }

  private async initDatabase() {
    try {
      this.db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database
      })

      // Create users table
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE,
          password TEXT,
          accessToken TEXT UNIQUE NOT NULL,
          isTemporary INTEGER NOT NULL DEFAULT 0,
          deviceId TEXT,
          lastLogin TEXT,
          createdAt TEXT NOT NULL
        )
      `)

      console.log('User database initialized')
    } catch (error) {
      console.error('Failed to initialize database:', error)
    }
  }

  async generateAccessToken(): Promise<string> {
    return uuidv4()
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10
    return bcrypt.hash(password, saltRounds)
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }

  async createTemporaryUser(username: string, deviceId?: string): Promise<AuthResult> {
    try {
      // Check if username already exists
      const existingUser = await this.getUserByUsername(username)
      if (existingUser) {
        if (existingUser.isTemporary) {
          // Check if it's the same device
          if (existingUser.deviceId === deviceId) {
            return { success: true, user: existingUser }
          } else {
            return {
              success: false,
              error: 'Username already exists on another device',
              needsDeviceVerification: true
            }
          }
        } else {
          return { success: false, error: 'Username already exists (permanent account)' }
        }
      }

      const accessToken = await this.generateAccessToken()
      const hashedPassword = await this.hashPassword(accessToken)

      const user: User = {
        id: uuidv4(),
        username: username.trim(),
        accessToken: hashedPassword,
        isTemporary: true,
        deviceId: deviceId || uuidv4(),
        lastLogin: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }

      await this.db!.run(`
        INSERT INTO users (id, username, accessToken, isTemporary, deviceId, lastLogin, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [user.id, user.username, user.accessToken, user.isTemporary ? 1 : 0, user.deviceId, user.lastLogin, user.createdAt])

      return { success: true, user }
    } catch (error) {
      console.error('Failed to create temporary user:', error)
      return { success: false, error: 'Failed to create user' }
    }
  }

  async createPermanentUser(username: string, password: string, email?: string): Promise<AuthResult> {
    try {
      // Check if username or email already exists
      const existingUser = await this.getUserByUsername(username)
      if (existingUser) {
        return { success: false, error: 'Username already exists' }
      }

      if (email) {
        const existingEmail = await this.getUserByEmail(email)
        if (existingEmail) {
          return { success: false, error: 'Email already exists' }
        }
      }

      const accessToken = await this.generateAccessToken()
      const hashedPassword = await this.hashPassword(password)

      const user: User = {
        id: uuidv4(),
        username: username.trim(),
        email: email?.trim(),
        password: hashedPassword,
        accessToken: hashedPassword,
        isTemporary: false,
        lastLogin: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }

      await this.db!.run(`
        INSERT INTO users (id, username, email, password, accessToken, isTemporary, lastLogin, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [user.id, user.username, user.email, user.password, user.accessToken, user.isTemporary ? 1 : 0, user.lastLogin, user.createdAt])

      return { success: true, user }
    } catch (error) {
      console.error('Failed to create permanent user:', error)
      return { success: false, error: 'Failed to create user' }
    }
  }

  async authenticateUser(username: string, password: string): Promise<AuthResult> {
    try {
      const user = await this.getUserByUsername(username)
      if (!user) {
        return { success: false, error: 'User not found' }
      }

      const isPasswordValid = await this.verifyPassword(password, user.accessToken)
      if (!isPasswordValid) {
        return { success: false, error: 'Invalid credentials' }
      }

      // Update last login
      await this.updateLastLogin(user.id)

      return { success: true, user }
    } catch (error) {
      console.error('Failed to authenticate user:', error)
      return { success: false, error: 'Authentication failed' }
    }
  }

  async getUserByAccessToken(accessToken: string): Promise<User | null> {
    try {
      const user = await this.db!.get('SELECT * FROM users WHERE accessToken = ?', [accessToken])
      return user || null
    } catch (error) {
      console.error('Failed to get user by access token:', error)
      return null
    }
  }

  async getUserByUsername(username: string): Promise<User | null> {
    try {
      const user = await this.db!.get('SELECT * FROM users WHERE username = ?', [username])
      return user || null
    } catch (error) {
      console.error('Failed to get user by username:', error)
      return null
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const user = await this.db!.get('SELECT * FROM users WHERE email = ?', [email])
      return user || null
    } catch (error) {
      console.error('Failed to get user by email:', error)
      return null
    }
  }

  async updateLastLogin(userId: string): Promise<void> {
    try {
      await this.db!.run('UPDATE users SET lastLogin = ? WHERE id = ?', [new Date().toISOString(), userId])
    } catch (error) {
      console.error('Failed to update last login:', error)
    }
  }

  async logoutUser(accessToken: string): Promise<boolean> {
    try {
      // For temporary users, we might want to delete the account or mark as inactive
      const user = await this.getUserByAccessToken(accessToken)
      if (user && user.isTemporary) {
        await this.db!.run('DELETE FROM users WHERE id = ?', [user.id])
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to logout user:', error)
      return false
    }
  }

  async convertTemporaryToPermanent(userId: string, email: string, password: string): Promise<AuthResult> {
    try {
      const user = await this.db!.get('SELECT * FROM users WHERE id = ?', [userId])
      if (!user) {
        return { success: false, error: 'User not found' }
      }

      if (!user.isTemporary) {
        return { success: false, error: 'User is already permanent' }
      }

      // Check if email already exists
      const existingEmail = await this.getUserByEmail(email)
      if (existingEmail) {
        return { success: false, error: 'Email already exists' }
      }

      const hashedPassword = await this.hashPassword(password)

      await this.db!.run(`
        UPDATE users SET
          email = ?,
          password = ?,
          isTemporary = 0,
          accessToken = ?
        WHERE id = ?
      `, [email, hashedPassword, hashedPassword, userId])

      const updatedUser = await this.db!.get('SELECT * FROM users WHERE id = ?', [userId])
      return { success: true, user: updatedUser }
    } catch (error) {
      console.error('Failed to convert user to permanent:', error)
      return { success: false, error: 'Failed to convert account' }
    }
  }

  async deleteUser(userId: string): Promise<boolean> {
    try {
      const result = await this.db!.run('DELETE FROM users WHERE id = ?', [userId])
      return result.changes > 0
    } catch (error) {
      console.error('Failed to delete user:', error)
      return false
    }
  }
}

// Singleton instance
export const userDatabase = new UserDatabase()