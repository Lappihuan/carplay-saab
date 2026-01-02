<script setup lang="ts">
import { ref, watch } from 'vue'
import type { ExtraConfig, Stream } from '../../../shared/types'

interface Props {
  settings: ExtraConfig
}

interface Emits {
  (e: 'update:settings', key: string, value: any): void
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const stream = ref<Stream>({
  fBlockID: '',
  instanceID: '',
  sinkNr: '',
  sourceAddrHigh: '',
  sourceAddrLow: ''
})

watch(
  () => props.settings.most?.stream,
  (mostStream) => {
    if (mostStream) {
      stream.value = { ...mostStream }
    }
  },
  { immediate: true }
)

const updateStream = (key: string, value: string) => {
  stream.value[key as keyof Stream] = value
}

const handleSave = () => {
  emit('update:settings', 'most', {
    stream: stream.value
  })
  emit('close')
}

const isValidHex = (value: string): boolean => {
  return /^0x[0-9A-Fa-f]+$/.test(value) || /^[0-9A-Fa-f]+$/.test(value)
}
</script>

<template>
  <v-container>
    <v-row>
      <v-col cols="12" md="6">
        <v-text-field
          v-model="stream.fBlockID"
          label="fBlockID"
          hint="Amplifier block ID (e.g., 0x22)"
          @update:model-value="updateStream('fBlockID', $event)"
          :error="!!(stream.fBlockID && !isValidHex(stream.fBlockID))"
          error-messages="Format must be hex (0x## or ##)"
        />
      </v-col>
      <v-col cols="12" md="6">
        <v-text-field
          v-model="stream.instanceID"
          label="Instance ID"
          hint="Instance ID for the amplifier"
          @update:model-value="updateStream('instanceID', $event)"
          :error="!!(stream.instanceID && !isValidHex(stream.instanceID))"
          error-messages="Format must be hex"
        />
      </v-col>
      <v-col cols="12" md="6">
        <v-text-field
          v-model="stream.sinkNr"
          label="Sink Number"
          hint="Sink number for the audio stream"
          @update:model-value="updateStream('sinkNr', $event)"
          :error="!!(stream.sinkNr && !isValidHex(stream.sinkNr))"
          error-messages="Format must be hex"
        />
      </v-col>
      <v-col cols="12" md="6">
        <v-text-field
          v-model="stream.sourceAddrHigh"
          label="Source Address High"
          hint="High byte of source address"
          @update:model-value="updateStream('sourceAddrHigh', $event)"
          :error="!!(stream.sourceAddrHigh && !isValidHex(stream.sourceAddrHigh))"
          error-messages="Format must be hex"
        />
      </v-col>
      <v-col cols="12" md="6">
        <v-text-field
          v-model="stream.sourceAddrLow"
          label="Source Address Low"
          hint="Low byte of source address"
          @update:model-value="updateStream('sourceAddrLow', $event)"
          :error="!!(stream.sourceAddrLow && !isValidHex(stream.sourceAddrLow))"
          error-messages="Format must be hex"
        />
      </v-col>

      <v-col cols="12">
        <v-btn block color="primary" @click="handleSave"> Save MOST Configuration </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>
