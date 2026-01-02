<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useCarplayStore } from '../stores/carplayStore'
import KeyBindings from '../components/KeyBindings.vue'
import Canbus from '../components/Canbus.vue'
import MostStream from '../components/MostStream.vue'
import type { ExtraConfig } from '../../../shared/types'

const carplayStore = useCarplayStore()

const activeSettings = ref<ExtraConfig | null>(null)
const cameras = ref<MediaDeviceInfo[]>([])
const microphones = ref<MediaDeviceInfo[]>([])
const openStream = ref(false)
const openBindings = ref(false)
const openCan = ref(false)

watch(
  () => carplayStore.settings,
  (newSettings) => {
    if (newSettings) {
      activeSettings.value = { ...newSettings }
    }
  },
  { immediate: true }
)

onMounted(() => {
  // Enumerate media devices
  if (!navigator.mediaDevices?.enumerateDevices) {
    cameras.value = []
    microphones.value = []
  } else {
    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        const mics: MediaDeviceInfo[] = []
        const cams: MediaDeviceInfo[] = []
        devices.forEach((device) => {
          if (device.kind === 'audioinput') {
            mics.push(device)
          } else if (device.kind === 'videoinput') {
            cams.push(device)
          }
        })
        microphones.value = mics
        cameras.value = cams
      })
      .catch((err) => console.error('Error enumerating devices:', err))
  }
})

const settingsChange = (key: string, value: any) => {
  if (activeSettings.value) {
    ;(activeSettings.value as any)[key] = value
  }
}

const saveSettings = () => {
  if (activeSettings.value) {
    carplayStore.saveSettings(activeSettings.value)
  }
}
</script>

<template>
  <v-container class="pa-4" v-if="activeSettings">
    <v-form @submit.prevent="saveSettings">
      <v-row>
        <!-- Display Settings -->
        <v-col cols="12" md="6">
          <v-text-field
            v-model.number="activeSettings.fps"
            label="FPS"
            type="number"
            hint="Frames per second (up to 60)"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model.number="activeSettings.mediaDelay"
            label="Media Delay"
            type="number"
            hint="Delay in milliseconds"
          />
        </v-col>

        <!-- Device Settings -->
        <v-col cols="12" md="6">
          <v-select
            v-model="activeSettings.camera"
            label="Camera"
            :items="cameras"
            item-title="label"
            item-value="deviceId"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-select
            v-model="activeSettings.microphone"
            label="Microphone"
            :items="microphones"
            item-title="label"
            item-value="deviceId"
          />
        </v-col>

        <!-- iBox Settings -->
        <v-col cols="12" md="6">
          <v-text-field
            v-model.number="activeSettings.iBoxVersion"
            label="iBox Version"
            type="number"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model.number="activeSettings.phoneWorkMode"
            label="Phone Work Mode"
            type="number"
          />
        </v-col>

        <!-- WiFi Type -->
        <v-col cols="12" md="6">
          <v-radio-group v-model="activeSettings.wifiType" label="WiFi Type" row>
            <v-radio value="2.4ghz" label="2.4GHz" />
            <v-radio value="5ghz" label="5GHz" />
          </v-radio-group>
        </v-col>

        <!-- Mic Type -->
        <v-col cols="12" md="6">
          <v-radio-group v-model="activeSettings.micType" label="Mic Type" row>
            <v-radio value="os" label="OS" />
            <v-radio value="box" label="BOX" />
          </v-radio-group>
        </v-col>

        <!-- Feature Toggles -->
        <v-col cols="12" md="6">
          <v-checkbox v-model="activeSettings.kiosk" label="Kiosk Mode" />
        </v-col>
        <v-col cols="12" md="6">
          <v-checkbox v-model="activeSettings.piMost" label="PiMost Integration" />
        </v-col>
        <v-col cols="12" md="6">
          <v-checkbox v-model="activeSettings.canbus" label="CAN Bus" />
        </v-col>

        <!-- Action Buttons -->
        <v-col cols="12">
          <v-row>
            <v-col cols="12" md="4">
              <v-btn block @click="openBindings = true"> Key Bindings </v-btn>
            </v-col>
            <v-col cols="12" md="4">
              <v-btn block @click="openCan = true"> CAN Bus Config </v-btn>
            </v-col>
            <v-col cols="12" md="4">
              <v-btn v-if="activeSettings.piMost" block @click="openStream = true">
                MOST Stream Config
              </v-btn>
            </v-col>
          </v-row>
        </v-col>

        <!-- Save Button -->
        <v-col cols="12">
          <v-btn block color="primary" type="submit" size="large"> Save Settings </v-btn>
        </v-col>
      </v-row>
    </v-form>

    <!-- Dialogs -->
    <v-dialog v-model="openBindings" max-width="800px">
      <v-card>
        <v-card-title>Key Bindings</v-card-title>
        <v-card-text>
          <KeyBindings
            v-if="activeSettings"
            :settings="activeSettings"
            @update:settings="settingsChange"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="openBindings = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="openCan" max-width="800px">
      <v-card>
        <v-card-title>CAN Bus Configuration</v-card-title>
        <v-card-text>
          <Canbus
            v-if="activeSettings"
            :settings="activeSettings"
            @update:settings="settingsChange"
            @close="openCan = false"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="openCan = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="openStream" max-width="800px">
      <v-card>
        <v-card-title>PiMost Stream Configuration</v-card-title>
        <v-card-text>
          <MostStream
            v-if="activeSettings"
            :settings="activeSettings"
            @update:settings="settingsChange"
            @close="openStream = false"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="openStream = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
