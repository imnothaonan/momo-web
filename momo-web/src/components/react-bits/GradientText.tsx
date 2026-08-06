/**
 * GradientText - 渐变文字（react-bits 风格）
 * 用于登录页品牌字
 */
import { type ReactNode } from 'react'

interface Props {
  children: ReactNode
  colors?: string[]
  className?: string
  style?: React.CSSProperties
}

export default function GradientText({
  children,
  colors = ['#9EE15C', '#F2C14E'],
  className = '',
  style,
}: Props) {
  return (
    <span
      className={className}
      style={{
        background: `linear-gradient(135deg, ${colors.join(', ')})`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        ...style,
      }}
    >
      {children}
    </span>
  )
}
