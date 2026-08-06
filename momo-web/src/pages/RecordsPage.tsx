import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { studyApi, ApiError, StudyRecord, formatTime } from '../lib/apiClient'
import BlurText from '../components/react-bits/BlurText'

/** 构造北京时区（+08:00）的某一天起止 ISO 串；本地时区即 +08 */
function dayRange(d: Date): { start: string; end: string } {
  const pad = (n: number) => String(n).padStart(2, '0')
  const iso = (dt: Date) =>
    `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}:${pad(dt.getSeconds())}+08:00`
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0)
  const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
  return { start: iso(start), end: iso(end) }
}

const RESP_LABEL: Record<string, { label: string; badge: string }> = {
  FAMILIAR: { label: '认识', badge: 'badge-success' },
  VAGUE: { label: '模糊', badge: 'badge-accent' },
  FORGET: { label: '忘记', badge: 'badge-danger' },
  WELL_FAMILIAR: { label: '熟知', badge: 'badge-success' },
  CANCEL_WELL_FAMILIAR: { label: '取消熟知', badge: 'badge-mute' },
}

const RANGES = [
  { key: 'today', label: '今天' },
  { key: 'week', label: '本周' },
  { key: 'month', label: '本月' },
  { key: 'custom', label: '自定义…' },
] as const

type RangeKey = (typeof RANGES)[number]['key']

