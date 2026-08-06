import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../stores/authStore'
import { useSettings } from '../stores/settingsStore'

const GROUPS: { label: string; items: { to: string; icon: string; label: string; end?: boolean }[] }[] = [
  {
    label: '学习中心',
    items: [
      { to: '/study', icon: '◷', label: '今日进度', end: true },
      { to: '/study/today', icon: '☰', label: '今日单词' },
      { to: '/study/flashcard', icon: '🎴', label: '翻卡复习' },
      { to: '/study/records', icon: '📊', label: '学习记录' },
      { to: '/study/add', icon: '＋', label: '添加单词' },
    ],
  },
  {
    label: '单词工具',
    items: [{ to: '/vocabulary', icon: '🔍', label: '搜索与详情' }],
  },
  {
    label: '内容管理',
    items: [
      { to: '/content', icon: '✍', label: '释义 / 助记 / 例句' },
      { to: '/content/notepads', icon: '📚', label: '云词本' },
    ],
  },
  {
    label: '记忆卡',
    items: [
      { to: '/markji', icon: '🃏', label: '牌组浏览', end: true },
      { to: '/markji/editor', icon: '📝', label: '卡片编辑器' },
    ],
  },
  {
    label: '系统',
    items: [{ to: '/settings', icon: '⚙', label: '设置' }],
  },
]

/** 移动端底部 TabBar（5 个主模块） */
const TABS = [
  { to: '/study', icon: '◷', label: '学习', end: true },
  { to: '/vocabulary', icon: '🔍', label: '单词' },
  { to: '/content', icon: '✍', label: '内容' },
  { to: '/markji', icon: '🃏', label: '卡片' },
  { to: '/settings', icon: '⚙', label: '设置' },
]

export default function AppLayout() {
  const logout = useAuth((s) => s.logout)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { theme, toggleTheme } = useSettings()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen">
      {/* TopBar */}
      <header
        className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-4 px-4 md:px-5"
        style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--line)' }}
      >
        {/* 移动端汉堡菜单 */}
        <button
          className="mobile-only flex h-9 w-9 items-center justify-center rounded-md"
          style={{ color: 'var(--ink-secondary)' }}
          onClick={() => setDrawerOpen((v) => !v)}
          aria-label="菜单"
        >
          {drawerOpen ? '✕' : '☰'}
        </button>
        <div className="flex items-center gap-2 font-display text-lg font-bold">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'var(--brand)', boxShadow: '0 0 12px var(--brand)' }} />
          MOMO&nbsp;<span style={{ color: 'var(--brand)' }}>·</span>&nbsp;Web
        </div>
        <div className="flex-1" />
        <button
          className="btn btn-ghost !px-3 !py-1.5 text-xs"
          title="刷新数据"
          onClick={() => queryClient.invalidateQueries()}
        >
          ⟳
        </button>
        <button
          className="btn btn-ghost !px-3 !py-1.5 text-xs"
          title="切换主题"
          onClick={toggleTheme}
        >
          {theme === 'dark' ? '☀' : '☾'}
        </button>
        <button className="btn btn-ghost !px-3 !py-1.5 text-xs desktop-only" onClick={handleLogout}>
          退出
        </button>
      </header>

      {/* 桌面侧边栏 */}
      <nav
        className="desktop-only fixed bottom-0 left-0 top-14 z-30 w-52 overflow-y-auto px-2.5 py-4"
        style={{ background: 'var(--bg-elevated)', borderRight: '1px solid var(--line)' }}
      >
        {GROUPS.map((group) => (
          <div key={group.label} className="mb-4">
            <div className="px-2.5 pb-1.5 text-[11px] font-semibold tracking-widest" style={{ color: 'var(--ink-tertiary)' }}>
              {group.label}
            </div>
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <span className="w-4 text-center">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* 移动端抽屉 */}
      {drawerOpen && (
        <div className="mobile-only fixed inset-0 z-50" onClick={() => setDrawerOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <nav
            className="absolute left-0 top-14 bottom-0 w-64 overflow-y-auto px-2.5 py-4"
            style={{ background: 'var(--bg-elevated)', borderRight: '1px solid var(--line)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {GROUPS.map((group) => (
              <div key={group.label} className="mb-4">
                <div className="px-2.5 pb-1.5 text-[11px] font-semibold tracking-widest" style={{ color: 'var(--ink-tertiary)' }}>
                  {group.label}
                </div>
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => setDrawerOpen(false)}
                  >
                    <span className="w-4 text-center">{item.icon}</span>
                    {item.label}
                  </NavLink>
                ))}
              </div>
            ))}
            <button className="nav-item w-full" onClick={handleLogout}>
              <span className="w-4 text-center">⏻</span>
              退出登录
            </button>
          </nav>
        </div>
      )}

      {/* Main */}
      <main className="mobile-main ml-0 mt-14 min-h-[calc(100vh-56px)] px-4 py-6 md:ml-52 md:px-8">
        <div className="mx-auto max-w-5xl">
          <Outlet />
        </div>
      </main>

      {/* 移动端底部 TabBar */}
      <nav
        className="mobile-only mobile-tabbar fixed inset-x-0 bottom-0 z-40 h-14 items-center justify-around"
        style={{ display: 'none', background: 'var(--bg-elevated)', borderTop: '1px solid var(--line)' }}
      >
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) => 'flex flex-col items-center gap-0.5 text-[10px]'}
            style={({ isActive }) => ({ color: isActive ? 'var(--brand)' : 'var(--ink-tertiary)' })}
          >
            <span className="text-lg">{tab.icon}</span>
            {tab.label}
          </NavLink>
        ))}
      </nav>

      {/* 移动端底部留白 */}
      <div className="mobile-only h-14" style={{ display: 'none' }} />
    </div>
  )
}
