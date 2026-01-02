<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useCarplayStore, useStatusStore } from './stores/carplayStore'
import Nav from './components/Nav.vue'
import Camera from './components/Camera.vue'

const carplayStore = useCarplayStore()
const statusStore = useStatusStore()

const receivingVideo = ref(false)
const commandCounter = ref(0)
const keyCommand = ref('')

onMounted(() => {
  carplayStore.loadSettings()

  // Listen for settings updates from main process
  window.electron?.ipcRenderer?.on('settings', (_, settings) => {
    carplayStore.setSettings(settings)
  })

  window.electron?.ipcRenderer?.on('settings-updated', (_, settings) => {
    carplayStore.setSettings(settings)
  })

  window.electron?.ipcRenderer?.on('reverse', () => {
    statusStore.setReverse(true)
  })

  // Setup keyboard listeners
  document.addEventListener('keydown', onKeyDown)
})

const onKeyDown = (event: KeyboardEvent) => {
  if (!carplayStore.settings) return

  if (Object.values(carplayStore.settings.bindings).includes(event.code)) {
    const action = Object.keys(carplayStore.settings.bindings).find(
      (key) => carplayStore.settings!.bindings[key] === event.code
    )

    if (action) {
      keyCommand.value = action
      commandCounter.value++

      if (action === 'selectDown') {
        setTimeout(() => {
          keyCommand.value = 'selectUp'
          commandCounter.value++
        }, 200)
      }
    }
  }
}

const handleReverseClose = () => {
  statusStore.setReverse(false)
}
</script>

<template>
  <v-app id="carplay-app">
    <Nav :receiving-video="receivingVideo" :settings="carplayStore.settings" />

    <v-main>
      <router-view
        :key="$route.fullPath"
        :receiving-video="receivingVideo"
        :settings="carplayStore.settings"
        :command="keyCommand"
        :command-counter="commandCounter"
        @update:receiving-video="(v) => (receivingVideo = v)"
      />
    </v-main>

    <!-- Reverse camera modal -->
    <v-dialog v-model="statusStore.reverse" fullscreen @update:model-value="handleReverseClose">
      <div class="d-flex" style="height: 100%; width: 100%">
        <Camera v-if="carplayStore.settings" :settings="carplayStore.settings" />
      </div>
    </v-dialog>
  </v-app>
</template>

<style scoped>
#carplay-app {
  height: 100vh;
  width: 100%;
}
</style>
