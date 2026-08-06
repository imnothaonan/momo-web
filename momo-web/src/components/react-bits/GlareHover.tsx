/**
 * GlareHover - 悬停眩光效果（react-bits 风格）
 * 用于云词本卡片
 */
import { useRef, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
  style?: React.CSSProperties
}

export default function GlareHover({ children, className = '', style }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  const handleMove = (e: React.MouseEvent) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    el.style.setProperty('--glare-x', `${x}px`)
    el.style.setProperty('--glare-y', `${y}px`)
  }

  return (
    <div
      ref={ref}
      className={`group relative overflow-hidden ${className}`}
      style={
        {
          '--glare-x': '50%',
          '--glare-y': '50%',
          ...style,
        } as React.CSSProperties
      }
      onMouseMove={handleMove}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: 'radial-gradient(180px circle at var(--glare-x) var(--glare-y), rgba(158,225,92,0.08), transparent 70%)',
        }}
      />
      {children}
    </div>
  )
}
