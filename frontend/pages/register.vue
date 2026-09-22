<template>
  <div class="min-h-screen flex items-center justify-center p-4
              bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-950 dark:to-gray-900">
    <div class="w-full max-w-md animate-fade-in">
      <div class="text-center mb-8">
        <div class="text-5xl mb-3">✅</div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Create Account</h1>
        <p class="text-gray-500 dark:text-gray-400 mt-1">Start organizing your tasks today</p>
      </div>

      <div class="card">
        <form @submit.prevent="handleRegister" class="space-y-4">
          <div>
            <label class="label" for="name">Full Name</label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              class="input"
              placeholder="John Doe"
              maxlength="50"
            />
          </div>

          <div>
            <label class="label" for="username">Username *</label>
            <input
              id="username"
              v-model="form.username"
              type="text"
              class="input"
              :class="{ 'border-red-400': errors.username }"
              placeholder="johndoe"
              required
              minlength="3"
              maxlength="30"
            />
            <p v-if="errors.username" class="mt-1 text-xs text-red-500">{{ errors.username }}</p>
          </div>

          <div>
            <label class="label" for="email">Email *</label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              class="input"
              :class="{ 'border-red-400': errors.email }"
              placeholder="john@example.com"
              required
            />
            <p v-if="errors.email" class="mt-1 text-xs text-red-500">{{ errors.email }}</p>
          </div>

          <div>
            <label class="label" for="password">Password *</label>
            <div class="relative">
              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                class="input pr-10"
                :class="{ 'border-red-400': errors.password }"
                placeholder="Min. 6 characters"
                required
                minlength="6"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                @click="showPassword = !showPassword"
              >
                {{ showPassword ? '🙈' : '👁️' }}
              </button>
            </div>
            <p v-if="errors.password" class="mt-1 text-xs text-red-500">{{ errors.password }}</p>
          </div>

          <div v-if="globalError" class="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-sm text-red-600 dark:text-red-400">
            {{ globalError }}
          </div>

          <button type="submit" class="btn-primary w-full" :disabled="loading">
            <AppLoadingSpinner v-if="loading" size="sm" />
            <span>{{ loading ? 'Creating account...' : 'Create Account' }}</span>
          </button>
        </form>

        <p class="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          Already have an account?
          <NuxtLink to="/login" class="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
            Sign in
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
useHead({ title: 'Register' })

const authStore = useAuthStore()
const { loading } = storeToRefs(authStore)
const toast = useToast()
const route = useRoute()

const showPassword = ref(false)
const globalError = ref('')
const errors = ref<Record<string, string>>({})

const form = reactive({
  name: '',
  username: '',
  email: '',
  password: '',
})

const handleRegister = async () => {
  errors.value = {}
  globalError.value = ''

  try {
    await authStore.register(form)
    toast.success('Welcome! Your account has been created 🎉')
    const redirect = route.query.redirect
    const destination = typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')
      ? redirect
      : '/dashboard'
    await navigateTo(destination)
  } catch (err: any) {
    const errData = err.data || {}
    globalError.value = errData.message || 'Registration failed. Please try again.'
    if (errData.errors) {
      errData.errors.forEach((e: { field: string; message: string }) => {
        errors.value[e.field] = e.message
      })
    }
  }
}
</script>
