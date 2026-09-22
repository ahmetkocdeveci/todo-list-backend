import { defineStore } from 'pinia'

interface TodoImage {
  url: string
  publicId: string
}

interface SharedWith {
  user: { _id: string; username: string; name?: string; avatar: TodoImage }
  permission: 'view' | 'edit'
}

export interface Todo {
  _id: string
  title: string
  description?: string
  status: 'pending' | 'in-progress' | 'completed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  category: string
  isPublic: boolean
  dueDate?: string
  completedAt?: string
  image?: TodoImage
  owner: { _id: string; username: string; name?: string; avatar: TodoImage }
  sharedWith: SharedWith[]
  tags: string[]
  isOverdue: boolean
  createdAt: string
  updatedAt: string
}

interface PaginationMeta {
  total: number
  totalPages: number
  currentPage: number
}

interface TodoStats {
  total: number
  pending: number
  inProgress: number
  completed: number
  overdue: number
}

interface TodosState {
  todos: Todo[]
  sharedTodos: Todo[]
  selectedTodo: Todo | null
  pagination: PaginationMeta
  stats: TodoStats
  loading: boolean
  error: string | null
}

export const useTodosStore = defineStore('todos', {
  state: (): TodosState => ({
    todos: [],
    sharedTodos: [],
    selectedTodo: null,
    pagination: { total: 0, totalPages: 1, currentPage: 1 },
    stats: { total: 0, pending: 0, inProgress: 0, completed: 0, overdue: 0 },
    loading: false,
    error: null,
  }),

  getters: {
    pendingCount: (state) => state.todos.filter((t) => t.status === 'pending').length,
    completedCount: (state) => state.todos.filter((t) => t.status === 'completed').length,
    overdueCount: (state) => state.todos.filter((t) => t.isOverdue).length,
  },

  actions: {
    async fetchStats() {
      const config = useRuntimeConfig()
      const data = await $fetch<{ success: boolean; stats: TodoStats }>(
        `${config.public.apiBase}/todos/stats`,
        { credentials: 'include' }
      )
      this.stats = data.stats
      return data.stats
    },

    async fetchTodos(params: Record<string, string | number> = {}) {
      const config = useRuntimeConfig()
      this.loading = true
      this.error = null
      try {
        const query = new URLSearchParams(params as Record<string, string>).toString()
        const data = await $fetch<{
          success: boolean
          todos: Todo[]
          total: number
          totalPages: number
          currentPage: number
        }>(`${config.public.apiBase}/todos?${query}`, { credentials: 'include' })

        this.todos = data.todos
        this.pagination = {
          total: data.total,
          totalPages: data.totalPages,
          currentPage: data.currentPage,
        }
        return data
      } catch (err: any) {
        this.error = err.data?.message || 'Failed to load todos.'
        throw err
      } finally {
        this.loading = false
      }
    },

    async fetchTodo(id: string) {
      const config = useRuntimeConfig()
      this.loading = true
      this.selectedTodo = null
      try {
        const data = await $fetch<{ success: boolean; todo: Todo }>(
          `${config.public.apiBase}/todos/${id}`,
          { credentials: 'include' }
        )
        this.selectedTodo = data.todo
        return data.todo
      } finally {
        this.loading = false
      }
    },

    async createTodo(formData: FormData | Record<string, any>) {
      const config = useRuntimeConfig()
      this.loading = true
      try {
        const data = await $fetch<{ success: boolean; todo: Todo }>(
          `${config.public.apiBase}/todos`,
          {
            method: 'POST',
            body: formData,
            credentials: 'include',
          }
        )
        this.todos.unshift(data.todo)
        return data.todo
      } finally {
        this.loading = false
      }
    },

    async updateTodo(id: string, updates: FormData | Record<string, any>) {
      const config = useRuntimeConfig()
      this.loading = true
      try {
        const data = await $fetch<{ success: boolean; todo: Todo }>(
          `${config.public.apiBase}/todos/${id}`,
          {
            method: 'PATCH',
            body: updates,
            credentials: 'include',
          }
        )
        const index = this.todos.findIndex((t) => t._id === id)
        if (index !== -1) this.todos[index] = data.todo
        if (this.selectedTodo?._id === id) this.selectedTodo = data.todo
        return data.todo
      } finally {
        this.loading = false
      }
    },

    async deleteTodo(id: string) {
      const config = useRuntimeConfig()
      this.loading = true
      try {
        await $fetch(`${config.public.apiBase}/todos/${id}`, {
          method: 'DELETE',
          credentials: 'include',
        })
        this.todos = this.todos.filter((t) => t._id !== id)
      } finally {
        this.loading = false
      }
    },

    async fetchSharedTodos() {
      const config = useRuntimeConfig()
      this.loading = true
      try {
        const data = await $fetch<{ success: boolean; todos: Todo[] }>(
          `${config.public.apiBase}/todos/shared`,
          { credentials: 'include' }
        )
        this.sharedTodos = data.todos
      } finally {
        this.loading = false
      }
    },

    async shareTodo(todoId: string, userId: string, permission: 'view' | 'edit' = 'view') {
      const config = useRuntimeConfig()
      const data = await $fetch<{ success: boolean; todo: Todo }>(
        `${config.public.apiBase}/todos/${todoId}/share`,
        {
          method: 'POST',
          body: { userId, permission },
          credentials: 'include',
        }
      )
      const index = this.todos.findIndex((t) => t._id === todoId)
      if (index !== -1) this.todos[index] = data.todo
      return data.todo
    },

    async unshareTodo(todoId: string, userId: string) {
      const config = useRuntimeConfig()
      const data = await $fetch<{ success: boolean; todo: Todo }>(
        `${config.public.apiBase}/todos/${todoId}/share/${userId}`,
        { method: 'DELETE', credentials: 'include' }
      )
      const index = this.todos.findIndex((todo) => todo._id === todoId)
      if (index !== -1) this.todos[index] = data.todo
      if (this.selectedTodo?._id === todoId) this.selectedTodo = data.todo
      return data.todo
    },

    async searchUsers(query: string) {
      const config = useRuntimeConfig()
      const data = await $fetch<{ success: boolean; users: Array<{ _id: string; username: string; name?: string }> }>(
        `${config.public.apiBase}/users/search?q=${encodeURIComponent(query)}`,
        { credentials: 'include' }
      )
      return data.users
    },

    async toggleStatus(id: string, currentStatus: string) {
      const nextStatus =
        currentStatus === 'completed' ? 'pending' : currentStatus === 'pending' ? 'in-progress' : 'completed'
      return this.updateTodo(id, { status: nextStatus })
    },

    clearError() {
      this.error = null
    },
  },
})
