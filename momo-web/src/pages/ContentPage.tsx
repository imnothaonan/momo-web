import { FormEvent, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  vocabularyApi, interpretationApi, noteApi, phraseApi,
  ApiError, formatTime, PublishStatus,
} from '../lib/apiClient'

type Kind = 'interpretations' | 'notes' | 'phrases'

interface FieldDef {
  key: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'tags'
  options?: string[]
  required?: boolean
}

type CrudApi = {
  list: (vocId: string) => Promise<{ [k: string]: unknown[] }>
  remove: (id: string) => Promise<unknown>
}

const CONFIG: Record<Kind, { api: CrudApi; fields: FieldDef[]; emptyText: string }> = {
  interpretations: {
    api: interpretationApi,
    emptyText: '该单词还没有释义，点击「新建」创建',
    fields: [
      { key: 'interpretation', label: '释义内容', type: 'textarea', required: true },
      { key: 'tags', label: '标签（回车添加）', type: 'tags' },
      { key: 'status', label: '状态', type: 'select', options: ['PUBLISHED', 'UNPUBLISHED'] },
    ],
  },
  notes: {
    api: noteApi,
    emptyText: '该单词还没有助记，点击「新建」创建',
    fields: [
      { key: 'note_type', label: '助记类型', type: 'select', options: ['谐音.', '词根.', '联想.', '串记.', '其他'], required: true },
      { key: 'note', label: '助记内容', type: 'textarea', required: true },
    ],
  },
  phrases: {
    api: phraseApi,
    emptyText: '该单词还没有例句，点击「新建」创建',
    fields: [
      { key: 'phrase', label: '例句', type: 'textarea', required: true },
      { key: 'interpretation', label: '翻译', type: 'text' },
      { key: 'origin', label: '来源', type: 'text' },
      { key: 'tags', label: '标签（回车添加）', type: 'tags' },
    ],
  },
}

/** 从拼写解析出 voc_id 并锁定上下文 */
function useWordContext() {
  const [spelling, setSpelling] = useState('')
  const [locked, setLocked] = useState('')
  const query = useQuery({
    queryKey: ['voc-lookup', locked],
    queryFn: () => vocabularyApi.get(locked),
    enabled: locked.length > 0,
    retry: false,
  })
  return {
    spelling, setSpelling,
    lookup: () => { if (spelling.trim()) setLocked(spelling.trim()) },
    voc: query.data?.voc,
    isError: query.isError,
    isFetching: query.isFetching,
  }
}

