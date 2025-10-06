import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder()

  // Create a readable stream
  const readable = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const data = `data: ${JSON.stringify({ type: 'connected' })}\n\n`
      controller.enqueue(encoder.encode(data))

      // Keep connection alive with periodic pings
      const interval = setInterval(() => {
        const ping = `data: ${JSON.stringify({ type: 'ping' })}\n\n`
        controller.enqueue(encoder.encode(ping))
      }, 30000) // Send ping every 30 seconds

      // Clean up on disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(interval)
        controller.close()
      })
    }
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}