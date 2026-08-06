import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notepadApi, BriefNotepad, formatTime, ApiError } from '../lib/apiClient'
import GlareHover from '../components/react-bits/GlareHover'

export default function NotepadsPage() {
  const query = useQuery({ queryKey: ['notepads'], queryFn: () => notepadApi.list({ limit: 10 }) })
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ title: '', brief: '', tags: '' as string | string[] })
  const [tagDraft, setTagDraft] = useState('')
  const [formError, setFormError] = useState('')

  const createMutation = useMutation({
    mutationFn: () => notepadApi.create({
      status: 'PUBLISHED',
      content: '# 第一章\n',
      title: form.title,
      brief: form.brief,
      tags: Array.isArray(form.tags) ? form.tags : [],
    }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notepads'] })
      setCreating(false)
      setForm({ title: '', brief: '', tags: [] })
      navigate(`/content/notepads/${data.notepad.id}`)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notepadApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notepads'] }),
  })

  const notepads = query.data?.notepads ?? []
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) { setFormError('请填写标题'); return }
    createMutation.mutate()
  }

  return (
    <div className="page-enter">
      <h1 className="font-display text-[32px] font-bold">云词本</h1>
      <p className="mt-1 text-[13px]" style={{ color: 'var(--ink-secondary)' }}>
        <span className="font-mono text-xs">GET/POST /memo/notepads</span> · 章节模式（# 开头）/ 文本模式
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {notepads.map((n: BriefNotepad) => (
          <GlareHover key={n.id} className="card flex flex-col p-5 transition-all hover:-translate-y-0.5">
            <Link to={`/content/notepads/${n.id}`} style={{ textDecoration: 'none' }}>
              <div className="flex items-center gap-2">
                <span className="font-semibold" style={{ color: 'var(--ink-primary)' }}>{n.title}</span>
                {n.type === 'FAVORITE' && <span className="badge badge-info">收藏·只读</span>}
              </div>
              <div className="mt-1.5 text-[13px]" style={{ color: 'var(--ink-secondary)' }}>{n.brief || '—'}</div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {n.tags.slice(0, 3).map((t) => <span key={t} className="badge badge-brand">{t}</span>)}
                <span className="badge badge-mute">{n.status === 'PUBLISHED' ? '已发布' : '未发布'}</span>
              </div>
              <div className="mt-3 text-xs" style={{ color: 'var(--ink-tertiary)' }}>更新于 {formatTime(n.updated_time)}</div>
            </Link>
            {n.type !== 'FAVORITE' && (
              <button
                className={`btn ${confirmId === n.id ? 'btn-danger' : 'btn-ghost'} mt-3 self-end !px-3 !py-1 text-xs`}
                onClick={() => {
                  if (confirmId === n.id) { deleteMutation.mutate(n.id); setConfirmId(null) }
                  else { setConfirmId(n.id); setTimeout(() => setConfirmId(null), 2500) }
                }}
              >
                {confirmId === n.id ? '确认删除？' : '删除'}
              </button>
            )}
          </GlareHover>
        ))}

        <button
          className="card grid min-h-36 place-items-center border-dashed p-5 transition-colors hover:!border-[var(--brand)]"
          style={{ color: 'var(--ink-tertiary)' }}
          onClick={() => setCreating(true)}
        >
          <div className="text-center"><div className="text-2xl">＋</div>新建词本</div>
        </button>
      </div>

      {query.isLoading && <div className="card mt-4 h-28 animate-pulse" />}
      {!query.isLoading && notepads.length === 0 && (
        <div className="card mt-6 flex flex-col items-center gap-2 p-12 text-center" style={{ color: 'var(--ink-tertiary)' }}>
          <div className="text-3xl">📚</div>
          还没有云词本，点击「新建词本」创建第一个
        </div>
      )}

      {creating && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setCreating(false)}>
          <form className="card w-full max-w-md !rounded-2xl p-6" style={{ background: 'var(--bg-overlay)' }}
            onClick={(e) => e.stopPropagation()} onSubmit={submit}>
            <h3 className="mb-4 text-lg font-semibold">新建云词本</h3>
            <div className="flex flex-col gap-3.5">
              <div>
                <label className="mb-1.5 block text-xs font-medium" style={{ color: 'var(--ink-secondary)' }}>标题</label>
                <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="如：考研核心词" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium" style={{ color: 'var(--ink-secondary)' }}>简介</label>
                <input className="input" value={form.brief} onChange={(e) => setForm({ ...form, brief: e.target.value })} placeholder="一句话说明" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium" style={{ color: 'var(--ink-secondary)' }}>标签（回车添加）</label>
                <div className="flex flex-wrap items-center gap-1.5 rounded-md px-3 py-2" style={{ background: 'var(--bg-base)', border: '1px solid var(--line-strong)' }}>
                  {(Array.isArray(form.tags) ? form.tags : []).map((t) => (
                    <span key={t} className="badge badge-brand" style={{ cursor: 'pointer' }}
                      onClick={() => setForm({ ...form, tags: (Array.isArray(form.tags) ? form.tags : []).filter((x) => x !== t) })}>
                      {t} ✕
                    </span>
                  ))}
                  <input
                    className="min-w-24 flex-1 bg-transparent text-sm outline-none"
                    placeholder="回车添加"
                    value={tagDraft}
                    onChange={(e) => setTagDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && tagDraft.trim()) {
                        e.preventDefault()
                        const arr = Array.isArray(form.tags) ? form.tags : []
                        setForm({ ...form, tags: [...arr, tagDraft.trim()] })
                        setTagDraft('')
                      }
                    }}
                  />
                </div>
              </div>
            </div>
            {formError && (
              <div className="mt-3 rounded-md px-3 py-2 text-[13px]" style={{ background: 'rgba(242,97,122,.1)', color: 'var(--danger)' }}>{formError}</div>
            )}
            {createMutation.error && (
              <div className="mt-3 rounded-md px-3 py-2 text-[13px]" style={{ background: 'rgba(242,97,122,.1)', color: 'var(--danger)' }}>
                {createMutation.error instanceof ApiError ? createMutation.error.message : '创建失败'}
              </div>
            )}
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" className="btn btn-ghost" onClick={() => setCreating(false)}>取消</button>
              <button type="submit" className="btn btn-brand" disabled={createMutation.isPending}>
                {createMutation.isPending ? '创建中…' : '创建'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
