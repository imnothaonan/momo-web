import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { studyApi, ApiError, StudyResponse } from '../lib/apiClient'
import BlurText from '../components/react-bits/BlurText'
import FlashCard from '../components/FlashCard'

type Filter = 'all' | 'new' | 'review' | 'todo' | 'done'
type ViewMode = 'list' | 'card'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'new', label: '新学' },
  { key: 'review', label: '复习' },
  { key: 'todo', label: '未完成' },
  { key: 'done', label: '已完成' },
]

const RESPONSE_MAP: Record<StudyResponse, { label: string; badge: string }> = {
  FAMILIAR: { label: '认识', badge: 'badge-success' },
  VAGUE: { label: '模糊', badge: 'badge-accent' },
  FORGET: { label: '忘记', badge: 'badge-danger' },
  WELL_FAMILIAR: { label: '熟知', badge: 'badge-success' },
  CANCEL_WELL_FAMILIAR: { label: '取消熟知', badge: 'badge-mute' },
}

export default function TodayItemsPage() {
  const [filter, setFilter] = useState<Filter>('all')
  const [view, setView] = useState<ViewMode>('list')
  const [cardIdx, setCardIdx] = useState(0)
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['study', 'todayItems'],
    queryFn: () => studyApi.getTodayItems({ limit: 200 }),
    refetchInterval: 60_000,
  })

  const items = useMemo(() => {
    const list = data?.today_items ?? []
    return list.filter((w) => {
      if (filter === 'new') return w.is_new
      if (filter === 'review') return !w.is_new
      if (filter === 'done') return w.is_finished
      if (filter === 'todo') return !w.is_finished
      return true
    })
  }, [data, filter])

  const currentItem = items[cardIdx]

  return (
    <div className="page-enter">
      <BlurText text="今日单词" delay={35} className="font-display text-[32px] font-bold" animateBy="words" direction="top" />
      <p className="mt-1 text-[13px]" style={{ color: 'var(--ink-secondary)' }}>
        按学习顺序展示 · <span className="font-mono text-xs">POST /memo/study/get_today_items</span>
      </p>

      <div className="mb-5 mt-4 flex flex-wrap items-center gap-3">
        <div className="flex w-max gap-1.5 rounded-full p-1" style={{ background: 'var(--bg-surface)', border: '1px solid var(--line)' }}>
          {FILTERS.map((f) => (
            <button key={f.key} className={`pill-btn ${filter === f.key ? 'active' : ''}`} onClick={() => { setFilter(f.key); setCardIdx(0) }}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex w-max gap-1.5 rounded-full p-1" style={{ background: 'var(--bg-surface)', border: '1px solid var(--line)' }}>
          <button className={`pill-btn ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>☰ 列表</button>
          <button className={`pill-btn ${view === 'card' ? 'active' : ''}`} onClick={() => setView('card')}>🎴 翻卡</button>
        </div>
      </div>

      {isLoading && <div className="card h-40 animate-pulse" />}

      {isError && (
        <div className="card flex flex-col items-center gap-3 p-12 text-center">
          <div className="text-3xl">📡</div>
          <div style={{ color: 'var(--ink-secondary)' }}>
            {error instanceof ApiError ? error.message : '加载失败'}
          </div>
        </div>
      )}

      {!isLoading && !isError && items.length === 0 && (
        <div className="card flex flex-col items-center gap-3 p-14 text-center" style={{ color: 'var(--ink-tertiary)' }}>
          <div className="text-3xl">☕</div>
          {filter === 'all' ? '今日暂无学习单词' : '该筛选条件下暂无单词'}
        </div>
      )}

      {/* 列表视图 */}
      {!isLoading && !isError && view === 'list' && items.length > 0 && (
        <div className="flex flex-col gap-2">
          {items.map((w, i) => {
            const resp = w.first_response ? RESPONSE_MAP[w.first_response] : null
            return (
              <div
                key={w.voc_id}
                className="card flex items-center gap-3.5 !rounded-xl px-4 py-3 transition-colors hover:!border-[var(--line-strong)]"
                style={{ animation: `fadeUp .3s ease-out ${i * 0.03}s backwards` }}
              >
                <span className="w-8 flex-none font-mono text-xs" style={{ color: 'var(--ink-tertiary)' }}>
                  #{w.order}
                </span>
                <span className="font-display text-[17px] font-semibold">{w.voc_spelling}</span>
                {w.is_new ? <span className="badge badge-cyan">新学</span> : <span className="badge badge-info">复习</span>}
                {w.is_finished ? <span className="badge badge-success">已完成</span> : <span className="badge badge-mute">未完成</span>}
                <span className="flex-1" />
                {resp ? (
                  <span className={`badge ${resp.badge}`}>{resp.label}</span>
                ) : (
                  <span className="text-xs" style={{ color: 'var(--ink-tertiary)' }}>未反馈</span>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* 翻卡视图 */}
      {!isLoading && !isError && view === 'card' && items.length > 0 && currentItem && (
        <div className="mt-6">
          <FlashCard
            item={currentItem}
            index={cardIdx}
            total={items.length}
            onRespond={() => {
              if (cardIdx < items.length - 1) setTimeout(() => setCardIdx((i) => i + 1), 300)
            }}
            onPrev={() => cardIdx > 0 && setCardIdx((i) => i - 1)}
            onNext={() => cardIdx < items.length - 1 && setCardIdx((i) => i + 1)}
            hasPrev={cardIdx > 0}
            hasNext={cardIdx < items.length - 1}
          />
        </div>
      )}

      {data && (
        <p className="mt-4 text-xs" style={{ color: 'var(--ink-tertiary)' }}>
          共 {data.today_items.length} 条（limit=200）
        </p>
      )}
    </div>
  )
}
