<script setup lang="ts">
import { onMounted, useTemplateRef, watch } from 'vue'
import { useCarplay } from '../composables/useCarplay'
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

const mainElemRef = useTemplateRef<HTMLDivElement>('mainElem')
const { carplayWorker, deviceFound, isLoading, initializeCarplay, checkDevice, requestDevice } =
  useCarplay(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mainElemRef as any,
    (value) => emit('update:receivingVideo', value),
    props.settings
  )

onMounted(async () => {
  console.log('[Carplay] onMounted')
  await initializeCarplay()
})

watch(
  () => props.settings,
  (newSettings) => {
    if (newSettings && !deviceFound.value) {
      console.log('[Carplay] Settings loaded, starting device search')
      checkDevice(false, startCarplayWithDevice as unknown as (device: unknown) => Promise<void>)
    }
  }
)

const startCarplayWithDevice = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  device: Record<string, any>
): Promise<void> => {
  console.log('[Carplay] Starting CarPlay with device:', device)
  if (!carplayWorker.value || !props.settings) {
    console.error('[Carplay] Cannot start: worker or settings missing')
    return
  }

  emit('update:receivingVideo', true)

  const config = {
    fps: props.settings.fps,
    width: window.innerWidth,
    height: window.innerHeight,
    mediaDelay: props.settings.mediaDelay,
    camera: Boolean(props.settings.camera),
    microphone: Boolean(props.settings.microphone)
  }

  carplayWorker.value.postMessage({
    type: 'start',
    payload: { config, device }
  })
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
            <v-btn @click="requestDevice">Request Device</v-btn>
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
      id="video"
      ref="canvas"
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
