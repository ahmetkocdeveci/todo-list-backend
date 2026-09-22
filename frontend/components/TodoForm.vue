<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="$emit('update:modelValue', false)"
      >
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" />

        <div
          class="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl
                 border border-gray-200 dark:border-gray-700 animate-slide-up overflow-y-auto max-h-[90vh]"
        >
          <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 class="text-lg font-bold dark:text-gray-100">
              {{ editTodo ? '✏️ Edit Todo' : '➕ New Todo' }}
            </h2>
            <button
              @click="$emit('update:modelValue', false)"
              class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <svg class="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
            <div>
              <label class="label" for="title">Title *</label>
              <input
                id="title"
                v-model="form.title"
                type="text"
                class="input"
                placeholder="What needs to be done?"
                required
                maxlength="100"
              />
              <p v-if="errors.title" class="mt-1 text-xs text-red-500">{{ errors.title }}</p>
            </div>

            <div>
              <label class="label" for="description">Description</label>
              <textarea
                id="description"
                v-model="form.description"
                class="input resize-none"
                placeholder="Add some details..."
                rows="3"
                maxlength="1000"
              />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label" for="status">Status</label>
                <select id="status" v-model="form.status" class="input">
                  <option value="pending">⏳ Pending</option>
                  <option value="in-progress">🔄 In Progress</option>
                  <option value="completed">✅ Completed</option>
                </select>
              </div>
              <div>
                <label class="label" for="priority">Priority</label>
                <select id="priority" v-model="form.priority" class="input">
                  <option value="low">🔵 Low</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="high">🟠 High</option>
                  <option value="urgent">🔴 Urgent</option>
                </select>
              </div>
            </div>

            <label class="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 cursor-pointer">
              <input v-model="form.isPublic" type="checkbox" class="mt-0.5 h-4 w-4 accent-indigo-600" />
              <span>
                <span class="block text-sm font-medium text-gray-800 dark:text-gray-100">Show on my profile</span>
                <span class="block text-xs text-gray-500 dark:text-gray-400">Private by default. Shared collaborators can still access it.</span>
              </span>
            </label>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label" for="category">Category</label>
                <input
                  id="category"
                  v-model="form.category"
                  type="text"
                  class="input"
                  placeholder="e.g. Work, Personal"
                  maxlength="50"
                />
              </div>
              <div>
                <label class="label" for="dueDate">Due Date</label>
                <input
                  id="dueDate"
                  v-model="form.dueDate"
                  type="datetime-local"
                  class="input"
                  :min="editTodo ? undefined : minDate"
                />
              </div>
            </div>

            <div>
              <label class="label">Tags</label>
              <div class="flex flex-wrap gap-1.5 mb-2">
                <span
                  v-for="(tag, i) in form.tags"
                  :key="i"
                  class="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs
                         bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                >
                  #{{ tag }}
                  <button type="button" @click="removeTag(i)" class="hover:text-red-500">×</button>
                </span>
              </div>
              <input
                v-model="tagInput"
                type="text"
                class="input"
                placeholder="Add a tag and press Enter"
                @keydown.enter.prevent="addTag"
                maxlength="30"
              />
            </div>

            <div>
              <label class="label">Image (optional)</label>
              <div
                class="border-2 border-dashed border-gray-300 dark:border-gray-600
                       rounded-lg p-4 text-center cursor-pointer hover:border-indigo-400
                       dark:hover:border-indigo-500 transition-colors"
                @click="fileInput?.click()"
                @dragover.prevent
                @drop.prevent="handleDrop"
              >
                <div v-if="imagePreview">
                  <img :src="imagePreview" alt="Preview" class="mx-auto max-h-32 rounded-lg object-cover" />
                  <button
                    type="button"
                    @click.stop="clearImage"
                    class="mt-2 text-xs text-red-500 hover:text-red-700"
                  >Remove</button>
                </div>
                <div v-else-if="editTodo?.image?.url">
                  <img :src="editTodo.image.url" alt="Current" class="mx-auto max-h-32 rounded-lg object-cover" />
                  <p class="text-xs text-gray-400 mt-1">Click to replace</p>
                </div>
                <div v-else class="text-gray-400 dark:text-gray-500">
                  <svg class="w-8 h-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p class="text-xs">Click or drag to upload (max 5MB)</p>
                </div>
              </div>
              <input
                ref="fileInput"
                type="file"
                accept="image/*"
                class="hidden"
                @change="handleFileChange"
              />
            </div>

            <p v-if="globalError" class="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
              {{ globalError }}
            </p>

            <div class="flex gap-3 pt-2">
              <button type="button" @click="$emit('update:modelValue', false)" class="btn-outline flex-1">
                Cancel
              </button>
              <button type="submit" class="btn-primary flex-1" :disabled="loading">
                <AppLoadingSpinner v-if="loading" size="sm" />
                <span>{{ editTodo ? 'Update' : 'Create' }} Todo</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { Todo } from '~/stores/todos'
