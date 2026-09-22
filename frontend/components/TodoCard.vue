<template>
  <div
    class="card group hover:shadow-md transition-all duration-200 animate-fade-in"
    :class="{ 'border-l-4': true, [priorityBorderColor]: true }"
  >
    <div class="flex items-start justify-between gap-3 mb-3">
      <div class="flex-1 min-w-0">
        <h3
          class="font-semibold text-gray-900 dark:text-gray-100 truncate text-sm sm:text-base"
          :class="{ 'line-through text-gray-400': todo.status === 'completed' }"
        >
          {{ todo.title }}
        </h3>
        <p v-if="todo.description" class="mt-0.5 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
          {{ todo.description }}
        </p>
      </div>

      <img
        v-if="todo.image?.url"
        :src="todo.image.url"
        :alt="todo.title"
        class="w-12 h-12 rounded-lg object-cover flex-shrink-0"
      />
    </div>

    <div class="flex flex-wrap gap-1.5 mb-3">
      <span :class="`badge-${todo.status}`">{{ statusLabel }}</span>
      <span :class="`badge-${todo.priority}`">{{ todo.priority.toUpperCase() }}</span>
      <span class="badge bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
        {{ todo.category }}
      </span>
      <span v-if="todo.isOverdue" class="badge bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
        ⚠️ Overdue
      </span>
    </div>

    <div v-if="todo.tags?.length" class="flex flex-wrap gap-1 mb-3">
      <span
        v-for="tag in todo.tags"
        :key="tag"
        class="text-xs px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600
               dark:bg-indigo-900/30 dark:text-indigo-400"
      >
        #{{ tag }}
      </span>
    </div>

    <div class="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
      <div class="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span v-if="todo.dueDate">{{ formatDate(todo.dueDate) }}</span>
        <span v-else class="italic">No due date</span>
      </div>

      <div
        v-if="!readonly"
        class="flex items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
      >
        <button
          @click.stop="$emit('toggle', todo)"
          class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          :title="todo.status === 'completed' ? 'Mark as pending' : 'Mark as completed'"
        >
          <svg class="w-4 h-4" :class="todo.status === 'completed' ? 'text-green-500' : 'text-gray-400'"
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </button>

        <button
          @click.stop="$emit('edit', todo)"
          class="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
          title="Edit"
        >
          <svg class="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>

        <button
          @click.stop="$emit('delete', todo)"
          class="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
          title="Delete"
        >
          <svg class="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>

    <div v-if="todo.sharedWith?.length" class="mt-2 flex items-center gap-1 text-xs text-gray-400">
      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      Shared with {{ todo.sharedWith.length }} user(s)
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Todo } from '~/stores/todos'

const props = withDefaults(defineProps<{ todo: Todo; readonly?: boolean }>(), { readonly: false })
defineEmits<{
  toggle: [todo: Todo]
  edit: [todo: Todo]
  delete: [todo: Todo]
}>()

const statusLabel = computed(() => {
  const labels: Record<string, string> = {
    pending: '⏳ Pending',
    'in-progress': '🔄 In Progress',
    completed: '✅ Completed',
  }
  return labels[props.todo.status] || props.todo.status
})

const priorityBorderColor = computed(() => {
  const colors: Record<string, string> = {
    low: 'border-l-gray-300',
    medium: 'border-l-blue-400',
    high: 'border-l-orange-400',
    urgent: 'border-l-red-500',
  }
  return colors[props.todo.priority] || 'border-l-gray-300'
})

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
</script>
