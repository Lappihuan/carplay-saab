<script setup lang="ts">
import { ref, onMounted, onUnmounted, useTemplateRef, computed, watch } from 'vue'
import { useStatusStore } from '../stores/carplayStore'
import type { ExtraConfig } from '../../../shared/types'

interface Props {
  receivingVideo: boolean
  settings: ExtraConfig | null
  command: string
  commandCounter: number
}

interface Emits {
  (e: 'update:receivingVideo', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const statusStore = useStatusStore()

const mainElemRef = useTemplateRef<HTMLDivElement>('mainElem')
const canvasRef = useTemplateRef<HTMLCanvasElement>('canvas')

const isLoading = ref(true)
const carplayWorker = ref<Worker | null>(null)
const isCarplayRunning = ref(false)

const width = computed(() => window.innerWidth)
const height = computed(() => window.innerHeight)

const RETRY_DELAY_MS = 5000
const retryTimeoutRef = ref<NodeJS.Timeout | null>(null)

// Listen for key commands from props
watch(
  () => props.commandCounter,
  () => {
    if (props.command && window.electron?.ipcRenderer) {
      window.electron.ipcRenderer.send('carplay:key', props.command)
    }
  }
)

// Watch for settings to be available and start CarPlay
watch(
  () => props.settings,
  (newSettings) => {
    if (newSettings && !isCarplayRunning.value && !isLoading.value) {
      // Settings are ready, we can try to start
      console.log('Settings loaded, attempting to start CarPlay')
      startCarplay()
    }
  }
)

// Initialize CarPlay
const startCarplay = () => {
  if (isCarplayRunning.value || !props.settings || !window.electron?.ipcRenderer) return

  isLoading.value = true
  isCarplayRunning.value = true

  const config = {
    fps: props.settings.fps || 60,
    width: props.settings.width || width.value,
    height: props.settings.height || height.value,
    iBoxVersion: props.settings.iBoxVersion || 2,
    mediaDelay: props.settings.mediaDelay || 100,
    phoneWorkMode: props.settings.phoneWorkMode || 0,
    camera: props.settings.camera,
    microphone: props.settings.microphone
  }

  // Start CarPlay in main process
  window.electron.ipcRenderer.send('carplay:start', config)
}

const stopCarplay = () => {
  if (!window.electron?.ipcRenderer) return

  window.electron.ipcRenderer.send('carplay:stop')
  isCarplayRunning.value = false
  isLoading.value = true
  emit('update:receivingVideo', false)

  clearRetryTimeout()
}

const clearRetryTimeout = () => {
  if (retryTimeoutRef.value) {
    clearTimeout(retryTimeoutRef.value)
    retryTimeoutRef.value = null
  }
}

onMounted(() => {
  if (!props.settings || !window.electron?.ipcRenderer) {
    isLoading.value = false
    return
  }

  // Initialize worker for video rendering
  carplayWorker.value = new Worker(new URL('../workers/carplay.worker.ts', import.meta.url), {
    type: 'module'
  })

  // Listen for IPC messages from main process
  window.electron.ipcRenderer.on('carplay:plugged', () => {
    console.log('Device plugged, starting CarPlay')
    statusStore.setPlugged(true)
    // Auto-start CarPlay when device is detected
    if (!isCarplayRunning.value) {
      startCarplay()
    }
  })

  window.electron.ipcRenderer.on('carplay:unplugged', () => {
    console.log('Device unplugged')
    statusStore.setPlugged(false)
    stopCarplay()
  })

  window.electron.ipcRenderer.on('carplay:failure', (_, error) => {
    console.error('CarPlay failure:', error)
    isLoading.value = false
    isCarplayRunning.value = false

    // Show error message in UI
    if (error?.message) {
      mainElemRef.value?.setAttribute('data-error', error.message)
    }

    if (retryTimeoutRef.value == null && statusStore.isPlugged) {
      console.log(`Retrying in ${RETRY_DELAY_MS}ms`)
      retryTimeoutRef.value = setTimeout(() => {
        if (!isCarplayRunning.value) {
          startCarplay()
        }
      }, RETRY_DELAY_MS)
    }
  })

  window.electron.ipcRenderer.on('carplay:video', (_, data) => {
    // Send video frame to worker for rendering
    if (carplayWorker.value && canvasRef.value) {
      carplayWorker.value.postMessage({
        type: 'video',
        payload: data
      })
    }

    if (isLoading.value) {
      isLoading.value = false
      emit('update:receivingVideo', true)
    }
  })

  window.electron.ipcRenderer.on('carplay:audio', (_, data) => {
    // Send audio to worker
    if (carplayWorker.value) {
      carplayWorker.value.postMessage({
        type: 'audio',
        payload: data
      })
    }
  })

  window.electron.ipcRenderer.on('carplay:command', (_, command) => {
    // Handle commands from phone (media controls, etc.)
    console.log('Command from phone:', command)
    // Route to appropriate handler based on command type
  })

  // Setup touch event listeners
  if (mainElemRef.value) {
    const handleTouchEvent = (event: PointerEvent) => {
      if (!window.electron?.ipcRenderer || !canvasRef.value) return

      const rect = canvasRef.value.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      let type = 0
      if (event.type === 'pointerdown') type = 1
      else if (event.type === 'pointermove') type = 2
      else if (event.type === 'pointerup') type = 0

      window.electron.ipcRenderer.send('carplay:touch', {
        type,
        x: Math.round(x),
        y: Math.round(y)
      })
    }

    mainElemRef.value.addEventListener('pointerdown', handleTouchEvent)
    mainElemRef.value.addEventListener('pointermove', handleTouchEvent)
    mainElemRef.value.addEventListener('pointerup', handleTouchEvent)
    mainElemRef.value.addEventListener('pointercancel', handleTouchEvent)
  }
})

onUnmounted(() => {
  stopCarplay()
  carplayWorker.value?.terminate()
  carplayWorker.value = null
})
</script>

<template>
  <div
    ref="mainElemRef"
    class="carplay-container"
    :style="{ height: '100%', width: '100%', padding: 0, margin: 0 }"
  >
    <div v-if="isLoading && !receivingVideo" class="loading-overlay">
      <v-card class="loading-card">
        <v-card-text>
          <v-progress-circular indeterminate color="primary" class="mb-4" />
          <p v-if="!statusStore.isPlugged">Searching For iPhone...</p>
          <p v-else>Initializing CarPlay...</p>
          <p v-if="mainElemRef?.getAttribute('data-error')" class="error-text">
            {{ mainElemRef?.getAttribute('data-error') }}
          </p>
        </v-card-text>
        <v-card-actions v-if="!statusStore.isPlugged || mainElemRef?.getAttribute('data-error')">
          <v-spacer />
          <v-btn @click="startCarplay">Retry</v-btn>
        </v-card-actions>
      </v-card>
    </div>

    <canvas
      v-show="receivingVideo"
      ref="canvas"
      id="video"
      class="carplay-canvas"
      style="width: 100%; height: 100%"
    />
  </div>
</template>

<style scoped>
.carplay-container {
  position: relative;
  overflow: hidden;
  touch-action: none;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.loading-overlay {
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f5f5;
  z-index: 10;
}

.loading-card {
  text-align: center;
  max-width: 400px;
}

.error-text {
  color: #d32f2f;
  font-size: 12px;
  margin-top: 12px;
  word-break: break-word;
}

.carplay-canvas {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
