<script setup lang="ts">
import { ref, onMounted, useTemplateRef } from 'vue'
import type { ExtraConfig } from '../../../shared/types'

interface Props {
  settings: ExtraConfig
}

const props = defineProps<Props>()

const videoRef = useTemplateRef('video')
const cameraFound = ref(false)

onMounted(() => {
  getVideo()
})

const getVideo = () => {
  if (!videoRef.value || !props.settings?.camera) return

  navigator.mediaDevices
    .getUserMedia({
      video: {
        width: { ideal: 800 },
        deviceId: props.settings.camera ? { exact: props.settings.camera } : undefined
      }
    })
    .then((stream) => {
      cameraFound.value = true
      videoRef.value!.srcObject = stream
      videoRef.value!.play()
    })
    .catch((err) => {
      console.error('Camera access denied:', err)
      cameraFound.value = false
    })
}
</script>

<template>
  <v-container class="pa-4">
    <v-card v-if="cameraFound">
      <video
        ref="video"
        style="width: 100%; height: auto; max-width: 600px; display: block; margin: 0 auto"
        autoplay
        playsinline
      />
    </v-card>
    <v-card v-else>
      <v-card-text class="text-center">
        <v-icon size="64" class="mb-4">mdi-camera-off</v-icon>
        <p>No Camera Found</p>
      </v-card-text>
    </v-card>
  </v-container>
</template>
