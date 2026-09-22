<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <AppLoadingSpinner v-if="loading" size="lg" full-page />

    <div v-else-if="loadError" class="card mx-auto max-w-xl text-center py-12" role="alert">
      <div class="text-5xl mb-4">⚠️</div>
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Todo could not be loaded</h2>
      <p class="mt-2 text-sm text-red-600 dark:text-red-400">{{ loadError }}</p>
      <div class="mt-5 flex justify-center gap-3">
        <NuxtLink :to="backTarget" class="btn-outline">Go Back</NuxtLink>
        <button type="button" class="btn-primary" @click="loadTodo">Try Again</button>
      </div>
    </div>

    <div v-else-if="!todo" class="text-center py-20">
      <div class="text-5xl mb-4">🔍</div>
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Todo not found</h2>
      <NuxtLink :to="backTarget" class="btn-primary mt-4">← Go Back</NuxtLink>
    </div>

    <div v-else class="animate-fade-in">
      <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
        <NuxtLink :to="backTarget" class="hover:text-indigo-600 dark:hover:text-indigo-400">Todos</NuxtLink>
        <span>/</span>
        <span class="text-gray-900 dark:text-white truncate max-w-xs">{{ todo.title }}</span>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
          <div class="card">
            <div class="flex items-start justify-between gap-4 mb-4">
              <h1
                class="text-2xl font-bold text-gray-900 dark:text-white"
                :class="{ 'line-through text-gray-400': todo.status === 'completed' }"
              >
                {{ todo.title }}
              </h1>

              <div v-if="isOwner || hasEditPermission" class="flex items-center gap-2 flex-shrink-0">
                <button @click="showEdit = true" class="btn-outline text-sm">✏️ Edit</button>
                <button v-if="isOwner" @click="handleDelete" class="btn-danger text-sm">🗑️ Delete</button>
              </div>
            </div>

            <p v-if="todo.description" class="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
              {{ todo.description }}
            </p>

            <div class="flex flex-wrap gap-2 mb-4">
              <span :class="`badge-${todo.status}`">{{ statusLabel }}</span>
              <span :class="`badge-${todo.priority}`">{{ todo.priority.toUpperCase() }}</span>
              <span class="badge bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                {{ todo.category }}
              </span>
              <span v-if="todo.isOverdue" class="badge bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                ⚠️ Overdue
              </span>
            </div>

            <div v-if="todo.tags?.length" class="flex flex-wrap gap-1.5">
              <span
                v-for="tag in todo.tags"
                :key="tag"
                class="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600
                       dark:bg-indigo-900/30 dark:text-indigo-400"
              >
                #{{ tag }}
              </span>
            </div>
          </div>

          <div v-if="todo.image?.url" class="card p-0 overflow-hidden">
            <img
              :src="todo.image.url"
              :alt="todo.title"
              class="w-full max-h-80 object-cover"
            />
          </div>

          <div v-if="isOwner || hasEditPermission" class="card">
            <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-3">Update Status</h3>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="s in ['pending', 'in-progress', 'completed']"
                :key="s"
                @click="changeStatus(s)"
                class="btn text-sm"
                :class="todo.status === s
                  ? 'bg-indigo-600 text-white'
                  : 'btn-outline'"
              >
                {{ s === 'pending' ? '⏳ Pending' : s === 'in-progress' ? '🔄 In Progress' : '✅ Completed' }}
              </button>
            </div>
          </div>

          <div v-if="isOwner" class="card">
            <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-3">
              👥 Share This Todo
            </h3>

            <div v-if="todo.sharedWith?.length" class="mb-4 space-y-2">
              <div
                v-for="shared in todo.sharedWith"
                :key="shared.user._id"
                class="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-700"
              >
                <div class="flex items-center gap-2">
                  <div class="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center
                               text-white text-xs font-bold">
                    {{ shared.user.username?.[0]?.toUpperCase() }}
                  </div>
                  <span class="text-sm text-gray-700 dark:text-gray-200">{{ shared.user.username }}</span>
                  <span class="badge bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    {{ shared.permission }}
                  </span>
                </div>
                <button
                  @click="removeShare(shared.user._id)"
                  class="text-xs text-red-500 hover:text-red-700"
                >Remove</button>
              </div>
            </div>

            <div class="relative">
              <div class="flex gap-2 flex-wrap">
              <input
                v-model="shareQuery"
                type="text"
                class="input flex-1"
                placeholder="Search by username or name"
                @input="searchShareUsers"
              />
              <select v-model="sharePermission" class="input w-auto">
                <option value="view">View only</option>
                <option value="edit">Can edit</option>
              </select>
              <button @click="handleShare" class="btn-primary whitespace-nowrap">Share</button>
              </div>
              <div v-if="shareCandidates.length" class="absolute z-10 left-0 right-0 mt-1 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800">
                <button
                  v-for="candidate in shareCandidates"
                  :key="candidate._id"
                  class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                  @click="selectShareUser(candidate)"
                >
                  <span class="h-7 w-7 rounded-full bg-indigo-600 text-center leading-7 text-xs font-bold text-white">{{ candidate.username[0]?.toUpperCase() }}</span>
                  <span><strong>{{ candidate.username }}</strong><span v-if="candidate.name"> · {{ candidate.name }}</span></span>
                </button>
              </div>
              <p v-if="selectedShareUser" class="mt-2 text-xs text-gray-500">Selected: <strong>{{ selectedShareUser.username }}</strong></p>
            </div>
          </div>
        </div>

        <div class="space-y-4">
          <div class="card">
            <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-3 text-sm uppercase tracking-wide">
              Details
            </h3>
            <dl class="space-y-3 text-sm">
              <div>
                <dt class="text-gray-500 dark:text-gray-400">Owner</dt>
                <dd class="font-medium">
                  <NuxtLink
                    :to="`/profile/${todo.owner.username}`"
                    class="text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    {{ todo.owner.username }}
                  </NuxtLink>
                </dd>
              </div>
              <div v-if="todo.dueDate">
                <dt class="text-gray-500 dark:text-gray-400">Due Date</dt>
                <dd class="font-medium" :class="{ 'text-red-500': todo.isOverdue }">
                  {{ formatDate(todo.dueDate) }}
                </dd>
              </div>
              <div v-if="todo.completedAt">
                <dt class="text-gray-500 dark:text-gray-400">Completed</dt>
                <dd class="font-medium text-green-600">{{ formatDate(todo.completedAt) }}</dd>
              </div>
              <div>
                <dt class="text-gray-500 dark:text-gray-400">Created</dt>
                <dd class="font-medium">{{ formatDate(todo.createdAt) }}</dd>
              </div>
              <div>
                <dt class="text-gray-500 dark:text-gray-400">Updated</dt>
                <dd class="font-medium">{{ formatDate(todo.updatedAt) }}</dd>
              </div>
            </dl>
          </div>

          <NuxtLink :to="backTarget" class="btn-outline w-full text-center">← Go Back</NuxtLink>
        </div>
      </div>
    </div>

    <TodoForm v-model="showEdit" :edit-todo="todo" @submitted="refreshTodo" />
  </div>
