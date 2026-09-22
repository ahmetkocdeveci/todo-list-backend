<template>
  <div>
    <section class="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50
                  dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950" />

      <div class="absolute top-20 left-10 w-72 h-72 bg-indigo-300/20 rounded-full blur-3xl" />
      <div class="absolute bottom-20 right-10 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl" />

      <div class="relative z-10 max-w-4xl mx-auto px-4 text-center animate-fade-in">
        <div class="inline-flex items-center gap-2 bg-indigo-100 dark:bg-indigo-900/30
                    text-indigo-700 dark:text-indigo-300 rounded-full px-4 py-1.5 text-sm
                    font-medium mb-6">
          <span>🚀</span> Built with Nuxt 3 + Node.js
        </div>

        <h1 class="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6
                   leading-tight">
          Organize Your Life
          <span class="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Effortlessly
          </span>
        </h1>

        <p class="text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
          A powerful todo app with priorities, deadlines, image attachments, team collaboration, and
          smart email reminders. Everything you need to stay productive.
        </p>

        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <NuxtLink to="/register" class="btn-primary text-lg px-8 py-3">
            Get Started Free 🎉
          </NuxtLink>
          <NuxtLink to="/login" class="btn-outline text-lg px-8 py-3">
            Sign In →
          </NuxtLink>
        </div>

        <div class="mt-16 grid grid-cols-3 gap-6 max-w-md mx-auto">
          <div v-for="stat in stats" :key="stat.label" class="text-center">
            <div class="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{{ stat.value }}</div>
            <div class="text-sm text-gray-500 dark:text-gray-400">{{ stat.label }}</div>
          </div>
        </div>
      </div>
    </section>

    <section class="py-20 bg-white dark:bg-gray-900">
      <div class="max-w-6xl mx-auto px-4">
        <h2 class="text-3xl font-bold text-center text-gray-900 dark:text-white mb-4">
          Everything You Need
        </h2>
        <p class="text-center text-gray-500 dark:text-gray-400 mb-12 max-w-xl mx-auto">
          From simple task tracking to collaborative project management
        </p>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="feature in features"
            :key="feature.title"
            class="card hover:shadow-md transition-shadow group"
          >
            <div class="text-3xl mb-3">{{ feature.icon }}</div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {{ feature.title }}
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              {{ feature.description }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <section class="py-20 bg-gradient-to-r from-indigo-600 to-purple-600">
      <div class="max-w-2xl mx-auto px-4 text-center">
        <h2 class="text-3xl font-bold text-white mb-4">Ready to get organized?</h2>
        <p class="text-indigo-100 mb-8">Join thousands of users who trust TodoList for their daily productivity.</p>
        <NuxtLink to="/register" class="btn bg-white text-indigo-600 hover:bg-indigo-50 text-lg px-8 py-3">
          Start For Free →
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'default' })
useHead({ title: 'Welcome' })

const authStore = useAuthStore()

if (authStore.isLoggedIn) {
  navigateTo('/dashboard')
}

const stats = [
  { value: '10K+', label: 'Users' },
  { value: '500K+', label: 'Todos' },
  { value: '99.9%', label: 'Uptime' },
]

const features = [
  {
    icon: '🎯',
    title: 'Smart Priorities',
    description: 'Organize todos by priority (Low, Medium, High, Urgent) and never miss what matters most.',
  },
  {
    icon: '📅',
    title: 'Due Dates & Reminders',
    description: 'Set deadlines and get automatic email reminders before they are due.',
  },
  {
    icon: '🏷️',
    title: 'Tags & Categories',
    description: 'Categorize with custom tags and filter your todos with powerful search.',
  },
  {
    icon: '🖼️',
    title: 'Image Attachments',
    description: 'Attach images to todos, stored securely on Cloudinary with automatic optimization.',
  },
  {
    icon: '👥',
    title: 'Team Collaboration',
    description: 'Share todos with team members and assign view or edit permissions.',
  },
  {
    icon: '🌙',
    title: 'Dark Mode',
    description: 'Beautiful dark mode that follows your system preference or manual toggle.',
  },
]
</script>
