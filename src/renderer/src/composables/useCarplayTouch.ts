type LocalTouchAction = 'up' | 'down' | 'move'

export const useCarplayTouch = (carplayWorker: Worker) => {
  const sendTouchEvent = (event: PointerEvent) => {
    const element = event.currentTarget as HTMLElement
    if (!element) return

    const rect = element.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    let action: LocalTouchAction = 'up'

    if (event.type === 'pointerdown') {
      action = 'down'
    } else if (event.type === 'pointermove') {
      action = 'move'
    } else if (
      event.type === 'pointerup' ||
      event.type === 'pointercancel' ||
      event.type === 'pointerout'
    ) {
      action = 'up'
    }

    carplayWorker.postMessage({
      type: 'touch',
      x: Math.round(x),
      y: Math.round(y),
      action
    })
  }

  return {
    sendTouchEvent
  }
}