export default function RecordsPage() {
  const [range, setRange] = useState<RangeKey>('week')
  const [custom, setCustom] = useState<{ start: string; end: string }>({ start: '', end: '' })

  const rangeQuery = useMemo(() => {
    const now = new Date()
    const today = dayRange(now)
    if (range === 'today') return today
    if (range === 'week') {
      const monday = new Date(now)
      monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
      return dayRange(monday)
    }
    if (range === 'month') {
      const first = new Date(now.getFullYear(), now.getMonth(), 1)
      return { start: dayRange(first).start, end: today.end }
    }
    return {
      start: custom.start ? `${custom.start}T00:00:00+08:00` : '',
      end: custom.end ? `${custom.end}T23:59:59+08:00` : today.end,
    }
  }, [range, custom])

  // 统计：规划总词数（as_count=true）
  const totalQuery = useQuery({
    queryKey: ['study', 'records-total'],
    queryFn: () => studyApi.queryRecords({ as_count: true }),
  })

  // 未来 7 天每日待学（7 次 count 查询，仅手动刷新，不做轮询）
  const weekQuery = useQuery({
    queryKey: ['study', 'records-7d'],
    queryFn: async () => {
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() + i)
        return d
      })
      const results = await Promise.allSettled(
        days.map((d) => {
          const r = dayRange(d)
          return studyApi.queryRecords({ next_study_date: r, as_count: true })
        }),
      )
      return days.map((d, i) => ({
        date: `${d.getMonth() + 1}-${d.getDate()}`,
        count: results[i].status === 'fulfilled' ? (results[i] as PromiseFulfilledResult<{ count: number }>).value.count : 0,
      }))
    },
  })
  const maxCount = Math.max(1, ...(weekQuery.data?.map((d) => d.count) ?? [1]))

  // 记录列表（按范围分段加载，limit 500）
  const listQuery = useQuery({
    queryKey: ['study', 'records-list', range, rangeQuery.start, rangeQuery.end],
    queryFn: () => studyApi.queryRecords({ next_study_date: rangeQuery, limit: 500 }),
    enabled: rangeQuery.start !== '',
  })
  const records: StudyRecord[] = listQuery.data?.records ?? []

  const listError = listQuery.error instanceof ApiError ? listQuery.error.message : null

  return (
    <div className="page-enter">
      <BlurText text="学习记录" delay={35} className="font-display text-[32px] font-bold" animateBy="words" direction="top" />
      <p className="mt-1 text-[13px]" style={{ color: 'var(--ink-secondary)' }}>
        按下次学习日期筛选（北京时区）· API 无 offset，按日期范围分段加载 ·{' '}
        <span className="font-mono text-xs">POST /memo/study/query_study_records</span>
      </p>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card p-5">
          <div className="font-display text-4xl font-bold" style={{ color: 'var(--brand)' }}>
            {totalQuery.data?.count ?? '—'}
          </div>
          <div className="mt-1 text-[13px]" style={{ color: 'var(--ink-secondary)' }}>规划总词数（as_count）</div>
        </div>
        <div className="card p-5 lg:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[13px]" style={{ color: 'var(--ink-secondary)' }}>未来 7 天每日待学</div>
            <button className="text-xs underline-offset-2 hover:underline" style={{ color: 'var(--brand)' }} onClick={() => weekQuery.refetch()}>
              ↻ 刷新
            </button>
          </div>
          {weekQuery.isLoading ? (
            <div className="h-24 animate-pulse rounded-lg" style={{ background: 'var(--bg-hover)' }} />
          ) : (
            <div className="flex h-28 items-end gap-2.5">
              {(weekQuery.data ?? []).map((d, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <span className="font-mono text-[11px]" style={{ color: 'var(--ink-secondary)' }}>{d.count}</span>
                  <div
                    className="w-full rounded-t-md transition-all"
                    style={{
                      height: `${Math.max(4, (d.count / maxCount) * 72)}px`,
                      background: i === 0 ? 'var(--accent)' : 'linear-gradient(180deg,var(--brand),rgba(158,225,92,.25))',
                      animation: 'barUp .7s cubic-bezier(.22,1,.36,1) backwards',
                      animationDelay: `${i * 0.05}s`,
                    }}
                  />
                  <span className="text-[11px]" style={{ color: 'var(--ink-tertiary)' }}>{d.date}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex w-max gap-1.5 rounded-full p-1" style={{ background: 'var(--bg-surface)', border: '1px solid var(--line)' }}>
          {RANGES.map((r) => (
            <button key={r.key} className={`pill-btn ${range === r.key ? 'active' : ''}`} onClick={() => setRange(r.key)}>
              {r.label}
            </button>
          ))}
        </div>
        {range === 'custom' && (
          <div className="flex items-center gap-2">
            <input type="date" className="input !w-40 !py-1.5 text-xs" value={custom.start} onChange={(e) => setCustom({ ...custom, start: e.target.value })} />
            <span style={{ color: 'var(--ink-tertiary)' }}>—</span>
            <input type="date" className="input !w-40 !py-1.5 text-xs" value={custom.end} onChange={(e) => setCustom({ ...custom, end: e.target.value })} />
          </div>
        )}
        <span className="text-xs" style={{ color: 'var(--ink-tertiary)' }}>
          {listQuery.data ? `共 ${listQuery.data.count} 条，展示前 ${records.length} 条` : '加载中…'}
        </span>
      </div>

      {listError && (
        <div className="card mt-4 p-6 text-center text-[13px]" style={{ color: 'var(--ink-tertiary)' }}>
          📡 {listError.includes('Permission') ? '学习记录接口需要权限（公测），请确认 App 已开启自动同步' : listError}
        </div>
      )}

      {!listError && (listQuery.isLoading ? (
        <div className="card mt-4 h-40 animate-pulse" />
      ) : records.length === 0 ? (
        <div className="card mt-4 flex flex-col items-center gap-2 p-12 text-center" style={{ color: 'var(--ink-tertiary)' }}>
          <div className="text-3xl">🗓</div>
          该时间段内没有学习记录
        </div>
      ) : (
        <div className="card mt-4 overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--line)' }}>
                {['拼写', '添加日期', '上次学习', '下次学习', '次数', '上次反馈', '标签'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-medium" style={{ color: 'var(--ink-tertiary)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((r) => {
                const resp = r.last_response ? RESP_LABEL[r.last_response] : null
                return (
                  <tr key={r.voc_id} style={{ borderBottom: '1px solid var(--line)' }}>
                    <td className="px-4 py-2.5 font-medium" style={{ color: 'var(--ink-primary)' }}>{r.voc_spelling}</td>
                    <td className="px-4 py-2.5" style={{ color: 'var(--ink-secondary)' }}>{formatTime(r.add_date ?? '')}</td>
                    <td className="px-4 py-2.5" style={{ color: 'var(--ink-secondary)' }}>{formatTime(r.last_study_date ?? '')}</td>
                    <td className="px-4 py-2.5" style={{ color: 'var(--info)' }}>{formatTime(r.next_study_date ?? '')}</td>
                    <td className="px-4 py-2.5 font-mono" style={{ color: 'var(--ink-secondary)' }}>{r.study_count}</td>
                    <td className="px-4 py-2.5">{resp ? <span className={`badge ${resp.badge}`}>{resp.label}</span> : <span style={{ color: 'var(--ink-tertiary)' }}>—</span>}</td>
                    <td className="px-4 py-2.5">
                      {r.tags?.includes('STICKING') && <span className="badge badge-accent mr-1">黏连</span>}
                      {r.tags?.includes('WELL_FAMILIAR') && <span className="badge badge-success">熟知</span>}
                      {!r.tags && <span style={{ color: 'var(--ink-tertiary)' }}>—</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ))}
      <style>{`@keyframes barUp { from { transform: scaleY(0); transform-origin: bottom; } to { transform: scaleY(1); } }`}</style>
    </div>
  )
}
