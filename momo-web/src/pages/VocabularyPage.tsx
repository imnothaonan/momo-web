import { FormEvent, useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  vocabularyApi, interpretationApi, noteApi, phraseApi,
  ApiError, formatTime,
} from '../lib/apiClient'
import BlurText from '../components/react-bits/BlurText'

type Tab = 'interpretations' | 'notes' | 'phrases'

const HISTORY_KEY = 'momo-vocab-history'
const MAX_HISTORY = 10

function loadHistory(): string[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
  } catch {
    return []
  }
}

function saveHistory(word: string) {
  const prev = loadHistory().filter((w) => w !== word)
  localStorage.setItem(HISTORY_KEY, JSON.stringify([word, ...prev].slice(0, MAX_HISTORY)))
}

export default function VocabularyPage() {
  const [spelling, setSpelling] = useState('')
  const [searched, setSearched] = useState('')
  const [tab, setTab] = useState<Tab>('interpretations')
  const [history, setHistory] = useState<string[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setHistory(loadHistory())
  }, [])

  const search = useQuery({
    queryKey: ['vocabulary', searched],
    queryFn: () => vocabularyApi.get(searched),
    enabled: searched.length > 0,
    retry: false,
  })
  const vocId = search.data?.voc?.id

  const details = useQuery({
    queryKey: ['voc-detail', vocId],
    queryFn: async () => {
      const [interp, notes, phrases] = await Promise.all([
        interpretationApi.list(vocId!).catch(() => ({ interpretations: [] })),
        noteApi.list(vocId!).catch(() => ({ notes: [] })),
        phraseApi.list(vocId!).catch(() => ({ phrases: [] })),
      ])
      return { ...interp, ...notes, ...phrases }
    },
    enabled: !!vocId,
  })

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const word = spelling.trim()
    if (word) {
      setSearched(word)
      saveHistory(word)
      setHistory(loadHistory())
      setShowHistory(false)
    }
  }

  const pickHistory = (word: string) => {
    setSpelling(word)
    setSearched(word)
    setShowHistory(false)
    inputRef.current?.blur()
  }

  const statusBadge = (status: string) =>
    status === 'PUBLISHED' ? <span className="badge badge-success">已发布</span> : <span className="badge badge-mute">未发布</span>

  return (
    <div className="page-enter">
      <BlurText text="单词工具" delay={35} className="font-display text-[32px] font-bold" animateBy="words" direction="top" />
      <p className="mt-1 text-[13px]" style={{ color: 'var(--ink-secondary)' }}>
        <span className="font-mono text-xs">GET /memo/vocabulary?spelling=</span>
      </p>

      <form onSubmit={onSubmit} className="relative mt-5 max-w-xl">
        <input
          ref={inputRef}
          className="input !py-3 pl-11 text-[15px]"
          placeholder="输入单词拼写，回车查询…"
          value={spelling}
          onChange={(e) => setSpelling(e.target.value)}
          onFocus={() => setShowHistory(true)}
          onBlur={() => setTimeout(() => setShowHistory(false), 150)}
          autoFocus
        />
        <span className="absolute left-4 top-3.5 text-sm" style={{ color: 'var(--ink-tertiary)' }}>🔍</span>
        {showHistory && history.length > 0 && (
          <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg shadow-lg" style={{ background: 'var(--bg-overlay)', border: '1px solid var(--line-strong)' }}>
            <div className="px-3 py-1.5 text-[11px] font-semibold" style={{ color: 'var(--ink-tertiary)' }}>最近搜索</div>
            {history.map((h) => (
              <button
                key={h}
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--bg-hover)]"
                style={{ color: 'var(--ink-primary)' }}
                onMouseDown={(e) => { e.preventDefault(); pickHistory(h) }}
              >
                <span style={{ color: 'var(--ink-tertiary)' }}>🕐</span>
                {h}
              </button>
            ))}
            <button
              type="button"
              className="w-full border-t px-3 py-1.5 text-left text-xs"
              style={{ borderColor: 'var(--line)', color: 'var(--ink-tertiary)' }}
              onMouseDown={(e) => { e.preventDefault(); localStorage.removeItem(HISTORY_KEY); setHistory([]) }}
            >
              清除历史
            </button>
          </div>
        )}
      </form>

      {search.isError && (
        <div className="card mt-6 flex flex-col items-center gap-2 p-10 text-center" style={{ color: 'var(--ink-tertiary)' }}>
          <div className="text-3xl">🔎</div>
          <div style={{ color: 'var(--ink-secondary)' }}>
            {search.error instanceof ApiError ? search.error.message : '查询失败'}
          </div>
          {search.error instanceof ApiError && search.error.status === 404 && (
            <div className="text-xs">墨墨词库中没有这个词，试试相近拼写</div>
          )}
        </div>
      )}

      {search.data?.voc && (
        <div className="card mt-6 max-w-xl overflow-hidden p-6">
          <div className="flex flex-wrap items-baseline gap-3">
            <div className="font-display text-3xl font-bold">{search.data.voc.spelling}</div>
            <button
              className="badge badge-mute font-mono !text-[11px]"
              title="点击复制 voc_id"
              onClick={() => { void navigator.clipboard?.writeText(search.data.voc.id); }}
            >
              ID: {search.data.voc.id.slice(0, 14)}…⧉
            </button>
          </div>

          <div className="mt-4 flex w-max gap-1.5 rounded-full p-1" style={{ background: 'var(--bg-base)', border: '1px solid var(--line)' }}>
            {(['interpretations', 'notes', 'phrases'] as Tab[]).map((t) => (
              <button key={t} className={`pill-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
                {t === 'interpretations' ? '释义' : t === 'notes' ? '助记' : '例句'}
                {details.data && (t === 'interpretations' ? details.data.interpretations : t === 'notes' ? details.data.notes : details.data.phrases).length > 0
                  ? ` (${(t === 'interpretations' ? details.data.interpretations : t === 'notes' ? details.data.notes : details.data.phrases).length})` : ''}
              </button>
            ))}
          </div>

          {details.isLoading && <div className="card mt-4 h-24 animate-pulse" />}

          {details.data && tab === 'interpretations' && (
            <div className="mt-4 flex flex-col gap-2">
              {details.data.interpretations.length === 0 && <Empty text="还没有释义，去内容管理创建" />}
              {details.data.interpretations.map((it) => (
                <div key={it.id} className="rounded-lg border p-3.5" style={{ borderColor: 'var(--line)' }}>
                  <div>{it.interpretation}</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {it.tags.map((t) => <span key={t} className="badge badge-brand">{t}</span>)}
                    {statusBadge(it.status)}
                    <span className="ml-auto badge badge-mute">{formatTime(it.updated_time)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {details.data && tab === 'notes' && (
            <div className="mt-4 flex flex-col gap-2">
              {details.data.notes.length === 0 && <Empty text="还没有助记，去内容管理创建" />}
              {details.data.notes.map((n) => (
                <div key={n.id} className="rounded-lg border p-3.5" style={{ borderColor: 'var(--line)' }}>
                  <div><span className="badge badge-info mr-2">{n.note_type}</span>{n.note}</div>
                  <div className="mt-2"><span className="badge badge-mute">{formatTime(n.updated_time)}</span></div>
                </div>
              ))}
            </div>
          )}

          {details.data && tab === 'phrases' && (
            <div className="mt-4 flex flex-col gap-2">
              {details.data.phrases.length === 0 && <Empty text="还没有例句，去内容管理创建" />}
              {details.data.phrases.map((p) => (
                <div key={p.id} className="rounded-lg border p-3.5" style={{ borderColor: 'var(--line)' }}>
                  <div>{p.phrase}</div>
                  <div className="mt-1 text-[13px]" style={{ color: 'var(--ink-secondary)' }}>{p.interpretation}</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {p.tags.map((t) => <span key={t} className="badge badge-brand">{t}</span>)}
                    <span className="badge badge-mute">{p.origin}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!searched && (
        <div className="card mt-6 flex max-w-xl flex-col items-center gap-3 p-12 text-center" style={{ color: 'var(--ink-tertiary)' }}>
          <div className="text-3xl">📖</div>
          输入单词拼写，查看释义、助记与例句
          {history.length > 0 && (
            <div className="mt-2 flex flex-wrap justify-center gap-1.5">
              {history.slice(0, 5).map((h) => (
                <button
                  key={h}
                  className="badge badge-mute cursor-pointer transition-colors hover:!text-[var(--brand)]"
                  onClick={() => pickHistory(h)}
                >
                  {h}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed p-8 text-center text-[13px]" style={{ color: 'var(--ink-tertiary)' }}>
      {text}
    </div>
  )
}