</template>

<script setup lang="ts">
import { useTodosStore } from '~/stores/todos'
import type { Todo } from '~/stores/todos'
import { useAuthStore } from '~/stores/auth'
import { useToast } from '~/composables/useToast'

definePageMeta({ layout: 'default' })

const route = useRoute()
const todosStore = useTodosStore()
const authStore = useAuthStore()
const toast = useToast()

const showEdit = ref(false)
const shareQuery = ref('')
const sharePermission = ref<'view' | 'edit'>('view')
const shareCandidates = ref<Array<{ _id: string; username: string; name?: string }>>([])
const selectedShareUser = ref<{ _id: string; username: string; name?: string } | null>(null)
const loading = ref(true)
const loadError = ref('')

const todo = computed(() => todosStore.selectedTodo)
const backTarget = computed(() => {
  if (authStore.isLoggedIn) return '/todos'
  return todo.value?.owner?.username ? `/profile/${todo.value.owner.username}` : '/'
})
const isOwner = computed(() =>
  todo.value?.owner._id === authStore.user?._id
)
const hasEditPermission = computed(() =>
  todo.value?.sharedWith?.some(
    (s: Todo['sharedWith'][number]) => s.user._id === authStore.user?._id && s.permission === 'edit'
  ) ?? false
)

const statusLabel = computed(() => {
  const map: Record<string, string> = {
    pending: '⏳ Pending',
    'in-progress': '🔄 In Progress',
    completed: '✅ Completed',
  }
  return todo.value ? map[todo.value.status] : ''
})

