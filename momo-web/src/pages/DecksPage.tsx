import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { markjiApi, MarkjiFolder, MarkjiSource, ApiError, formatTime } from '../lib/apiClient'
import TiltedCard from '../components/react-bits/TiltedCard'

function PermissionError({ message }: { message: string }) {
  return (
    <div className="card flex flex-col items-center gap-3 p-14 text-center">
      <div className="text-3xl">🔐</div>
      <div className="font-semibold">无法访问记忆卡</div>
      <div className="max-w-md text-[13px]" style={{ color: 'var(--ink-secondary)' }}>
        {message.includes('Permission') || message.includes('403')
          ? '墨墨记忆卡（Markji）接口需要开通「Markji Plus」权限。请在墨墨记忆卡 App 中开通后重试。'
          : message}
      </div>
    </div>
  )
}

function FolderTree({ folders, onSelect, activeId }: { folders: MarkjiFolder[]; onSelect: (id: string | undefined) => void; activeId?: string }) {
  const [open, setOpen] = useState<Set<string>>(new Set())

  // 按 parent_id 建立文件夹层级；根节点 parent_id 为空
  const byParent = (parentId: string | undefined) => folders.filter((f) => (f.parent_id ?? undefined) === parentId)
  // 每个文件夹内的牌组 id（由 items 中 object_class=DECK 的对象推导）
  const deckIdsOf = (f: MarkjiFolder) => f.items.filter((i) => i.object_class === 'DECK').map((i) => i.object_id)

  const toggle = (id: string) => {
    const next = new Set(open)
    if (next.has(id)) next.delete(id); else next.add(id)
    setOpen(next)
  }

  const renderFolder = (f: MarkjiFolder) => {
    const isOpen = open.has(f.id)
    const subFolders = byParent(f.id)
    const deckIds = deckIdsOf(f)
    return (
      <div key={f.id}>
        <div
          className={activeId === f.id ? 'active' : ''}
          style={{ padding: '7px 10px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: activeId === f.id ? 'var(--brand)' : 'var(--ink-secondary)' }}
          onClick={() => { toggle(f.id); onSelect(f.id) }}
        >
          <span style={{ width: 12, color: 'var(--ink-tertiary)' }}>{isOpen ? '▾' : '▸'}</span>
          📁 {f.name}
        </div>
        {isOpen && (
          <div style={{ marginLeft: 16, paddingLeft: 6, borderLeft: '1px solid var(--line)' }}>
            {subFolders.map(renderFolder)}
            {deckIds.map((deckId) => (
              <Link
                key={deckId}
                to={`/markji/decks/${deckId}`}
                style={{ display: 'block', padding: '7px 10px', borderRadius: 8, fontSize: 13.5, color: 'var(--ink-tertiary)', textDecoration: 'none' }}
              >
                🗂 {deckId.slice(0, 12)}…
              </Link>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <div
        style={{ padding: '7px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 8, color: activeId === undefined ? 'var(--brand)' : 'var(--ink-secondary)', fontWeight: activeId === undefined ? 600 : 400 }}
        onClick={() => onSelect(undefined)}
      >
        📚 全部牌组
      </div>
      {byParent(undefined).map(renderFolder)}
    </div>
  )
}

export default function DecksPage() {
  const [source, setSource] = useState<MarkjiSource | undefined>(undefined)
  const [offset, setOffset] = useState(0)
  const [folderId, setFolderId] = useState<string | undefined>(undefined)

  const foldersQuery = useQuery({ queryKey: ['markji', 'folders'], queryFn: markjiApi.listFolders })
  const decksQuery = useQuery({
    queryKey: ['markji', 'decks', { source, offset, folderId }],
    queryFn: () => markjiApi.listDecks({ offset, limit: 12, folder_id: folderId, source }),
  })

  const firstError = decksQuery.error ?? foldersQuery.error
  const permError = firstError instanceof ApiError ? firstError.message : null

  const decks = decksQuery.data?.decks ?? []
  const total = decksQuery.data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / 12))

  if (permError) return <PermissionError message={permError} />

  return (
    <div className="page-enter">
      <h1 className="font-display text-[32px] font-bold">记忆卡 · 牌组</h1>
      <p className="mt-1 text-[13px]" style={{ color: 'var(--ink-secondary)' }}>
        <span className="font-mono text-xs">GET /markji/decks/folders + /markji/decks</span>
      </p>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[220px_1fr]">
        <div className="card h-max p-3">
          {foldersQuery.isLoading && <div className="h-40 animate-pulse" />}
          {foldersQuery.data && (
            <FolderTree folders={foldersQuery.data.folders} onSelect={setFolderId} activeId={folderId} />
          )}
        </div>

        <div>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="flex w-max gap-1.5 rounded-full p-1" style={{ background: 'var(--bg-surface)', border: '1px solid var(--line)' }}>
              <button className={`pill-btn ${!source ? 'active' : ''}`} onClick={() => { setSource(undefined); setOffset(0) }}>全部</button>
              <button className={`pill-btn ${source === 'SELF' ? 'active' : ''}`} onClick={() => { setSource('SELF'); setOffset(0) }}>自建</button>
              <button className={`pill-btn ${source === 'FORK' ? 'active' : ''}`} onClick={() => { setSource('FORK'); setOffset(0) }}>派生</button>
            </div>
            <span className="text-[13px]" style={{ color: 'var(--ink-tertiary)' }}>共 {total} 个牌组</span>
          </div>

          {decksQuery.isLoading && <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">{[...Array(3)].map((_, i) => <div key={i} className="card h-36 animate-pulse" />)}</div>}

          {!decksQuery.isLoading && decks.length === 0 && (
            <div className="card flex flex-col items-center gap-2 p-14 text-center" style={{ color: 'var(--ink-tertiary)' }}>
              <div className="text-3xl">🃏</div>
              没有找到牌组，去墨墨记忆卡 App 创建一个吧
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {decks.map((d, i) => (
              <TiltedCard
                key={d.id}
                rotateRange={6}
                style={{ animation: `fadeUp .3s ease-out ${i * 0.04}s backwards` }}
              >
                <Link
                  to={`/markji/decks/${d.id}`}
                  className="card group block p-5"
                  style={{ textDecoration: 'none' }}
                >
                  <div className="font-semibold" style={{ color: 'var(--ink-primary)' }}>{d.name}</div>
                  <div className="mt-1.5 line-clamp-2 text-[13px]" style={{ color: 'var(--ink-secondary)' }}>{d.description || '—'}</div>
                  <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: 'var(--ink-tertiary)' }}>
                    <span>🃏 {d.card_count}</span>
                    <span>📑 {d.chapter_count}</span>
                    <span className="ml-auto">{formatTime(d.updated_time)}</span>
                  </div>
                  <div className="mt-3 flex gap-1.5">
                    <span className={`badge ${d.source === 'SELF' ? 'badge-brand' : 'badge-info'}`}>{d.source === 'SELF' ? '自建' : '派生'}</span>
                    {d.is_private && <span className="badge badge-mute">🔒 私有</span>}
                  </div>
                </Link>
              </TiltedCard>
            ))}
          </div>

          {pageCount > 1 && (
            <div className="mt-6 flex justify-center gap-2">
              <button className="btn btn-ghost !px-3 !py-1.5 text-xs" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - 12))}>←</button>
              <span className="flex items-center px-2 text-xs" style={{ color: 'var(--ink-tertiary)' }}>
                {offset / 12 + 1} / {pageCount}
              </span>
              <button className="btn btn-ghost !px-3 !py-1.5 text-xs" disabled={offset + 12 >= total} onClick={() => setOffset(offset + 12)}>→</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
