/**
 * CarPlay Worker - Message bridge between renderer and main process
 * The actual CarPlay protocol runs in the main process via node-carplay/node
 * This worker handles video rendering and touch/key event distribution
 */

// Message types for communication
export interface CarplayMessage {
  type:
    | 'start'
    | 'stop'
    | 'touch'
    | 'key'
    | 'plugged'
    | 'unplugged'
    | 'video'
    | 'audio'
    | 'command'
    | 'failure'
  payload?: any
}

// Store canvas reference for rendering
let canvas: OffscreenCanvas | null = null
let videoDecoder: VideoDecoder | null = null

// Handle messages from the main renderer thread
self.onmessage = async (event: MessageEvent<CarplayMessage>) => {
  const { type, payload } = event.data

  switch (type) {
    case 'start':
      console.log('[Worker] CarPlay starting with config:', payload)
      // Renderer will send start signal, worker relays to IPC
      break

    case 'stop':
      console.log('[Worker] CarPlay stopping')
      cleanupDecoder()
      break

    case 'touch':
      // Touch events are forwarded by renderer to IPC directly
      break

    case 'key':
      // Key events are forwarded by renderer to IPC directly
      break

    case 'video':
      // Receive video frame from main process
      if (payload && payload.buffer) {
        await handleVideoFrame(payload)
      }
      break

    case 'audio':
      // Receive audio data from main process
      if (payload && payload.buffer) {
        handleAudioFrame(payload)
      }
      break

    case 'plugged':
      console.log('[Worker] Device plugged')
      break

    case 'unplugged':
      console.log('[Worker] Device unplugged')
      cleanupDecoder()
      break

    case 'failure':
      console.error('[Worker] CarPlay failure:', payload)
      cleanupDecoder()
      break

    default:
      console.warn('[Worker] Unknown message type:', type)
  }
}

// Initialize video decoder
const initializeDecoder = async () => {
  if (videoDecoder) return

  try {
    videoDecoder = new VideoDecoder({
      output: (frame: VideoFrame) => {
        renderFrame(frame)
        frame.close()
      },
      error: (error: DOMException) => {
        console.error('[Worker] VideoDecoder error:', error)
      }
    })

    // Configure for H.264
    const codecConfig = {
      codec: 'avc1.42001f',
      width: 1920,
      height: 1080
    }

    await videoDecoder.configure(codecConfig)
  } catch (error) {
    console.error('[Worker] Failed to initialize VideoDecoder:', error)
  }
}

// Handle incoming video frames
const handleVideoFrame = async (data: { buffer: number[]; width: number; height: number }) => {
  await initializeDecoder()

  if (!videoDecoder) return

  try {
    // Convert buffer array back to Uint8Array
    const frameData = new Uint8Array(data.buffer)

    // Create encoded video chunk
    const chunk = new EncodedVideoChunk({
      type: 'key', // Assume key frames for now
      timestamp: Date.now() * 1000,
      duration: 1000000 / 30, // 30fps
      data: frameData
    })

    videoDecoder.decode(chunk)
  } catch (error) {
    console.error('[Worker] Error processing video frame:', error)
  }
}

// Render video frame to canvas
const renderFrame = (frame: VideoFrame) => {
  if (!canvas) {
    // Canvas will be set up on first frame
    return
  }

  try {
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(frame as any, 0, 0)
    }
  } catch (error) {
    console.error('[Worker] Error rendering frame:', error)
  }
}

// Handle audio frame
const handleAudioFrame = (data: { buffer: number[]; sampleRate: number }) => {
  // Audio processing would happen here
  // For now, just acknowledge receipt
  console.log('[Worker] Audio frame received, samples:', data.buffer.length)
}

// Set canvas reference (called from main thread with Transferable)
export const setCanvas = (offscreenCanvas: OffscreenCanvas) => {
  canvas = offscreenCanvas
}

// Cleanup
const cleanupDecoder = () => {
  if (videoDecoder) {
    videoDecoder.close()
    videoDecoder = null
  }
}

export {}
