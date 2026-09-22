import { defineStore } from 'pinia'

interface User {
  _id: string
  username: string
  email: string
  name?: string
  bio?: string
  role: 'user' | 'admin'
  avatar: { url: string; publicId: string }
  todoCount?: number
}

interface AuthState {
  user: User | null
  loading: boolean
  initialized: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    loading: false,
    initialized: false,
  }),

  getters: {
    isLoggedIn: (state) => !!state.user,
    isAdmin: (state) => state.user?.role === 'admin',
    currentUser: (state) => state.user,
  },

  actions: {
    async register(payload: { username: string; email: string; password: string; name?: string }) {
      const config = useRuntimeConfig()
      this.loading = true
      try {
        const data = await $fetch<{ success: boolean; user: User }>(
          `${config.public.apiBase}/auth/register`,
          {
            method: 'POST',
            body: payload,
            credentials: 'include',
          }
        )
        this.user = data.user
        return data
      } finally {
        this.loading = false
      }
    },

    async login(payload: { email: string; password: string }) {
      const config = useRuntimeConfig()
      this.loading = true
      try {
        const data = await $fetch<{ success: boolean; user: User }>(
          `${config.public.apiBase}/auth/login`,
          {
            method: 'POST',
            body: payload,
            credentials: 'include',
          }
        )
        this.user = data.user
        return data
      } finally {
        this.loading = false
      }
    },

    async logout() {
      const config = useRuntimeConfig()
      try {
        await $fetch(`${config.public.apiBase}/auth/logout`, {
          method: 'POST',
          credentials: 'include',
        })
      } finally {
        this.user = null
        navigateTo('/login')
      }
    },

    async fetchMe() {
      const config = useRuntimeConfig()
      try {
        const data = await $fetch<{ success: boolean; user: User }>(
          `${config.public.apiBase}/auth/me`,
          { credentials: 'include' }
        )
        this.user = data.user
      } catch {
        this.user = null
      } finally {
        this.initialized = true
      }
    },

    setUser(user: User) {
      this.user = user
    },
  },
})
