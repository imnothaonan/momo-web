/**
 * 全局 ErrorBoundary（《前端设计文档》§5.15）
 * 捕获渲染错误 → 整页 ErrorState + 复制错误信息
 */
import { Component, type ErrorInfo, type ReactNode } from 'react'

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo)
    this.setState({ errorInfo })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  handleCopy = () => {
    const { error, errorInfo } = this.state
    const text = `${error?.stack ?? error?.message}\n\nComponent Stack:\n${errorInfo?.componentStack ?? ''}`
    void navigator.clipboard?.writeText(text)
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div className="grid min-h-screen place-items-center" style={{ background: 'var(--bg-base)' }}>
        <div className="card max-w-lg p-10 text-center">
          <div className="text-5xl">😵‍💫</div>
          <h1 className="mt-4 font-display text-2xl font-bold">页面出了点问题</h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--ink-secondary)' }}>
            {this.state.error?.message || '未知渲染错误'}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button className="btn btn-brand" onClick={this.handleReset}>
              重试
            </button>
            <button className="btn btn-ghost" onClick={this.handleCopy}>
              复制错误信息
            </button>
          </div>
        </div>
      </div>
    )
  }
}
