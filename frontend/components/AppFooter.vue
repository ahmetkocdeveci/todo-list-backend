<template>
  <footer class="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 mt-auto">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold">
          <span class="text-xl">✅</span>
          <span>TodoList App</span>
        </div>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Built with ❤️ using Nuxt 3 + Node.js
        </p>
        <div class="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <NuxtLink to="/contact" class="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            Contact
          </NuxtLink>
          <span>© {{ new Date().getFullYear() }}</span>
        </div>
      </div>
    </div>
  </footer>
</template>
