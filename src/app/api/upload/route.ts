import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { dataStore } from '@/lib/data-store'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const room_id = formData.get('room_id') as string
    const username = formData.get('username') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!room_id) {
      return NextResponse.json(
        { error: 'Room ID is required' },
        { status: 400 }
      )
    }

    // Check if room exists
    const room = dataStore.getRoom(room_id)
    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      )
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads')
    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch (error) {
      // Directory might already exist
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()
    const uniqueFilename = `${uuidv4()}.${fileExtension}`
    const filePath = join(uploadsDir, uniqueFilename)

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Store file info in data store
    const fileInfo = {
      original_name: file.name,
      filename: uniqueFilename,
      url: `/uploads/${uniqueFilename}`,
      size: file.size,
      upload_time: new Date().toISOString(),
      room_id,
      username: username || 'Anonymous'
    }

    dataStore.addFile(fileInfo)

    // Add file message to room
    dataStore.addMessage({
      room_id,
      username: username || 'Anonymous',
      message: `分享了文件: ${file.name}`,
      type: 'file',
      file_info: {
        original_name: file.name,
        url: `/uploads/${uniqueFilename}`,
        size: file.size,
        filename: uniqueFilename
      }
    })

    return NextResponse.json({
      message: 'File uploaded successfully',
      file: fileInfo
    })
  } catch (error) {
    console.error('Failed to upload file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}