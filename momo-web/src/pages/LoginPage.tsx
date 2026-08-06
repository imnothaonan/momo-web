import { FormEvent, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../stores/authStore'
import GradientText from '../components/react-bits/GradientText'

export default function LoginPage() {
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const login = useAuth((s) => s.login)
  const isAuthenticated = useAuth((s) => s.isAuthenticated)
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) navigate('/study', { replace: true })
  }, [isAuthenticated, navigate])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!token.trim() || loading) return
    setLoading(true)
    setError('')
    try {
      await login(token.trim())
      navigate('/study', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden" style={{ background: '#0a0d08' }}>
      {/* Aurora 背景 */}
      <div className="pointer-events-none absolute -inset-[40%] opacity-50 blur-[70px]" style={{ animation: 'auroraMove 14s ease-in-out infinite alternate' }}>
        <div className="absolute left-[6%] top-[10%] h-[42%] w-[46%] rounded-full" style={{ background: 'radial-gradient(circle,#3E7C2F,transparent 65%)' }} />
        <div className="absolute right-[4%] top-[32%] h-[40%] w-[40%] rounded-full" style={{ background: 'radial-gradient(circle,#1E5B4A,transparent 65%)' }} />
        <div className="absolute bottom-[4%] left-[30%] h-[34%] w-[34%] rounded-full" style={{ background: 'radial-gradient(circle,#6B5A1E,transparent 65%)' }} />
      </div>

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-7 px-6">
        <div className="text-center">
          <div className="font-display text-5xl font-bold tracking-wide">
            墨墨<span style={{ color: 'var(--brand)' }}>单词</span>
          </div>
          <div className="mt-3 font-display text-sm uppercase tracking-[0.42em]" style={{ color: 'var(--ink-secondary)' }}>
            <GradientText colors={['#9EE15C', '#6FC3E8']}>Web Edition</GradientText>
          </div>
        </div>

        <form
          onSubmit={onSubmit}
          className="card flex w-full flex-col gap-4 !rounded-2xl p-7"
          style={{ background: 'rgba(26,32,22,.72)', backdropFilter: 'blur(14px)' }}
        >
          <div>
            <label className="mb-1.5 block text-xs font-medium" style={{ color: 'var(--ink-secondary)' }}>
              开放 API Token
            </label>
            <input
              className="input font-mono"
              type="password"
              placeholder="粘贴你的 Bearer Token…"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              autoFocus
            />
          </div>
          {error && (
            <div className="rounded-md px-3 py-2 text-[13px]" style={{ background: 'rgba(242,97,122,.1)', color: 'var(--danger)' }}>
              {error}
            </div>
          )}
          <button className="btn btn-brand justify-center !py-3" type="submit" disabled={loading || !token.trim()}>
            {loading ? '验证中…' : '开始使用 →'}
          </button>
        </form>

        <p className="text-center text-xs leading-relaxed" style={{ color: 'var(--ink-tertiary)' }}>
          App → 我的 → 更多设置 → 实验功能 → 开放 API
          <br />
          Token 仅存储于服务端加密 Cookie，前端不持有
        </p>
      </div>
    </div>
  )
}