import { useTodosStore } from '~/stores/todos'
import { useToast } from '~/composables/useToast'

const props = defineProps<{
  modelValue: boolean
  editTodo?: Todo | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submitted: []
}>()

const todosStore = useTodosStore()
const toast = useToast()
const { loading } = storeToRefs(todosStore)

const fileInput = ref<HTMLInputElement | null>(null)
const imagePreview = ref<string | null>(null)
const selectedFile = ref<File | null>(null)
const tagInput = ref('')
const globalError = ref('')
const errors = ref<Record<string, string>>({})

const form = reactive({
  title: '',
  description: '',
  status: 'pending' as 'pending' | 'in-progress' | 'completed',
  priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
  category: 'general',
  isPublic: false,
  dueDate: '',
  tags: [] as string[],
})

const toLocalDateTimeInput = (value: string | Date) => {
  const date = new Date(value)
  const localTime = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return localTime.toISOString().slice(0, 16)
}

const clearImage = () => {
  if (imagePreview.value?.startsWith('blob:')) {
    URL.revokeObjectURL(imagePreview.value)
  }
  selectedFile.value = null
  imagePreview.value = null
  if (fileInput.value) fileInput.value.value = ''
}

const resetForm = () => {
  form.title = ''
  form.description = ''
  form.status = 'pending'
  form.priority = 'medium'
  form.category = 'general'
  form.isPublic = false
  form.dueDate = ''
  form.tags = []
  tagInput.value = ''
  clearImage()
  errors.value = {}
  globalError.value = ''
}

watch(
  [() => props.editTodo, () => props.modelValue],
  ([todo, isOpen]: [Todo | null | undefined, boolean]) => {
    if (!isOpen) return

    if (todo) {
      form.title = todo.title
      form.description = todo.description || ''
      form.status = todo.status
      form.priority = todo.priority
      form.category = todo.category
      form.isPublic = todo.isPublic
      form.dueDate = todo.dueDate
        ? toLocalDateTimeInput(todo.dueDate)
        : ''
      form.tags = [...todo.tags]
    } else {
      resetForm()
    }
  },
  { immediate: true }
)

const minDate = computed(() => toLocalDateTimeInput(new Date()))

const addTag = () => {
  const tag = tagInput.value.trim().toLowerCase()
  if (tag && !form.tags.includes(tag) && form.tags.length < 10) {
    form.tags.push(tag)
    tagInput.value = ''
  }
}

const removeTag = (index: number) => {
  form.tags.splice(index, 1)
}

const handleFileChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) setFile(file)
}

const handleDrop = (e: DragEvent) => {
  const file = e.dataTransfer?.files[0]
  if (file && file.type.startsWith('image/')) setFile(file)
}

const setFile = (file: File) => {
  if (!file.type.startsWith('image/')) {
    toast.error('Please select a valid image file.')
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    toast.error('Image must be smaller than 5MB.')
    return
  }
  if (imagePreview.value?.startsWith('blob:')) {
    URL.revokeObjectURL(imagePreview.value)
  }
  selectedFile.value = file
  imagePreview.value = URL.createObjectURL(file)
}

onBeforeUnmount(clearImage)

const buildPayload = () => {
  const payload: Record<string, string | boolean | string[] | null> = {
    title: form.title.trim(),
    description: form.description,
    status: form.status,
    priority: form.priority,
    category: form.category.trim() || 'general',
    isPublic: form.isPublic,
    tags: [...form.tags],
  }

  if (form.dueDate) {
    payload.dueDate = new Date(form.dueDate).toISOString()
  } else if (props.editTodo) {
    payload.dueDate = null
  }

  return payload
}

const buildMultipartPayload = (payload: ReturnType<typeof buildPayload>) => {
  const formData = new FormData()

  Object.entries(payload).forEach(([key, value]) => {
    if (key === 'tags') return
    if (key === 'dueDate' && value === null) {
      formData.append(key, '')
      return
    }
    if (value !== null) formData.append(key, String(value))
  })

  formData.append('tagsJson', JSON.stringify(payload.tags))
  if (selectedFile.value) formData.append('image', selectedFile.value)
  return formData
}

const handleSubmit = async () => {
  errors.value = {}
  globalError.value = ''

  if (!form.title.trim()) {
    errors.value.title = 'Title is required.'
    return
  }

  const payload = buildPayload()
  const requestBody = selectedFile.value ? buildMultipartPayload(payload) : payload

  try {
    if (props.editTodo) {
      await todosStore.updateTodo(props.editTodo._id, requestBody)
      toast.success('Todo updated successfully! ✅')
    } else {
      await todosStore.createTodo(requestBody)
      toast.success('Todo created successfully! 🎉')
    }
    emit('update:modelValue', false)
    emit('submitted')
  } catch (err: any) {
    globalError.value = err.data?.message || 'Something went wrong. Please try again.'
    if (err.data?.errors) {
      err.data.errors.forEach((e: { field: string; message: string }) => {
        errors.value[e.field] = e.message
      })
    }
  }
}
</script>
