<template>
  <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <div class="text-center mb-10">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">📬 Contact Us</h1>
      <p class="text-gray-500 dark:text-gray-400">
        Have a question or feedback? We'd love to hear from you.
      </p>
    </div>

    <div v-if="submitted" class="card text-center py-12 animate-fade-in">
      <div class="text-5xl mb-4">🎉</div>
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Message Sent!</h2>
      <p class="text-gray-500 dark:text-gray-400 mb-6">
        Thank you for reaching out. We'll get back to you as soon as possible.
      </p>
      <button @click="submitted = false" class="btn-primary">Send Another</button>
    </div>

    <div v-else class="card animate-fade-in">
      <form @submit.prevent="handleSubmit" class="space-y-5">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="label" for="name">Full Name *</label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              class="input"
              :class="{ 'border-red-400': errors.name }"
              placeholder="John Doe"
              required
            />
            <p v-if="errors.name" class="mt-1 text-xs text-red-500">{{ errors.name }}</p>
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
        </div>

        <div>
          <label class="label" for="subject">Subject *</label>
          <input
            id="subject"
            v-model="form.subject"
            type="text"
            class="input"
            :class="{ 'border-red-400': errors.subject }"
            placeholder="How can we help?"
            required
          />
          <p v-if="errors.subject" class="mt-1 text-xs text-red-500">{{ errors.subject }}</p>
        </div>

        <div>
          <label class="label" for="message">Message *</label>
          <textarea
            id="message"
            v-model="form.message"
            class="input resize-none"
            :class="{ 'border-red-400': errors.message }"
            rows="5"
            placeholder="Tell us what's on your mind..."
            required
          />
          <p v-if="errors.message" class="mt-1 text-xs text-red-500">{{ errors.message }}</p>
          <p class="mt-1 text-xs text-gray-400 text-right">{{ form.message.length }}/2000</p>
        </div>

        <div v-if="globalError" class="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-sm text-red-600 dark:text-red-400">
          {{ globalError }}
        </div>

        <button type="submit" class="btn-primary w-full" :disabled="loading">
          <AppLoadingSpinner v-if="loading" size="sm" />
          <span>{{ loading ? 'Sending...' : '📤 Send Message' }}</span>
        </button>
      </form>
    </div>

    <div class="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div v-for="item in contactInfo" :key="item.label" class="text-center">
        <div class="text-2xl mb-1">{{ item.icon }}</div>
        <p class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ item.label }}</p>
        <p class="text-xs text-gray-500 dark:text-gray-400">{{ item.value }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'default' })
useHead({ title: 'Contact' })

const authStore = useAuthStore()
const config = useRuntimeConfig()

const loading = ref(false)
const submitted = ref(false)
const globalError = ref('')
const errors = ref<Record<string, string>>({})

const form = reactive({
  name: authStore.user?.name || authStore.user?.username || '',
  email: authStore.user?.email || '',
  subject: '',
  message: '',
})

const handleSubmit = async () => {
  errors.value = {}
  globalError.value = ''
  loading.value = true

  try {
    await $fetch(`${config.public.apiBase}/users/contact`, {
      method: 'POST',
      body: form,
      credentials: 'include',
    })
    submitted.value = true
    form.subject = ''
    form.message = ''
  } catch (err: any) {
    globalError.value = err.data?.message || 'Failed to send message. Please try again.'
    if (err.data?.errors) {
      err.data.errors.forEach((e: { field: string; message: string }) => {
        errors.value[e.field] = e.message
      })
    }
  } finally {
    loading.value = false
  }
}

const contactInfo = [
  { icon: '📧', label: 'Email', value: 'hello@todolist.app' },
  { icon: '⏰', label: 'Response Time', value: 'Within 24 hours' },
  { icon: '🌍', label: 'Location', value: 'Istanbul, Turkey' },
]
</script>
