<script setup lang="ts">
import { ref } from 'vue'
import type { ExtraConfig } from '../../../shared/types'

interface Props {
  settings: ExtraConfig
}

interface Emits {
  (e: 'update:settings', key: string, value: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const keyToBind = ref('')
const awaitingKey = ref(false)

const startBinding = (key: string) => {
  keyToBind.value = key
  awaitingKey.value = true
  document.addEventListener('keydown', handleKeyDown)
}

const handleKeyDown = (event: KeyboardEvent) => {
  const bindings = { ...props.settings.bindings }
  bindings[keyToBind.value as keyof typeof bindings] = event.code
  emit('update:settings', 'bindings', bindings)
  awaitingKey.value = false
  keyToBind.value = ''
  document.removeEventListener('keydown', handleKeyDown)
}
</script>

<template>
  <v-container>
    <v-row>
      <v-col v-for="(key, binding) in settings.bindings" :key="binding" cols="12" md="6">
        <v-card>
          <v-card-text class="d-flex align-center justify-space-between">
            <span class="font-weight-bold">{{ binding }}</span>
            <v-btn
              @click="startBinding(binding as string)"
              :color="keyToBind === binding ? 'warning' : 'primary'"
            >
              {{ key || 'Not Set' }}
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="awaitingKey" max-width="400px">
      <v-card>
        <v-card-text class="text-center pt-8">
          <p class="text-h6 mb-4">Press a key for: {{ keyToBind }}</p>
          <v-progress-circular indeterminate color="primary" />
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>
