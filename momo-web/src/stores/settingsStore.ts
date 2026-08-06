/**
 * 全局设置（主题等非敏感配置，localStorage 持久化；Token 等敏感信息不在此处）
 */
import { create } from 'zustand'

type Theme = 'dark' | 'light'

interface SettingsState {
  theme: Theme
  setTheme: (t: Theme) => void
  toggleTheme: () => void
}

function applyTheme(t: Theme) {
  document.documentElement.setAttribute('data-theme', t)
  localStorage.setItem('momo-theme', t)
}

const initial: Theme = (localStorage.getItem('momo-theme') as Theme) || 'dark'
applyTheme(initial)

export const useSettings = create<SettingsState>((set, get) => ({
  theme: initial,
  setTheme: (t) => {
    applyTheme(t)
    set({ theme: t })
  },
  toggleTheme: () => get().setTheme(get().theme === 'dark' ? 'light' : 'dark'),
}))
