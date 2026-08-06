/**
 * HTTP Client（momo_web.md §10.1）
 * - 统一解包墨墨 API 响应包裹层：{ errors, data, success }（2026-08-05 实测确认）
 * - 统一错误：BFF 错误 { error: { code, message } } → ApiError
 * - 401 → 清除前端认证标志（由 authStore 监听处理跳转）
 */
import { useAuth } from '../stores/authStore'

const BASE_URL = '/api/v1'

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

interface Envelope<T> {
  errors?: unknown[]
  data?: T
  success?: boolean
}

async function request<T>(path: string, options?: RequestInit & { params?: Record<string, unknown> }): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`, window.location.origin)
  if (options?.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value))
    })
  }

  const isFormData = options?.body instanceof FormData
  const response = await fetch(url.toString(), {
    ...options,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      Accept: 'application/json',
      ...options?.headers,
    },
  })

  const json = (await response.json().catch(() => null)) as (Envelope<T> & { error?: { code: string; message: string } }) | null

  if (!response.ok) {
    // 同时兼容 BFF 的 { error: { code, message } } 与墨墨上游的 { errors: [{code, msg, info}], data, success }
    const envelope = json as Envelope<unknown>
    const errItem = envelope?.errors?.[0] as { code?: string; msg?: string; info?: string } | undefined
    const code = json?.error?.code ?? errItem?.code ?? `HTTP_${response.status}`
    const baseMsg = json?.error?.message ?? errItem?.msg ?? `请求失败（${response.status}）`
    const info = errItem?.info
    const message = info && info !== '' ? `${baseMsg}（${info}）` : baseMsg
    if (response.status === 401) useAuth.getState().setExpired()
    if (response.status === 429) window.dispatchEvent(new CustomEvent('momo:rate-limited'))
    throw new ApiError(response.status, code, message)
  }

  // 墨墨上游包裹层解包
  if (json && typeof json === 'object' && 'success' in json) {
    if (json.success === false) {
      const errItem = (json.errors as { msg?: string; info?: string }[])?.[0]
      const msg = errItem?.info && errItem.info !== '' ? `${errItem.msg}（${errItem.info}）` : (errItem?.msg ?? '墨墨 API 返回错误')
      throw new ApiError(response.status, 'UPSTREAM_ERROR', msg)
    }
    return json.data as T
  }
  return json as T
}

export const apiClient = {
  get<T>(path: string, params?: Record<string, unknown>) {
    return request<T>(path, { method: 'GET', params })
  },
  post<T>(path: string, body?: unknown) {
    return request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) })
  },
  delete<T>(path: string) {
    return request<T>(path, { method: 'DELETE' })
  },
  upload<T>(path: string, formData: FormData) {
    return request<T>(path, { method: 'POST', body: formData })
  },
}

/* ===== 类型定义（按《墨墨OpenAPI 规范.md》+ 2026-08-05 实测修正） ===== */

export interface StudyProgress {
  finished: number
  total: number
  /** 今日学习时长，单位毫秒 */
  study_time: number
}

export type StudyResponse = 'FAMILIAR' | 'VAGUE' | 'FORGET' | 'WELL_FAMILIAR' | 'CANCEL_WELL_FAMILIAR'

export interface StudyTodayItem {
  /** 实测格式为 "voc-xxx" 长串（与文档示例不同） */
  voc_id: string
  voc_spelling: string
  order: number
  first_response?: StudyResponse
  is_new: boolean
  is_finished: boolean
}

export const studyApi = {
  getProgress: () => apiClient.post<{ progress: StudyProgress }>('/memo/study/get_study_progress', {}),
  getTodayItems: (body?: { is_finished?: boolean; is_new?: boolean; limit?: number }) =>
    apiClient.post<{ today_items: StudyTodayItem[] }>('/memo/study/get_today_items', body ?? { limit: 200 }),
  /** 学习记录：无 offset，按 next_study_date 范围分段加载（北京时区） */
  queryRecords: (body: {
    next_study_date?: { start?: string; end?: string }
    as_count?: boolean
    limit?: number
  }) => apiClient.post<{ records: StudyRecord[]; count: number }>('/memo/study/query_study_records', body),
  addWords: (body: { words: { id: string }[]; advance: boolean }) =>
    apiClient.post<{ added_count: number }>('/memo/study/add_words', body),
}

export interface StudyRecord {
  voc_id: string
  voc_spelling: string
  add_date?: string
  first_study_date?: string
  last_study_date?: string
  next_study_date?: string
  last_response?: StudyResponse
  /** 学习次数（每日最多计入 1 次） */
  study_count: number
  /** 实测为 string（逗号分隔或单值，待确认），STICKING / WELL_FAMILIAR */
  tags?: string
}

/* ===== 单词 ===== */

export interface Vocabulary {
  id: string
  spelling: string
}

export const vocabularyApi = {
  get: (spelling: string) => apiClient.get<{ voc: Vocabulary }>('/memo/vocabulary', { spelling }),
  query: (body: { spellings?: string[]; ids?: string[] }) =>
    apiClient.post<{ voc: Vocabulary[] }>('/memo/vocabulary/query', body),
}

/* ===== 释义 / 助记 / 例句（同构 CRUD） ===== */

export type PublishStatus = 'PUBLISHED' | 'UNPUBLISHED'

export interface Interpretation {
  id: string
  interpretation: string
  tags: string[]
  status: PublishStatus | 'DELETED'
  created_time: string
  updated_time: string
}

export interface Note {
  id: string
  note_type: string
  note: string
  status: 'PUBLISHED' | 'DELETED'
  created_time: string
  updated_time: string
}

export interface Phrase {
  id: string
  phrase: string
  interpretation: string
  tags: string[]
  origin: string
  status: 'PUBLISHED' | 'DELETED'
  created_time: string
  updated_time: string
}

export const interpretationApi = {
  list: (vocId: string) => apiClient.get<{ interpretations: Interpretation[] }>('/memo/interpretations', { voc_id: vocId }),
  create: (body: { voc_id: string; interpretation: string; tags: string[]; status: PublishStatus }) =>
    apiClient.post<{ interpretation: Interpretation }>('/memo/interpretations', { interpretation: body }),
  update: (id: string, body: { interpretation: string; tags: string[]; status: PublishStatus }) =>
    apiClient.post<{ interpretation: Interpretation }>(`/memo/interpretations/${id}`, { id, interpretation: body }),
  remove: (id: string) => apiClient.delete<Record<string, never>>(`/memo/interpretations/${id}`),
}

export const noteApi = {
  list: (vocId: string) => apiClient.get<{ notes: Note[] }>('/memo/notes', { voc_id: vocId }),
  create: (body: { voc_id: string; note_type: string; note: string }) =>
    apiClient.post<{ note: Note }>('/memo/notes', { note: body }),
  update: (id: string, body: { note_type: string; note: string }) =>
    apiClient.post<{ note: Note }>(`/memo/notes/${id}`, { id, note: body }),
  remove: (id: string) => apiClient.delete<Record<string, never>>(`/memo/notes/${id}`),
}

export const phraseApi = {
  list: (vocId: string) => apiClient.get<{ phrases: Phrase[] }>('/memo/phrases', { voc_id: vocId }),
  create: (body: { voc_id: string; phrase: string; interpretation: string; tags: string[]; origin: string }) =>
    apiClient.post<{ phrase: Phrase }>('/memo/phrases', { phrase: body }),
  update: (id: string, body: { phrase: string; interpretation: string; tags: string[]; origin: string }) =>
    apiClient.post<{ phrase: Phrase }>(`/memo/phrases/${id}`, { id, phrase: body }),
  remove: (id: string) => apiClient.delete<Record<string, never>>(`/memo/phrases/${id}`),
}

/* ===== 云词本 ===== */

export type NotepadStatus = 'PUBLISHED' | 'UNPUBLISHED'
export interface BriefNotepad {
  id: string
  type: 'FAVORITE' | 'NOTEPAD'
  creator: number
  status: NotepadStatus
  title: string
  brief: string
  tags: string[]
  created_time: string
  updated_time: string
}
export interface NotepadParsedItem {
  type: 'CHAPTER' | 'WORD'
  data: { chapter?: string; word?: string }
}
export interface Notepad extends BriefNotepad {
  content: string
  list: NotepadParsedItem[]
}

export const notepadApi = {
  /** 注意：limit 实测最大 10（超出返回 400） */
  list: (params?: { limit?: number; offset?: number }) =>
    apiClient.get<{ notepads: BriefNotepad[] }>('/memo/notepads', params ?? { limit: 10, offset: 0 }),
  get: (id: string) => apiClient.get<{ notepad: Notepad }>(`/memo/notepads/${id}`),
  create: (body: { status: NotepadStatus; content: string; title: string; brief: string; tags: string[] }) =>
    apiClient.post<{ notepad: Notepad }>('/memo/notepads', { notepad: body }),
  update: (id: string, body: { status: NotepadStatus; content: string; title: string; brief: string; tags: string[] }) =>
    apiClient.post<{ notepad: Notepad }>(`/memo/notepads/${id}`, { id, notepad: body }),
  remove: (id: string) => apiClient.delete<Record<string, never>>(`/memo/notepads/${id}`),
}

/* ===== 墨墨记忆卡 ===== */

export type MarkjiSource = 'SELF' | 'FORK'
export interface MarkjiFolderItem {
  object_id: string
  object_class: 'FOLDER' | 'DECK'
  order: number
}
export interface MarkjiFolder {
  id: string
  items: MarkjiFolderItem[]
  parent_id?: string
  name: string
}
export interface MarkjiDeck {
  id: string
  parent_id?: string
  source: MarkjiSource
  status: 'NORMAL' | 'DELETED' | 'BLOCKED'
  name: string
  description: string
  creator: string
  authors: string[]
  revision: number
  is_private: boolean
  card_count: number
  chapter_count: number
  created_time: string
  updated_time: string
  /** with_root=true 时返回根牌组 */
  root_deck?: MarkjiDeck
}
export interface MarkjiChapter {
  id: string
  deck_id: string
  name: string
  revision: number
  card_ids: string[]
  creator: string
  created_time: string
  updated_time: string
}
export interface MarkjiFile {
  id: string
  url: string
  mime: string
  size: number
  info: unknown
  expire_time: string
}
export interface MarkjiCard {
  id: string
  status: 'NORMAL' | 'DELETED' | 'BLOCKED'
  deck_id: string
  parent_id?: string
  root_id?: string
  revision: number
  content: string
  content_type: 'PLAIN'
  files: MarkjiFile[]
  creator: string
  source: MarkjiSource
  grammar_version: number
  card_rids?: string[]
  created_time: string
  updated_time: string
}

export const markjiApi = {
  listFolders: () => apiClient.get<{ folders: MarkjiFolder[] }>('/markji/decks/folders'),
  listDecks: (params?: { offset?: number; limit?: number; folder_id?: string; source?: MarkjiSource }) =>
    apiClient.get<{ decks: MarkjiDeck[]; total: number }>('/markji/decks', params ?? { limit: 24 }),
  getDeck: (deck: string, withRoot = true) =>
    apiClient.get<{ deck: MarkjiDeck }>(`/markji/decks/${deck}`, { with_root: withRoot }),
  listChapters: (deck: string, withCards = false) =>
    apiClient.get<{ chapters: MarkjiChapter[]; cards?: MarkjiCard[] }>(`/markji/decks/${deck}/chapters`, { with_cards: withCards }),
  getChapter: (deck: string, chapter: string, withCards = true) =>
    apiClient.get<{ chapter: MarkjiChapter; cards?: MarkjiCard[] }>(`/markji/decks/${deck}/chapters/${chapter}`, { with_cards: withCards }),
  getCard: (deck: string, card: string) => apiClient.get<{ card: MarkjiCard }>(`/markji/decks/${deck}/cards/${card}`),
  /** 注意：此端点路径参数命名为 deck_id/card_id，与其它端点不同，封装在此处 */
  createCard: (deck: string, chapter: string, content: string, order?: number) =>
    apiClient.post<{ card: MarkjiCard; chapter: MarkjiChapter }>(
      `/markji/decks/${deck}/chapters/${chapter}/cards`,
      { deck, chapter, card: { content, grammar_version: 1 }, order },
    ),
  updateCard: (deckId: string, cardId: string, content: string) =>
    apiClient.post<{ card: MarkjiCard }>(`/markji/decks/${deckId}/cards/${cardId}`, {
      deck_id: deckId,
      card_id: cardId,
      card: { content, grammar_version: 1 },
    }),
  uploadFile: (deckId: string | undefined, file: File) => {
    const form = new FormData()
    if (deckId) form.append('deck_id', deckId)
    form.append('file', file)
    return apiClient.upload<{ file: MarkjiFile }>('/markji/files', form)
  },
  queryFiles: (ids: string[], expires = 2592000) =>
    apiClient.post<{ files: MarkjiFile[] }>('/markji/files/query', { ids, expires }),
}

/* ===== 格式工具 ===== */

export function formatTime(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('zh-CN')
}

export function formatDuration(ms: number): string {
  const min = Math.round(ms / 60_000)
  if (min >= 60) return `${Math.floor(min / 60)}h ${min % 60}min`
  if (min >= 1) return `${min}min`
  return `${Math.round(ms / 1000)}s`
}
