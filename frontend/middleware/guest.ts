import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.server) return

  const authStore = useAuthStore()

  if (!authStore.initialized) {
    await authStore.fetchMe()
  }

  if (authStore.isLoggedIn) {
    return navigateTo('/dashboard')
  }
})
