<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
        👋 Welcome back, {{ user?.name || user?.username }}!
      </h1>
      <p class="text-gray-500 dark:text-gray-400 mt-1">Here's what's on your plate today.</p>
    </div>

    <div
      v-if="loadError"
      class="mb-6 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
      role="alert"
    >
      <span>{{ loadError }}</span>
      <button type="button" class="btn-outline shrink-0" @click="loadDashboard">Try again</button>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="card text-center hover:shadow-md transition-shadow"
        :class="stat.bgClass"
      >
        <div class="text-2xl mb-1">{{ stat.icon }}</div>
        <div class="text-2xl font-bold" :class="stat.textClass">{{ stat.value }}</div>
        <div class="text-sm text-gray-500 dark:text-gray-400">{{ stat.label }}</div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <div class="lg:col-span-2">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Recent Todos</h2>
          <NuxtLink to="/todos" class="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
            View all →
          </NuxtLink>
        </div>

        <AppLoadingSpinner v-if="todosStore.loading" />

        <div v-else-if="recentTodos.length" class="space-y-3">
          <TodoCard
            v-for="todo in recentTodos"
            :key="todo._id"
            :todo="todo"
            @toggle="handleToggle"
            @edit="openEdit"
            @delete="handleDelete"
          />
        </div>

        <div v-else class="card text-center py-12 text-gray-400">
          <div class="text-4xl mb-3">📋</div>
          <p>No todos yet.</p>
          <button @click="showForm = true" class="btn-primary mt-4">Create your first todo</button>
        </div>
      </div>

      <div class="space-y-4">
        <button @click="showForm = true" class="btn-primary w-full py-3 text-base">
          ➕ New Todo
        </button>

        <div class="card">
          <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-3">📨 Shared With Me</h3>
          <div v-if="todosStore.sharedTodos.length">
            <div
              v-for="shared in todosStore.sharedTodos.slice(0, 3)"
              :key="shared._id"
              class="flex items-center gap-2 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
            >
              <span class="text-xs flex-1 truncate text-gray-600 dark:text-gray-300">{{ shared.title }}</span>
              <span class="text-xs text-gray-400">by {{ shared.owner.username }}</span>
            </div>
            <NuxtLink to="/todos?tab=shared" class="text-xs text-indigo-600 dark:text-indigo-400 hover:underline mt-2 block">
              View all shared →
            </NuxtLink>
          </div>
          <p v-else class="text-sm text-gray-400">No todos shared with you yet.</p>
        </div>

        <div class="card">
          <div class="flex items-center gap-3">
            <img
              v-if="user?.avatar?.url"
              :src="user.avatar.url"
              :alt="user?.username"
              class="w-12 h-12 rounded-full object-cover"
            />
            <div v-else class="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center
                               text-white font-bold text-lg">
              {{ user?.username?.[0]?.toUpperCase() }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-gray-900 dark:text-gray-100 truncate">
                {{ user?.name || user?.username }}
              </p>
              <p class="text-sm text-gray-400 truncate">{{ user?.email }}</p>
            </div>
          </div>
          <NuxtLink
            :to="`/profile/${user?.username}`"
            class="btn-outline w-full mt-3 text-sm"
          >View Profile</NuxtLink>
        </div>
      </div>
    </div>

    <TodoForm v-model="showForm" :edit-todo="editingTodo" @submitted="onSubmitted" />
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { useTodosStore } from '~/stores/todos'
import type { Todo } from '~/stores/todos'
import { useToast } from '~/composables/useToast'

definePageMeta({ middleware: 'auth', layout: 'default' })
useHead({ title: 'Dashboard' })

const authStore = useAuthStore()
const todosStore = useTodosStore()
const toast = useToast()

const { user } = storeToRefs(authStore)
const showForm = ref(false)
const editingTodo = ref<Todo | null>(null)

const recentTodos = computed(() => todosStore.todos.slice(0, 5))

const stats = computed(() => [
  {
    icon: '📋',
    label: 'Total',
    value: todosStore.stats.total,
    bgClass: '',
    textClass: 'text-gray-900 dark:text-white',
  },
  {
    icon: '⏳',
    label: 'Pending',
    value: todosStore.stats.pending,
    bgClass: '',
    textClass: 'text-yellow-600',
  },
  {
    icon: '✅',
    label: 'Completed',
    value: todosStore.stats.completed,
    bgClass: '',
    textClass: 'text-green-600',
  },
  {
    icon: '⚠️',
    label: 'Overdue',
    value: todosStore.stats.overdue,
    bgClass: '',
    textClass: 'text-red-600',
  },
])

const loadError = ref('')

const getErrorMessage = (error: any) =>
  error?.data?.message || error?.message || 'Dashboard data could not be loaded.'

const loadDashboard = async () => {
  loadError.value = ''
  try {
    await Promise.all([
      todosStore.fetchTodos({ limit: 5 }),
      todosStore.fetchSharedTodos(),
      todosStore.fetchStats(),
    ])
  } catch (error: any) {
    loadError.value = getErrorMessage(error)
  }
}

onMounted(loadDashboard)

const openEdit = (todo: Todo) => {
  editingTodo.value = todo
  showForm.value = true
}

const handleToggle = async (todo: Todo) => {
  try {
    await todosStore.toggleStatus(todo._id, todo.status)
    await todosStore.fetchStats()
    toast.success('Status updated!')
  } catch (error: any) {
    toast.error(getErrorMessage(error))
  }
}

const handleDelete = async (todo: Todo) => {
  if (!confirm(`Delete "${todo.title}"?`)) return
  try {
    await todosStore.deleteTodo(todo._id)
    await todosStore.fetchStats()
    toast.success('Todo deleted.')
  } catch (error: any) {
    toast.error(getErrorMessage(error))
  }
}

const onSubmitted = async () => {
  editingTodo.value = null
  await loadDashboard()
}

watch(showForm, (val: boolean) => {
  if (!val) editingTodo.value = null
})
</script>
