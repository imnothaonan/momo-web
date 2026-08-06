import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { markjiApi, formatTime, ApiError } from '../lib/apiClient'
import { useToast } from '../components/ToastProvider'

export default function DeckDetailPage() {
  const { deckId } = useParams<{ deckId: string }>()
  const queryClient = useQueryClient()
  const { show } = useToast()
  const [syncing, setSyncing] = useState(false)

  const deckQuery = useQuery({
    queryKey: ['markji', 'deck', deckId],
    queryFn: () => markjiApi.getDeck(deckId!, true),
    enabled: !!deckId,
  })
  const chaptersQuery = useQuery({
    queryKey: ['markji', 'chapters', deckId],
    queryFn: () => markjiApi.listChapters(deckId!),
    enabled: !!deckId,
  })

  const deck = deckQuery.data?.deck
  const chapters = chaptersQuery.data?.chapters ?? []

  const handleSync = async () => {
    if (!deckId || syncing) return
    setSyncing(true)
    try {
      // 增量同步：用 updated_time 参数只拉变化章节
      const lastUpdate = chapters.length > 0
        ? chapters.reduce((latest, c) => c.updated_time > latest ? c.updated_time : latest, chapters[0].updated_time)
        : undefined
      const fresh = await markjiApi.listChapters(deckId)
      const newChapters = lastUpdate
        ? fresh.chapters.filter((c) => c.updated_time > lastUpdate)
        : fresh.chapters
      queryClient.invalidateQueries({ queryKey: ['markji', 'chapters', deckId] })
      queryClient.invalidateQueries({ queryKey: ['markji', 'deck', deckId] })
      show(`同步完成：更新 ${newChapters.length} 章 / ${fresh.chapters.length} 总章节`, 'success')
    } catch (e) {
      show(e instanceof ApiError ? e.message : '同步失败', 'danger')
    } finally {
      setSyncing(false)
    }
  }

  if (deckQuery.isLoading) return <div className="card h-40 animate-pulse" />

  if (!deck) {
    return (
      <div className="card flex flex-col items-center gap-2 p-12 text-center" style={{ color: 'var(--ink-tertiary)' }}>
        <div className="text-3xl">🃏</div>
        牌组不存在或无权访问
        <Link to="/markji/decks" className="btn btn-ghost mt-2">返回牌组列表</Link>
      </div>
    )
  }

  return (
    <div className="page-enter">
      <div className="mb-3 flex items-center gap-2 text-[13px]" style={{ color: 'var(--ink-tertiary)' }}>
        <Link to="/markji/decks" style={{ color: 'var(--ink-secondary)' }}>牌组</Link>
        <span>/</span>
        <span style={{ color: 'var(--ink-primary)' }}>{deck.name}</span>
      </div>

      <div className="card p-6">
        <div className="flex flex-wrap items-start gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-bold">{deck.name}</h1>
              <span className={`badge ${deck.source === 'SELF' ? 'badge-brand' : 'badge-info'}`}>
                {deck.source === 'SELF' ? '自建' : '派生'}
              </span>
              {deck.is_private && <span className="badge badge-mute">🔒 私有</span>}
            </div>
            <p className="mt-1.5 text-[13px]" style={{ color: 'var(--ink-secondary)' }}>{deck.description || '暂无简介'}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="btn btn-ghost !px-3.5 !py-2 text-xs"
              onClick={handleSync}
              disabled={syncing}
              title="只拉取上次同步后有变化的章节"
            >
              {syncing ? '同步中…' : '↻ 增量同步'}
            </button>
            <Link to={`/markji/editor?deck=${deck.id}`} className="btn btn-brand">＋ 新建卡片</Link>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[13px]" style={{ color: 'var(--ink-secondary)' }}>
          <span>🃏 {deck.card_count} 张卡</span>
          <span>📑 {deck.chapter_count} 章节</span>
          <span className="font-mono text-xs">revision {deck.revision}</span>
          <span>更新于 {formatTime(deck.updated_time)}</span>
          {deck.root_deck && (
            <span>
              根牌组：
              <Link to={`/markji/decks/${deck.root_deck.id}`} style={{ color: 'var(--brand)' }}>{deck.root_deck.name}</Link>
            </span>
          )}
        </div>
      </div>

      <h2 className="mb-3 mt-7 flex items-center gap-2 text-lg font-semibold">
        章节
        <span className="badge badge-mute">{chapters.length}</span>
      </h2>

      {chaptersQuery.isLoading && <div className="card h-32 animate-pulse" />}

      {!chaptersQuery.isLoading && chapters.length === 0 && (
        <div className="card flex flex-col items-center gap-2 p-12 text-center" style={{ color: 'var(--ink-tertiary)' }}>
          <div className="text-3xl">📑</div>
          这个牌组还没有章节
          <Link to={`/markji/editor?deck=${deck.id}`} className="btn btn-ghost mt-2">去创建第一张卡片</Link>
        </div>
      )}

      <div className="card">
        {chapters.map((c, i) => (
          <Link
            key={c.id}
            to={`/markji/decks/${deck.id}/chapters/${c.id}`}
            className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[var(--bg-hover)]"
            style={{ borderBottom: i < chapters.length - 1 ? '1px solid var(--line)' : undefined, textDecoration: 'none' }}
          >
            <div className="flex-1">
              <div className="font-medium" style={{ color: 'var(--ink-primary)' }}>{c.name}</div>
              <div className="mt-0.5 text-xs" style={{ color: 'var(--ink-tertiary)' }}>
                {c.card_ids.length} 张卡 · 更新于 {formatTime(c.updated_time)} · revision {c.revision}
              </div>
            </div>
            <span style={{ color: 'var(--ink-tertiary)' }}>→</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