export default function ContentPage() {
  const [kind, setKind] = useState<Kind>('interpretations')
  const cfg = CONFIG[kind]
  const { spelling, setSpelling, lookup, voc, isError, isFetching } = useWordContext()
  const queryClient = useQueryClient()

  const listQuery = useQuery({
    queryKey: [kind, voc?.id],
    queryFn: () => cfg.api.list(voc!.id),
    enabled: !!voc,
  })
  const items = listQuery.data ? (listQuery.data as { interpretations: unknown[] } & { notes: unknown[] } & { phrases: unknown[] })[kind] : []

  const [editing, setEditing] = useState<{ id?: string; values: Record<string, unknown> } | null>(null)

  const saveMutation = useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      if (!voc) throw new Error('请先查询单词')
      if (editing?.id) {
        if (kind === 'interpretations') return interpretationApi.update(editing.id, values as { interpretation: string; tags: string[]; status: PublishStatus })
        if (kind === 'notes') return noteApi.update(editing.id, values as { note_type: string; note: string })
        return phraseApi.update(editing.id, values as { phrase: string; interpretation: string; tags: string[]; origin: string })
      }
      if (kind === 'interpretations') return interpretationApi.create({ voc_id: voc.id, ...values } as never)
      if (kind === 'notes') return noteApi.create({ voc_id: voc.id, ...values } as never)
      return phraseApi.create({ voc_id: voc.id, ...values } as never)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [kind] })
      setEditing(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => cfg.api.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [kind] }),
  })

  const rowValues = (row: Record<string, unknown>) => {
    if (kind === 'interpretations') return { interpretation: row.interpretation, tags: row.tags, status: row.status }
    if (kind === 'notes') return { note_type: row.note_type, note: row.note }
    return { phrase: row.phrase, interpretation: row.interpretation, tags: row.tags, origin: row.origin }
  }

  const renderRow = (row: Record<string, unknown>) => {
    if (kind === 'interpretations') {
      const r = row as unknown as { interpretation: string; tags: string[]; status: string; updated_time: string }
      return (
        <RowView
          title={r.interpretation}
          badges={[...r.tags.map((t) => <span key={t} className="badge badge-brand">{t}</span>),
            r.status === 'PUBLISHED' ? <span key="s" className="badge badge-success">已发布</span> : <span key="s" className="badge badge-mute">未发布</span>]}
          time={r.updated_time}
          onEdit={() => setEditing({ id: row.id as string, values: rowValues(row) })}
          onDelete={() => deleteMutation.mutate(row.id as string)}
        />
      )
    }
    if (kind === 'notes') {
      const r = row as unknown as { note_type: string; note: string; updated_time: string }
      return (
        <RowView
          title={<>{r.note} <span className="badge badge-info ml-2">{r.note_type}</span></>}
          badges={[]}
          time={r.updated_time}
          onEdit={() => setEditing({ id: row.id as string, values: rowValues(row) })}
          onDelete={() => deleteMutation.mutate(row.id as string)}
        />
      )
    }
    const r = row as unknown as { phrase: string; interpretation: string; origin: string; updated_time: string }
    return (
      <RowView
        title={r.phrase}
        sub={r.interpretation}
        badges={r.origin ? [<span key="o" className="badge badge-mute">{r.origin}</span>] : []}
        time={r.updated_time}
        onEdit={() => setEditing({ id: row.id as string, values: rowValues(row) })}
        onDelete={() => deleteMutation.mutate(row.id as string)}
      />
    )
  }

  return (
    <div className="page-enter">
      <h1 className="font-display text-[32px] font-bold">内容管理</h1>
      <p className="mt-1 text-[13px]" style={{ color: 'var(--ink-secondary)' }}>
        释义 / 助记 / 例句 · 管理你为单词创建的内容
      </p>

      <div className="mt-4 flex w-max gap-1.5 rounded-full p-1" style={{ background: 'var(--bg-surface)', border: '1px solid var(--line)' }}>
        {(['interpretations', 'notes', 'phrases'] as Kind[]).map((k) => (
          <button key={k} className={`pill-btn ${kind === k ? 'active' : ''}`} onClick={() => { setKind(k); setEditing(null) }}>
            {k === 'interpretations' ? '释义' : k === 'notes' ? '助记' : '例句'}
          </button>
        ))}
      </div>

      {/* 单词定位条 */}
      <div className="card mt-4 flex flex-wrap items-center gap-3 px-5 py-4">
        <span className="text-[13px]" style={{ color: 'var(--ink-secondary)' }}>当前单词</span>
        <input
          className="input !w-52 !py-2"
          placeholder="输入拼写定位…"
          value={spelling}
          onChange={(e) => setSpelling(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && lookup()}
        />
        <button className="btn btn-ghost !px-3.5 !py-2 text-xs" onClick={lookup} disabled={isFetching}>
          {isFetching ? '查询中…' : '定位'}
        </button>
        {voc && (
          <>
            <b className="font-display text-xl font-semibold">{voc.spelling}</b>
            <span className="font-mono text-[11px]" style={{ color: 'var(--ink-tertiary)' }}>{voc.id.slice(0, 18)}…</span>
          </>
        )}
        {isError && !voc && <span className="text-xs" style={{ color: 'var(--danger)' }}>未找到该单词</span>}
        <span className="flex-1" />
        <button className="btn btn-brand" disabled={!voc} onClick={() => setEditing({ values: {} })}>＋ 新建</button>
      </div>

      {!voc && (
        <div className="card mt-5 flex flex-col items-center gap-2 p-12 text-center" style={{ color: 'var(--ink-tertiary)' }}>
          <div className="text-3xl">✍️</div>
          先在顶部输入拼写并「定位」到单词，再管理内容
        </div>
      )}

      {voc && listQuery.isLoading && <div className="card mt-5 h-32 animate-pulse" />}

      {voc && !listQuery.isLoading && (items.length === 0 ? (
        <div className="card mt-5 flex flex-col items-center gap-2 p-10 text-center" style={{ color: 'var(--ink-tertiary)' }}>
          <div className="text-2xl">🗒</div>
          {cfg.emptyText}
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-2">
          {items.map((row) => renderRow(row as Record<string, unknown>))}
        </div>
      ))}

      {editing && voc && (
        <EditorModal
          kind={kind}
          cfg={cfg}
          values={editing.values}
          isSaving={saveMutation.isPending}
          error={saveMutation.error instanceof ApiError ? saveMutation.error.message : saveMutation.error instanceof Error ? saveMutation.error.message : ''}
          onClose={() => setEditing(null)}
          onSave={() => saveMutation.mutate(editing.values)}
          onChange={(key, value) => setEditing((e) => e ? { ...e, values: { ...e.values, [key]: value } } : e)}
        />
      )}
    </div>
  )
}

