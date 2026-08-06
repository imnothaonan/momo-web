/**
 * StarBorder - 流光边框效果（react-bits 风格）
 * 用于 100% 完成率庆祝动画
 */
import { type ReactNode } from 'react'

interface Props {
  children: ReactNode
  color?: string
  speed?: string
  className?: string
  style?: React.CSSProperties
}

export default function StarBorder({
  children,
  color = 'var(--brand)',
  speed = '3s',
  className = '',
  style,
}: Props) {
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        ...style,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `conic-gradient(from var(--angle, 0deg), transparent 0%, ${color} 5%, transparent 10%)`,
          animation: `starBorderRotate ${speed} linear infinite`,
          padding: '1px',
          WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }}
      />
      <style>{`
        @keyframes starBorderRotate {
          to { --angle: 360deg; }
        }
        @property --angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }
      `}</style>
      {children}
    </div>
  )
}
