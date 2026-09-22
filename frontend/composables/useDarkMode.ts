export const useDarkMode = () => {
  const isDark = ref(false)

  const applyTheme = (dark: boolean) => {
    if (import.meta.client) {
      document.documentElement.classList.toggle('dark', dark)
      localStorage.setItem('color-theme', dark ? 'dark' : 'light')
      isDark.value = dark
    }
  }

  const toggle = () => applyTheme(!isDark.value)
  const setDark = () => applyTheme(true)
  const setLight = () => applyTheme(false)

  onMounted(() => {
    const saved = localStorage.getItem('color-theme')
    if (saved) {
      applyTheme(saved === 'dark')
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      applyTheme(prefersDark)
    }
  })

  return { isDark: readonly(isDark), toggle, setDark, setLight }
}
