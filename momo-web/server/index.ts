/**
 * MOMO Web BFF（Backend for Frontend）
 * 职责：Token 认证（HTTP-only Cookie 加密存储）、API 代理（注入 Bearer）、频控、统一错误格式
 * 架构依据：momo_web.md §5 / §5.3.1 / §10.1
 */
import { serve } from '@hono/node-server'
import { Hono, type Context } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import crypto from 'node:crypto'

const UPSTREAM = process.env.MOMO_API_BASE || 'https://open.maimemo.com/open'
const COOKIE_NAME = 'mm_session'
const PORT = Number(process.env.PORT || 8787)

// TOKEN_SECRET 未设置时生成随机密钥（开发可用，重启后旧会话失效）
const SECRET = process.env.TOKEN_SECRET || crypto.randomBytes(32).toString('hex')
if (!process.env.TOKEN_SECRET) {
  console.warn('[bff] TOKEN_SECRET 未设置，已生成进程级随机密钥（重启后会话失效）')
}
const KEY = crypto.createHash('sha256').update(SECRET).digest()

function encrypt(text: string): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv)
  const enc = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, enc]).toString('base64url')
}

function decrypt(payload: string): string | null {
  try {
    const buf = Buffer.from(payload, 'base64url')
    const iv = buf.subarray(0, 12)
    const tag = buf.subarray(12, 28)
    const enc = buf.subarray(28)
    const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, iv)
    decipher.setAuthTag(tag)
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8')
  } catch {
    return null
  }
}

function getTokenFromCookie(c: Context): string | null {
  const session = getCookie(c)[COOKIE_NAME]
  return session ? decrypt(session) : null
}

// ---- 频控：内存滑动窗口（10s/20，60s/40），对齐墨墨 API 限制 ----
const hits: number[] = []
function rateOk(): boolean {
  const now = Date.now()
  while (hits.length && now - hits[0] > 60_000) hits.shift()
  const in10s = hits.filter((t) => now - t < 10_000).length
  if (in10s >= 20 || hits.length >= 40) return false
  hits.push(now)
  return true
}

const err = (code: string, message: string) => ({ error: { code, message } })

const app = new Hono()

// ---- 认证端点（§5.3.1）----

// 验证 Token 并种入 HTTP-only Cookie
app.post('/api/auth/token', async (c) => {
  const body = await c.req.json().catch(() => ({} as { token?: string }))
  const token = typeof body.token === 'string' ? body.token.trim() : ''
  if (!token) return c.json(err('BAD_REQUEST', '缺少 token'), 400)

  // 用轻量接口验证 Token 有效性
  let res: Response
  try {
    res = await fetch(`${UPSTREAM}/api/v1/memo/notepads?limit=1`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    })
  } catch {
    return c.json(err('UPSTREAM_UNREACHABLE', '无法连接墨墨 API 服务器'), 502)
  }
  if (!res.ok) return c.json(err('INVALID_TOKEN', 'Token 无效或已过期，请重新获取'), 401)

  setCookie(c, COOKIE_NAME, encrypt(token), {
    httpOnly: true,
    sameSite: 'Lax',
    path: '/',
    maxAge: 7 * 24 * 3600, // 7 天
  })
  return c.json({ ok: true })
})

// 会话状态检查（供前端路由守卫）
app.get('/api/auth/status', (c) => {
  return c.json({ authenticated: getTokenFromCookie(c) !== null })
})

// 退出登录
app.delete('/api/auth/token', (c) => {
  deleteCookie(c, COOKIE_NAME, { path: '/' })
  return c.json({ ok: true })
})

// ---- API 代理：/api/v1/* → https://open.maimemo.com/open/api/v1/* ----
app.all('/api/v1/*', async (c) => {
  const token = getTokenFromCookie(c)
  if (!token) return c.json(err('UNAUTHORIZED', '未登录或会话已过期'), 401)
  if (!rateOk()) return c.json(err('RATE_LIMITED', '请求过于频繁，请稍后再试'), 429)

  const url = UPSTREAM + c.req.path + new URL(c.req.url).search
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
  }

  let body: BodyInit | undefined
  if (c.req.method !== 'GET' && c.req.method !== 'HEAD') {
    const ct = c.req.header('content-type') || ''
    if (ct.includes('multipart/form-data')) {
      // 文件上传：透传原始字节与 boundary
      body = await c.req.arrayBuffer()
      headers['Content-Type'] = ct
    } else {
      const text = await c.req.text()
      if (text) body = text
      headers['Content-Type'] = 'application/json'
    }
  }

  let res: Response
  try {
    res = await fetch(url, { method: c.req.method, headers, body })
  } catch {
    return c.json(err('UPSTREAM_UNREACHABLE', '无法连接墨墨 API 服务器'), 502)
  }

  const text = await res.text()
  return new Response(text, {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('content-type') || 'application/json; charset=utf-8' },
  })
})

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`[bff] listening on http://localhost:${info.port}`)
})
