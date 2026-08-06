import { useState, useMemo, useCallback, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { studyApi, ApiError, StudyResponse, StudyTodayItem } from '../lib/apiClient'
import BlurText from '../components/react-bits/BlurText'
import FlashCard from '../components/FlashCard'
import { useToast } from '../components/ToastProvider'

type StudyMode = 'all' | 'new' | 'review' | 'todo'
type ViewMode = 'card' | 'list'

const MODE_LABELS: Record<StudyMode, string> = {
  all: '全部',
  new: '仅新学',
  review: '仅复习',
  todo: '未完成',
}

const RESPONSE_LABELS: Record<string, string> = {
  FAMILIAR: '认识',
  VAGUE: '模糊',
  FORGET: '忘记',
  WELL_FAMILIAR: '熟知',
  CANCEL_WELL_FAMILIAR: '取消熟知',
}

const RESPONSE_COLORS: Record<string, string> = {
  FAMILIAR: 'var(--success)',
  VAGUE: 'var(--accent)',
  FORGET: 'var(--danger)',
  WELL_FAMILIAR: 'var(--success)',
  CANCEL_WELL_FAMILIAR: 'var(--ink-tertiary)',
}

export default function FlashcardStudyPage() {
  const { show } = useToast()
  const [mode, setMode] = useState<StudyMode>('todo')
  const [view, setView] = useState<ViewMode>('card')
  const [currentIdx, setCurrentIdx] = useState(0)
  const [responses, setResponses] = useState<Record<string, StudyResponse>>({})
  const [finished, setFinished] = useState(false)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['study', 'todayItems', 'flashcard'],
    queryFn: () => studyApi.getTodayItems({ limit: 200 }),
    refetchInterval: 60_000,
  })

  const items = useMemo(() => {
    const list = data?.today_items ?? []
    return list.filter((w) => {
      if (mode === 'new') return w.is_new
      if (mode === 'review') return !w.is_new
      if (mode === 'todo') return !w.is_finished
      return true
    })
  }, [data, mode])

  // 切换模式时重置
  useEffect(() => {
    setCurrentIdx(0)
    setResponses({})
    setFinished(false)
  }, [mode])

  const currentItem = items[currentIdx]
  const hasPrev = currentIdx > 0
  const hasNext = currentIdx < items.length - 1

  const handleRespond = useCallback((response: StudyResponse) => {
    if (!currentItem) return
    setResponses((prev) => ({ ...prev, [currentItem.voc_id]: response }))
    show(`${RESPONSE_LABELS[response]} · ${currentItem.voc_spelling}`, response === 'FORGET' ? 'danger' : response === 'VAGUE' ? 'accent' : 'success')
    if (hasNext) {
      setTimeout(() => setCurrentIdx((i) => i + 1), 300)
    } else {
      setTimeout(() => setFinished(true), 300)
    }
  }, [currentItem, hasNext, show])

  const handlePrev = useCallback(() => {
    if (hasPrev) setCurrentIdx((i) => i - 1)
  }, [hasPrev])

  const handleNext = useCallback(() => {
    if (hasNext) setCurrentIdx((i) => i + 1)
  }, [hasNext])

  const handleRestart = () => {
    setCurrentIdx(0)
    setResponses({})
    setFinished(false)
  }

  // 统计
  const stats = useMemo(() => {
    const vals = Object.values(responses)
    return {
      total: vals.length,
      familiar: vals.filter((r) => r === 'FAMILIAR').length,
      vague: vals.filter((r) => r === 'VAGUE').length,
      forget: vals.filter((r) => r === 'FORGET').length,
    }
  }, [responses])

  // 完成页
  if (finished) {
    return (
      <div className="page-enter">
        <BlurText text="本轮完成" delay={30} className="font-display text-[32px] font-bold" animateBy="words" direction="top" />
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="card p-5 text-center">
            <div className="font-display text-4xl font-bold" style={{ color: 'var(--brand)' }}>{stats.total}</div>
            <div className="mt-1 text-[13px]" style={{ color: 'var(--ink-secondary)' }}>已学</div>
          </div>
          <div className="card p-5 text-center">
            <div className="font-display text-4xl font-bold" style={{ color: 'var(--success)' }}>{stats.familiar}</div>
            <div className="mt-1 text-[13px]" style={{ color: 'var(--ink-secondary)' }}>认识</div>
          </div>
          <div className="card p-5 text-center">
            <div className="font-display text-4xl font-bold" style={{ color: 'var(--accent)' }}>{stats.vague}</div>
            <div className="mt-1 text-[13px]" style={{ color: 'var(--ink-secondary)' }}>模糊</div>
          </div>
          <div className="card p-5 text-center">
            <div className="font-display text-4xl font-bold" style={{ color: 'var(--danger)' }}>{stats.forget}</div>
            <div className="mt-1 text-[13px]" style={{ color: 'var(--ink-secondary)' }}>忘记</div>
          </div>
        </div>
        <div className="mt-6 flex items-center gap-3">
          <button className="btn btn-brand" onClick={handleRestart}>再来一轮</button>
          <button className="btn btn-ghost" onClick={() => { setMode('todo'); handleRestart() }}>只练忘记的</button>
        </div>
      </div>
    )
  }

  return (
    <div className="page-enter">
      <BlurText text="翻卡复习" delay={30} className="font-display text-[32px] font-bold" animateBy="words" direction="top" />
      <p className="mt-1 text-[13px]" style={{ color: 'var(--ink-secondary)' }}>
        翻面查看释义 · 键盘快捷键：Space 翻面 · 1/2/3 反馈 · ←/→ 切换 ·{' '}
        <span className="font-mono text-xs">POST /memo/study/get_today_items</span>
      </p>

      {/* 模式选择 */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="flex w-max gap-1.5 rounded-full p-1" style={{ background: 'var(--bg-surface)', border: '1px solid var(--line)' }}>
          {(Object.keys(MODE_LABELS) as StudyMode[]).map((m) => (
            <button key={m} className={`pill-btn ${mode === m ? 'active' : ''}`} onClick={() => setMode(m)}>
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>
        <div className="flex w-max gap-1.5 rounded-full p-1" style={{ background: 'var(--bg-surface)', border: '1px solid var(--line)' }}>
          <button className={`pill-btn ${view === 'card' ? 'active' : ''}`} onClick={() => setView('card')}>🎴 卡片</button>
          <button className={`pill-btn ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>☰ 列表</button>
        </div>
        <span className="text-xs" style={{ color: 'var(--ink-tertiary)' }}>
          {items.length} 个单词 · 已复习 {stats.total}
        </span>
      </div>

      {isLoading && (
        <div className="card mt-8 flex h-96 items-center justify-center">
          <div className="flex items-center gap-3" style={{ color: 'var(--ink-tertiary)' }}>
            <span className="h-3 w-3 animate-pulse rounded-full" style={{ background: 'var(--brand)' }} />
            加载今日单词…
          </div>
        </div>
      )}

      {isError && (
        <div className="card mt-8 flex flex-col items-center gap-3 p-12 text-center">
          <div className="text-3xl">📡</div>
          <div style={{ color: 'var(--ink-secondary)' }}>
            {error instanceof ApiError ? error.message : '加载失败'}
          </div>
          <div className="text-xs" style={{ color: 'var(--ink-tertiary)' }}>
            学习数据为公测接口，请确认已在 App 中开启自动同步
          </div>
        </div>
      )}

      {!isLoading && !isError && items.length === 0 && (
        <div className="card mt-8 flex flex-col items-center gap-3 p-14 text-center" style={{ color: 'var(--ink-tertiary)' }}>
          <div className="text-3xl">🎉</div>
          {mode === 'todo' ? '今日单词已全部完成！' : '该模式下暂无单词'}
        </div>
      )}

      {!isLoading && !isError && items.length > 0 && view === 'card' && currentItem && (
        <div className="mt-8">
          <FlashCard
            item={currentItem}
            index={currentIdx}
            total={items.length}
            onRespond={handleRespond}
            onPrev={handlePrev}
            onNext={handleNext}
            hasPrev={hasPrev}
            hasNext={hasNext}
          />
        </div>
      )}

      {/* 列表视图：展示已复习的结果 */}
      {!isLoading && !isError && items.length > 0 && view === 'list' && (
        <div className="mt-6 flex flex-col gap-2">
          {items.map((w, i) => {
            const resp = responses[w.voc_id]
            return (
              <div
                key={w.voc_id}
                className="card flex items-center gap-3.5 !rounded-xl px-4 py-3"
                style={{
                  borderColor: resp ? `${RESPONSE_COLORS[resp]}40` : undefined,
                  animation: `fadeUp .3s ease-out ${i * 0.02}s backwards`,
                }}
              >
                <span className="w-8 flex-none font-mono text-xs" style={{ color: 'var(--ink-tertiary)' }}>
                  #{i + 1}
                </span>
                <span className="font-display text-[17px] font-semibold">{w.voc_spelling}</span>
                {w.is_new ? <span className="badge badge-cyan">新学</span> : <span className="badge badge-info">复习</span>}
                {w.is_finished && <span className="badge badge-success">已完成</span>}
                <span className="flex-1" />
                {resp ? (
                  <span
                    className="badge"
                    style={{ background: `${RESPONSE_COLORS[resp]}1a`, color: RESPONSE_COLORS[resp] }}
                  >
                    {RESPONSE_LABELS[resp]}
                  </span>
                ) : (
                  <span className="text-xs" style={{ color: 'var(--ink-tertiary)' }}>未复习</span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
