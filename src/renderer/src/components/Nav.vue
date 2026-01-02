<script setup lang="ts">
import { useRoute } from 'vue-router'
import { mdiPhone, mdiCog, mdiInformation, mdiCamera, mdiLogout } from '@mdi/js'
import type { ExtraConfig } from '../../../shared/types'

interface Props {
  receivingVideo: boolean
  settings: ExtraConfig | null
}

defineProps<Props>()

const route = useRoute()

const quit = () => {
  window.electron?.ipcRenderer?.send('quit')
}
</script>

<template>
  <v-app-bar
    app
    color="primary"
    dark
    :style="{
      minHeight: '0px',
      height: receivingVideo && route.name === 'Carplay' ? '0px' : 'auto'
    }"
  >
    <v-toolbar dense>
      <v-btn :to="{ name: 'Carplay' }" :active="route.name === 'Carplay'" :icon="mdiPhone" />
      <v-btn :to="{ name: 'Settings' }" :active="route.name === 'Settings'" :icon="mdiCog" />
      <v-btn :to="{ name: 'Info' }" :active="route.name === 'Info'" :icon="mdiInformation" />
      <v-btn
        v-if="settings?.camera"
        :to="{ name: 'Camera' }"
        :active="route.name === 'Camera'"
        :icon="mdiCamera"
      />
      <v-spacer />
      <v-btn :icon="mdiLogout" @click="quit" />
    </v-toolbar>
  </v-app-bar>
</template>
