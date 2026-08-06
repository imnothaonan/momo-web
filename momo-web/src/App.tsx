import { useEffect } from 'react'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { useAuth } from './stores/authStore'
import AppLayout from './components/AppLayout'
import ErrorBoundary from './components/ErrorBoundary'
import { ToastProvider } from './components/ToastProvider'
import LoginPage from './pages/LoginPage'
import ProgressPage from './pages/ProgressPage'
import TodayItemsPage from './pages/TodayItemsPage'
import FlashcardStudyPage from './pages/FlashcardStudyPage'
import RecordsPage from './pages/RecordsPage'
import AddWordsPage from './pages/AddWordsPage'
import VocabularyPage from './pages/VocabularyPage'
import ContentPage from './pages/ContentPage'
import NotepadsPage from './pages/NotepadsPage'
import NotepadDetailPage from './pages/NotepadDetailPage'
import DecksPage from './pages/DecksPage'
import DeckDetailPage from './pages/DeckDetailPage'
import ChapterDetailPage from './pages/ChapterDetailPage'
import EditorPage from './pages/EditorPage'
import SettingsPage from './pages/SettingsPage'
import NotFoundPage from './pages/NotFoundPage'

function FullLoading() {
  return (
    <div className="grid min-h-screen place-items-center" style={{ color: 'var(--ink-tertiary)' }}>
      <div className="flex items-center gap-3">
        <span className="h-2.5 w-2.5 animate-pulse rounded-full" style={{ background: 'var(--brand)' }} />
        正在检查会话…
      </div>
    </div>
  )
}

function RequireAuth() {
  const { isAuthenticated } = useAuth()
  if (isAuthenticated === null) return <FullLoading />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Outlet />
}

export default function App() {
  const check = useAuth((s) => s.check)
  useEffect(() => {
    void check()
  }, [check])

  return (
    <ErrorBoundary>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<RequireAuth />}>
            <Route element={<AppLayout />}>
              <Route index element={<Navigate to="/study" replace />} />
              {/* 学习中心 */}
              <Route path="/study" element={<ProgressPage />} />
              <Route path="/study/today" element={<TodayItemsPage />} />
              <Route path="/study/flashcard" element={<FlashcardStudyPage />} />
              <Route path="/study/records" element={<RecordsPage />} />
              <Route path="/study/add" element={<AddWordsPage />} />
              {/* 单词工具 */}
              <Route path="/vocabulary" element={<VocabularyPage />} />
              {/* 内容管理 */}
              <Route path="/content" element={<ContentPage />} />
              <Route path="/content/notepads" element={<NotepadsPage />} />
              <Route path="/content/notepads/:id" element={<NotepadDetailPage />} />
              {/* 记忆卡 */}
              <Route path="/markji" element={<DecksPage />} />
              <Route path="/markji/decks/:deckId" element={<DeckDetailPage />} />
              <Route path="/markji/decks/:deckId/chapters/:chapterId" element={<ChapterDetailPage />} />
              <Route path="/markji/editor" element={<EditorPage />} />
              {/* 设置 */}
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </ToastProvider>
    </ErrorBoundary>
  )
}
