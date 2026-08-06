import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { markjiApi, ApiError, formatTime, MarkjiCard, MarkjiFile } from '../lib/apiClient'
import MarkjiRenderer from '../lib/markji'

/** 收集卡片内容中的媒体 ID，调 files/query 换取有效 URL */
function useFileUrls(cards: MarkjiCard[]) {
  const [fileMap, setFileMap] = useState<Record<string, MarkjiFile>>({})

  useEffect(() => {
    const ids = new Set<string>()
    cards.forEach((card) => {
      card.files.forEach((f) => ids.add(f.id))
      // 从 content 中提取 [Pic#ID/xxx#] 和 [Audio#ID/xxx#]
      const matches = card.content.matchAll(/\[(?:Pic|Audio)#ID\/([^#\]]+)#/g)
      for (const m of matches) ids.add(m[1])
    })
    if (ids.size === 0) return
    const idList = [...ids]
    markjiApi.queryFiles(idList).then(({ files }) => {
      const map: Record<string, MarkjiFile> = {}
      files.forEach((f) => { map[f.id] = f })
      setFileMap(map)
    }).catch(() => undefined)
  }, [cards])

  return fileMap
}

function CardPreview({ content, files, fileMap }: { content: string; files: MarkjiFile[]; fileMap: Record<string, MarkjiFile> }) {
  const [expanded, setExpanded] = useState(false)
  const plain = content.replace(/\[[^\]]*\]/g, '').split('\n')[0]?.trim() || content.slice(0, 60)
  const mediaFiles = files.length > 0 ? files : []

  return (
    <div>
      {expanded ? (
        <div className="rounded-lg p-4" style={{ background: 'var(--bg-base)', border: '1px solid var(--line)' }}>
          <MarkjiRenderer content={content} fileMap={fileMap} />
          {/* 渲染附件 */}
          {mediaFiles.map((f) => {
            const url = fileMap[f.id]?.url || f.url
            if (f.mime.startsWith('image/')) {
              return <img key={f.id} src={url} alt="" className="mt-2 max-h-48 rounded-lg" style={{ border: '1px solid var(--line)' }} />
            }
            if (f.mime.startsWith('audio/')) {
              return <audio key={f.id} src={url} controls className="mt-2 w-full" />
            }
            return <div key={f.id} className="mt-1 text-xs" style={{ color: 'var(--ink-tertiary)' }}>📎 {f.mime}</div>
          })}
        </div>
      ) : (
        <div className="text-[13px]" style={{ color: 'var(--ink-secondary)' }}>{plain || '（空卡片）'}</div>
      )}
      <button className="mt-1.5 text-xs underline-offset-2 hover:underline" style={{ color: 'var(--brand)' }} onClick={() => setExpanded((v) => !v)}>
        {expanded ? '收起预览' : '展开预览'}
      </button>
    </div>
  )
}

export default function ChapterDetailPage() {
  const { deckId, chapterId } = useParams<{ deckId: string; chapterId: string }>()

  const chapterQuery = useQuery({
    queryKey: ['markji', 'chapter', deckId, chapterId],
    queryFn: () => markjiApi.getChapter(deckId!, chapterId!, true),
    enabled: !!deckId && !!chapterId,
  })
  const chapter = chapterQuery.data?.chapter
  const cards = chapterQuery.data?.cards ?? []
  const fileMap = useFileUrls(cards)

  return (
    <div className="page-enter">
      <div className="mb-3 flex items-center gap-2 text-[13px]" style={{ color: 'var(--ink-tertiary)' }}>
        <Link to="/markji/decks" style={{ color: 'var(--ink-secondary)' }}>牌组</Link>
        <span>/</span>
        <Link to={`/markji/decks/${deckId}`} style={{ color: 'var(--ink-secondary)' }}>牌组详情</Link>
        <span>/</span>
        <span style={{ color: 'var(--ink-primary)' }}>{chapter?.name ?? '章节'}</span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-2xl font-bold">{chapter?.name ?? '加载中…'}</h1>
        <span className="badge badge-mute">{cards.length} 张卡</span>
        <span className="flex-1" />
        <Link to={`/markji/editor?deck=${deckId}&chapter=${chapterId}`} className="btn btn-brand">＋ 新建卡片</Link>
      </div>

      {chapterQuery.isLoading && <div className="card mt-5 h-40 animate-pulse" />}

      {chapterQuery.isError && (
        <div className="card mt-5 flex flex-col items-center gap-2 p-12 text-center" style={{ color: 'var(--ink-tertiary)' }}>
          <div className="text-3xl">🔐</div>
          <div style={{ color: 'var(--ink-secondary)' }}>
            {chapterQuery.error instanceof ApiError
              ? (chapterQuery.error.message.includes('Permission') ? '需要开通「Markji Plus」权限' : chapterQuery.error.message)
              : '章节加载失败'}
          </div>
          <Link to={`/markji/decks/${deckId}`} className="btn btn-ghost mt-2">返回牌组</Link>
        </div>
      )}

      {!chapterQuery.isLoading && !chapterQuery.isError && cards.length === 0 && (
        <div className="card mt-5 flex flex-col items-center gap-2 p-12 text-center" style={{ color: 'var(--ink-tertiary)' }}>
          <div className="text-3xl">🗃</div>
          这个章节还没有卡片
          <Link to={`/markji/editor?deck=${deckId}&chapter=${chapterId}`} className="btn btn-ghost mt-2">创建第一张卡片</Link>
        </div>
      )}

      <div className="mt-5 flex flex-col gap-2">
        {cards.map((card, i) => (
          <div key={card.id} className="card flex items-start gap-4 !rounded-xl px-5 py-4">
            <span className="mt-0.5 font-mono text-xs" style={{ color: 'var(--ink-tertiary)' }}>#{i + 1}</span>
            <div className="flex-1">
              <CardPreview content={card.content} files={card.files} fileMap={fileMap} />
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs" style={{ color: 'var(--ink-tertiary)' }}>
                {card.files.length > 0 && <span className="badge badge-info">{card.files.length} 个附件</span>}
                <span className="font-mono">rev {card.revision}</span>
                <span>更新于 {formatTime(card.updated_time)}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Link to={`/markji/editor?deck=${deckId}&chapter=${chapterId}&card=${card.id}`} className="btn btn-ghost !px-3 !py-1.5 text-xs">编辑</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
