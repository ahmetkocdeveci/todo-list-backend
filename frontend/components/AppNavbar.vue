<template>
  <nav
    class="fixed top-0 left-0 right-0 z-50 h-16 bg-white/80 dark:bg-gray-900/80
           backdrop-blur-md border-b border-gray-200 dark:border-gray-800"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
      <NuxtLink to="/" class="flex items-center gap-2 font-bold text-xl text-indigo-600 dark:text-indigo-400">
        <span class="text-2xl">✅</span>
        <span class="hidden sm:inline">TodoList</span>
      </NuxtLink>

      <div class="hidden md:flex items-center gap-6">
        <NuxtLink
          v-if="isLoggedIn"
          to="/dashboard"
          class="nav-link"
          active-class="nav-link-active"
        >Dashboard</NuxtLink>

        <NuxtLink
          v-if="isLoggedIn"
          to="/todos"
          class="nav-link"
          active-class="nav-link-active"
        >My Todos</NuxtLink>

        <NuxtLink
          v-if="isLoggedIn"
          to="/workspaces"
          class="nav-link"
          active-class="nav-link-active"
        >Workspaces</NuxtLink>

        <NuxtLink
          to="/contact"
          class="nav-link"
          active-class="nav-link-active"
        >Contact</NuxtLink>
      </div>

      <div class="flex items-center gap-3">
        <AppDarkModeToggle />

        <template v-if="!isLoggedIn">
          <NuxtLink to="/login" class="btn-outline hidden sm:inline-flex">Login</NuxtLink>
          <NuxtLink to="/register" class="btn-primary">Register</NuxtLink>
        </template>

        <template v-else>
          <div class="relative" ref="dropdownRef">
            <button
              @click="dropdownOpen = !dropdownOpen"
              class="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100
                     dark:hover:bg-gray-800 transition-colors"
            >
              <img
                v-if="user?.avatar?.url"
                :src="user.avatar.url"
                :alt="user.username"
                class="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500"
              />
              <span
                v-else
                class="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center
                       justify-center text-sm font-bold"
              >
                {{ user?.username?.[0]?.toUpperCase() }}
              </span>
              <span class="hidden sm:inline text-sm font-medium dark:text-gray-200">
                {{ user?.name || user?.username }}
              </span>
              <svg class="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <Transition
              enter-active-class="transition ease-out duration-100"
              enter-from-class="opacity-0 scale-95"
              enter-to-class="opacity-100 scale-100"
              leave-active-class="transition ease-in duration-75"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-95"
            >
              <div
                v-if="dropdownOpen"
                class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl
                       shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50"
              >
                <NuxtLink
                  :to="`/profile/${user?.username}`"
                  class="dropdown-item"
                  @click="dropdownOpen = false"
                >
                  👤 Profile
                </NuxtLink>
                <NuxtLink
                  to="/todos"
                  class="dropdown-item"
                  @click="dropdownOpen = false"
                >
                  📋 My Todos
                </NuxtLink>
                <NuxtLink
                  to="/workspaces"
                  class="dropdown-item"
                  @click="dropdownOpen = false"
                >
                  👥 Workspaces
                </NuxtLink>
                <hr class="my-1 border-gray-200 dark:border-gray-700" />
                <button
                  @click="handleLogout"
                  class="dropdown-item text-red-600 dark:text-red-400 w-full text-left"
                >
                  🚪 Logout
                </button>
              </div>
            </Transition>
          </div>
        </template>

        <button
          class="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          @click="mobileOpen = !mobileOpen"
        >
          <svg class="w-5 h-5 dark:text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              :d="mobileOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'" />
          </svg>
        </button>
      </div>
    </div>

    <Transition
      enter-active-class="transition ease-out duration-150"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-100"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div
        v-if="mobileOpen"
        class="md:hidden absolute top-16 left-0 right-0 bg-white dark:bg-gray-900
               border-b border-gray-200 dark:border-gray-800 shadow-lg"
      >
        <div class="px-4 py-3 space-y-1">
          <NuxtLink v-if="isLoggedIn" to="/dashboard" class="mobile-nav-link" @click="mobileOpen = false">Dashboard</NuxtLink>
          <NuxtLink v-if="isLoggedIn" to="/todos" class="mobile-nav-link" @click="mobileOpen = false">My Todos</NuxtLink>
          <NuxtLink v-if="isLoggedIn" to="/workspaces" class="mobile-nav-link" @click="mobileOpen = false">Workspaces</NuxtLink>
          <NuxtLink to="/contact" class="mobile-nav-link" @click="mobileOpen = false">Contact</NuxtLink>
          <template v-if="!isLoggedIn">
            <NuxtLink to="/login" class="mobile-nav-link" @click="mobileOpen = false">Login</NuxtLink>
            <NuxtLink to="/register" class="mobile-nav-link" @click="mobileOpen = false">Register</NuxtLink>
          </template>
          <button v-else @click="handleLogout" class="mobile-nav-link text-red-600 w-full text-left">Logout</button>
        </div>
      </div>
    </Transition>
  </nav>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { onClickOutside } from '@vueuse/core'

const authStore = useAuthStore()
const { user, isLoggedIn } = storeToRefs(authStore)

const dropdownOpen = ref(false)
const mobileOpen = ref(false)
const dropdownRef = ref(null)

onClickOutside(dropdownRef, () => {
  dropdownOpen.value = false
})

const handleLogout = async () => {
  dropdownOpen.value = false
  mobileOpen.value = false
  await authStore.logout()
}
</script>

<style scoped>
.nav-link {
  @apply text-sm font-medium text-gray-600 dark:text-gray-300
         hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors;
}
.nav-link-active {
  @apply text-indigo-600 dark:text-indigo-400 font-semibold;
}
.dropdown-item {
  @apply block px-4 py-2 text-sm text-gray-700 dark:text-gray-200
         hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors;
}
.mobile-nav-link {
  @apply block px-3 py-2 rounded-lg text-sm font-medium text-gray-700
         dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors;
}
</style>
