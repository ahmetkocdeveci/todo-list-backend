<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
    <div class="flex flex-col sm:flex-row gap-3">
      <div class="relative flex-1">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          v-model="localFilters.search"
          type="text"
          class="input pl-9"
          placeholder="Search todos..."
          @input="debouncedEmit"
        />
      </div>

      <div class="flex flex-wrap gap-2">
        <select v-model="localFilters.status" class="input w-auto" @change="emitFilters">
          <option value="">All Status</option>
          <option value="pending">⏳ Pending</option>
          <option value="in-progress">🔄 In Progress</option>
          <option value="completed">✅ Completed</option>
        </select>

        <select v-model="localFilters.priority" class="input w-auto" @change="emitFilters">
          <option value="">All Priority</option>
          <option value="low">🔵 Low</option>
          <option value="medium">🟡 Medium</option>
          <option value="high">🟠 High</option>
          <option value="urgent">🔴 Urgent</option>
        </select>

        <input
          v-model="localFilters.category"
          type="text"
          class="input w-36"
          placeholder="Category"
          maxlength="50"
          @input="debouncedEmit"
        />

        <select v-model="localFilters.sort" class="input w-auto" @change="emitFilters">
          <option value="-createdAt">Newest First</option>
          <option value="createdAt">Oldest First</option>
          <option value="dueDate">Due Date ↑</option>
          <option value="-dueDate">Due Date ↓</option>
          <option value="-priority">Priority ↑</option>
          <option value="title">Title A-Z</option>
        </select>
      </div>

      <button
        v-if="hasActiveFilters"
        @click="clearFilters"
        class="btn-outline text-sm whitespace-nowrap"
      >
        Clear Filters
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'

const emit = defineEmits<{
  filter: [filters: Record<string, string>]
}>()

const localFilters = reactive({
  search: '',
  status: '',
  priority: '',
  category: '',
  sort: '-createdAt',
})

const hasActiveFilters = computed(() => {
  return localFilters.search || localFilters.status || localFilters.priority || localFilters.category || localFilters.sort !== '-createdAt'
})

const emitFilters = () => {
  const filters: Record<string, string> = {}
  if (localFilters.search) filters.search = localFilters.search
  if (localFilters.status) filters.status = localFilters.status
  if (localFilters.priority) filters.priority = localFilters.priority
  if (localFilters.category) filters.category = localFilters.category
  if (localFilters.sort) filters.sort = localFilters.sort
  emit('filter', filters)
}

const debouncedEmit = useDebounceFn(emitFilters, 300)

const clearFilters = () => {
  localFilters.search = ''
  localFilters.status = ''
  localFilters.priority = ''
  localFilters.category = ''
  localFilters.sort = '-createdAt'
  emitFilters()
}
</script>
