import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../stores/authStore'
import { useSettings } from '../stores/settingsStore'
import BlurText from '../components/react-bits/BlurText'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-7">
      <h3 className="mb-2.5 flex items-center gap-2 text-base font-semibold">{title}</h3>
      <div className="card overflow-hidden">{children}</div>
    </div>
  )
}

function Row({
  title, desc, children,
}: { title: string; desc?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 border-b px-5 py-4 last:border-b-0" style={{ borderColor: 'var(--line)' }}>
      <div className="flex-1">
        <div className="text-sm font-medium">{title}</div>
        {desc && <div className="mt-0.5 text-xs" style={{ color: 'var(--ink-tertiary)' }}>{desc}</div>}
      </div>
      {children}
    </div>
  )
}

export default function SettingsPage() {
  const logout = useAuth((s) => s.logout)
  const { theme, toggleTheme } = useSettings()
  const queryClient = useQueryClient()
  const [logoutArmed, setLogoutArmed] = useState(false)

  return (
    <div className="page-enter">
      <BlurText text="设置" delay={35} className="font-display text-[32px] font-bold" animateBy="words" direction="top" />
      <p className="mt-1 text-[13px]" style={{ color: 'var(--ink-secondary)' }}>
        Token 只存于服务端 HTTP-only Cookie，前端无从读取——这是特性而非缺陷
      </p>

      <div className="mt-6">
        <Section title="账号与会话">
          <Row title="已连接墨墨开放 API" desc="会话有效期 7 天 · Token 加密存储于服务端 Cookie">
            <span className="h-2 w-2 rounded-full" style={{ background: 'var(--success)', boxShadow: '0 0 8px var(--success)' }} />
            <button
              className="btn btn-danger !px-3.5 !py-1.5 text-xs"
              onClick={() => {
                if (!logoutArmed) {
                  setLogoutArmed(true)
                  setTimeout(() => setLogoutArmed(false), 3000)
                  return
                }
                void logout()
              }}
            >
              {logoutArmed ? '再点一次确认退出' : '退出登录'}
            </button>
          </Row>
        </Section>

        <Section title="外观">
          <Row title="深色主题（夜间自习室）" desc="浅色主题适用于日间使用，选择即时生效并持久化">
            <button
              className="h-[22px] w-10 rounded-full transition-all"
              style={{
                background: theme === 'dark' ? 'var(--brand)' : 'var(--bg-hover)',
                border: '1px solid var(--line-strong)',
                position: 'relative',
              }}
              onClick={toggleTheme}
              aria-label="切换主题"
            >
              <span
                className="absolute top-[2px] h-4 w-4 rounded-full transition-all"
                style={{ left: theme === 'dark' ? 20 : 2, background: theme === 'dark' ? 'var(--on-brand)' : 'var(--ink-secondary)' }}
              />
            </button>
          </Row>
        </Section>

        <Section title="数据">
          <Row title="本地缓存" desc="TanStack Query 数据缓存，清理后下次访问重新拉取">
            <button className="btn btn-ghost !px-3.5 !py-1.5 text-xs" onClick={() => queryClient.clear()}>
              清理缓存
            </button>
          </Row>
        </Section>

        <Section title="关于">
          <Row title="MOMO Web v0.1.0" desc="墨墨开放 API 频控：10s/20 · 60s/40 · 5h/2000（背单词）· 5h/8000（记忆卡）">
            <a className="btn btn-ghost !px-3.5 !py-1.5 text-xs" href="https://open.maimemo.com/#/" target="_blank" rel="noreferrer">
              API 文档 ↗
            </a>
          </Row>
        </Section>
      </div>
    </div>
  )
}
