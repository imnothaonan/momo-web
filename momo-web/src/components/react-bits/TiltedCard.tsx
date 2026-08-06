/**
 * TiltedCard - 鼠标悬停 3D 倾斜效果（react-bits 风格）
 * 用于牌组网格卡和快捷卡
 */
import { useRef, useState, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  rotateRange?: number
  className?: string
  style?: React.CSSProperties
}

export default function TiltedCard({ children, rotateRange = 8, className = '', style }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [transform, setTransform] = useState('')

  const handleMove = (e: React.MouseEvent) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    const rotateY = x * rotateRange
    const rotateX = -y * rotateRange
    setTransform(`perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`)
  }

  const handleLeave = () => {
    setTransform('perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)')
  }

  return (
    <div
      ref={ref}
      className={className}
      style={{
        transform,
        transition: 'transform 0.2s cubic-bezier(.22,1,.36,1)',
        ...style,
      }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      {children}
    </div>
  )
}
