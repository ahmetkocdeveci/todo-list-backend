<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <AppLoadingSpinner v-if="loading" size="lg" full-page />

    <div v-else-if="loadError" class="card mx-auto max-w-xl text-center py-12" role="alert">
      <div class="text-5xl mb-4">⚠️</div>
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Profile could not be loaded</h2>
      <p class="mt-2 text-sm text-red-600 dark:text-red-400">{{ loadError }}</p>
      <button type="button" class="btn-primary mt-5" @click="loadData">Try Again</button>
    </div>

    <div v-else-if="!profileUser" class="text-center py-20">
      <div class="text-5xl mb-4">👤</div>
      <h2 class="text-xl font-semibold dark:text-white">User not found</h2>
      <NuxtLink to="/" class="btn-primary mt-4">Go Home</NuxtLink>
    </div>

    <div v-else class="animate-fade-in">
      <div class="card mb-6">
        <div class="flex items-start gap-6 flex-wrap">
          <div class="flex-shrink-0">
            <img
              v-if="profileUser.avatar?.url"
              :src="profileUser.avatar.url"
              :alt="profileUser.username"
              class="w-20 h-20 rounded-full object-cover ring-4 ring-indigo-100 dark:ring-indigo-900"
            />
            <div v-else
              class="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600
                     flex items-center justify-center text-white text-3xl font-bold"
            >
              {{ profileUser.username?.[0]?.toUpperCase() }}
            </div>
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-3 flex-wrap">
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ profileUser.name || profileUser.username }}
              </h1>
              <span v-if="profileUser.role === 'admin'"
                class="badge bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                Admin
              </span>
            </div>
            <p class="text-gray-500 dark:text-gray-400 mt-0.5">@{{ profileUser.username }}</p>
            <p v-if="profileUser.bio" class="text-gray-600 dark:text-gray-300 mt-2 text-sm">
              {{ profileUser.bio }}
            </p>

            <div class="flex items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
              <span>📋 {{ profileUser.todoCount || 0 }} todos</span>
              <span>📅 Joined {{ joinedDate }}</span>
            </div>
          </div>

          <div v-if="isOwnProfile">
            <button @click="showEditProfile = !showEditProfile" class="btn-outline text-sm">
              ✏️ Edit Profile
            </button>
          </div>
        </div>

        <Transition enter-active-class="transition ease-out duration-150" enter-from-class="opacity-0 -translate-y-2"
          enter-to-class="opacity-100 translate-y-0">
          <form v-if="showEditProfile && isOwnProfile" @submit.prevent="handleUpdateProfile"
            class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="label">Full Name</label>
                <input v-model="editForm.name" type="text" class="input" maxlength="50" />
              </div>
              <div>
                <label class="label">Username</label>
                <input v-model="editForm.username" type="text" class="input" maxlength="30" />
              </div>
            </div>
            <div>
              <label class="label">Bio</label>
              <textarea v-model="editForm.bio" class="input resize-none" rows="2" maxlength="200" />
            </div>
            <div>
              <label class="label">Avatar</label>
              <input type="file" accept="image/*" @change="handleAvatarChange" class="text-sm text-gray-500" />
            </div>
            <div class="flex gap-3">
              <button type="button" @click="showEditProfile = false" class="btn-outline flex-1">Cancel</button>
              <button type="submit" class="btn-primary flex-1" :disabled="updating">
                <AppLoadingSpinner v-if="updating" size="sm" />
                Save Changes
              </button>
            </div>
          </form>
        </Transition>
      </div>

      <div>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          📋 {{ isOwnProfile ? 'My' : `${profileUser.username}'s` }} Todos
        </h2>

        <AppLoadingSpinner v-if="todosLoading" />

        <div v-else-if="userTodos.length" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TodoCard
            v-for="todo in userTodos"
            :key="todo._id"
            :todo="todo"
            readonly
            @click="navigateTo(`/todos/${todo._id}`)"
            class="cursor-pointer"
          />
        </div>
        <div v-else class="card text-center py-12 text-gray-400">
          <p>No public todos yet.</p>
        </div>

        <div v-if="totalPages > 1" class="mt-6 flex justify-center gap-2">
          <button
            v-for="page in totalPages"
            :key="page"
            @click="loadPage(page)"
            class="w-9 h-9 rounded-lg text-sm"
            :class="currentPage === page ? 'bg-indigo-600 text-white' : 'btn-outline'"
          >{{ page }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { useToast } from '~/composables/useToast'
import type { Todo } from '~/stores/todos'

definePageMeta({ layout: 'default' })

const route = useRoute()
const authStore = useAuthStore()
const toast = useToast()
const config = useRuntimeConfig()

const loading = ref(true)
const todosLoading = ref(false)
const updating = ref(false)
const loadError = ref('')
const showEditProfile = ref(false)
const profileUser = ref<any>(null)
const userTodos = ref<Todo[]>([])
const currentPage = ref(1)
const totalPages = ref(1)

const isOwnProfile = computed(
  () => profileUser.value?.username === authStore.user?.username
)

const joinedDate = computed(() =>
  profileUser.value
    ? new Date(profileUser.value.createdAt).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })
    : ''
)

