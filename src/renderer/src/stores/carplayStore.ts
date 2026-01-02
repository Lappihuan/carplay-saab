import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ExtraConfig } from '../../../shared/types'

export const useCarplayStore = defineStore('carplay', () => {
  const settings = ref<ExtraConfig | null>(null)
  const isLoading = ref(false)

  const saveSettings = (newSettings: ExtraConfig) => {
    settings.value = newSettings
    window.electron?.ipcRenderer?.send('save-settings', newSettings)
  }

  const loadSettings = () => {
    isLoading.value = true
    window.electron?.ipcRenderer?.send('get-settings')
  }

  const setSettings = (newSettings: ExtraConfig) => {
    settings.value = newSettings
  }

  return {
    settings: computed(() => settings.value),
    isLoading: computed(() => isLoading.value),
    saveSettings,
    loadSettings,
    setSettings
  }
})

export const useStatusStore = defineStore('status', () => {
  const isPlugged = ref(false)
  const reverse = ref(false)

  const setPlugged = (plugged: boolean) => {
    isPlugged.value = plugged
  }

  const setReverse = (reverseState: boolean) => {
    reverse.value = reverseState
  }

  return {
    isPlugged: computed(() => isPlugged.value),
    reverse: computed(() => reverse.value),
    setPlugged,
    setReverse
  }
})
