<template>
  <div class="flex items-center justify-center" :class="containerClass">
    <div
      class="rounded-full border-2 border-indigo-600 border-t-transparent animate-spin"
      :class="spinnerSizeClass"
    />
    <span v-if="label" class="ml-3 text-sm text-gray-500 dark:text-gray-400">{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  size?: 'sm' | 'md' | 'lg'
  label?: string
  fullPage?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  fullPage: false,
})

const spinnerSizeClass = computed(() => ({
  'w-4 h-4': props.size === 'sm',
  'w-8 h-8': props.size === 'md',
  'w-12 h-12 border-4': props.size === 'lg',
}))

const containerClass = computed(() => ({
  'min-h-[60vh]': props.fullPage,
  'py-4': !props.fullPage,
}))
</script>
