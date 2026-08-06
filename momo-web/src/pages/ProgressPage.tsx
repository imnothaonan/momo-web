import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { studyApi, ApiError } from '../lib/apiClient'
import CountUp from '../components/react-bits/CountUp'
import BlurText from '../components/react-bits/BlurText'
import StarBorder from '../components/react-bits/StarBorder'

/** study_time（毫秒）→ 人性化时长 */
function formatDuration(ms: number): string {
  const min = Math.round(ms / 60_000)
  if (min >= 60) return `${Math.floor(min / 60)}h ${min % 60}min`
  if (min >= 1) return `${min}min`
  return `${Math.round(ms / 1000)}s`
}

function BetaBanner() {
  const [show, setShow] = useState(true)
  if (!show) return null
  return (
    <div
      className="mt-4 flex items-start gap-2.5 rounded-xl px-4 py-3 text-[13px]"
      style={{ background: 'var(--accent-muted)', border: '1px solid rgba(242,193,78,.3)', color: 'var(--accent)' }}
    >
      <span className="mt-0.5">⚠</span>
      <div>
        学习数据接口为公测功能：需在 App 中开启「自动同步」，且当日打开过 App 完成初始化，数据才准确。
      </div>
      <button className="ml-auto opacity-70 hover:opacity-100" onClick={() => setShow(false)}>✕</button>
    </div>
  )
}

export default function ProgressPage() {
  const { data, isLoading, isError, error, dataUpdatedAt } = useQuery({
    queryKey: ['study', 'progress'],
    queryFn: studyApi.getProgress,
    refetchInterval: 60_000, // 60s 轮询（仅页面可见时生效）
  })

  const progress = data?.progress
  const percent = progress && progress.total > 0 ? Math.round((progress.finished / progress.total) * 100) : 0
  const circumference = 2 * Math.PI * 37

  return (
    <div className="page-enter">
      <BlurText text="今日学习" delay={40} className="font-display text-[32px] font-bold" animateBy="words" direction="top" />
      <p className="mt-1 text-[13px]" style={{ color: 'var(--ink-secondary)' }}>
        {dataUpdatedAt ? `数据更新于 ${new Date(dataUpdatedAt).toLocaleTimeString('zh-CN')}` : '—'}
        {' · 每 60s 自动刷新 · '}
        <span className="font-mono text-xs">POST /memo/study/get_study_progress</span>
      </p>

      <BetaBanner />

      {isLoading && (
        <div className="mt-8 grid grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="card h-32 animate-pulse" style={{ background: 'var(--bg-surface)' }} />
          ))}
        </div>
      )}

      {isError && (
        <div className="card mt-8 flex flex-col items-center gap-3 p-12 text-center">
          <div className="text-3xl">📡</div>
          <div style={{ color: 'var(--ink-secondary)' }}>
            {error instanceof ApiError ? error.message : '学习数据加载失败'}
          </div>
          <div className="text-xs" style={{ color: 'var(--ink-tertiary)' }}>
            学习数据为公测接口，请确认已在 App 中开启自动同步
          </div>
        </div>
      )}

      {progress && progress.total === 0 && (
        <div className="card mt-8 flex flex-col items-center gap-3 p-12 text-center">
          <div className="text-3xl">☕</div>
          <div className="font-semibold">今日数据未同步</div>
          <div className="max-w-md text-[13px]" style={{ color: 'var(--ink-secondary)' }}>
            请先在墨墨背单词 App 中开启「自动同步」，并打开 App 完成一次学习，这里才会显示今日进度。
          </div>
        </div>
      )}

      {progress && progress.total > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StarBorder 
            className="card relative overflow-hidden p-5"
            color={percent === 100 ? 'var(--brand)' : 'transparent'}
            speed={percent === 100 ? '4s' : '0s'}
          >
            <div className="font-display text-5xl font-bold" style={{ color: 'var(--brand)' }}>
              <CountUp to={progress.finished} duration={1.2} />
            </div>
            <div className="mt-1.5 flex items-center gap-1.5 text-[13px]" style={{ color: 'var(--ink-secondary)' }}>
              <span className="h-2 w-2 rounded-full" style={{ background: 'var(--brand)' }} />
              已完成（词）
              {percent === 100 && <span className="badge badge-success ml-1">🎉 全部完成</span>}
            </div>
          </StarBorder>

          <div className="card p-5">
            <div className="font-display text-5xl font-bold">
              <CountUp to={progress.total} duration={1.2} />
            </div>
            <div className="mt-1.5 flex items-center gap-1.5 text-[13px]" style={{ color: 'var(--ink-secondary)' }}>
              <span className="h-2 w-2 rounded-full" style={{ background: 'var(--info)' }} />
              今日总数（词）
            </div>
          </div>

          <div className="card flex items-center gap-4 p-5">
            <svg width="72" height="72" viewBox="0 0 86 86" className="-rotate-90">
              <defs>
                <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#9EE15C" />
                  <stop offset="100%" stopColor="#F2C14E" />
                </linearGradient>
              </defs>
              <circle cx="43" cy="43" r="37" fill="none" strokeWidth="7" style={{ stroke: 'var(--line)' }} />
              <circle
                cx="43" cy="43" r="37" fill="none" strokeWidth="7" stroke="url(#ringGrad)" strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - percent / 100)}
                style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(.22,1,.36,1)' }}
              />
            </svg>
            <div>
              <div className="font-display text-3xl font-bold">
                <CountUp to={percent} duration={1.4} />
                %
              </div>
              <div className="text-[13px]" style={{ color: 'var(--ink-secondary)' }}>完成率</div>
            </div>
          </div>

          <div className="card relative overflow-hidden p-5">
            <div className="font-display text-5xl font-bold" style={{ color: 'var(--accent)' }}>
              {formatDuration(progress.study_time)}
            </div>
            <div className="mt-1.5 flex items-center gap-1.5 text-[13px]" style={{ color: 'var(--ink-secondary)' }}>
              <span className="h-2 w-2 rounded-full" style={{ background: 'var(--accent)' }} />
              学习时长
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Link
          to="/study/today"
          className="card flex items-center gap-4 p-5 transition-all hover:-translate-y-0.5"
          style={{ textDecoration: 'none' }}
        >
          <div className="grid h-11 w-11 flex-none place-items-center rounded-xl text-lg" style={{ background: 'var(--brand-muted)', color: 'var(--brand)' }}>
            ☰
          </div>
          <div>
            <div className="font-semibold">今日单词</div>
            <div className="text-[13px]" style={{ color: 'var(--ink-secondary)' }}>查看今日学习列表与掌握情况</div>
          </div>
          <div className="ml-auto" style={{ color: 'var(--ink-tertiary)' }}>→</div>
        </Link>
        <Link
          to="/study/flashcard"
          className="card flex items-center gap-4 p-5 transition-all hover:-translate-y-0.5"
          style={{ textDecoration: 'none' }}
        >
          <div className="grid h-11 w-11 flex-none place-items-center rounded-xl text-lg" style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}>
            🎴
          </div>
          <div>
            <div className="font-semibold">翻卡复习</div>
            <div className="text-[13px]" style={{ color: 'var(--ink-secondary)' }}>3D 翻卡记忆 · 键盘快捷操作</div>
          </div>
          <div className="ml-auto" style={{ color: 'var(--ink-tertiary)' }}>→</div>
        </Link>
      </div>
    </div>
  )
}
