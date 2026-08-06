import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { vocabularyApi, studyApi, ApiError, Vocabulary } from '../lib/apiClient'
import BlurText from '../components/react-bits/BlurText'

function parseWords(text: string): string[] {
  const set = new Set<string>()
  text
    .split(/[\s,，;；、]+/)
    .map((w) => w.trim())
    .filter((w) => /^[A-Za-z][A-Za-z'\- ]*$/.test(w))
    .slice(0, 1000)
    .forEach((w) => set.add(w.toLowerCase()))
  return [...set]
}

export default function AddWordsPage() {
  const [step, setStep] = useState(1)
  const [raw, setRaw] = useState('')
  const [voc, setVoc] = useState<Vocabulary[]>([])
  const [missing, setMissing] = useState<string[]>([])
  const [advance, setAdvance] = useState(true)
  const [added, setAdded] = useState<number | null>(null)

  const queryMutation = useMutation({
    mutationFn: async (spellings: string[]) => {
      const { voc: found } = await vocabularyApi.query({ spellings })
      setVoc(found)
      const foundSet = new Set(found.map((v) => v.spelling))
      setMissing(spellings.filter((s) => !foundSet.has(s)))
      setStep(2)
    },
  })

  const addMutation = useMutation({
    mutationFn: () => studyApi.addWords({ words: voc.map((v) => ({ id: v.id })), advance }),
    onSuccess: (data) => {
      setAdded(data.added_count)
      setStep(3)
    },
  })

  const words = parseWords(raw)

  return (
    <div className="page-enter">
      <BlurText text="添加单词" delay={35} className="font-display text-[32px] font-bold" animateBy="words" direction="top" />
      <p className="mt-1 text-[13px]" style={{ color: 'var(--ink-secondary)' }}>
        <span className="font-mono text-xs">POST /memo/vocabulary/query → /memo/study/add_words</span>
      </p>

      {/* Stepper */}
      <div className="mt-6 flex items-center gap-0">
        {[1, 2, 3].map((s, i) => (
          <div key={s} className="flex items-center">
            <div className="flex items-center gap-2">
              <span
                className="grid h-6 w-6 place-items-center rounded-full text-xs font-mono"
                style={{
                  border: `1.5px solid ${step > s ? 'var(--success)' : step === s ? 'var(--brand)' : 'var(--line-strong)'}`,
                  background: step >= s ? (step > s ? 'rgba(126,217,87,.12)' : 'var(--brand-muted)') : 'transparent',
                  color: step > s ? 'var(--success)' : step === s ? 'var(--brand)' : 'var(--ink-tertiary)',
                }}
              >
                {step > s ? '✓' : s}
              </span>
              <span className="text-[13px] font-medium" style={{ color: step >= s ? 'var(--ink-primary)' : 'var(--ink-tertiary)' }}>
                {s === 1 ? '搜索' : s === 2 ? '确认' : '完成'}
              </span>
            </div>
            {i < 2 && <div className="mx-3 h-[1.5px] w-10" style={{ background: step > s ? 'var(--success)' : 'var(--line-strong)' }} />}
          </div>
        ))}
      </div>

      {/* Step 1: 搜索 */}
      {step === 1 && (
        <div className="card mt-6 p-6">
          <div className="mb-2 text-[13px] font-medium" style={{ color: 'var(--ink-secondary)' }}>
            输入单词（支持批量粘贴：按行 / 逗号 / 空格分隔，一次最多 1000 个）
          </div>
          <textarea
            className="input !min-h-36 !font-mono !text-[13px]"
            placeholder={'apple, serendipity, ephemeral\nubiquitous'}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            spellCheck={false}
          />
          <div className="mt-4 flex items-center gap-4">
            <button
              className="btn btn-brand"
              disabled={words.length === 0 || queryMutation.isPending}
              onClick={() => queryMutation.mutate(words)}
            >
              {queryMutation.isPending ? '查询中…' : `查询 ${words.length} 个单词 →`}
            </button>
            {queryMutation.error && (
              <span className="text-xs" style={{ color: 'var(--danger)' }}>
                {queryMutation.error instanceof ApiError ? queryMutation.error.message : '查询失败'}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Step 2: 确认 */}
      {step === 2 && (
        <div className="card mt-6 p-6">
          <div className="mb-3 text-[13px] font-medium" style={{ color: 'var(--ink-secondary)' }}>
            查询到 {voc.length} 个单词{missing.length > 0 && `，${missing.length} 个未找到（${missing.join('、')}）`}
          </div>
          {voc.length > 0 && (
            <div className="card mb-4 overflow-hidden">
              <table className="w-full text-[13px]">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--line)' }}>
                    <th className="px-4 py-2.5 text-left text-xs font-medium" style={{ color: 'var(--ink-tertiary)' }}>拼写</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium" style={{ color: 'var(--ink-tertiary)' }}>voc_id</th>
                    <th className="px-4 py-2.5 text-right" />
                  </tr>
                </thead>
                <tbody>
                  {voc.map((v) => (
                    <tr key={v.id} style={{ borderBottom: '1px solid var(--line)' }}>
                      <td className="px-4 py-2.5 font-medium" style={{ color: 'var(--ink-primary)' }}>{v.spelling}</td>
                      <td className="px-4 py-2.5 font-mono text-[11px]" style={{ color: 'var(--ink-tertiary)' }}>{v.id.slice(0, 18)}…</td>
                      <td className="px-4 py-2.5 text-right">
                        <button
                          className="text-xs hover:underline"
                          style={{ color: 'var(--danger)' }}
                          onClick={() => setVoc(voc.filter((x) => x.id !== v.id))}
                        >
                          移除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mb-5 flex items-center gap-3">
            <button
              className="relative h-[22px] w-10 rounded-full transition-all"
              style={{ background: advance ? 'var(--brand)' : 'var(--bg-hover)', border: '1px solid var(--line-strong)' }}
              onClick={() => setAdvance((v) => !v)}
              aria-label="提前复习开关"
            >
              <span className="absolute top-[2px] h-4 w-4 rounded-full transition-all" style={{ left: advance ? 20 : 2, background: advance ? 'var(--on-brand)' : 'var(--ink-secondary)' }} />
            </button>
            <div>
              <div className="text-sm font-medium">添加后一并提前复习</div>
              <div className="text-xs" style={{ color: 'var(--ink-tertiary)' }}>经 add_words 的 advance 参数，无等级限制</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="btn btn-ghost" onClick={() => setStep(1)}>← 返回</button>
            <button
              className="btn btn-brand"
              disabled={voc.length === 0 || addMutation.isPending}
              onClick={() => addMutation.mutate()}
            >
              {addMutation.isPending ? '添加中…' : `确认添加 ${voc.length} 个单词`}
            </button>
            {addMutation.error && (
              <span className="text-xs" style={{ color: 'var(--danger)' }}>
                {addMutation.error instanceof ApiError ? addMutation.error.message : '添加失败'}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Step 3: 完成 */}
      {step === 3 && added !== null && (
        <div className="card mt-6 p-12 text-center">
          <div className="font-display text-6xl font-bold" style={{ color: 'var(--success)' }}>{added}</div>
          <div className="mt-2 text-[13px]" style={{ color: 'var(--ink-secondary)' }}>added_count · 成功添加</div>
          <div className="mt-6 flex justify-center gap-3">
            <button className="btn btn-brand" onClick={() => { setStep(1); setRaw(''); setVoc([]); setMissing([]); setAdded(null) }}>继续添加</button>
          </div>
        </div>
      )}
    </div>
  )
}
