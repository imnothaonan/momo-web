/**
 * 全局 Toast 系统（《前端设计文档》§7.1）
 * 右下角，宽 320，icon + 单行文案，4s 自动消失，最多叠 3 条。
 * 同时监听 apiClient 发出的 429 频控事件。
 */
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

type ToastKind = 'success' | 'danger' | 'accent' | 'info'

interface Toast {
  id: number
  kind: ToastKind
  message: string
  leaving?: boolean
}

interface ToastCtx {
  show: (message: string, kind?: ToastKind) => void
}

const Ctx = createContext<ToastCtx | null>(null)

const ICONS: Record<ToastKind, string> = {
  success: '✓',
  danger: '✕',
  accent: '⚠',
  info: 'ℹ',
}

const COLORS: Record<ToastKind, { bg: string; color: string }> = {
  success: { bg: 'rgba(126,217,87,.12)', color: 'var(--success)' },
  danger: { bg: 'rgba(242,97,122,.12)', color: 'var(--danger)' },
  accent: { bg: 'var(--accent-muted)', color: 'var(--accent)' },
  info: { bg: 'rgba(111,195,232,.12)', color: 'var(--info)' },
}

let nextId = 1

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)))
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 200)
  }, [])

  const show = useCallback((message: string, kind: ToastKind = 'info') => {
    const id = nextId++
    setToasts((prev) => [...prev, { id, kind, message }].slice(-3))
    setTimeout(() => remove(id), 4000)
  }, [remove])

  // 监听 429 频控事件
  useEffect(() => {
    const handler = () => show('请求太频繁啦，休息几秒再试', 'accent')
    window.addEventListener('momo:rate-limited', handler)
    return () => window.removeEventListener('momo:rate-limited', handler)
  }, [show])

  return (
    <Ctx.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex w-80 flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast-item flex items-center gap-2.5 rounded-lg px-4 py-3 text-[13px] shadow-lg ${t.leaving ? 'leaving' : ''}`}
            style={{
              background: 'var(--bg-overlay)',
              border: '1px solid var(--line-strong)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <span
              className="grid h-5 w-5 flex-none place-items-center rounded-full text-xs font-bold"
              style={{ background: COLORS[t.kind].bg, color: COLORS[t.kind].color }}
            >
              {ICONS[t.kind]}
            </span>
            <span className="flex-1 leading-snug" style={{ color: 'var(--ink-primary)' }}>{t.message}</span>
            <button
              className="flex-none text-xs opacity-50 hover:opacity-100"
              style={{ color: 'var(--ink-tertiary)' }}
              onClick={() => remove(t.id)}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}

export function useToast() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