useHead(() => ({
  title: profileUser.value ? `${profileUser.value.username}'s Profile` : 'Profile',
}))

const editForm = reactive({ name: '', username: '', bio: '' })
let avatarFile: File | null = null

const loadProfile = async () => {
  const data = await $fetch<{ success: boolean; user: any }>(
    `${config.public.apiBase}/users/${route.params.username}`,
    { credentials: 'include' }
  )
  profileUser.value = data.user
  editForm.name = data.user.name || ''
  editForm.username = data.user.username
  editForm.bio = data.user.bio || ''
}

const loadTodos = async (page = 1) => {
  todosLoading.value = true
  try {
    const data = await $fetch<{ todos: Todo[]; totalPages: number; currentPage: number }>(
      `${config.public.apiBase}/users/${route.params.username}/todos?page=${page}&limit=6`,
      { credentials: 'include' }
    )
    userTodos.value = data.todos
    totalPages.value = data.totalPages
    currentPage.value = data.currentPage
  } finally {
    todosLoading.value = false
  }
}

const getErrorMessage = (error: any) =>
  error?.data?.message || error?.message || 'Please try again.'

const loadData = async () => {
  loading.value = true
  loadError.value = ''
  try {
    await Promise.all([loadProfile(), loadTodos()])
  } catch (error: any) {
    profileUser.value = null
    userTodos.value = []
    loadError.value = getErrorMessage(error)
  } finally {
    loading.value = false
  }
}

const loadPage = async (page: number) => {
  try {
    await loadTodos(page)
  } catch (error: any) {
    toast.error(getErrorMessage(error))
  }
}

onMounted(loadData)
watch(() => route.params.username, () => loadData())

const handleAvatarChange = (e: Event) => {
  avatarFile = (e.target as HTMLInputElement).files?.[0] || null
}

const handleUpdateProfile = async () => {
  updating.value = true
  try {
    if (avatarFile) {
      const fd = new FormData()
      fd.append('avatar', avatarFile)
      await $fetch(`${config.public.apiBase}/users/avatar`, {
        method: 'POST',
        body: fd,
        credentials: 'include',
      })
    }

    const data = await $fetch<{ user: any }>(
      `${config.public.apiBase}/users/profile`,
      {
        method: 'PATCH',
        body: editForm,
        credentials: 'include',
      }
    )
    authStore.setUser(data.user)
    profileUser.value = data.user
    showEditProfile.value = false
    toast.success('Profile updated! ✅')

    if (editForm.username !== route.params.username) {
      await navigateTo(`/profile/${editForm.username}`)
    }
  } catch (err: any) {
    toast.error(err.data?.message || 'Update failed.')
  } finally {
    updating.value = false
  }
}
</script>
