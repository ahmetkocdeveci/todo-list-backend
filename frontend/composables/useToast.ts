export const useToast = () => {
  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const { $toast } = useNuxtApp()
    if ($toast) {
      ($toast as any)[type](message, {
        timeout: 3500,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      })
    } else {
      console[type === 'error' ? 'error' : 'log'](`[Toast ${type}] ${message}`)
    }
  }

  return {
    success: (msg: string) => showToast(msg, 'success'),
    error: (msg: string) => showToast(msg, 'error'),
    info: (msg: string) => showToast(msg, 'info'),
    warning: (msg: string) => showToast(msg, 'warning'),
  }
}
