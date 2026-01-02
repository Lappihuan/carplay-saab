import { ref } from 'vue'
import type { AudioData } from 'node-carplay/web'

const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
const audioPlayers = ref(new Map<string, AudioPlayer>())

interface AudioPlayer {
  processor: ScriptProcessorNode | null
  gain: GainNode
}

export const useCarplayAudio = (carplayWorker: Worker) => {
  const processAudio = (audioData: AudioData) => {
    const key = `${audioData.audioType}-${audioData.decodeType}`
    let player = audioPlayers.value.get(key)

    if (!player) {
      const gain = audioContext.createGain()
      gain.connect(audioContext.destination)

      player = {
        processor: null,
        gain
      }
      audioPlayers.value.set(key, player)
    }

    // Implementation depends on audio decoding strategy
    // This is a placeholder for the actual audio processing
  }

  const getAudioPlayer = (audioData: AudioData) => {
    const key = `${audioData.audioType}-${audioData.decodeType}`
    return audioPlayers.value.get(key)
  }

  const startRecording = () => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        const mediaStreamAudioSourceNode = audioContext.createMediaStreamSource(stream)
        const processor = audioContext.createScriptProcessor(4096, 1, 1)

        processor.onaudioprocess = (event) => {
          const audioData = event.inputBuffer.getChannelData(0)
          carplayWorker.postMessage(
            {
              type: 'audio',
              message: audioData
            },
            [audioData.buffer]
          )
        }

        mediaStreamAudioSourceNode.connect(processor)
        processor.connect(audioContext.destination)
      })
      .catch((err) => console.error('Audio access denied:', err))
  }

  const stopRecording = () => {
    audioContext.close()
  }

  return {
    processAudio,
    getAudioPlayer,
    startRecording,
    stopRecording
  }
}
