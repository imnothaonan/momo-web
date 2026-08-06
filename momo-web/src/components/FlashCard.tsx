/**
 * 3D 翻卡组件（可复用）
 * 正面：单词拼写 + 状态徽标
 * 背面：释义 / 助记 / 例句（按需加载）
 */
import { useState, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { vocabularyApi, interpretationApi, noteApi, phraseApi, StudyTodayItem, StudyResponse } from '../lib/apiClient'

interface Props {
  item: StudyTodayItem
  index: number
  total: number
  onRespond: (response: StudyResponse) => void
  onPrev?: () => void
  onNext?: () => void
  hasPrev?: boolean
  hasNext?: boolean
}

const RESPONSES: { key: StudyResponse; label: string; color: string; shortcut: string }[] = [
  { key: 'FAMILIAR', label: '认识', color: 'var(--success)', shortcut: '1' },
  { key: 'VAGUE', label: '模糊', color: 'var(--accent)', shortcut: '2' },
  { key: 'FORGET', label: '忘记', color: 'var(--danger)', shortcut: '3' },
]

export default function FlashCard({ item, index, total, onRespond, onPrev, onNext, hasPrev, hasNext }: Props) {
  const [flipped, setFlipped] = useState(false)
  const [direction, setDirection] = useState<'none' | 'left' | 'right'>('none')

  // 翻到背面时加载详情
  const detailsQuery = useQuery({
    queryKey: ['flashcard-detail', item.voc_id],
    queryFn: async () => {
      const [interp, notes, phrases] = await Promise.all([
        interpretationApi.list(item.voc_id).catch(() => ({ interpretations: [] })),
        noteApi.list(item.voc_id).catch(() => ({ notes: [] })),
        phraseApi.list(item.voc_id).catch(() => ({ phrases: [] })),
      ])
      return { ...interp, ...notes, ...phrases }
    },
    enabled: flipped,
    staleTime: 5 * 60_000,
  })

  // 切换单词时重置翻面状态
  useEffect(() => {
    setFlipped(false)
    setDirection('none')
  }, [item.voc_id])

  const handleFlip = useCallback(() => setFlipped((v) => !v), [])

  // 键盘快捷键
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); handleFlip() }
      else if (e.key === '1') onRespond('FAMILIAR')
      else if (e.key === '2') onRespond('VAGUE')
      else if (e.key === '3') onRespond('FORGET')
      else if (e.key === 'ArrowLeft' && onPrev) onPrev()
      else if (e.key === 'ArrowRight' && onNext) onNext()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleFlip, onRespond, onPrev, onNext])

  // 触摸滑动
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY })
  }
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return
    const dx = e.changedTouches[0].clientX - touchStart.x
    const dy = e.changedTouches[0].clientY - touchStart.y
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0 && onPrev) { setDirection('right'); setTimeout(() => onPrev(), 150) }
      else if (dx < 0 && onNext) { setDirection('left'); setTimeout(() => onNext(), 150) }
    }
    setTouchStart(null)
  }

  const interpretations = detailsQuery.data?.interpretations ?? []
  const notes = detailsQuery.data?.notes ?? []
  const phrases = detailsQuery.data?.phrases ?? []

  return (
    <div className="flex flex-col items-center">
      {/* 进度条 */}
      <div className="mb-4 flex w-full max-w-lg items-center gap-3">
        <span className="font-mono text-xs" style={{ color: 'var(--ink-tertiary)' }}>
          {index + 1} / {total}
        </span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: 'var(--bg-hover)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${((index + 1) / total) * 100}%`, background: 'linear-gradient(90deg, var(--brand), var(--accent))' }}
          />
        </div>
      </div>

      {/* 翻卡区域 */}
      <div
        className={`flip-card ${flipped ? 'flipped' : ''} w-full max-w-lg`}
        style={{
          height: 380,
          animation: direction === 'left' ? 'cardSlideOutLeft .15s ease-in forwards' :
                     direction === 'right' ? 'cardSlideOutRight .15s ease-in forwards' :
                     'cardSlideIn .4s cubic-bezier(.22,1,.36,1)',
        }}
        onClick={handleFlip}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flip-card-inner">
          {/* 正面 */}
          <div
            className="flip-card-front card flex flex-col items-center justify-center !rounded-2xl"
            style={{ background: 'var(--bg-surface)', cursor: 'pointer' }}
          >
            <div className="absolute left-4 top-4 flex gap-2">
              {item.is_new ? <span className="badge badge-cyan">新学</span> : <span className="badge badge-info">复习</span>}
              {item.is_finished && <span className="badge badge-success">已完成</span>}
            </div>
            <div className="absolute right-4 top-4 text-xs" style={{ color: 'var(--ink-tertiary)' }}>
              点击翻面
            </div>
            <div className="font-display text-5xl font-bold tracking-wide" style={{ color: 'var(--ink-primary)' }}>
              {item.voc_spelling}
            </div>
            {item.first_response && (
              <div className="mt-3 text-xs" style={{ color: 'var(--ink-tertiary)' }}>
                上次反馈：{item.first_response === 'FAMILIAR' ? '认识' : item.first_response === 'VAGUE' ? '模糊' : item.first_response === 'FORGET' ? '忘记' : item.first_response === 'WELL_FAMILIAR' ? '熟知' : '取消熟知'}
              </div>
            )}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs" style={{ color: 'var(--ink-tertiary)' }}>
              <kbd className="rounded border px-1.5 py-0.5" style={{ borderColor: 'var(--line-strong)' }}>Space</kbd> 翻面
            </div>
          </div>

          {/* 背面 */}
          <div
            className="flip-card-back card overflow-y-auto !rounded-2xl"
            style={{ background: 'var(--bg-surface)', cursor: 'pointer' }}
          >
            <div className="flex items-center gap-2 border-b px-5 py-3" style={{ borderColor: 'var(--line)' }}>
              <span className="font-display text-xl font-bold">{item.voc_spelling}</span>
              <span className="font-mono text-[10px]" style={{ color: 'var(--ink-tertiary)' }}>{item.voc_id.slice(0, 16)}…</span>
            </div>
            <div className="p-5">
              {detailsQuery.isLoading && (
                <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--ink-tertiary)' }}>
                  <span className="h-2 w-2 animate-pulse rounded-full" style={{ background: 'var(--brand)' }} />
                  加载释义…
                </div>
              )}
              {detailsQuery.data && interpretations.length === 0 && notes.length === 0 && phrases.length === 0 && (
                <div className="text-sm" style={{ color: 'var(--ink-tertiary)' }}>
                  暂无释义/助记/例句数据
                </div>
              )}
              {interpretations.length > 0 && (
                <div className="mb-3">
                  <div className="mb-1.5 text-xs font-semibold" style={{ color: 'var(--brand)' }}>释义</div>
                  {interpretations.map((it) => (
                    <div key={it.id} className="mb-1 text-sm" style={{ color: 'var(--ink-primary)' }}>
                      {it.interpretation}
                      {it.tags.length > 0 && (
                        <span className="ml-2 inline-flex gap-1">
                          {it.tags.map((t) => <span key={t} className="badge badge-brand !text-[10px]">{t}</span>)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {notes.length > 0 && (
                <div className="mb-3">
                  <div className="mb-1.5 text-xs font-semibold" style={{ color: 'var(--info)' }}>助记</div>
                  {notes.map((n) => (
                    <div key={n.id} className="mb-1 text-sm" style={{ color: 'var(--ink-primary)' }}>
                      <span className="badge badge-info mr-1.5 !text-[10px]">{n.note_type}</span>
                      {n.note}
                    </div>
                  ))}
                </div>
              )}
              {phrases.length > 0 && (
                <div className="mb-3">
                  <div className="mb-1.5 text-xs font-semibold" style={{ color: 'var(--accent)' }}>例句</div>
                  {phrases.map((p) => (
                    <div key={p.id} className="mb-1.5 text-sm" style={{ color: 'var(--ink-primary)' }}>
                      {p.phrase}
                      <div className="text-xs" style={{ color: 'var(--ink-secondary)' }}>{p.interpretation}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 反馈按钮 */}
      <div className="mt-6 flex items-center gap-3">
        {hasPrev && (
          <button className="btn btn-ghost !px-4" onClick={(e) => { e.stopPropagation(); onPrev?.() }} title="上一个 (←)">
            ←
          </button>
        )}
        {flipped ? (
          <>
            {RESPONSES.map((r) => (
              <button
                key={r.key}
                className="btn !px-6 !py-2.5 font-semibold transition-all hover:scale-105"
                style={{
                  background: `${r.color}1a`,
                  color: r.color,
                  border: `1px solid ${r.color}44`,
                }}
                onClick={(e) => { e.stopPropagation(); onRespond(r.key) }}
                title={`${r.label} (${r.shortcut})`}
              >
                {r.label}
                <kbd className="ml-1 rounded text-[10px] opacity-60" style={{ border: `1px solid ${r.color}44` }}>{r.shortcut}</kbd>
              </button>
            ))}
          </>
        ) : (
          <button className="btn btn-ghost" onClick={(e) => { e.stopPropagation(); handleFlip() }}>
            翻面查看释义 →
          </button>
        )}
        {hasNext && (
          <button className="btn btn-ghost !px-4" onClick={(e) => { e.stopPropagation(); onNext?.() }} title="下一个 (→)">
            →
          </button>
        )}
      </div>
    </div>
  )
}
