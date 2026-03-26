import { create } from "zustand"

type Theme = "light" | "dark" | "system"

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  effectiveTheme: () => "light" | "dark"
}

export const useThemeStore = create<ThemeState>()((set, get) => ({
  theme: (localStorage.getItem("wingwork_theme") as Theme) || "system",

  setTheme: (theme) => {
    localStorage.setItem("wingwork_theme", theme)
    set({ theme })
    applyTheme(theme)
  },

  effectiveTheme: () => {
    const { theme } = get()
    if (theme === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
    }
    return theme
  },
}))

function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === "system") {
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    root.classList.toggle("dark", isDark)
  } else {
    root.classList.toggle("dark", theme === "dark")
  }
}

// Apply theme on load
applyTheme(useThemeStore.getState().theme)

// Listen for system theme changes
window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", () => {
    const { theme } = useThemeStore.getState()
    if (theme === "system") {
      applyTheme("system")
    }
  })
