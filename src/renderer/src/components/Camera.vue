<script setup lang="ts">
import { ref, onMounted, useTemplateRef } from 'vue'
import type { ExtraConfig } from '../../../shared/types'

interface Props {
  settings: ExtraConfig | null
}

const props = defineProps<Props>()

const videoRef = useTemplateRef('video')
const cameraFound = ref(false)

onMounted(() => {
  if (props.settings?.camera) {
    getVideo()
  }
})

const getVideo = () => {
  if (!videoRef.value || !props.settings?.camera) return

  navigator.mediaDevices
    .getUserMedia({
      video: {
        width: { ideal: 800 },
        deviceId: { exact: props.settings.camera }
      }
    })
    .then((stream) => {
      cameraFound.value = true
      if (videoRef.value) {
        videoRef.value.srcObject = stream
        videoRef.value.play()
      }
    })
    .catch((err) => {
      console.error('Camera error:', err)
    })
}
</script>

<template>
  <div class="camera-container">
    <video
      v-if="cameraFound"
      ref="video"
      style="width: 100%; height: 100%; object-fit: cover"
      autoplay
      playsinline
    />
    <div v-else class="no-camera">
      <v-icon size="48">mdi-camera-off</v-icon>
      <p>No Camera Found</p>
    </div>
  </div>
</template>

<style scoped>
.camera-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #000;
}

.no-camera {
  text-align: center;
  color: white;
}
</style>