useHead(() => ({ title: todo.value?.title || 'Todo Detail' }))

const getErrorMessage = (error: any) =>
  error?.data?.message || error?.message || 'Please try again.'

const loadTodo = async () => {
  loading.value = true
  loadError.value = ''
  try {
    await todosStore.fetchTodo(route.params.id as string)
  } catch (error: any) {
    loadError.value = getErrorMessage(error)
  } finally {
    loading.value = false
  }
}

onMounted(loadTodo)
watch(() => route.params.id, () => loadTodo())

const refreshTodo = async () => {
  try {
    await todosStore.fetchTodo(route.params.id as string)
  } catch (error: any) {
    loadError.value = getErrorMessage(error)
    toast.error(loadError.value)
  }
}

const changeStatus = async (status: string) => {
  if (!todo.value) return
  try {
    await todosStore.updateTodo(todo.value._id, { status })
    toast.success('Status updated!')
    await refreshTodo()
  } catch (error: any) {
    toast.error(getErrorMessage(error))
  }
}

const handleDelete = async () => {
  if (!todo.value || !confirm(`Delete "${todo.value.title}"?`)) return
  try {
    await todosStore.deleteTodo(todo.value._id)
    toast.success('Todo deleted.')
    await navigateTo('/todos')
  } catch (error: any) {
    toast.error(getErrorMessage(error))
  }
}

const handleShare = async () => {
  if (!todo.value || !selectedShareUser.value) {
    toast.error('Choose a user from the search results first.')
    return
  }
  try {
    await todosStore.shareTodo(todo.value._id, selectedShareUser.value._id, sharePermission.value)
    toast.success('Todo shared!')
    shareQuery.value = ''
    selectedShareUser.value = null
    shareCandidates.value = []
    await refreshTodo()
  } catch (err: any) {
    toast.error(err.data?.message || 'Failed to share.')
  }
}

let searchTimer: ReturnType<typeof setTimeout> | undefined
const searchShareUsers = () => {
  selectedShareUser.value = null
  clearTimeout(searchTimer)
  if (shareQuery.value.trim().length < 2) {
    shareCandidates.value = []
    return
  }
  searchTimer = setTimeout(async () => {
    try {
      shareCandidates.value = await todosStore.searchUsers(shareQuery.value.trim())
    } catch {
      shareCandidates.value = []
    }
  }, 250)
}

const selectShareUser = (user: { _id: string; username: string; name?: string }) => {
  selectedShareUser.value = user
  shareQuery.value = user.name ? `${user.username} · ${user.name}` : user.username
  shareCandidates.value = []
}

const removeShare = async (userId: string) => {
  if (!todo.value) return
  try {
    await todosStore.unshareTodo(todo.value._id, userId)
    await refreshTodo()
    toast.success('Share removed.')
  } catch (error: any) {
    toast.error(getErrorMessage(error))
  }
}

onBeforeUnmount(() => clearTimeout(searchTimer))

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('tr-TR', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}
</script>
