import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notepadApi, ApiError, formatTime } from '../lib/apiClient'

interface Draft {
  title: string
  brief: string
  content: string
  tags: string[]
  status: 'PUBLISHED' | 'UNPUBLISHED'
}

export default function NotepadDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['notepad', id],
    queryFn: () => notepadApi.get(id!),
    enabled: !!id,
  })
  const notepad = data?.notepad
  const isFavorite = notepad?.type === 'FAVORITE'

  const [draft, setDraft] = useState<Draft | null>(null)
  const [tagDraft, setTagDraft] = useState('')

  // 数据加载完成后初始化草稿（仅在词本 id 变化时重置）
  useEffect(() => {
    if (notepad && !isFavorite) {
      setDraft({
        title: notepad.title,
        brief: notepad.brief,
        content: notepad.content,
        tags: notepad.tags,
        status: notepad.status === 'PUBLISHED' ? 'PUBLISHED' : 'UNPUBLISHED',
      })
    }
  }, [notepad?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const saveMutation = useMutation({
    mutationFn: () => notepadApi.update(id!, draft!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notepad', id] })
      queryClient.invalidateQueries({ queryKey: ['notepads'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => notepadApi.remove(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notepads'] })
      navigate('/content/notepads')
    },
  })

  const chapters = useMemo(() => {
    if (!notepad?.list) return []
    const result: { name: string; words: string[] }[] = []
    let cur: { name: string; words: string[] } | null = null
    notepad.list.forEach((item) => {
      if (item.type === 'CHAPTER') { cur = { name: item.data.chapter ?? '章节', words: [] }; result.push(cur) }
      else if (item.type === 'WORD' && cur) cur.words.push(item.data.word ?? '')
    })
    return result
  }, [notepad])

  if (isLoading) return <div className="card h-40 animate-pulse" />
  if (isError || !notepad) {
    return (
      <div className="card flex flex-col items-center gap-2 p-12 text-center" style={{ color: 'var(--ink-tertiary)' }}>
        <div className="text-3xl">📭</div>
        词本不存在或已被删除
        <Link to="/content/notepads" className="btn btn-ghost mt-2">返回列表</Link>
      </div>
    )
  }

  return (
    <div className="page-enter">
      <div className="mb-3 flex items-center gap-2 text-[13px]" style={{ color: 'var(--ink-tertiary)' }}>
        <Link to="/content/notepads" style={{ color: 'var(--ink-secondary)' }}>云词本</Link>
        <span>/</span>
        <span style={{ color: 'var(--ink-primary)' }}>{notepad.title}</span>
      </div>

      {isFavorite ? (
        <div className="card p-6">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold">{notepad.title}</h1>
            <span className="badge badge-info">我的收藏 · 只读</span>
          </div>
          <p className="mt-2 whitespace-pre-wrap rounded-lg p-4 font-mono text-[13px]" style={{ background: 'var(--bg-base)' }}>{notepad.content}</p>
          <div className="mt-3 text-xs" style={{ color: 'var(--ink-tertiary)' }}>更新于 {formatTime(notepad.updated_time)}</div>
        </div>
      ) : (
        <div className="card p-6">
          <div className="flex flex-wrap items-center gap-3">
            <input className="input !w-64 font-display text-lg font-bold" value={draft?.title ?? ''} onChange={(e) => setDraft(draft && { ...draft, title: e.target.value })} />
            <select
              className="input !w-36"
              value={draft?.status ?? 'PUBLISHED'}
              onChange={(e) => setDraft(draft && { ...draft, status: e.target.value as 'PUBLISHED' | 'UNPUBLISHED' })}
            >
              <option value="PUBLISHED">已发布</option>
              <option value="UNPUBLISHED">未发布</option>
            </select>
            <div className="flex flex-1 flex-wrap items-center gap-1.5">
              {draft?.tags.map((t) => (
                <span key={t} className="badge badge-brand" style={{ cursor: 'pointer' }}
                  onClick={() => setDraft(draft && { ...draft, tags: draft.tags.filter((x) => x !== t) })}>
                  {t} ✕
                </span>
              ))}
              <input
                className="min-w-20 flex-1 bg-transparent text-sm outline-none"
                placeholder="+标签"
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && tagDraft.trim() && draft) {
                    e.preventDefault()
                    setDraft({ ...draft, tags: [...draft.tags, tagDraft.trim()] })
                    setTagDraft('')
                  }
                }}
              />
            </div>
            <button className="btn btn-brand" disabled={saveMutation.isPending || !draft} onClick={() => saveMutation.mutate()}>
              {saveMutation.isPending ? '保存中…' : '保存'}
            </button>
            <button
              className="btn btn-danger"
              onClick={() => {
                if (window.confirm(`确定删除词本「${notepad.title}」？此操作不可恢复`)) deleteMutation.mutate()
              }}
            >
              删除
            </button>
          </div>
          <input className="input mt-3 !w-full" value={draft?.brief ?? ''} onChange={(e) => setDraft(draft && { ...draft, brief: e.target.value })} placeholder="简介" />
          {saveMutation.error && (
            <div className="mt-3 rounded-md px-3 py-2 text-[13px]" style={{ background: 'rgba(242,97,122,.1)', color: 'var(--danger)' }}>
              {saveMutation.error instanceof ApiError ? saveMutation.error.message : '保存失败'}
            </div>
          )}

          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div>
              <div className="mb-2 text-[13px] font-medium" style={{ color: 'var(--ink-secondary)' }}>
                内容编辑器（章节模式：以 # 开头；文本模式：直接粘贴文字）
              </div>
              <textarea
                className="input !min-h-72 !font-mono !text-[13px] leading-relaxed"
                value={draft?.content ?? ''}
                onChange={(e) => setDraft(draft && { ...draft, content: e.target.value })}
                spellCheck={false}
              />
            </div>
            <div>
              <div className="mb-2 text-[13px] font-medium" style={{ color: 'var(--ink-secondary)' }}>
                解析预览 · 共 {chapters.length} 章 / {notepad.list.filter((i) => i.type === 'WORD').length} 词
              </div>
              <div className="max-h-96 overflow-y-auto rounded-lg border p-4" style={{ borderColor: 'var(--line)', background: 'var(--bg-base)' }}>
                {chapters.length === 0 && <div className="text-[13px]" style={{ color: 'var(--ink-tertiary)' }}>无章节结构（文本模式或未解析）</div>}
                {chapters.map((c) => (
                  <div key={c.name} className="mb-3">
                    <div className="flex items-center gap-2 font-semibold" style={{ color: 'var(--brand)' }}>
                      <span>#</span>{c.name}
                      <span className="badge badge-mute !text-[10px]">{c.words.length} 词</span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {c.words.map((w) => <span key={w} className="badge badge-mute">{w}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
