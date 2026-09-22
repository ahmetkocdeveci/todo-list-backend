import { useAuthStore } from '~/stores/auth'

export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore()

  if (!authStore.initialized) {
    await authStore.fetchMe()
  }
})
