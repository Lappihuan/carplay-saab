// Render worker for video decoding and rendering
// Uses WebCodec API for H.264 decoding

let decoder: VideoDecoder | null = null
let canvas: OffscreenCanvas | null = null
let ctx: OffscreenCanvasRenderingContext2D | null = null

self.onmessage = async (event) => {
  const { type } = event.data

  switch (type) {
    case 'init':
      initializeRenderer(event.data.canvas)
      break
    case 'frame':
      if (decoder && event.data.frameData) {
        processFrame(event.data.frameData)
      }
      break
  }
}

function initializeRenderer(offscreenCanvas: OffscreenCanvas) {
  canvas = offscreenCanvas
  ctx = canvas.getContext('2d')

  // Initialize video decoder
  const config: VideoDecoderConfig = {
    codec: 'avc1.42001f', // H.264 codec
    codedHeight: 1920,
    codedWidth: 1080
  }

  decoder = new VideoDecoder({
    output: (frame) => {
      renderFrame(frame)
    },
    error: (error) => {
      console.error('Decoder error:', error)
    }
  })

  decoder.configure(config)
}

function processFrame(frameData: Uint8Array) {
  if (!decoder) return

  const chunk = new EncodedVideoChunk({
    type: 'key', // Simplified - actual implementation would detect key frames
    timestamp: Date.now() * 1000,
    duration: 33333, // ~30fps
    data: frameData
  })

  decoder.decode(chunk)
}

function renderFrame(frame: VideoFrame) {
  if (!ctx || !canvas) return

  // Create a bitmap from the frame and render to canvas
  canvas.width = frame.codedWidth
  canvas.height = frame.codedHeight

  ctx.drawImage(frame, 0, 0)
  frame.close()
}

export {}
