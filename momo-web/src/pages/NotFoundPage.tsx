import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'

const MESSAGES = ['页面走丢了', '单词还没背', '回去学习吧']

export default function NotFoundPage() {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setIdx((i) => (i + 1) % MESSAGES.length), 2500)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="grid min-h-screen place-items-center" style={{ background: 'var(--bg-base)' }}>
      <div className="text-center">
        <div className="font-display text-8xl font-bold" style={{ color: 'var(--ink-tertiary)' }}>
          404
        </div>
        <div className="mt-4 text-lg" style={{ color: 'var(--ink-secondary)' }}>
          {MESSAGES[idx]}
        </div>
        <Link to="/study" className="btn btn-brand mt-8">
          回首页 →
        </Link>
      </div>
    </div>
  )
}
