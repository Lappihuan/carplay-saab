import { ref, type Ref } from 'vue'
import { findDevice, requestDevice, CommandMapping } from 'node-carplay/web'
import { useRouter } from 'vue-router'
import { useStatusStore } from '../stores/carplayStore'
import { useCarplayAudio } from './useCarplayAudio'
import { useCarplayTouch } from './useCarplayTouch'
import type { ExtraConfig } from '../../../shared/types'

const DEVICE_SEARCH_RETRY_DELAY_MS = 5000
const RETRY_DELAY_MS = 15000

export interface UseCarplayReturn {
  carplayWorker: Ref<Worker | null>
  deviceFound: Ref<boolean>
  isLoading: Ref<boolean>
  initializeCarplay: () => Promise<void>
  checkDevice: (
    request: boolean,
    onDeviceFound?: (device: unknown) => Promise<void>
  ) => Promise<unknown>
  requestDevice: () => Promise<void>
}

export const useCarplay = (
  mainElemRef: Ref<HTMLDivElement | undefined>,
  onReceivingVideo: (value: boolean) => void,
  settings: ExtraConfig | null
): UseCarplayReturn => {
  const router = useRouter()
  const statusStore = useStatusStore()

  const carplayWorker = ref<Worker | null>(null)
  const deviceFound = ref(false)
  const isLoading = ref(false)
  const retryTimeoutRef = ref<NodeJS.Timeout | null>(null)

  // ============ Worker Initialization ============
  const initializeWorker = async (): Promise<Worker> => {
    console.log('[Carplay] Creating worker...')
    const workerUrl = new URL('../workers/carplay.worker.ts', import.meta.url)
    carplayWorker.value = new Worker(workerUrl, { type: 'module' })
    console.log('[Carplay] Worker created')
    return carplayWorker.value
  }

  // ============ Device Detection ============
  const checkDevice = async (
    request: boolean = false,
    onDeviceFound?: (device: unknown) => Promise<void>
  ): Promise<unknown> => {
    isLoading.value = true
    console.log('[Carplay] Checking for device...', { request })
    try {
      const device = request ? await requestDevice() : await findDevice()
      console.log('[Carplay] Device check result:', { device })

      if (device) {
        console.log('[Carplay] Device found!')
        deviceFound.value = true
        if (onDeviceFound) {
          await onDeviceFound(device)
        }
        return device
      } else {
        if (!request) {
          console.log('[Carplay] No device found, will retry in 5s')
          setTimeout(() => checkDevice(false, onDeviceFound), DEVICE_SEARCH_RETRY_DELAY_MS)
        } else {
          console.log('[Carplay] User cancelled device request')
          deviceFound.value = false
        }
        return null
      }
    } catch (error) {
      console.error('[Carplay] Device check failed:', error)
      if (!request) {
        setTimeout(() => checkDevice(false, onDeviceFound), DEVICE_SEARCH_RETRY_DELAY_MS)
      }
      return null
    } finally {
      isLoading.value = false
    }
  }

  const requestDeviceWrapper = async (): Promise<void> => {
    await checkDevice(true)
  }

  // ============ Worker Messages ============
  const setupWorkerMessages = (): void => {
    if (!carplayWorker.value) {
      console.error('[Carplay] Worker not initialized')
      return
    }

    const { processAudio, getAudioPlayer, startRecording, stopRecording } = useCarplayAudio(
      carplayWorker.value
    )
    const { sendTouchEvent } = useCarplayTouch(carplayWorker.value)

    carplayWorker.value.onmessage = (ev) => {
      console.log('[Carplay] Worker message received:', ev.data.type, ev.data)
      const { type } = ev.data

      switch (type) {
        case 'plugged':
          console.log('[Carplay] Device plugged')
          statusStore.setPlugged(true)
          break

        case 'unplugged':
          console.log('[Carplay] Device unplugged')
          statusStore.setPlugged(false)
          break

        case 'requestBuffer':
          console.log('[Carplay] Received requestBuffer')
          clearRetryTimeout()
          onReceivingVideo(true)
          break

        case 'audioPlayer':
          console.log('[Carplay] Received audioPlayer')
          getAudioPlayer(ev.data.message)
          break

        case 'audio':
          console.log('[Carplay] Received audio')
          clearRetryTimeout()
          processAudio(ev.data.message)
          break

        case 'command':
          console.log('[Carplay] Received command:', ev.data.message.value)
          handleCommand(ev.data.message.value, startRecording, stopRecording)
          break

        case 'failure':
          console.error('[Carplay] Worker reported failure')
          if (retryTimeoutRef.value == null) {
            const msg = `[Carplay] Carplay initialization failed -- Reloading page in ${RETRY_DELAY_MS}ms`
            console.error(msg)
            retryTimeoutRef.value = setTimeout(() => {
              window.location.reload()
            }, RETRY_DELAY_MS)
          }
          break
      }
    }

    setupResizeObserver()
    setupTouchListeners(sendTouchEvent)
  }

  const handleCommand = (
    command: number,
    startRecording: () => void,
    stopRecording: () => void
  ): void => {
    switch (command) {
      case CommandMapping.startRecordAudio:
        console.log('[Carplay] Start recording')
        startRecording()
        break

      case CommandMapping.stopRecordAudio:
        console.log('[Carplay] Stop recording')
        stopRecording()
        break

      case CommandMapping.requestHostUI:
        console.log('[Carplay] Request host UI, navigating to settings')
        router.push('/settings')
        break
    }
  }

  const setupResizeObserver = (): void => {
    const element = mainElemRef.value
    if (element) {
      console.log('[Carplay] Setting up resize observer')
      const observer = new ResizeObserver(() => {
        carplayWorker.value?.postMessage({ type: 'frame' })
      })
      observer.observe(element)
    } else {
      console.warn('[Carplay] mainElemRef not available')
    }
  }

  const setupTouchListeners = (sendTouchEvent: (event: PointerEvent) => void): void => {
    console.log('[Carplay] Setting up touch event listeners')
    const element = mainElemRef.value
    if (!element) {
      console.warn('[Carplay] mainElemRef not available')
      return
    }

    element.addEventListener('pointerdown', sendTouchEvent)
    element.addEventListener('pointermove', sendTouchEvent)
    element.addEventListener('pointerup', sendTouchEvent)
    element.addEventListener('pointercancel', sendTouchEvent)
    element.addEventListener('pointerout', sendTouchEvent)
  }

  const clearRetryTimeout = (): void => {
    if (retryTimeoutRef.value) {
      clearTimeout(retryTimeoutRef.value)
      retryTimeoutRef.value = null
    }
  }

  // ============ Configuration & Session ============
  // Note: config building and session setup happen in component now for clarity
  // This keeps the composable focused on coordination

  // ============ Initialization ============
  const initializeCarplay = async (): Promise<void> => {
    console.log('[Carplay] Initializing...')
    if (!settings) {
      console.warn('[Carplay] No settings provided!')
      return
    }

    await initializeWorker()
    setupWorkerMessages()
    console.log('[Carplay] Initialization complete')
  }

  return {
    carplayWorker,
    deviceFound,
    isLoading,
    initializeCarplay,
    checkDevice,
    requestDevice: requestDeviceWrapper
  }
}
