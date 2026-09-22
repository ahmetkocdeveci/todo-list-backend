import Toast, { POSITION, useToast as useVueToast, type PluginOptions } from 'vue-toastification'
import 'vue-toastification/dist/index.css'

export default defineNuxtPlugin((nuxtApp) => {
  const options: PluginOptions = {
    position: POSITION.TOP_RIGHT,
    timeout: 3500,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  }

  nuxtApp.vueApp.use(Toast, options)

  return {
    provide: {
      toast: useVueToast(),
    },
  }
})