function RowView({
  title, sub, badges, time, onEdit, onDelete,
}: {
  title: React.ReactNode
  sub?: string
  badges?: React.ReactNode[]
  time: string
  onEdit: () => void
  onDelete: () => void
}) {
  const [armed, setArmed] = useState(false)
  return (
    <div className="card flex items-center gap-4 !rounded-xl px-5 py-4 transition-colors hover:!border-[var(--line-strong)]">
      <div className="flex-1">
        <div className="text-[15px]">{title}</div>
        {sub && <div className="mt-1 text-[13px]" style={{ color: 'var(--ink-secondary)' }}>{sub}</div>}
        {(badges?.length || time) && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {badges}
            <span className="badge badge-mute">{formatTime(time)}</span>
          </div>
        )}
      </div>
      <button className="btn btn-ghost !px-3 !py-1.5 text-xs" onClick={onEdit}>编辑</button>
      <button
        className={`btn ${armed ? 'btn-danger' : 'btn-ghost'} !px-3 !py-1.5 text-xs`}
        onClick={() => {
          if (armed) onDelete()
          else { setArmed(true); setTimeout(() => setArmed(false), 2500) }
        }}
      >
        {armed ? '确认删除？' : '删除'}
      </button>
    </div>
  )
}

function EditorModal({
  kind, cfg, values, isSaving, error, onClose, onSave, onChange,
}: {
  kind: Kind
  cfg: { fields: FieldDef[] }
  values: Record<string, unknown>
  isSaving: boolean
  error: string
  onClose: () => void
  onSave: () => void
  onChange: (key: string, value: unknown) => void
}) {
  const [tagDraft, setTagDraft] = useState('')
  const [formError, setFormError] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const missing = cfg.fields.find((f) => f.required && !values[f.key])
    if (missing) { setFormError(`请填写「${missing.label}」`); return }
    onSave()
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <form
        className="card w-full max-w-lg !rounded-2xl p-6"
        style={{ background: 'var(--bg-overlay)' }}
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
      >
        <h3 className="mb-4 text-lg font-semibold">
          {kind === 'interpretations' ? '释义' : kind === 'notes' ? '助记' : '例句'}
          {values.id ? ' · 编辑' : ' · 新建'}
        </h3>
        <div className="flex flex-col gap-3.5">
          {cfg.fields.map((f) => (
            <div key={f.key}>
              <label className="mb-1.5 block text-xs font-medium" style={{ color: 'var(--ink-secondary)' }}>{f.label}</label>
              {f.type === 'textarea' ? (
                <textarea
                  className="input"
                  rows={3}
                  value={(values[f.key] as string) ?? ''}
                  onChange={(e) => onChange(f.key, e.target.value)}
                />
              ) : f.type === 'select' ? (
                <select
                  className="input"
                  value={(values[f.key] as string) ?? (f.options?.[0] ?? '')}
                  onChange={(e) => onChange(f.key, e.target.value)}
                >
                  {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : f.type === 'tags' ? (
                <div className="flex flex-wrap items-center gap-1.5 rounded-md px-3 py-2" style={{ background: 'var(--bg-base)', border: '1px solid var(--line-strong)' }}>
                  {((values[f.key] as string[]) ?? []).map((t) => (
                    <span key={t} className="badge badge-brand" style={{ cursor: 'pointer' }}
                      onClick={() => onChange(f.key, ((values[f.key] as string[]) ?? []).filter((x) => x !== t))}>
                      {t} ✕
                    </span>
                  ))}
                  <input
                    className="min-w-24 flex-1 bg-transparent text-sm outline-none"
                    placeholder="输入后回车"
                    value={tagDraft}
                    onChange={(e) => setTagDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && tagDraft.trim()) {
                        e.preventDefault()
                        onChange(f.key, [...((values[f.key] as string[]) ?? []), tagDraft.trim()])
                        setTagDraft('')
                      }
                    }}
                  />
                </div>
              ) : (
                <input
                  className="input"
                  value={(values[f.key] as string) ?? ''}
                  onChange={(e) => onChange(f.key, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
        {(error || formError) && (
          <div className="mt-3 rounded-md px-3 py-2 text-[13px]" style={{ background: 'rgba(242,97,122,.1)', color: 'var(--danger)' }}>
            {formError || error}
          </div>
        )}
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" className="btn btn-ghost" onClick={onClose}>取消</button>
          <button type="submit" className="btn btn-brand" disabled={isSaving}>
            {isSaving ? '保存中…' : '保存'}
          </button>
        </div>
      </form>
    </div>
  )
}
