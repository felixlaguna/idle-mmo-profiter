import { ref } from 'vue'
import type { ToastMessage } from '../components/Toast.vue'

const toasts = ref<ToastMessage[]>([])
let toastId = 0

export const useToast = () => {
  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' | 'warning' = 'info',
    duration = 3000
  ) => {
    const id = ++toastId
    toasts.value.push({ id, message, type, duration })
  }

  const dismissToast = (id: number) => {
    const index = toasts.value.findIndex((t) => t.id === id)
    if (index !== -1) {
      toasts.value.splice(index, 1)
    }
  }

  const success = (message: string, duration?: number) => {
    showToast(message, 'success', duration)
  }

  const error = (message: string, duration?: number) => {
    showToast(message, 'error', duration)
  }

  const warning = (message: string, duration?: number) => {
    showToast(message, 'warning', duration)
  }

  const info = (message: string, duration?: number) => {
    showToast(message, 'info', duration)
  }

  return {
    toasts,
    showToast,
    dismissToast,
    success,
    error,
    warning,
    info,
  }
}
