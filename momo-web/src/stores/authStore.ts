/**
 * 认证状态（momo_web.md §6 修订版）
 * Token 只存 BFF 的 HTTP-only Cookie，前端绝不持有；此处仅维护会话布尔标志。
 */
import { create } from 'zustand'

interface AuthState {
  /** null = 尚未检查（加载中） */
  isAuthenticated: boolean | null
  check: () => Promise<void>
  login: (token: string) => Promise<void>
  logout: () => Promise<void>
  /** 收到 401 时由 apiClient 调用，本地清除会话标志 */
  setExpired: () => void
}

export const useAuth = create<AuthState>((set) => ({
  isAuthenticated: null,

  check: async () => {
    try {
      const res = await fetch('/api/auth/status')
      const json = (await res.json()) as { authenticated?: boolean }
      set({ isAuthenticated: !!json.authenticated })
    } catch {
      set({ isAuthenticated: false })
    }
  },

  login: async (token: string) => {
    const res = await fetch('/api/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
    if (!res.ok) {
      const json = (await res.json().catch(() => null)) as { error?: { message?: string } } | null
      throw new Error(json?.error?.message ?? '登录失败，请稍后重试')
    }
    set({ isAuthenticated: true })
  },

  logout: async () => {
    await fetch('/api/auth/token', { method: 'DELETE' }).catch(() => undefined)
    set({ isAuthenticated: false })
  },

  setExpired: () => set({ isAuthenticated: false }),
}))
