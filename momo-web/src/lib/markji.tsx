/**
 * Markji 语法渲染器（《前端设计文档》§11）
 * 支持：T（样式）、F（挖空）、P（块级）、Choice（选择题）、E（公式 KaTeX）、Pic/Audio/Card、---（答案线）
 * 验证器：10 条规则对照官方检查清单
 */
import { ReactNode, useState, useEffect, lazy, Suspense } from 'react'
import type { MarkjiFile } from './apiClient'

// KaTeX 懒加载
const Katex = lazy(async () => {
  try {
    await import('katex/dist/katex.min.css')
    const { default: katex } = await import('katex')
    return {
      default: ({ formula }: { formula: string }) => {
        const html = katex.renderToString(formula, { throwOnError: false, displayMode: true })
        return <span dangerouslySetInnerHTML={{ __html: html }} />
      },
    }
  } catch {
    return {
      default: ({ formula }: { formula: string }) => (
        <span className="font-mono" style={{ color: 'var(--info)' }}>{formula}</span>
      ),
    }
  }
})

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** 行内解析：返回 ReactNode[] */
function parseInline(raw: string, fileMap?: Record<string, MarkjiFile>): ReactNode[] {
  const s = esc(raw).replace(/\\(\[|\])/g, '$1')
  const nodes: ReactNode[] = []
  const regex = /\[T#([^#\]]+)#([^\]]*)\]|\[F#(\d+)#([^\]]*)\]|\[Audio#([^#\]]*)#([^\]]*)\]|\[Card#([^#\]]*)#([^\]]*)\]|\[Pic#ID\/([^#\]]+)#\]/g
  let last = 0
  let m: RegExpExecArray | null
  let key = 0
  while ((m = regex.exec(s))) {
    if (m.index > last) nodes.push(<span key={key++}>{s.slice(last, m.index)}</span>)
    if (m[1] !== undefined) {
      // [T#参数#文字]
      let style: React.CSSProperties = {}
      m[1].split(',').forEach((p) => {
        p = p.trim()
        if (p === 'B') style.fontWeight = 700
        else if (p === 'I') style.fontStyle = 'italic'
        else if (p === 'U') style.textDecoration = 'underline'
        else if (p === 'up') style.verticalAlign = 'super'
        else if (p === 'down') style.verticalAlign = 'sub'
        else if (/^![0-9a-f]{6}$/.test(p)) style.color = '#' + p.slice(1)
        else if (/^!![0-9a-f]{6}$/.test(p)) {
          style.background = '#' + p.slice(2)
          style.padding = '0 3px'
          style.borderRadius = 3
        }
        else if (p.startsWith('link/')) style.color = 'var(--brand)'
      })
      nodes.push(<span key={key++} style={style}>{m[2]}</span>)
    } else if (m[3] !== undefined) {
      nodes.push(<Cloze key={key++} label={m[4]} />)
    } else if (m[5] !== undefined) {
      const fileId = m[5].startsWith('ID/') ? m[5].slice(3) : m[5]
      const url = fileMap?.[fileId]?.url
      if (url) {
        nodes.push(<audio key={key++} src={url} controls className="!inline-block !h-6 !align-middle" />)
      } else {
        nodes.push(<span key={key++} className="badge badge-info">♪ {m[6] || '播放'}</span>)
      }
    } else if (m[7] !== undefined) {
      nodes.push(<span key={key++} style={{ color: 'var(--info)', textDecoration: 'underline' }}>🃏 {m[8]}</span>)
    } else if (m[9] !== undefined) {
      // [Pic#ID/xxx#]
      const fileId = m[9]
      const url = fileMap?.[fileId]?.url
      if (url) {
        nodes.push(<img key={key++} src={url} alt="" className="inline-block max-h-32 rounded-md" style={{ verticalAlign: 'middle', border: '1px solid var(--line)' }} />)
      } else {
        nodes.push(
          <span key={key++} className="badge badge-mute" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            🖼 {fileId.slice(0, 8)}…
          </span>
        )
      }
    }
    last = regex.lastIndex
  }
  if (last < s.length) nodes.push(<span key={key++}>{s.slice(last)}</span>)
  return nodes
}

function Cloze({ label }: { label: string }) {
  const [open, setOpen] = useState(false)
  return (
    <span
      onClick={() => setOpen((v) => !v)}
      style={{
        display: 'inline-block', minWidth: 44, padding: '0 8px', borderRadius: 5, cursor: 'pointer',
        textAlign: 'center', userSelect: 'none', transition: 'all .2s',
        background: open ? 'transparent' : 'var(--brand-muted)',
        color: open ? 'var(--brand)' : 'transparent',
        borderBottom: '2px solid var(--brand)',
      }}
      title="点击显示/隐藏挖空"
    >
      {label || '　'}
    </span>
  )
}

function ChoiceBlock({ params, options }: { params: string; options: { text: string; right: boolean }[] }) {
  const multi = params.includes('multi')
  const [picked, setPicked] = useState<Set<number>>(new Set())
  const [settled, setSettled] = useState(false)
  const toggle = (i: number) => {
    const next = new Set(picked)
    if (multi) {
      if (next.has(i)) next.delete(i); else next.add(i)
    } else {
      next.clear(); next.add(i)
    }
    setPicked(next)
  }
  return (
    <div style={{ margin: '10px 0' }}>
      {options.map((o, i) => {
        const isPicked = picked.has(i)
        const show = multi ? isPicked && settled : isPicked
        return (
          <div
            key={i}
            onClick={() => toggle(i)}
            style={{
              margin: '6px 0', padding: '9px 13px', border: '1px solid var(--line)',
              borderRadius: 8, cursor: 'pointer', transition: 'all .15s', fontSize: 14,
              borderColor: show ? (o.right ? 'var(--success)' : 'var(--danger)') : undefined,
              background: show ? (o.right ? 'rgba(126,217,87,.1)' : 'rgba(242,97,122,.1)') : undefined,
              color: show ? (o.right ? 'var(--success)' : 'var(--danger)') : undefined,
            }}
          >
            {isPicked ? (multi ? '☑ ' : '● ') : multi ? '☐ ' : '○ '}
            {o.text}
            {show && (o.right ? ' ✓' : ' ✗')}
          </div>
        )
      })}
      {multi && !settled && (
        <button className="btn btn-ghost !py-1 !px-3 text-xs" onClick={() => setSettled(true)}>
          提交答案
        </button>
      )}
    </div>
  )
}

interface Block {
  type: 'p' | 'h1' | 'choice' | 'formula' | 'pic' | 'answer' | 'plain'
  style?: React.CSSProperties
  inline?: string
  options?: { text: string; right: boolean }[]
  params?: string
  label?: string
}

/** 块级解析 */
export function parseMarkji(src: string): { blocks: Block[]; errors: string[] } {
  const lines = src.split('\n')
  const blocks: Block[] = []
  const errors: string[] = []
  let inChoice: string | null = null
  let choiceLines: string[] = []
  let choiceStartLine = 0

  const flushChoice = () => {
    if (inChoice !== null) {
      const options = choiceLines.map((l) => {
        const t = l.trim()
        return { text: t.slice(2), right: t.startsWith('* ') }
      })
      // 规则 4: Choice 选项前缀严格 * / -
      const rightCount = options.filter((o) => o.right).length
      if (rightCount > 1 && !inChoice.includes('multi')) {
        errors.push(`第 ${choiceStartLine} 行：多正确选项须在 Choice 参数中加 'multi'`)
      }
      blocks.push({ type: 'choice', params: inChoice, options })
      inChoice = null
      choiceLines = []
    }
  }

  // 合法标签名白名单（规则 1）
  const VALID_TAGS = new Set(['T', 'F', 'P', 'Choice', 'Pic', 'Audio', 'Card', 'E'])

  lines.forEach((line, idx) => {
    const ln = idx + 1
    const trim = line.trim()
    if (!trim) return

    if (/^---\s*$/.test(line)) {
      flushChoice()
      blocks.push({ type: 'answer' })
      return
    }

    const choiceStart = line.match(/^\[Choice#([^#\]]*)#\s*$/)
    if (choiceStart) {
      flushChoice()
      inChoice = choiceStart[1]
      choiceStartLine = ln
      return
    }
    if (trim === ']' && inChoice !== null) {
      flushChoice()
      return
    }
    if (inChoice !== null) {
      if (/^(\* |- )/.test(trim)) choiceLines.push(trim)
      else errors.push(`第 ${ln} 行：选项须以 "* " 或 "- " 开头`)
      return
    }

    // 提取行内标签名进行白名单校验（规则 1）
    const tagMatches = line.matchAll(/\[([A-Za-z]+)#/g)
    for (const tm of tagMatches) {
      if (!VALID_TAGS.has(tm[1])) {
        errors.push(`第 ${ln} 行：未知标签名 '${tm[1]}'（合法：T F P Choice Pic Audio Card E）`)
      }
    }

    // 规则 2: [ ] 配对 + # 段数
    const opens = (line.match(/\[/g) || []).length
    const closes = (line.match(/\]/g) || []).length
    if (opens !== closes) errors.push(`第 ${ln} 行：'[' 与 ']' 数量不配对（${opens}个[ vs ${closes}个]）`)

    // 规则 3: 块级语法必须行首起始
    const blockTags = ['P', 'Choice', 'Pic', 'E']
    for (const bt of blockTags) {
      const re = new RegExp(`^\\s+\\[${bt}#`)
      if (re.test(line) && !line.trimStart().startsWith(`[${bt}#`)) {
        errors.push(`第 ${ln} 行：[${bt}] 块级语法必须行首起始`)
      }
    }

    const p = line.match(/^\[P#([^#\]]*)#([^\]]*)\]$/)
    if (p) {
      const params = p[1].split(',').map((x) => x.trim())
      const style: React.CSSProperties = {}
      let type: Block['type'] = 'p'
      if (params.includes('H1')) type = 'h1'
      if (params.includes('center')) style.textAlign = 'center'
      else if (params.includes('right')) style.textAlign = 'right'
      const indent = params.find((x) => /^I\d+$/.test(x))
      if (indent) style.paddingLeft = +indent.slice(1) * 18
      blocks.push({ type, style, inline: p[2] })
      return
    }

    const formula = line.match(/^\[E##([^\]]*)\]$/)
    if (formula) {
      blocks.push({ type: 'formula', inline: formula[1] })
      return
    }

    const pic = line.match(/^\[Pic#([^#\]]*)#\]$/)
    if (pic) {
      // 规则 10: 媒体 ID 格式校验
      const idStr = pic[1]
      if (!idStr.startsWith('ID/')) {
        errors.push(`第 ${ln} 行：媒体 ID 须为 'ID/xxx' 格式`)
      }
      blocks.push({ type: 'pic', label: idStr })
      return
    }

    // 规则 5: 挖空编号为正整数
    const clozeMatches = line.matchAll(/\[F#(\d+)#/g)
    for (const cm of clozeMatches) {
      const num = parseInt(cm[1], 10)
      if (num < 1) errors.push(`第 ${ln} 行：挖空编号须为正整数（当前: ${cm[1]}）`)
    }

    // 规则 8: 颜色参数必须 6 位小写 hex
    const colorMatches = line.matchAll(/!([0-9a-fA-F]{6})/g)
    for (const cm of colorMatches) {
      if (cm[1] !== cm[1].toLowerCase()) {
        errors.push(`第 ${ln} 行：颜色参数须为小写 hex：${cm[1]}`)
      }
    }

    // 规则 9: up/down 不共存
    const tMatches = line.matchAll(/\[T#([^#]+)#/g)
    for (const tm of tMatches) {
      const params = tm[1]
      if (params.includes('up') && params.includes('down')) {
        errors.push(`第 ${ln} 行：'up' 与 'down' 不可共存`)
      }
      // 规则 9: link 网址必须英文双引号包裹
      if (params.includes('link/') && !params.includes('link/"')) {
        errors.push(`第 ${ln} 行：link 网址须用英文双引号包裹`)
      }
    }

    blocks.push({ type: 'plain', inline: line })
  })
  flushChoice()

  // 规则 6: 未转义的 [ ] 出现在纯文本
  const unescaped = src.match(/(?<!\\)\[(?![A-Za-z]+#)/g)
  if (unescaped && unescaped.length > 0) {
    errors.push(`发现 ${unescaped.length} 处未转义的 '['，可能为语法错误`)
  }

  return { blocks, errors }
}

export function validateMarkji(src: string): string[] {
  const { errors } = parseMarkji(src)
  // 规则 7: 嵌套白名单检查 - Choice 内仅 T；T/F/Audio/Card 内容不再嵌套
  const lines = src.split('\n')
  let inChoice = false
  lines.forEach((line, idx) => {
    const ln = idx + 1
    const trim = line.trim()
    if (trim.startsWith('[Choice#') && trim.endsWith('#')) { inChoice = true; return }
    if (trim === ']' && inChoice) { inChoice = false; return }
    if (inChoice) {
      // Choice 内只允许 T 标签
      const nonT = trim.match(/\[(?!T#|\/)[A-Za-z]+#/g)
      if (nonT) errors.push(`第 ${ln} 行：Choice 内仅允许 T 标签（发现 ${nonT.join(', ')}）`)
    }
  })
  return errors
}

export default function MarkjiRenderer({ content, errors, fileMap }: { content: string; errors?: string[]; fileMap?: Record<string, MarkjiFile> }) {
  const { blocks, errors: parseErrors } = parseMarkji(content)
  const allErrors = errors ?? parseErrors
  const [showAnswer, setShowAnswer] = useState(false)

  return (
    <div>
      {blocks.map((b, i) => {
        if (b.type === 'h1') {
          return <div key={i} className="font-display text-xl font-bold" style={{ margin: '4px 0 10px', ...b.style }}>{parseInline(b.inline!, fileMap)}</div>
        }
        if (b.type === 'p') {
          return <p key={i} style={{ margin: '8px 0', lineHeight: 1.8, ...b.style }}>{parseInline(b.inline!, fileMap)}</p>
        }
        if (b.type === 'plain') {
          return <p key={i} style={{ margin: '8px 0', lineHeight: 1.8 }}>{parseInline(b.inline!, fileMap)}</p>
        }
        if (b.type === 'choice') {
          return <ChoiceBlock key={i} params={b.params!} options={b.options!} />
        }
        if (b.type === 'formula') {
          return (
            <div key={i} style={{ background: 'var(--bg-base)', border: '1px solid var(--line)', borderRadius: 8, padding: '10px 16px', textAlign: 'center', margin: '10px 0' }}>
              <Suspense fallback={<span className="font-mono" style={{ color: 'var(--info)' }}>{b.inline}</span>}>
                <Katex formula={b.inline!} />
              </Suspense>
            </div>
          )
        }
        if (b.type === 'pic') {
          const fileId = b.label?.startsWith('ID/') ? b.label.slice(3) : b.label
          const url = fileId ? fileMap?.[fileId]?.url : undefined
          if (url) {
            return <img key={i} src={url} alt="" className="max-h-48 rounded-lg" style={{ margin: '8px 0', border: '1px solid var(--line)' }} />
          }
          return (
            <div key={i} style={{ border: '1px dashed var(--line-strong)', borderRadius: 8, padding: 18, textAlign: 'center', color: 'var(--ink-tertiary)', fontSize: 12, margin: '8px 0' }}>
              🖼 图片 {b.label}（经 files/query 换 URL 后渲染）
            </div>
          )
        }
        if (b.type === 'answer') {
          return (
            <div key={i}>
              <div
                className="answer-line"
                onClick={() => setShowAnswer((v) => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0', color: 'var(--accent)', fontSize: 12, fontWeight: 600, letterSpacing: '.08em', cursor: 'pointer' }}
              >
                <span style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,transparent,var(--accent))' }} />
                {showAnswer ? '收起答案' : '答 案'}
                <span style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,var(--accent),transparent)' }} />
              </div>
            </div>
          )
        }
        return null
      })}
      {allErrors.length > 0 && (
        <div style={{ marginTop: 10, fontSize: 12.5, color: 'var(--danger)', fontFamily: 'var(--font-mono, monospace)' }}>
          {allErrors.map((e, i) => <div key={i}>⚠ {e}</div>)}
        </div>
      )}
    </div>
  )
}
