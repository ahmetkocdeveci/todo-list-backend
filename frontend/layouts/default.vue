<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
    <AppNavbar />

    <main class="pt-16 min-h-screen">
      <slot />
    </main>

    <AppFooter />
  </div>
</template>
