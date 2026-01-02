<script setup lang="ts">
import { ref, onMounted, useTemplateRef, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useStatusStore } from '../stores/carplayStore'
import { findDevice, requestDevice, CommandMapping } from 'node-carplay/web'
import { useCarplayAudio } from '../composables/useCarplayAudio'
import { useCarplayTouch } from '../composables/useCarplayTouch'
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

const router = useRouter()
const statusStore = useStatusStore()

const mainElemRef = useTemplateRef<HTMLDivElement>('mainElem')

const deviceFound = ref(false)
const isLoading = ref(false)
const carplayWorker = ref<Worker | null>(null)

const width = computed(() => window.innerWidth)
const height = computed(() => window.innerHeight)

const RETRY_DELAY_MS = 15000
const retryTimeoutRef = ref<NodeJS.Timeout | null>(null)

onMounted(async () => {
  if (!props.settings) return

  // Initialize carplay worker
  carplayWorker.value = new Worker(new URL('../workers/carplay.worker.ts', import.meta.url), {
    type: 'module'
  })

  const { processAudio, getAudioPlayer, startRecording, stopRecording } = useCarplayAudio(
    carplayWorker.value
  )
  const { sendTouchEvent } = useCarplayTouch(carplayWorker.value)

  // Setup worker messages
  carplayWorker.value.onmessage = (ev) => {
    const { type } = ev.data
    switch (type) {
      case 'plugged':
        statusStore.setPlugged(true)
        if (props.settings?.piMost && props.settings?.most?.stream) {
          console.log('setting most stream')
        }
        break
      case 'unplugged':
        statusStore.setPlugged(false)
        break
      case 'requestBuffer':
        clearRetryTimeout()
        emit('update:receivingVideo', true)
        break
      case 'audioPlayer':
        getAudioPlayer(ev.data.message)
        break
      case 'audio':
        clearRetryTimeout()
        processAudio(ev.data.message)
        break
      case 'command':
        const {
          message: { value }
        } = ev.data
        switch (value) {
          case CommandMapping.startRecordAudio:
            startRecording()
            break
          case CommandMapping.stopRecordAudio:
            stopRecording()
            break
          case CommandMapping.requestHostUI:
            router.push('/settings')
        }
        break
      case 'failure':
        if (retryTimeoutRef.value == null) {
          console.error(`Carplay initialization failed -- Reloading page in ${RETRY_DELAY_MS}ms`)
          retryTimeoutRef.value = setTimeout(() => {
            window.location.reload()
          }, RETRY_DELAY_MS)
        }
        break
    }
  }

  // Setup resize observer
  const element = mainElemRef.value
  if (element) {
    const observer = new ResizeObserver(() => {
      carplayWorker.value?.postMessage({ type: 'frame' })
    })
    observer.observe(element)
  }

  // Check for device
  await checkDevice()

  // Store touch handler
  mainElemRef.value?.addEventListener('pointerdown', sendTouchEvent)
  mainElemRef.value?.addEventListener('pointermove', sendTouchEvent)
  mainElemRef.value?.addEventListener('pointerup', sendTouchEvent)
  mainElemRef.value?.addEventListener('pointercancel', sendTouchEvent)
  mainElemRef.value?.addEventListener('pointerout', sendTouchEvent)
})

const checkDevice = async (request: boolean = false) => {
  isLoading.value = true
  try {
    const device = request ? await requestDevice() : await findDevice()
    if (device) {
      deviceFound.value = true
      emit('update:receivingVideo', true)
      startCarplay()
    }
  } catch (error) {
    console.error('Device check failed:', error)
    setTimeout(() => checkDevice(), 5000)
  } finally {
    isLoading.value = false
  }
}

const startCarplay = () => {
  if (!carplayWorker.value || !props.settings) return

  const config = {
    fps: props.settings.fps,
    width: width.value,
    height: height.value,
    mediaDelay: props.settings.mediaDelay,
    camera: props.settings.camera,
    microphone: props.settings.microphone
  }

  carplayWorker.value.postMessage({
    type: 'start',
    payload: { config }
  })
}

const clearRetryTimeout = () => {
  if (retryTimeoutRef.value) {
    clearTimeout(retryTimeoutRef.value)
    retryTimeoutRef.value = null
  }
}
</script>

<template>
  <div
    ref="mainElemRef"
    class="carplay-container"
    :style="{ height: '100%', width: '100%', padding: 0, margin: 0 }"
  >
    <div v-if="(deviceFound === false || isLoading) && !receivingVideo" class="loading-overlay">
      <div v-if="deviceFound === false">
        <v-card class="loading-card">
          <v-card-text>
            <v-progress-circular indeterminate color="primary" class="mb-4" />
            <p>Searching For Phone</p>
          </v-card-text>
          <v-card-actions>
            <v-btn @click="checkDevice(true)">Request Device</v-btn>
          </v-card-actions>
        </v-card>
      </div>
      <div v-if="deviceFound && isLoading">
        <v-card class="loading-card">
          <v-card-text>
            <v-progress-circular indeterminate color="primary" class="mb-4" />
            <p>Initializing CarPlay</p>
          </v-card-text>
        </v-card>
      </div>
    </div>

    <canvas
      v-show="receivingVideo"
      ref="canvas"
      id="video"
      class="carplay-canvas"
      style="width: 100%; height: 100%; display: flex"
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
}

.carplay-canvas {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
