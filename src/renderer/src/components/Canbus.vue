<script setup lang="ts">
import { ref, watch } from 'vue'
import type { ExtraConfig, CanMessage } from '../../../shared/types'

interface Props {
  settings: ExtraConfig
}

interface Emits {
  (e: 'update:settings', key: string, value: any): void
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const reverse = ref<CanMessage>({ canId: 0x00, mask: 0x00, byte: 0 })
const lights = ref<CanMessage>({ canId: 0x00, mask: 0x00, byte: 0 })

watch(
  () => props.settings.canConfig,
  (canConfig) => {
    if (canConfig?.reverse) {
      reverse.value = canConfig.reverse
    }
    if (canConfig?.lights) {
      lights.value = canConfig.lights
    }
  },
  { immediate: true }
)

const handleSave = () => {
  emit('update:settings', 'canConfig', {
    reverse: reverse.value,
    lights: lights.value
  })
  emit('close')
}
</script>

<template>
  <v-container>
    <v-row>
      <!-- Reverse Camera Settings -->
      <v-col cols="12">
        <v-card>
          <v-card-title>Reverse Camera</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model.number="reverse.canId"
                  label="CAN ID"
                  type="number"
                  hint="Hex format (0x00-0xFFF)"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model.number="reverse.mask"
                  label="Mask"
                  type="number"
                  hint="Bit mask for the signal"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model.number="reverse.byte"
                  label="Byte"
                  type="number"
                  hint="Byte position (0-7)"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Lights Settings -->
      <v-col cols="12">
        <v-card>
          <v-card-title>Lights</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model.number="lights.canId"
                  label="CAN ID"
                  type="number"
                  hint="Hex format (0x00-0xFFF)"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model.number="lights.mask"
                  label="Mask"
                  type="number"
                  hint="Bit mask for the signal"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model.number="lights.byte"
                  label="Byte"
                  type="number"
                  hint="Byte position (0-7)"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Save Button -->
      <v-col cols="12">
        <v-btn block color="primary" @click="handleSave"> Save CAN Configuration </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>
