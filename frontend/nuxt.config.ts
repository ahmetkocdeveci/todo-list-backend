const backendOrigin = process.env.NUXT_BACKEND_ORIGIN || 'http://localhost:5000'

export default defineNuxtConfig({
  devtools: { enabled: true },

  experimental: {
    appManifest: false,
  },

  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vueuse/nuxt',
  ],

  runtimeConfig: {
    backendOrigin,
    public: {
      apiBase: '/api',
    },
  },

  routeRules: {
    '/api/**': {
      proxy: `${backendOrigin}/api/**`,
    },
  },

  tailwindcss: {
    config: {
      darkMode: 'class',
    },
  },

  app: {
    head: {
      title: 'Todo List App',
      titleTemplate: '%s | Todo List',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: 'A full-featured todo list app built with Nuxt 3 and Node.js',
        },
      ],
      link: [
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
        },
      ],
    },
  },

  css: ['~/assets/css/main.css'],

  nitro: {
    devProxy: {
      '/api': { target: `${backendOrigin}/api`, changeOrigin: true },
    },
  },
});
