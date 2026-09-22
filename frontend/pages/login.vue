<template>
  <div class="min-h-screen flex items-center justify-center p-4
              bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-950 dark:to-gray-900">
    <div class="w-full max-w-md animate-fade-in">
      <div class="text-center mb-8">
        <div class="text-5xl mb-3">✅</div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Welcome Back</h1>
        <p class="text-gray-500 dark:text-gray-400 mt-1">Sign in to continue</p>
      </div>

      <div class="card">
        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label class="label" for="email">Email</label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              class="input"
              placeholder="john@example.com"
              required
              autofocus
            />
          </div>

          <div>
            <label class="label" for="password">Password</label>
            <div class="relative">
              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                class="input pr-10"
                placeholder="Your password"
                required
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                @click="showPassword = !showPassword"
              >
                {{ showPassword ? '🙈' : '👁️' }}
              </button>
            </div>
          </div>

          <div v-if="error" class="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-sm text-red-600 dark:text-red-400">
            {{ error }}
          </div>

          <button type="submit" class="btn-primary w-full" :disabled="loading">
            <AppLoadingSpinner v-if="loading" size="sm" />
            <span>{{ loading ? 'Signing in...' : 'Sign In' }}</span>
          </button>
        </form>

        <p class="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          Don't have an account?
          <NuxtLink to="/register" class="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
            Register
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { useToast } from '~/composables/useToast'

definePageMeta({ middleware: 'guest', layout: 'default' })
useHead({ title: 'Login' })

const authStore = useAuthStore()
const { loading } = storeToRefs(authStore)
const toast = useToast()
const route = useRoute()

const showPassword = ref(false)
const error = ref('')

const form = reactive({ email: '', password: '' })

const handleLogin = async () => {
  error.value = ''
  try {
    await authStore.login(form)
    toast.success('Welcome back! 👋')
    const redirect = route.query.redirect
    const destination = typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')
      ? redirect
      : '/dashboard'
    await navigateTo(destination)
  } catch (err: any) {
    error.value = err.data?.message || 'Login failed. Please check your credentials.'
  }
}
</script>
