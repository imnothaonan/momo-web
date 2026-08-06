import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { markjiApi, ApiError, formatTime } from '../lib/apiClient'
import MarkjiRenderer, { validateMarkji } from '../lib/markji'

const SNIPPETS: { label: string; snip: string }[] = [
  { label: 'B 加粗', snip: '[T#B#文字]' },
  { label: '◻ 挖空', snip: '[F#1#内容]' },
  { label: 'H1 标题', snip: '[P#H1#标题]' },
  { label: '☑ 选择题', snip: '[Choice##\n* 正确选项\n- 错误选项\n]' },
  { label: '∑ 公式', snip: '[E##E=mc^2]' },
  { label: '🖼 图片', snip: '[Pic#ID/图片ID#]' },
  { label: '♪ 音频', snip: '[Audio#ID/音频ID#发音]' },
  { label: '― 答案线', snip: '---' },
]

export default function EditorPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const deckParam = params.get('deck') ?? ''
  const chapterParam = params.get('chapter') ?? ''
  const cardParam = params.get('card') ?? ''

  const [deckId, setDeckId] = useState(deckParam)
  const [chapterId, setChapterId] = useState(chapterParam)
  const [content, setContent] = useState('')
  const [uploading, setUploading] = useState(false)
  const [fileError, setFileError] = useState('')

  // 从 URL 参数初始化
  useEffect(() => { if (deckParam) setDeckId(deckParam) }, [deckParam])
  useEffect(() => { if (chapterParam) setChapterId(chapterParam) }, [chapterParam])

  const decksQuery = useQuery({ queryKey: ['markji', 'decks-all'], queryFn: () => markjiApi.listDecks({ limit: 100 }) })
  const chaptersQuery = useQuery({
    queryKey: ['markji', 'chapters', deckId],
    queryFn: () => markjiApi.listChapters(deckId),
    enabled: !!deckId,
  })

  const decksError = decksQuery.error instanceof ApiError ? decksQuery.error.message : ''

  // 编辑已有卡片：拉取原内容
  const cardQuery = useQuery({
    queryKey: ['markji', 'card', cardParam],
    queryFn: () => markjiApi.getCard(deckId, cardParam),
    enabled: !!cardParam && !!deckId,
  })
  useEffect(() => {
    if (cardQuery.data?.card) setContent(cardQuery.data.card.content)
  }, [cardQuery.data])

  const validationErrors = useMemo(() => validateMarkji(content), [content])

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!deckId) throw new Error('请先选择牌组')
      if (cardParam) return markjiApi.updateCard(deckId, cardParam, content)
      if (!chapterId) throw new Error('新建卡片请选择章节')
      return markjiApi.createCard(deckId, chapterId, content)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['markji'] })
      const card = (data as { card?: { id: string } }).card
      if (card) navigate(`/markji/decks/${deckId}/chapters/${chapterId}`)
      else navigate(`/markji/decks/${deckId}`)
    },
  })

  const insertSnippet = (snip: string) => {
    const ta = document.getElementById('mj-input') as HTMLTextAreaElement | null
    const s = ta?.selectionStart ?? content.length
    const next = content.slice(0, s) + snip + content.slice(s ?? content.length)
    setContent(next)
    requestAnimationFrame(() => { if (ta) ta.focus() })
  }

  const uploadFile = async (file: File) => {
    setUploading(true)
    setFileError('')
    try {
      const { file: f } = await markjiApi.uploadFile(deckId || undefined, file)
      insertSnippet(`[Pic#ID/${f.id}#]`)
    } catch (e) {
      setFileError(e instanceof ApiError ? e.message : '上传失败')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="page-enter">
      <div className="mb-3 flex items-center gap-2 text-[13px]" style={{ color: 'var(--ink-tertiary)' }}>
        <Link to="/markji/decks" style={{ color: 'var(--ink-secondary)' }}>牌组</Link>
        <span>/</span>
        <span style={{ color: 'var(--ink-primary)' }}>{cardParam ? '编辑卡片' : '新建卡片'}</span>
      </div>

      <h1 className="font-display text-[32px] font-bold">{cardParam ? '编辑卡片' : '新建卡片'}</h1>

      {decksError && (
        <div className="card mt-4 flex items-center gap-3 p-4 text-[13px]" style={{ color: 'var(--danger)' }}>
          🔐 无法加载牌组列表：{decksError.includes('Permission') ? '需要开通「Markji Plus」权限' : decksError}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <select className="input !w-64" value={deckId} onChange={(e) => { setDeckId(e.target.value); setChapterId('') }}>
          <option value="">选择牌组…</option>
          {decksQuery.data?.decks.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select className="input !w-64" value={chapterId} onChange={(e) => setChapterId(e.target.value)} disabled={!deckId}>
          <option value="">选择章节…</option>
          {chaptersQuery.data?.chapters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <span className="badge badge-mute font-mono">grammar_version: 1</span>
        {cardParam && cardQuery.data?.card && (
          <span className="badge badge-info">编辑中 · 更新于 {formatTime(cardQuery.data.card.updated_time)}</span>
        )}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div>
          <div className="flex flex-wrap gap-1.5 rounded-t-lg p-2.5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--line)', borderBottom: 'none' }}>
            {SNIPPETS.map((s) => (
              <button key={s.label} className="rounded-md px-2.5 py-1.5 font-mono text-xs transition-colors hover:!text-[var(--brand)]"
                style={{ color: 'var(--ink-secondary)', border: '1px solid var(--line)' }} onClick={() => insertSnippet(s.snip)}>
                {s.label}
              </button>
            ))}
            <label className="cursor-pointer rounded-md px-2.5 py-1.5 font-mono text-xs transition-colors hover:!text-[var(--brand)]"
              style={{ color: 'var(--ink-secondary)', border: '1px solid var(--line)' }}>
              {uploading ? '上传中…' : '⬆ 上传文件'}
              <input type="file" className="hidden" accept="image/*,audio/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadFile(f); e.target.value = '' }} />
            </label>
          </div>
          <textarea
            id="mj-input"
            className="input !min-h-96 !rounded-t-none !font-mono !text-[13.5px] leading-relaxed"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="[P#H1#标题]
正文 [F#1#挖空]…
---
答案区"
            spellCheck={false}
          />
          {fileError && <div className="mt-2 text-xs" style={{ color: 'var(--danger)' }}>{fileError}</div>}
        </div>

        <div>
          <div className="mb-2 flex items-center gap-3">
            <span className="text-[13px] font-medium" style={{ color: 'var(--ink-secondary)' }}>实时预览</span>
            {validationErrors.length > 0 ? (
              <span className="badge badge-danger">{validationErrors.length} 处语法问题</span>
            ) : (
              <span className="badge badge-success">✓ 语法通过</span>
            )}
          </div>
          <div className="min-h-96 rounded-lg border p-5" style={{ borderColor: 'var(--line)', background: 'var(--bg-surface)' }}>
            {content.trim() ? <MarkjiRenderer content={content} /> : <div className="text-sm" style={{ color: 'var(--ink-tertiary)' }}>在左侧输入 Markji 语法，这里实时渲染</div>}
          </div>
          {validationErrors.length > 0 && (
            <div className="mt-3 flex flex-col gap-1 font-mono text-xs" style={{ color: 'var(--danger)' }}>
              {validationErrors.map((e, i) => <div key={i}>⚠ {e}</div>)}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          className="btn btn-brand !px-8"
          disabled={saveMutation.isPending || validationErrors.length > 0 || (cardParam ? !deckId : !deckId || !chapterId)}
          onClick={() => saveMutation.mutate()}
        >
          {saveMutation.isPending ? '保存中…' : '保存卡片'}
        </button>
        {validationErrors.length > 0 && (
          <span className="text-xs" style={{ color: 'var(--ink-tertiary)' }}>修复语法问题后可保存</span>
        )}
        {saveMutation.error && (
          <span className="text-xs" style={{ color: 'var(--danger)' }}>
            {saveMutation.error instanceof ApiError ? saveMutation.error.message : '保存失败'}
          </span>
        )}
      </div>
    </div>
  )
}
