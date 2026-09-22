<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">My Todos</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          {{ todosStore.pagination.total }} total • {{ todosStore.stats.completed }} completed
        </p>
      </div>
      <div class="flex items-center gap-3">
        <div class="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <button
            @click="viewMode = 'grid'"
            class="p-2 transition-colors"
            :class="viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-500'"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            @click="viewMode = 'list'"
            class="p-2 transition-colors"
            :class="viewMode === 'list' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-500'"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        <button @click="showForm = true" class="btn-primary">➕ New Todo</button>
      </div>
    </div>

    <div class="flex gap-1 mb-4 border-b border-gray-200 dark:border-gray-700">
      <button
        @click="activeTab = 'my'"
        class="px-4 py-2 text-sm font-medium transition-colors border-b-2"
        :class="activeTab === 'my'
          ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
          : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'"
      >
        My Todos ({{ todosStore.pagination.total }})
      </button>
      <button
        @click="activeTab = 'shared'"
        class="px-4 py-2 text-sm font-medium transition-colors border-b-2"
        :class="activeTab === 'shared'
          ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
          : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'"
      >
        Shared With Me ({{ todosStore.sharedTodos.length }})
      </button>
    </div>

    <TodoFilter v-if="activeTab === 'my'" @filter="onFilter" class="mb-6" />

    <div
      v-if="loadError"
      class="mb-6 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
      role="alert"
    >
      <span>{{ loadError }}</span>
      <button type="button" class="btn-outline shrink-0" @click="loadInitialData">Try again</button>
    </div>

    <AppLoadingSpinner v-if="pageLoading || todosStore.loading" size="lg" full-page label="Loading todos..." />

    <div v-else-if="activeTodos.length === 0 && !todosStore.loading" class="card text-center py-16">
      <div class="text-5xl mb-4">{{ activeTab === 'shared' ? '📨' : '📋' }}</div>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {{ activeTab === 'shared' ? 'No shared todos' : 'No todos found' }}
      </h3>
      <p class="text-gray-400 mb-6">
        {{ activeTab === 'shared' ? 'No one has shared any todos with you yet.' : 'Create your first todo to get started!' }}
      </p>
      <button v-if="activeTab === 'my'" @click="showForm = true" class="btn-primary">
        Create First Todo
      </button>
    </div>

    <div
      v-else
      :class="viewMode === 'grid'
        ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
        : 'space-y-3'"
    >
      <TodoCard
        v-for="todo in activeTodos"
        :key="todo._id"
        :todo="todo"
        :readonly="activeTab === 'shared'"
        @click="navigateTo(`/todos/${todo._id}`)"
        @toggle="handleToggle"
        @edit="openEdit"
        @delete="handleDelete"
        class="cursor-pointer"
      />
    </div>

    <div v-if="activeTab === 'my' && todosStore.pagination.totalPages > 1" class="mt-8 flex items-center justify-center gap-2">
      <button
        :disabled="currentPage === 1"
        @click="goToPage(currentPage - 1)"
        class="btn-outline disabled:opacity-40"
      >← Prev</button>

      <div class="flex gap-1">
        <button
          v-for="page in visiblePages"
          :key="page"
          @click="goToPage(page)"
          class="w-9 h-9 rounded-lg text-sm font-medium transition-colors"
          :class="page === currentPage
            ? 'bg-indigo-600 text-white'
            : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300'"
        >{{ page }}</button>
      </div>

      <button
        :disabled="currentPage === todosStore.pagination.totalPages"
        @click="goToPage(currentPage + 1)"
        class="btn-outline disabled:opacity-40"
      >Next →</button>
    </div>

    <TodoForm v-model="showForm" :edit-todo="editingTodo" @submitted="onSubmitted" />
  </div>
</template>

<script setup lang="ts">
import { useTodosStore } from '~/stores/todos'
import type { Todo } from '~/stores/todos'
import { useToast } from '~/composables/useToast'

definePageMeta({ middleware: 'auth', layout: 'default' })
useHead({ title: 'My Todos' })

const todosStore = useTodosStore()
const toast = useToast()
const route = useRoute()

const showForm = ref(false)
const editingTodo = ref<Todo | null>(null)
const viewMode = ref<'grid' | 'list'>('grid')
const currentPage = ref(1)
const activeFilters = ref<Record<string, string>>({})
const pageLoading = ref(true)
const loadError = ref('')
const activeTab = ref<'my' | 'shared'>(
  route.query.tab === 'shared' ? 'shared' : 'my'
)

const activeTodos = computed(() =>
  activeTab.value === 'my' ? todosStore.todos : todosStore.sharedTodos
)

const visiblePages = computed(() => {
  const total = todosStore.pagination.totalPages
  const current = currentPage.value
  const pages = []
  for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) {
    pages.push(i)
  }
  return pages
})

const loadTodos = async () => {
  await todosStore.fetchTodos({
    page: currentPage.value,
    limit: 9,
    ...activeFilters.value,
  })
}

const getErrorMessage = (error: any) =>
  error?.data?.message || error?.message || 'Todos could not be loaded.'

const loadTodosSafely = async () => {
  loadError.value = ''
  try {
    await loadTodos()
  } catch (error: any) {
    loadError.value = getErrorMessage(error)
  }
}

const loadInitialData = async () => {
  pageLoading.value = true
  loadError.value = ''

  const results = await Promise.allSettled([
    loadTodos(),
    todosStore.fetchSharedTodos(),
    todosStore.fetchStats(),
  ])
  const failure = results.find((result) => result.status === 'rejected')
  if (failure?.status === 'rejected') {
    loadError.value = getErrorMessage(failure.reason)
  }

  pageLoading.value = false
}

onMounted(loadInitialData)

const onFilter = async (filters: Record<string, string>) => {
  activeFilters.value = filters
  currentPage.value = 1
  await loadTodosSafely()
}

const goToPage = async (page: number) => {
  currentPage.value = page
  await loadTodosSafely()
  if (!loadError.value) window.scrollTo({ top: 0, behavior: 'smooth' })
}

const openEdit = (todo: Todo) => {
  editingTodo.value = todo
  showForm.value = true
}

const handleToggle = async (todo: Todo) => {
  try {
    await todosStore.toggleStatus(todo._id, todo.status)
    await todosStore.fetchStats()
    toast.success('Status updated! ✅')
  } catch (error: any) {
    toast.error(getErrorMessage(error))
  }
}

const handleDelete = async (todo: Todo) => {
  if (!confirm(`Delete "${todo.title}"?`)) return
  try {
    await todosStore.deleteTodo(todo._id)
    await Promise.all([loadTodos(), todosStore.fetchStats()])
    toast.success('Todo deleted.')
  } catch (error: any) {
    loadError.value = getErrorMessage(error)
    toast.error(loadError.value)
  }
}

const onSubmitted = async () => {
  editingTodo.value = null
  await Promise.all([loadTodosSafely(), todosStore.fetchStats()])
}

watch(showForm, (val: boolean) => {
  if (!val) editingTodo.value = null
})
</script>
