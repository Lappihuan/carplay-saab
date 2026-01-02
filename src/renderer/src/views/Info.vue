<script setup lang="ts"></script>

<template>
  <v-container class="pa-4">
    <v-card>
      <v-card-title>About CarPlay SAAB</v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12">
            <p class="font-weight-bold">Version: 1.0.0</p>
          </v-col>
          <v-col cols="12">
            <p>
              A Vue-based Electron application for displaying Apple CarPlay on a Raspberry Pi or
              compatible hardware using the Carlinkit dongle.
            </p>
          </v-col>
          <v-col cols="12">
            <p class="font-weight-bold">Features:</p>
            <ul>
              <li>CarPlay streaming up to 60fps @ 1080p</li>
              <li>CAN Bus integration for camera triggers</li>
              <li>MOST Bus integration for audio streaming</li>
              <li>Configurable keybindings</li>
              <li>Camera and microphone device selection</li>
            </ul>
          </v-col>
          <v-col cols="12">
            <p class="font-weight-bold">Keyboard Shortcuts:</p>
            <ul>
              <li>Arrow Keys: Navigation</li>
              <li>Space: Select</li>
              <li>Backspace: Back</li>
              <li>H: Home</li>
              <li>P: Play</li>
              <li>O: Pause</li>
              <li>N: Next</li>
              <li>V: Previous</li>
            </ul>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-container>
</template>
