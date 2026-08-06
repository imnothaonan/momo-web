# 墨墨单词 Web 版 — 架构规划文档

> **项目名称**：MOMO Web  
> **文档版本**：v1.1（2026-08-05 修订，详见文末「修订记录」）  
> **创建日期**：2026-08-05  
> **技术栈**：React 18 + TypeScript + Vite + Tailwind CSS + Framer Motion  
> **组件库**：[react-bits](https://github.com/DavidHDev/react-bits)（165+ 动画组件）  
> **API 来源**：墨墨开放 API v1（详见 `墨墨开放api.md` 和 `墨墨OpenAPI 规范.md`）

---

## 目录

1. [项目概述](#1-项目概述)
2. [功能模块规划](#2-功能模块规划)
3. [技术架构设计](#3-技术架构设计)
4. [前端架构详解](#4-前端架构详解)
5. [后端代理层设计](#5-后端代理层设计)
6. [状态管理方案](#6-状态管理方案)
7. [路由设计](#7-路由设计)
8. [react-bits 组件选型](#8-react-bits-组件选型)
9. [页面设计方案](#9-页面设计方案)
10. [API 服务层设计](#10-api-服务层设计)
11. [目录结构](#11-目录结构)
12. [开发阶段规划](#12-开发阶段规划)
13. [关键技术决策](#13-关键技术决策)
14. [安全与合规](#14-安全与合规)
15. [性能优化策略](#15-性能优化策略)
16. [修订记录](#16-修订记录)

---

## 1. 项目概述

### 1.1 项目定位

墨墨单词 Web 版是墨墨背单词 App 的浏览器端补充工具，核心目标：

- **学习管理**：查看今日学习进度、学习记录、添加/提前复习单词
- **内容创作**：管理释义、助记、例句、云词本等用户生成内容
- **记忆卡管理**：浏览/编辑墨墨记忆卡（Markji）的牌组、章节和卡片
- **数据可视化**：将学习数据以图表形式直观展示

### 1.2 设计原则

| 原则 | 说明 |
|------|------|
| **移动优先响应式** | 以移动端体验为核心，适配桌面端 |
| **渐进式加载** | 路由级 + 组件级代码分割 |
| **离线友好** | 利用 SW 缓存静态资源，支持弱网体验 |
| **动画驱动** | 使用 react-bits 动画组件提升交互体验 |
| **类型安全** | 全链路 TypeScript，API 响应有完整类型定义 |

### 1.3 目标用户

- 墨墨背单词 App 用户，希望在 PC 上管理学习内容
- 需要批量编辑释义/助记/例句的深度用户
- 使用墨墨记忆卡制作学习卡片的用户

---

## 2. 功能模块规划

基于墨墨开放 API 的 34 个端点，规划以下功能模块：

### 2.1 模块全景图

```
┌─────────────────────────────────────────────────────────┐
│                     MOMO Web                             │
├──────────────┬──────────────┬──────────────┬────────────┤
│   学习中心    │   单词工具    │   内容管理    │  记忆卡     │
│  (Study)     │ (Vocabulary) │ (Content)    │ (Markji)   │
├──────────────┼──────────────┼──────────────┼────────────┤
│ · 今日进度    │ · 单词搜索    │ · 释义管理    │ · 牌组浏览  │
│ · 今日单词    │ · 批量查询    │ · 助记管理    │ · 章节列表  │
│ · 学习记录    │              │ · 例句管理    │ · 卡片编辑  │
│ · 添加单词    │              │ · 云词本管理  │ · 文件上传  │
│ · 提前复习    │              │              │            │
└──────────────┴──────────────┴──────────────┴────────────┘
```

### 2.2 功能清单

#### 模块一：学习中心（Study）

| 功能 | 对应 API | 说明 |
|------|----------|------|
| 今日学习进度 | `POST /study/get_study_progress` | 展示完成数/总数/学习时长 |
| 今日学习单词 | `POST /study/get_today_items` | 按学习顺序展示，支持筛选新学/已完成 |
| 学习记录查询 | `POST /study/query_study_records` | 按日期/单词查询，支持统计总数 |
| 添加单词 | `POST /study/add_words` | 通过拼写查词后添加到学习计划（`advance=true` 可一并提前复习，**无等级限制**） |
| 提前复习 | `POST /study/advance_study` | 将指定单词提前到当下复习（**需账号 10 级解锁**，未解锁时引导改用「添加单词 + advance」路径） |

> ⚠️ **公测提示**：学习数据接口处于公测期，不保证可用性；需在 App 中开启「自动同步」，且当日打开过 App 完成初始化，否则数据不准确或为空。学习中心各页面必须设计对应的空态/引导态（详见《前端设计文档》）。

#### 模块二：单词工具（Vocabulary）

| 功能 | 对应 API | 说明 |
|------|----------|------|
| 单词搜索 | `GET /vocabulary?spelling=` | 输入拼写获取单词 ID |
| 批量查词 | `POST /vocabulary/query` | 按拼写或 ID 批量查询（最多 1000） |

#### 模块三：内容管理（Content）

| 功能 | 对应 API | 说明 |
|------|----------|------|
| 释义管理 | `GET/POST/DELETE /interpretations` | CRUD 释义，按单词维度管理 |
| 助记管理 | `GET/POST/DELETE /notes` | CRUD 助记 |
| 例句管理 | `GET/POST/DELETE /phrases` | CRUD 例句 |
| 云词本管理 | `GET/POST/DELETE /notepads` | CRUD 云词本，支持章节/文本模式 |

#### 模块四：记忆卡（Markji）

| 功能 | 对应 API | 说明 |
|------|----------|------|
| 文件夹列表 | `GET /markji/decks/folders` | 展示文件夹树形结构 |
| 牌组列表 | `GET /markji/decks` | 分页展示牌组，支持来源筛选 |
| 牌组详情 | `GET /markji/decks/{deck}` | 展示牌组信息及根牌组 |
| 章节列表 | `GET /markji/decks/{deck}/chapters` | 展示章节，支持增量更新 |
| 章节详情 | `GET /markji/decks/{deck}/chapters/{chapter}` | 展示章节内卡片 |
| 卡片详情 | `GET /markji/decks/{deck}/cards/{card}` | 展示单张卡片内容 |
| 新建卡片 | `POST /markji/decks/{deck}/chapters/{chapter}/cards` | 使用 Markji 语法创建卡片 |
| 更新卡片 | `POST /markji/decks/{deck_id}/cards/{card_id}` | 编辑已有卡片 |
| 上传文件 | `POST /markji/files` | 上传图片/音频等媒体文件 |
| 查询文件 | `POST /markji/files/query` | 获取文件访问 URL |

---

## 3. 技术架构设计

### 3.1 整体架构

```
┌──────────────────────────────────────────────────────────┐
│                      浏览器（客户端）                       │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │              React SPA (Vite + TS)                 │  │
│  │                                                    │  │
│  │  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │  │
│  │  │  Pages   │  │ Components│  │  Hooks/Store  │  │  │
│  │  │ (路由页面)│  │(react-bits│  │ (Zustand+React│  │  │
│  │  │          │  │ +自定义)  │  │   Query)      │  │  │
│  │  └────┬─────┘  └────┬─────┘  └───────┬───────┘  │  │
│  │       └──────┬──────┴────────────────┘           │  │
│  │              │ API Service Layer                  │  │
│  │              │ (typed fetch wrapper)              │  │
│  │              ▼                                    │  │
│  └──────────────┼────────────────────────────────────┘  │
│                 │                                       │
│                 ▼                                       │
│  ┌────────────────────────────────────────────────────┐ │
│  │           Service Worker (PWA 缓存)                │ │
│  └────────────────────────────────────────────────────┘ │
└──────────────────┬───────────────────────────────────────┘
                   │ HTTPS
                   ▼
┌──────────────────────────────────────────────────────────┐
│                后端代理层（BFF）                           │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │              Express / Hono Server                  │  │
│  │                                                    │  │
│  │  · Token 管理（用户输入 → 安全存储）                 │  │
│  │  · 请求转发（添加 Authorization Header）             │  │
│  │  · 频控限流（10s/20, 60s/40, 5h/2000）             │  │
│  │  · 响应缓存                                         │  │
│  │  · CORS 处理                                        │  │
│  └────────────────────┬───────────────────────────────┘  │
└───────────────────────┼──────────────────────────────────┘
                        │ HTTPS
                        ▼
┌──────────────────────────────────────────────────────────┐
│              墨墨开放 API 服务器                           │
│         https://open.maimemo.com/open                    │
└──────────────────────────────────────────────────────────┘
```

### 3.2 为什么需要后端代理层（BFF）

墨墨开放 API 使用 OAuth 2.0 Bearer Token 认证，Token 是用户个人凭证。如果直接从前端调用 API：

1. **Token 暴露**：Token 会出现在浏览器网络请求中，存在安全风险
2. **CORS 限制**：墨墨 API 服务器可能不允许跨域请求
3. **频控管理**：需要在服务端统一管理请求频率，避免触发频控
4. **数据缓存**：单词查询、牌组信息等数据可缓存，减少 API 调用

**方案**：使用轻量级 Node.js 服务作为 BFF（Backend for Frontend），用户在设置页输入 Token，BFF 加密存储并代理所有 API 请求。

### 3.3 技术选型总览

| 层级 | 技术 | 版本 | 选型理由 |
|------|------|------|----------|
| 构建工具 | Vite | ^7.x | 极速 HMR，React 生态首选 |
| 框架 | React | ^18.3（可评估升 19） | react-bits 要求 React 18+；升 19 前需逐组件验证兼容性 |
| 语言 | TypeScript | ^5.x | 类型安全，API 类型完整 |
| 样式 | Tailwind CSS | **^3.4（钉住）** | shadcn CLI 现在默认生成 Tailwind v4 配置，init 时需手动钉住 v3.4；react-bits TW 变体在 v4 下的兼容性逐组件验证后再评估迁移 |
| 动画 | motion（原 Framer Motion） | ^11 / ^12 | `framer-motion@11` 后更名为 `motion`；react-bits 组件分别 import `framer-motion` 或 `motion/react`，安装时按组件提示补依赖 |
| 状态管理 | Zustand | ^5.x | 轻量、TypeScript 友好 |
| 数据请求 | TanStack Query | ^5.x | 缓存、重试、乐观更新 |
| 路由 | React Router | ^7.x | v7 兼容 v6 用法，React 生态标准路由方案 |
| UI 组件库 | react-bits | 最新 | 165+ 动画组件，copy-paste 模式 |
| 基础组件 | shadcn/ui | 最新 | 对话框、表单等基础组件补充 |
| 图表 | Recharts | ^2.x | 学习数据可视化 |
| 图标 | Lucide React | 最新 | 轻量图标库 |
| BFF 框架 | Hono | ^4.x | 轻量、快速、边缘运行时兼容 |
| PWA | vite-plugin-pwa | 最新 | 离线缓存、可安装 |

---

## 4. 前端架构详解

### 4.1 分层架构

```
┌─────────────────────────────────────────────┐
│                 UI Layer                     │  ← Pages + Components
├─────────────────────────────────────────────┤
│              Hooks Layer                     │  ← useStudy, useVocabulary...
├─────────────────────────────────────────────┤
│           State Layer (Zustand)              │  ← 全局状态
├─────────────────────────────────────────────┤
│         Data Layer (TanStack Query)          │  ← 请求缓存
├─────────────────────────────────────────────┤
│          API Service Layer                   │  ← typed fetch
├─────────────────────────────────────────────┤
│            HTTP Client Layer                 │  ← fetch wrapper
└─────────────────────────────────────────────┘
```

### 4.2 各层职责

| 层级 | 职责 | 示例 |
|------|------|------|
| UI Layer | 页面布局、组件渲染、用户交互 | `StudyPage.tsx`, `WordCard.tsx` |
| Hooks Layer | 封装业务逻辑，连接 UI 与数据层 | `useStudyProgress()`, `useNotepads()` |
| State Layer | 全局 UI 状态、用户配置 | Token、主题、侧边栏状态 |
| Data Layer | API 请求缓存、乐观更新、重试 | `queryClient.fetchQuery()` |
| API Service | 类型安全的 API 调用函数 | `studyApi.getProgress()` |
| HTTP Client | 底层 fetch 封装，统一错误处理 | `apiClient.get()`, `apiClient.post()` |

---

## 5. 后端代理层设计

### 5.1 BFF 架构

```
┌─────────────────────────────────────────┐
│            Hono Server (BFF)             │
│                                         │
│  ┌───────────┐  ┌───────────────────┐  │
│  │  Auth     │  │  Rate Limiter     │  │
│  │  Middleware│  │  (内存/Redis)      │  │
│  └─────┬─────┘  └─────────┬─────────┘  │
│        │                   │            │
│        ▼                   ▼            │
│  ┌─────────────────────────────────┐    │
│  │        Proxy Handler            │    │
│  │  · 路径映射 /api/* → /open/api/* │    │
│  │  · 注入 Authorization Header     │    │
│  │  · 响应缓存（单词查询等）         │    │
│  └──────────────┬──────────────────┘    │
│                 │                       │
│  ┌──────────────▼──────────────────┐    │
│  │     Token Storage               │    │
│  │  · 内存 Map（会话级）            │    │
│  │  · 加密 Cookie（持久化）         │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

### 5.2 BFF API 设计

BFF 对前端暴露的 API 与墨墨原 API 路径保持一致，但无需前端传递 Token：

```
前端请求:  GET  /api/v1/memo/phrases?voc_id=xxx
BFF 转发:  GET  https://open.maimemo.com/open/api/v1/memo/phrases?voc_id=xxx
           Header: Authorization: Bearer <user_token>
```

### 5.3 Token 管理流程

```
用户输入 Token → BFF 验证 → 加密存入 HTTP-only Cookie
                              ↓
后续请求 → BFF 读取 Cookie → 解密 → 注入 Authorization Header → 转发
```

### 5.3.1 BFF 认证端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/auth/token` | POST | 接收 Token → 调用轻量接口验证（`GET /memo/notepads?limit=1`）→ 验证通过后 AES 加密种入 HTTP-only Cookie |
| `/api/auth/status` | GET | 检查 Cookie 存在且可解密 → 返回 `{ "authenticated": boolean }`，供前端路由守卫使用 |
| `/api/auth/token` | DELETE | 清除 Cookie（退出登录） |

Cookie 属性：`HttpOnly; Secure; SameSite=Lax; Max-Age=7d; Path=/`。加密密钥由服务端环境变量 `TOKEN_SECRET` 提供；Token 不落库、不写日志。

> **关键约束**：前端任何代码都不持有 Token —— Zustand / localStorage 中只存 `isAuthenticated` 布尔标志（§6 已同步修正）。

### 5.4 频控策略

| 窗口 | 限制 | BFF 实现 |
|------|------|----------|
| 10s | 20 次 | 滑动窗口计数器 |
| 60s | 40 次 | 滑动窗口计数器 |
| 5h | 2000 次（背单词） | 令牌桶 |
| 5h | 8000 次（记忆卡） | 令牌桶 |

超出限制时返回 `429 Too Many Requests`，前端展示友好提示。

---

## 6. 状态管理方案

### 6.1 状态分类

| 状态类型 | 管理工具 | 示例 |
|----------|----------|------|
| 服务器数据（缓存） | TanStack Query | 单词列表、学习进度、牌组信息 |
| 全局 UI 状态 | Zustand | 侧边栏开关、主题模式、当前选中单词 |
| 认证状态 | Zustand（仅内存） | `isAuthenticated` 布尔标志（**Token 只存 HTTP-only Cookie，前端不持有**） |
| 用户配置 | Zustand + localStorage | 主题、语言偏好等非敏感配置 |
| 表单状态 | React Hook Form | 创建/编辑释义、助记等 |
| URL 状态 | React Router + searchParams | 当前页码、筛选条件 |

### 6.2 Zustand Store 设计

```typescript
// stores/appStore.ts
interface AppStore {
  // 认证（Token 只存 HTTP-only Cookie，此处仅维护会话标志）
  isAuthenticated: boolean;
  setAuthenticated: (v: boolean) => void;

  // 主题
  theme: 'light' | 'dark';
  toggleTheme: () => void;

  // 导航
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  activeModule: 'study' | 'vocabulary' | 'content' | 'markji';
  setActiveModule: (module: AppStore['activeModule']) => void;

  // 当前上下文
  currentVocId: string | null;
  currentDeckId: string | null;
}
```

### 6.3 TanStack Query 使用规范

```typescript
// 每个模块一个 hooks 文件，统一管理 query key

// hooks/study/useStudyProgress.ts
export const studyKeys = {
  all: ['study'] as const,
  progress: () => [...studyKeys.all, 'progress'] as const,
  todayItems: (filters?: StudyItemFilters) => [...studyKeys.all, 'todayItems', filters] as const,
  records: (filters?: StudyRecordFilters) => [...studyKeys.all, 'records', filters] as const,
};

export function useStudyProgress() {
  return useQuery({
    queryKey: studyKeys.progress(),
    queryFn: () => studyApi.getProgress(),
    refetchInterval: 60_000, // 60秒轮询（仅页面可见时生效，节省 5h/2000 次频控预算）
  });
}
```

---

## 7. 路由设计

### 7.1 路由树

```
/                           → 重定向到 /study
├── /login                  → Token 输入页
├── /study                  → 学习中心
│   ├── /study/progress     → 今日进度（默认）
│   ├── /study/today        → 今日单词
│   ├── /study/records      → 学习记录
│   └── /study/add          → 添加单词
├── /vocabulary             → 单词工具
│   ├── /vocabulary/search  → 单词搜索（默认）
│   └── /vocabulary/:id     → 单词详情（释义/助记/例句）
├── /content                → 内容管理
│   ├── /content/interpretations  → 释义管理
│   ├── /content/notes            → 助记管理
│   ├── /content/phrases          → 例句管理
│   └── /content/notepads         → 云词本管理
│       └── /content/notepads/:id → 云词本详情/编辑
├── /markji                 → 记忆卡
│   ├── /markji/decks       → 牌组列表（默认）
│   ├── /markji/decks/:id   → 牌组详情
│   │   └── /markji/decks/:id/chapters/:chapterId → 章节详情
│   └── /markji/editor      → 卡片编辑器（支持 ?deck=&chapter=&card= 参数进入编辑态）
└── /settings               → 设置
└── *                       → 404 NotFound（全局错误边界 + 返回首页引导）
```

### 7.2 路由守卫

```typescript
// 所有非 /login 路由需要认证
<Route element={<RequireAuth />}>
  <Route path="/study" element={<StudyLayout />}>
    <Route index element={<StudyProgress />} />
    ...
  </Route>
</Route>
```

### 7.3 布局结构

```
┌──────────────────────────────────────────────┐
│  TopBar（Logo + 主题切换 + 用户菜单）           │
├────────┬─────────────────────────────────────┤
│        │                                     │
│ Side   │         Main Content                │
│ Nav    │       (Outlet / 路由出口)            │
│        │                                     │
│ · 学习  │                                     │
│ · 单词  │                                     │
│ · 内容  │                                     │
│ · 卡片  │                                     │
│ · 设置  │                                     │
│        │                                     │
└────────┴─────────────────────────────────────┘
```

移动端：侧边栏变为底部 Tab 栏或抽屉式菜单。

---

## 8. react-bits 组件选型

react-bits 提供 165+ 动画组件，分为 4 大类。以下是根据墨墨单词 Web 版需求精选的组件：

### 8.1 文字动画（TextAnimations）— 31 个可用

| 组件 | 使用场景 | 页面位置 |
|------|----------|----------|
| **BlurText** | 页面标题渐入效果 | 各页面 H1 标题 |
| **CountUp** | 学习数据数字动画 | 今日进度卡片（已完成数、总数、学习时长） |
| **TextType** | 单词拼写打字机效果 | 单词搜索结果展示 |
| **GradientText** | 品牌名称渐变文字 | Logo、首页标题 |
| **DecryptedText** | 单词 ID 解密效果 | 单词详情页 voc_id 展示 |
| **RotatingText** | 轮播提示语 | 空状态提示（"暂无数据"、"试试搜索..."） |
| **ScrollReveal** | 列表项滚动揭示 | 学习记录列表、牌组列表 |
| **ShinyText** | 按钮文字闪光效果 | 主要 CTA 按钮 |
| **SplitText** | 大标题分字动画 | 登录页标题 |

### 8.2 动画组件（Animations）— 35 个可用

| 组件 | 使用场景 | 页面位置 |
|------|----------|----------|
| **AnimatedContent** | 通用内容入场动画 | 卡片、面板切换 |
| **FadeContent** | 页面切换淡入淡出 | 路由过渡 |
| **ClickSpark** | 按钮点击粒子效果 | 添加单词、提前复习按钮 |
| **Magnet** | 磁吸悬停效果 | 导航栏图标 |
| **StarBorder** | 边框星光动画 | 重要卡片边框（今日进度卡片） |
| **PixelTransition** | 图片切换像素过渡 | 记忆卡图片展示 |
| **ScrollExpand** | 滚动展开效果 | 学习记录时间线 |
| **GlareHover** | 悬停眩光效果 | 牌组卡片、云词本卡片 |
| **ElectricBorder** | 选中态边框动画 | 当前选中的章节/卡片 |

### 8.3 UI 组件（Components）— 42 个可用

| 组件 | 使用场景 | 页面位置 |
|------|----------|----------|
| **TiltedCard** | 3D 倾斜卡片 | 牌组卡片、单词卡片 |
| **Counter** | 数字计数器 | 学习统计面板 |
| **Carousel** | 轮播组件 | 今日单词卡片轮播 |
| **Dock** | 底部 Dock 导航 | macOS 风格导航栏 |
| **Stepper** | 步骤指示器 | 添加单词流程（搜索→确认→添加） |
| **AccordionGallery** | 手风琴展开 | 云词本列表展开/折叠 |
| **AnimatedList** | 动画列表 | 学习记录列表、今日单词列表 |
| **SpotlightCard** | 聚光灯卡片 | 内容管理模块入口卡片 |
| **ProfileCard** | 个人信息卡片 | 设置页用户信息 |
| **FluidGlass** | 毛玻璃容器 | 浮层、弹窗容器 |
| **MagicBento** | Bento Grid 布局 | 学习中心仪表盘 |
| **Stack** | 卡片堆叠 | 今日单词翻卡学习 |
| **PillNav** | 胶囊导航 | 模块切换 Tab |
| **SpecularButton** | 高光按钮 | 主要操作按钮 |
| **BorderGlow** | 发光边框 | 选中状态的输入框 |
| **Masonry** | 瀑布流 | 记忆卡画廊展示 |
| **Folder** | 文件夹组件 | Markji 文件夹层级展示 |

### 8.4 背景动画（Backgrounds）— 51 个可用

| 组件 | 使用场景 | 页面位置 |
|------|----------|----------|
| **Aurora** | 极光背景 | 登录页背景 |
| **Particles** | 粒子背景 | 首页/学习中心背景 |
| **GridDistortion** | 网格扭曲 | 记忆卡编辑器背景 |
| **DotGrid** | 点阵背景 | 内容管理页背景 |
| **Waves** | 波浪背景 | 学习进度页背景 |
| **Threads** | 线条背景 | 设置页背景 |
| **SoftAurora** | 柔光极光 | 全局低饱和度背景（默认） |

### 8.5 组件安装方式

react-bits 使用 shadcn CLI 或 jsrepo 进行 copy-paste 安装，组件代码直接复制到项目中：

```bash
# 初始化 shadcn（注意：CLI 默认生成 Tailwind v4 配置，本项目钉住 v3.4，需手动调整）
npx shadcn@latest init

# 方式一：shadcn CLI（@react-bits 命名空间，与官网首页示例一致）
npx shadcn@latest add @react-bits/BlurText-TS-TW

# 方式一等价写法：完整 registry URL
npx shadcn@latest add "https://reactbits.dev/r/BlurText-TS-TW"

# 方式二：jsrepo（变体：default / tailwind / ts/default / ts/tailwind）
npx jsrepo add https://reactbits.dev/ts/tailwind/TextAnimations/BlurText
# ... 按需安装
```

**注意事项**：

- 变体后缀规则：`-<TS|JS>-<TW|CSS>`，本项目统一使用 `TS-TW`。
- 部分组件有额外运行时依赖（如 `gsap`、`ogl`、`motion`），安装后按组件 Code 页提示 `npm i` 补齐。
- 背景类组件多为 WebGL/Canvas 实现（依赖 `ogl`），注意包体积与移动端性能，全部按需懒加载。
- 许可证为 MIT + Commons Clause，允许商用；组件代码归项目所有，可自由修改。
- `rb_content.json` / `rb_src.json` 为 react-bits 仓库目录快照：组件按 4 大类组织于 `src/content/`，TS+Tailwind 变体源码位于 `src/ts-tailwind/`，与上述 CLI 安装产物一致。

---

## 9. 页面设计方案

### 9.1 登录页（/login）

```
┌──────────────────────────────────────────────┐
│           [Aurora 背景动画]                    │
│                                              │
│          ┌─────────────────┐                 │
│          │  SplitText      │                 │
│          │  "墨墨单词"      │                 │
│          │  GradientText   │                 │
│          │  "Web Edition"  │                 │
│          └─────────────────┘                 │
│                                              │
│          ┌─────────────────┐                 │
│          │  输入 Token      │  ← BorderGlow   │
│          │                 │                 │
│          │  [SpecularButton]│                 │
│          │  "开始使用"      │  ← ClickSpark   │
│          └─────────────────┘                 │
│                                              │
│          RotatingText                        │
│          "在 App 中获取 Token..."             │
└──────────────────────────────────────────────┘
```

### 9.2 学习中心（/study）

#### 今日进度页

```
┌──────────────────────────────────────────────┐
│  TopBar                                       │
├────────┬─────────────────────────────────────┤
│ Side   │  BlurText "今日学习"                 │
│ Nav    │                                     │
│        │  ┌──────────────────────────────┐   │
│ ·▶学习 │  │  MagicBento (仪表盘)          │   │
│  单词  │  │                              │   │
│  内容  │  │  ┌─────────┐ ┌─────────┐    │   │
│  卡片  │  │  │CountUp  │ │CountUp  │    │   │
│  设置  │  │  │已完成   │ │总数     │    │   │
│        │  │  │  10     │ │  20     │    │   │
│        │  │  └─────────┘ └─────────┘    │   │
│        │  │                              │   │
│        │  │  ┌─────────┐ ┌─────────┐    │   │
│        │  │  │CountUp  │ │Progress │    │   │
│        │  │  │学习时长 │ │ 完成率   │    │   │
│        │  │  │ 23min   │ │  50%    │    │   │
│        │  │  └─────────┘ └─────────┘    │   │
│        │  └──────────────────────────────┘   │
│        │                                     │
│        │  ┌──────────────────────────────┐   │
│        │  │  SpecularButton              │   │
│        │  │  "添加单词 →"                │   │
│        │  └──────────────────────────────┘   │
│        │  ┌──────────────────────────────┐   │
│        │  │  SpecularButton              │   │
│        │  │  "提前复习 →"                │   │
│        │  └──────────────────────────────┘   │
└────────┴─────────────────────────────────────┘
```

#### 今日单词页

```
┌──────────────────────────────────────────────┐
│  PillNav: [全部] [新学] [已完成] [未完成]      │
├──────────────────────────────────────────────┤
│                                              │
│  AnimatedList                                │
│  ┌──────────────────────────────────────┐    │
│  │ #1  apple    [新学] [未完成]    →    │    │
│  ├──────────────────────────────────────┤    │
│  │ #2  banana   [复习] [已完成]    →    │    │
│  ├──────────────────────────────────────┤    │
│  │ #3  cherry   [新学] [未完成]    →    │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  Stack (翻卡模式切换)                         │
│  ┌──────────────────────────────────────┐    │
│  │           apple                      │    │
│  │           n. 苹果                     │    │
│  │        [翻面] [下一个]                 │    │
│  └──────────────────────────────────────┘    │
└──────────────────────────────────────────────┘
```

### 9.3 单词搜索页（/vocabulary/search）

```
┌──────────────────────────────────────────────┐
│  BorderGlow 输入框                            │
│  ┌──────────────────────────────────────┐    │
│  │  🔍 输入单词拼写...                    │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  搜索结果:                                    │
│  ┌──────────────────────────────────────┐    │
│  │  TiltedCard                          │    │
│  │  TextType "apple"                    │    │
│  │  ID: DecryptedText "5a7BFf4..."      │    │
│  │                                      │    │
│  │  [查看释义] [查看助记] [查看例句]       │    │
│  │  [添加到学习] [提前复习]               │    │
│  └──────────────────────────────────────┘    │
└──────────────────────────────────────────────┘
```

### 9.4 内容管理 — 释义管理（/content/interpretations）

```
┌──────────────────────────────────────────────┐
│  搜索栏: 输入单词拼写 → 查询单词 → 获取释义     │
├──────────────────────────────────────────────┤
│                                              │
│  当前单词: apple (voc_id: 5a7BFf4...)         │
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │  释义列表 (AnimatedList)              │    │
│  │                                      │    │
│  │  ┌────────────────────────────────┐  │    │
│  │  │ n. 苹果                         │  │    │
│  │  │ 标签: [考研]  状态: 已发布        │  │    │
│  │  │ [编辑] [删除]                    │  │    │
│  │  └────────────────────────────────┘  │    │
│  │                                      │    │
│  │  ┌────────────────────────────────┐  │    │
│  │  │ n. 苹果公司                     │  │    │
│  │  │ 标签: [商务]  状态: 未发布        │  │    │
│  │  │ [编辑] [删除]                    │  │    │
│  │  └────────────────────────────────┘  │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │  + 创建新释义                         │    │
│  │  释义: [_______________]              │    │
│  │  标签: [_______________]              │    │
│  │  状态: [PUBLISHED ▼]                  │    │
│  │  [SpecularButton 创建]                │    │
│  └──────────────────────────────────────┘    │
└──────────────────────────────────────────────┘
```

### 9.5 记忆卡 — 牌组浏览（/markji/decks）

```
┌──────────────────────────────────────────────┐
│  PillNav: [全部] [自建] [派生]                 │
├──────────────────────────────────────────────┤
│                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  │TiltedCard│ │TiltedCard│ │TiltedCard│     │
│  │          │ │          │ │          │     │
│  │ 牌组名称  │ │ 牌组名称  │ │ 牌组名称  │     │
│  │ 120 张卡  │ │ 56 张卡   │ │ 89 张卡   │     │
│  │ 8 章节    │ │ 5 章节    │ │ 12 章节   │     │
│  │          │ │          │ │          │     │
│  │GlareHover│ │GlareHover│ │GlareHover│     │
│  └──────────┘ └──────────┘ └──────────┘     │
│                                              │
│  分页: ← 1 2 3 4 →                           │
└──────────────────────────────────────────────┘
```

### 9.6 记忆卡 — 卡片编辑器（/markji/editor）

```
┌──────────────────────────────────────────────┐
│  牌组: [选择牌组 ▼]  章节: [选择章节 ▼]        │
├───────────────────────────────────┬──────────┤
│                                   │          │
│  卡片内容编辑器                     │ 实时预览  │
│  ┌─────────────────────────────┐  │          │
│  │ [P#H1#光合作用]              │  │ ┌──────┐│
│  │ 光合作用主要发生在            │  │ │光合  ││
│  │ [F#1#叶绿体]中。             │  │ │作用  ││
│  │ ---                         │  │ │      ││
│  │ 叶绿体。                     │  │ │叶绿体││
│  │                             │  │ │      ││
│  └─────────────────────────────┘  │ │叶绿体││
│                                   │ └──────┘│
│  语法工具栏:                        │          │
│  [加粗] [挖空] [标题] [选择题]       │  语法    │
│  [图片] [公式] [音频] [答案线]       │  检查    │
│                                   │          │
│  [SpecularButton 保存卡片]          │ ✓ 通过  │
│                                   │          │
└───────────────────────────────────┴──────────┘
```

---

## 10. API 服务层设计

### 10.1 HTTP Client

```typescript
// lib/apiClient.ts
const BASE_URL = '/api/v1'; // BFF 代理路径

class ApiClient {
  private async request<T>(
    path: string,
    options?: RequestInit & { params?: Record<string, unknown> }
  ): Promise<T> {
    const url = new URL(`${BASE_URL}${path}`, window.location.origin);
    if (options?.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      });
    }

    const isFormData = options?.body instanceof FormData;
    const response = await fetch(url.toString(), {
      ...options,
      headers: {
        // FormData 不设置 Content-Type，由浏览器自动生成 multipart boundary
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        'Accept': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await this.handleError(response);
      throw error;
    }

    return response.json();
  }

  get<T>(path: string, params?: Record<string, unknown>) {
    return this.request<T>(path, { method: 'GET', params });
  }

  post<T>(path: string, body?: unknown) {
    return this.request<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(path: string) {
    return this.request<T>(path, { method: 'DELETE' });
  }

  /** 文件上传（multipart/form-data）：调用方构造 FormData，
   *  不要手动设置 Content-Type；BFF 需透传 multipart 请求体 */
  upload<T>(path: string, formData: FormData) {
    return this.request<T>(path, { method: 'POST', body: formData });
  }
}

export const apiClient = new ApiClient();
```

**统一错误处理**：BFF 将所有上游错误包装为 `{ "error": { "code", "message", "status" } }`；前端抛出 `ApiError`（携带 `status` 与 `code`）。特殊状态约定：

- `401` → 清除 `isAuthenticated` 标志，跳转 `/login`；
- `429` → 全局 Toast「请求过于频繁，请稍后再试」，展示剩余等待时间；
- `5xx` / 网络错误 → 页面级 ErrorState + 手动重试按钮。

**响应包裹层（2026-08-05 实测确认）**：墨墨上游成功响应实际为 `{"errors": [], "data": {...}, "success": true}`，apiClient 需先校验 `success`，再解包 `data` 返回给业务层；`success=false` 时以 `errors[0].message` 抛出。另注意 **voc_id 实测格式为 `voc-` 前缀长串**，与文档示例不同（已在 `墨墨开放api.md` 顶部补充实测说明）。

### 10.2 API 模块划分

```typescript
// services/api/studyApi.ts
export const studyApi = {
  getProgress: () => apiClient.post<StudyProgressResponse>('/memo/study/get_study_progress'),
  getTodayItems: (body?: TodayItemsRequest) => apiClient.post<TodayItemsResponse>('/memo/study/get_today_items', body),
  queryRecords: (body?: StudyRecordsRequest) => apiClient.post<StudyRecordsResponse>('/memo/study/query_study_records', body),
  addWords: (body: AddWordsRequest) => apiClient.post<AddWordsResponse>('/memo/study/add_words', body),
  advanceStudy: (body: AdvanceStudyRequest) => apiClient.post<AdvanceStudyResponse>('/memo/study/advance_study', body),
};

// services/api/vocabularyApi.ts
export const vocabularyApi = {
  get: (spelling: string) => apiClient.get<VocabularyResponse>('/memo/vocabulary', { spelling }),
  query: (body: VocabularyQueryRequest) => apiClient.post<VocabularyQueryResponse>('/memo/vocabulary/query', body),
};

// services/api/interpretationApi.ts
export const interpretationApi = {
  list: (vocId: string) => apiClient.get<InterpretationsResponse>('/memo/interpretations', { voc_id: vocId }),
  create: (body: CreateInterpretationRequest) => apiClient.post<InterpretationResponse>('/memo/interpretations', body),
  update: (id: string, body: UpdateInterpretationRequest) => apiClient.post<InterpretationResponse>(`/memo/interpretations/${id}`, body),
  delete: (id: string) => apiClient.delete<void>(`/memo/interpretations/${id}`),
};

// services/api/noteApi.ts — 助记管理（同上模式）
// services/api/phraseApi.ts — 例句管理（同上模式）
// services/api/notepadApi.ts — 云词本管理（同上模式）
// services/api/markjiApi.ts — 记忆卡管理（同上模式）
```

### 10.3 TypeScript 类型定义

基于 `墨墨OpenAPI 规范.md` 中的 Schema 定义，为所有请求和响应创建完整的类型：

```typescript
// types/api.ts

// ===== 枚举 =====
export type MarkjiSource = 'SELF' | 'FORK';
export type MarkjiStatus = 'NORMAL' | 'DELETED' | 'BLOCKED';
export type InterpretationStatus = 'PUBLISHED' | 'UNPUBLISHED' | 'DELETED';
export type NoteStatus = 'PUBLISHED' | 'DELETED';
export type NotepadStatus = 'PUBLISHED' | 'UNPUBLISHED' | 'DELETED';
export type NotepadType = 'FAVORITE' | 'NOTEPAD';
export type PhraseStatus = 'PUBLISHED' | 'DELETED';
export type StudyResponse = 'FAMILIAR' | 'VAGUE' | 'FORGET' | 'WELL_FAMILIAR' | 'CANCEL_WELL_FAMILIAR';

// ===== 墨墨记忆卡 =====
export interface MarkjiDeck { id: string; name: string; description: string; ... }
export interface MarkjiChapter { id: string; deck_id: string; name: string; ... }
export interface MarkjiCard { id: string; content: string; grammar_version: number; ... }
export interface MarkjiFile { id: string; url: string; mime: string; ... }

// ===== 墨墨背单词 =====
export interface Vocabulary { id: string; spelling: string; }
export interface Interpretation { id: string; interpretation: string; tags: string[]; ... }
export interface Note { id: string; note_type: string; note: string; ... }
export interface Phrase { id: string; phrase: string; interpretation: string; ... }
export interface Notepad { id: string; title: string; content: string; ... }

// ===== 学习数据 =====
export interface StudyProgress { finished: number; total: number; study_time: number; }
export interface StudyTodayItem { voc_id: string; voc_spelling: string; order: number; ... }
export interface StudyRecord { voc_id: string; voc_spelling: string; next_study_date: string; ... }
```

---

## 11. 目录结构

```
MOMO_EnglishStudy/
├── momo-web/                          # 前端项目根目录
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── main.tsx                   # 应用入口
│   │   ├── App.tsx                    # 根组件 + 路由
│   │   ├── index.css                  # 全局样式 + Tailwind
│   │   │
│   │   ├── components/                # 组件目录
│   │   │   ├── ui/                    # 基础 UI 组件（shadcn/ui）
│   │   │   │   ├── button.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── select.tsx
│   │   │   │   └── ...
│   │   │   ├── react-bits/            # react-bits 组件（copy-paste）
│   │   │   │   ├── text/              # 文字动画
│   │   │   │   │   ├── BlurText.tsx
│   │   │   │   │   ├── CountUp.tsx
│   │   │   │   │   ├── GradientText.tsx
│   │   │   │   │   └── ...
│   │   │   │   ├── animations/        # 动画组件
│   │   │   │   │   ├── AnimatedContent.tsx
│   │   │   │   │   ├── ClickSpark.tsx
│   │   │   │   │   └── ...
│   │   │   │   ├── components/        # UI 组件
│   │   │   │   │   ├── TiltedCard.tsx
│   │   │   │   │   ├── Carousel.tsx
│   │   │   │   │   └── ...
│   │   │   │   └── backgrounds/       # 背景动画
│   │   │   │       ├── Aurora.tsx
│   │   │   │       ├── Particles.tsx
│   │   │   │       └── ...
│   │   │   ├── layout/                # 布局组件
│   │   │   │   ├── AppLayout.tsx      # 主布局（TopBar + SideNav）
│   │   │   │   ├── TopBar.tsx
│   │   │   │   ├── SideNav.tsx
│   │   │   │   └── MobileNav.tsx
│   │   │   ├── shared/                # 业务共享组件
│   │   │   │   ├── WordCard.tsx       # 单词卡片
│   │   │   │   ├── EmptyState.tsx     # 空状态
│   │   │   │   ├── ErrorState.tsx     # 错误状态
│   │   │   │   ├── LoadingSpinner.tsx
│   │   │   │   └── Pagination.tsx
│   │   │   ├── study/                 # 学习模块组件
│   │   │   │   ├── ProgressDashboard.tsx
│   │   │   │   ├── TodayWordList.tsx
│   │   │   │   ├── TodayWordCard.tsx
│   │   │   │   ├── StudyRecordTable.tsx
│   │   │   │   └── AddWordsFlow.tsx
│   │   │   ├── vocabulary/            # 单词模块组件
│   │   │   │   ├── SearchBar.tsx
│   │   │   │   ├── VocabularyResult.tsx
│   │   │   │   └── BatchQueryPanel.tsx
│   │   │   ├── content/               # 内容管理组件
│   │   │   │   ├── InterpretationEditor.tsx
│   │   │   │   ├── InterpretationList.tsx
│   │   │   │   ├── NoteEditor.tsx
│   │   │   │   ├── NoteList.tsx
│   │   │   │   ├── PhraseEditor.tsx
│   │   │   │   ├── PhraseList.tsx
│   │   │   │   ├── NotepadEditor.tsx
│   │   │   │   └── NotepadList.tsx
│   │   │   └── markji/                # 记忆卡模块组件
│   │   │       ├── DeckCard.tsx
│   │   │       ├── DeckGrid.tsx
│   │   │       ├── ChapterList.tsx
│   │   │       ├── CardEditor.tsx
│   │   │       ├── CardPreview.tsx
│   │   │       ├── MarkjiSyntaxToolbar.tsx
│   │   │       └── FileUploader.tsx
│   │   │
│   │   ├── pages/                     # 页面组件
│   │   │   ├── LoginPage.tsx
│   │   │   ├── study/
│   │   │   │   ├── StudyPage.tsx
│   │   │   │   ├── ProgressPage.tsx
│   │   │   │   ├── TodayItemsPage.tsx
│   │   │   │   ├── RecordsPage.tsx
│   │   │   │   └── AddWordsPage.tsx
│   │   │   ├── vocabulary/
│   │   │   │   ├── VocabularyPage.tsx
│   │   │   │   └── VocabularyDetailPage.tsx
│   │   │   ├── content/
│   │   │   │   ├── ContentPage.tsx
│   │   │   │   ├── InterpretationsPage.tsx
│   │   │   │   ├── NotesPage.tsx
│   │   │   │   ├── PhrasesPage.tsx
│   │   │   │   ├── NotepadsPage.tsx
│   │   │   │   └── NotepadDetailPage.tsx
│   │   │   ├── markji/
│   │   │   │   ├── MarkjiPage.tsx
│   │   │   │   ├── DecksPage.tsx
│   │   │   │   ├── DeckDetailPage.tsx
│   │   │   │   ├── ChapterDetailPage.tsx
│   │   │   │   └── CardEditorPage.tsx
│   │   │   └── SettingsPage.tsx
│   │   │   └── NotFoundPage.tsx          # 404 + 全局错误边界落点
│   │   │
│   │   ├── hooks/                     # 自定义 Hooks
│   │   │   ├── study/
│   │   │   │   ├── useStudyProgress.ts
│   │   │   │   ├── useTodayItems.ts
│   │   │   │   ├── useStudyRecords.ts
│   │   │   │   └── useAddWords.ts
│   │   │   ├── vocabulary/
│   │   │   │   ├── useVocabulary.ts
│   │   │   │   └── useBatchVocabulary.ts
│   │   │   ├── content/
│   │   │   │   ├── useInterpretations.ts
│   │   │   │   ├── useNotes.ts
│   │   │   │   ├── usePhrases.ts
│   │   │   │   └── useNotepads.ts
│   │   │   ├── markji/
│   │   │   │   ├── useFolders.ts
│   │   │   │   ├── useDecks.ts
│   │   │   │   ├── useChapters.ts
│   │   │   │   ├── useCards.ts
│   │   │   │   └── useFiles.ts
│   │   │   └── useAuth.ts
│   │   │
│   │   ├── services/                  # 服务层
│   │   │   └── api/
│   │   │       ├── client.ts          # HTTP Client
│   │   │       ├── studyApi.ts
│   │   │       ├── vocabularyApi.ts
│   │   │       ├── interpretationApi.ts
│   │   │       ├── noteApi.ts
│   │   │       ├── phraseApi.ts
│   │   │       ├── notepadApi.ts
│   │   │       └── markjiApi.ts
│   │   │
│   │   ├── stores/                    # Zustand 状态管理
│   │   │   ├── authStore.ts
│   │   │   ├── appStore.ts
│   │   │   └── settingsStore.ts
│   │   │
│   │   ├── types/                     # TypeScript 类型
│   │   │   ├── api.ts                 # API 请求/响应类型
│   │   │   ├── domain.ts              # 领域模型类型
│   │   │   └── common.ts              # 通用类型
│   │   │
│   │   ├── lib/                       # 工具库
│   │   │   ├── utils.ts               # cn() 等通用工具
│   │   │   ├── constants.ts           # 常量定义
│   │   │   ├── markji/                # Markji 语法工具
│   │   │   │   ├── syntax.ts          # 语法常量
│   │   │   │   ├── parser.ts          # 语法解析器
│   │   │   │   ├── validator.ts       # 语法验证器
│   │   │   │   └── snippets.ts        # 语法片段模板
│   │   │   # （Query keys 就近定义在各 hooks 文件中，见 §6.3，不再单独维护）
│   │   │
│   │   └── assets/                    # 静态资源
│   │       ├── icons/
│   │       └── images/
│   │
│   ├── server/                        # BFF 后端代理
│   │   ├── index.ts                   # Hono 服务入口
│   │   ├── middleware/
│   │   │   ├── auth.ts                # Token 认证中间件
│   │   │   ├── rateLimit.ts           # 频控中间件
│   │   │   └── cors.ts                # CORS 中间件
│   │   ├── routes/
│   │   │   ├── auth.ts                # 认证端点（§5.3.1）
│   │   │   └── proxy.ts               # API 代理路由
│   │   └── utils/
│   │       ├── crypto.ts              # Token 加解密
│   │       └── cache.ts               # 响应缓存
│   │
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── vite.config.ts
│   └── components.json                # shadcn/ui 配置
│
├── 墨墨开放api.md                      # API 文档
├── 墨墨OpenAPI 规范.md                 # OpenAPI 规范文档
└── momo_web.md                        # 本文档
```

### 11.1 开发代理与启动脚本

前端 `BASE_URL = '/api/v1'` 依赖开发代理指向 BFF；生产环境建议同域部署（BFF 静态托管前端产物）或反向代理 `/api`：

```jsonc
// vite.config.ts —— 开发环境将 /api 代理到 BFF（默认端口 8787）
export default defineConfig({
  server: {
    proxy: { '/api': { target: 'http://localhost:8787', changeOrigin: true } },
  },
});

// package.json scripts —— 前后端并行启动
{
  "scripts": {
    "dev": "concurrently \"npm:dev:web\" \"npm:dev:server\"",
    "dev:web": "vite",
    "dev:server": "tsx watch server/index.ts"
  }
}
```

---

## 12. 开发阶段规划

### 阶段一：基础搭建（Week 1）

| 任务 | 说明 |
|------|------|
| 项目初始化 | Vite + React + TS + Tailwind v3.4（钉住） |
| **设计令牌先行** | 色彩/字体/间距/圆角/动效 tokens（CSS 变量，双主题），避免后期返工 — 详见《前端设计文档》 |
| BFF 搭建 | Hono 服务 + 认证端点（§5.3.1）+ 频控 + 代理路由 |
| HTTP Client | 封装 fetch（含 upload），统一错误处理 |
| 类型定义 | 基于 OpenAPI 规范生成全部 TS 类型（推荐 `openapi-typescript` 从 `api_bundle.yaml` 生成，避免手写漂移） |
| 路由框架 | React Router 配置 + 布局组件 |
| 登录页 | Token 输入 + 验证 + 存储 |

### 阶段二：学习中心（Week 2）

| 任务 | 说明 |
|------|------|
| 今日进度页 | MagicBento 仪表盘 + CountUp 动画 |
| 今日单词页 | AnimatedList + Stack 翻卡模式 |
| 学习记录页 | 表格 + 日期筛选 + 统计模式 |
| 添加单词页 | 搜索 → 确认 → 添加流程 (Stepper) |
| 提前复习 | 单词选择 + 批量操作 |

### 阶段三：单词与内容管理（Week 3）

| 任务 | 说明 |
|------|------|
| 单词搜索页 | 搜索 + 结果展示 (TiltedCard) |
| 释义管理 | 列表 + 创建/编辑/删除 (FluidGlass 弹窗) |
| 助记管理 | 列表 + 创建/编辑/删除 |
| 例句管理 | 列表 + 创建/编辑/删除 |
| 云词本管理 | 列表 + 编辑器（章节/文本模式） |

### 阶段四：记忆卡模块（Week 4）

| 任务 | 说明 |
|------|------|
| 牌组浏览 | TiltedCard 网格 + 分页 + 筛选 |
| 牌组详情 | 牌组信息 + 章节列表 |
| 章节详情 | 卡片列表 + 增量更新 |
| 卡片编辑器 | 代码编辑 + 实时预览 + 语法工具栏 |
| 文件上传 | 拖拽上传 + 文件查询 |

### 阶段五：打磨与优化（Week 5）

| 任务 | 说明 |
|------|------|
| PWA 配置 | Service Worker + 离线缓存 |
| 深色模式 | 主题切换 + 全局色彩系统 |
| 动画优化 | 页面过渡 + 滚动动画 + 微交互 |
| 性能优化 | 代码分割 + 懒加载 + 图片优化 |
| 响应式适配 | 移动端 / 平板 / 桌面端 |
| 错误处理 | 全局错误边界 + 友好提示 |

---

## 13. 关键技术决策

### 13.1 为什么选择 Zustand 而非 Redux

| 维度 | Zustand | Redux Toolkit |
|------|---------|---------------|
| 包体积 | ~1KB | ~14KB |
| 模板代码 | 极少 | 较多 |
| TypeScript | 原生友好 | 需要额外配置 |
| 学习成本 | 低 | 中 |
| 适用场景 | 中小型应用 | 大型复杂应用 |

墨墨 Web 版状态相对简单（主要是 UI 状态 + 用户配置），服务器数据由 TanStack Query 管理，Zustand 足够。

### 13.2 为什么选择 TanStack Query

- **自动缓存**：单词查询、牌组信息等可缓存，减少 API 调用
- **乐观更新**：创建/编辑/删除操作可立即更新 UI
- **自动重试**：网络波动时自动重试
- **轮询刷新**：学习进度可定时刷新
- **请求去重**：相同请求自动去重

### 13.3 为什么选择 Hono 作为 BFF

- **轻量**：零依赖核心，启动快
- **TypeScript 原生**：端到端类型安全
- **边缘兼容**：可部署到 Cloudflare Workers / Vercel Edge
- **中间件生态**：CORS、限流等中间件开箱即用

### 13.4 为什么使用 copy-paste 模式而非 npm 包

react-bits 采用 shadcn/ui 的 copy-paste 哲学：

- **完全可控**：组件代码在项目内，可自由修改
- **无版本锁定**：不依赖外部包版本
- **按需使用**：只引入需要的组件，零冗余
- **类型安全**：TypeScript 代码直接可用

### 13.5 Markji 语法编辑器方案

卡片编辑器是记忆卡模块的核心，需要支持 Markji 语法的编辑和预览：

```
编辑器方案：Monaco Editor / CodeMirror 6
├── 语法高亮：自定义 Markji 语法规则
├── 代码补全：标签名、参数名自动补全
├── 实时预览：右侧面板实时渲染卡片效果
├── 语法验证：输入时检查格式错误
└── 工具栏：快捷插入标签模板
```

推荐 **CodeMirror 6**：
- 比 Monaco 更轻量（~130KB vs ~5MB）
- 移动端友好
- 支持自定义语法高亮和补全
- 可扩展性强

---

## 14. 安全与合规

### 14.1 Token 安全

| 措施 | 说明 |
|------|------|
| HTTP-only Cookie | Token 存储在 HTTP-only Cookie 中，JS 无法读取 |
| 加密传输 | BFF 与墨墨 API 之间使用 HTTPS |
| 不持久化明文 | BFF 内存中不保存明文 Token，每次从 Cookie 解密 |
| Token 过期 | Cookie 设置合理过期时间（如 7 天） |
| 清除功能 | 设置页提供"退出登录"清除 Token |

### 14.2 请求安全

| 措施 | 说明 |
|------|------|
| CORS 白名单 | BFF 只允许前端域名跨域请求 |
| 请求频率限制 | BFF 实现墨墨 API 的频控策略 |
| 输入校验 | BFF 对请求参数进行基本校验 |
| HTTPS 强制 | 生产环境强制 HTTPS |

### 14.3 数据隐私

- 不收集用户数据，所有数据在用户浏览器和墨墨服务器之间流转
- BFF 不记录请求日志（或仅记录错误日志）
- 不使用第三方分析工具（或使用隐私友好的方案）

---

## 15. 性能优化策略

### 15.1 加载性能

| 策略 | 实现 |
|------|------|
| 路由级代码分割 | `React.lazy()` + `Suspense` |
| 组件级懒加载 | react-bits 背景动画按需加载 |
| 图片优化 | WebP 格式 + 懒加载 + 响应式图片 |
| 字体优化 | `font-display: swap` + 预加载 |
| 预连接 | `<link rel="preconnect" href="https://open.maimemo.com">` |

### 15.2 运行时性能

| 策略 | 实现 |
|------|------|
| 虚拟列表 | 今日单词、学习记录等长列表使用 `@tanstack/react-virtual` |
| 请求缓存 | TanStack Query 自动缓存 + stale-while-revalidate |
| 防抖节流 | 搜索输入防抖，滚动事件节流 |
| 动画优化 | `will-change` + `transform` 硬件加速 |
| 分页加载 | 牌组列表 offset 分页；学习记录按 `next_study_date` 日期范围分段加载（API 无 offset 参数，见附录 D） |

### 15.3 缓存策略

| 数据类型 | 缓存策略 | 过期时间 |
|----------|----------|----------|
| 单词查询 | TanStack Query 缓存 | 24 小时 |
| 牌组列表 | TanStack Query 缓存 | 5 分钟 |
| 学习进度 | 轮询刷新 | 30 秒 |
| 文件 URL | BFF 缓存 | 跟随 expire_time |
| 静态资源 | Service Worker | 永久（版本控制） |

---

## 附录

### A. react-bits 组件完整清单

#### TextAnimations（31 个）
ASCIIText, BlurText, CircularText, CountUp, CurvedLoop, DecryptedText, DepthText, EchoText, FallingText, FoldText, FuzzyText, GlitchText, GradientText, MaskedHeading, ParticleText, RotatingText, ScrambledText, ScrollFloat, ScrollReveal, ScrollVelocity, ShinyText, Shuffle, SplitFlapText, SplitText, StrokeText, TextCursor, TextLoop, TextPressure, TextType, TrueFocus, VariableProximity, WarpText

#### Animations（35 个）
AnimatedContent, Antigravity, BlobCursor, ClickSpark, Crosshair, Cubes, CursorGrid, ElasticMesh, ElectricBorder, FadeContent, GhostCursor, GlareHover, GradualBlur, HalftoneReveal, ImageTrail, LaserFlow, LogoLoop, MagicRings, Magnet, MagnetLines, MetaBalls, MetallicPaint, Noise, OrbitImages, PixelTrail, PixelTransition, Ribbons, RippleDistortion, ScrollExpand, ShapeBlur, SplashCursor, StarBorder, StickerPeel, Strands, SwarmCursor, TargetCursor

#### Components（42 个）
AccordionGallery, AnimatedList, BorderGlow, BounceCards, BubbleMenu, CardNav, CardSwap, Carousel, ChromaGrid, CircularGallery, Counter, CurvedInput, DecayCard, DepthCarousel, Dock, DomeGallery, DriftWall, ElasticSlider, FlowingMenu, FluidGlass, FlyingPosters, Folder, GlassIcons, GlassSurface, GooeyNav, InfiniteMenu, Lanyard, LineSidebar, MagicBento, Masonry, ModelViewer, MorphSlider, OptionWheel, PillNav, PixelCard, ProfileCard, ReflectiveCard, ScrollStack, SpecularButton, SpotlightCard, Stack, StaggeredMenu, Stepper, TiltedCard

#### Backgrounds（51 个）
AcidSquares, Aurora, Balatro, Ballpit, Beams, ColorBends, DarkVeil, Dither, DotField, DotGrid, EvilEye, FaultyTerminal, Ferrofluid, FloatingLines, Galaxy, GradientBlinds, GradientWaves, Grainient, GridDistortion, GridMotion, GridScan, Hyperspeed, Iridescence, LetterGlitch, LightPillar, LightRays, LightTunnel, Lightfall, Lightning, LineWaves, LiquidChrome, LiquidEther, MoltenMetal, Orb, Particles, PixelBlast, PixelSnow, Plasma, PlasmaWave, Prism, PrismaticBurst, Radar, RippleGrid, Scanner, ShapeGrid, SideRays, Silk, SlicedWaves, SoftAurora, Threads, Topography, Waves, WebThreads

### B. API 频控参考

| 窗口 | 背单词 | 记忆卡 |
|------|--------|--------|
| 10 秒 | 20 次 | 20 次 |
| 60 秒 | 40 次 | 40 次 |
| 5 小时 | 2000 次 | 8000 次 |

### C. 依赖清单

> 以下为版本基线（2026-08），实际以项目初始化时的最新稳定版为准；Tailwind 除外，钉住 v3.4。

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^7.6.0",
    "zustand": "^5.0.0",
    "@tanstack/react-query": "^5.51.0",
    "@tanstack/react-virtual": "^3.8.0",
    "framer-motion": "^11.3.0",
    "motion": "^12.0.0",
    "lucide-react": "^0.460.0",
    "recharts": "^2.12.0",
    "react-hook-form": "^7.52.0",
    "zod": "^3.23.0",
    "@hookform/resolvers": "^3.9.0",
    "hono": "^4.6.0",
    "@hono/node-server": "^1.13.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.4.0",
    "class-variance-authority": "^0.7.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "vite": "^7.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "tailwindcss": "^3.4.14",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "vitest": "^2.0.0",
    "@testing-library/react": "^16.0.0",
    "vite-plugin-pwa": "^0.20.0",
    "concurrently": "^9.0.0",
    "tsx": "^4.19.0",
    "openapi-typescript": "^7.4.0"
  }
}
```

### D. 已知 API 限制与前端对策

| 限制 | 影响 | 对策 |
|------|------|------|
| 学习数据接口为公测 | 可能不可用 / 数据不准 | 空态 +「去 App 开启自动同步」引导；接口异常时学习中心降级为功能入口页 |
| 当日未打开 App 初始化 | `total` / `finished` 不准确 | 进度页展示数据可信度提示与刷新时间 |
| `advance_study` 需 10 级解锁 | 部分用户不可用 | 优先引导「添加单词 + `advance=true`」（无等级限制） |
| `query_study_records` 无 `offset` 参数 | 无法传统分页 | 按日期范围分段查询（周 / 月视图切换） |
| `study_time` 单位为毫秒 | 展示需换算 | 统一 `formatDuration()` 工具函数 |
| `StudyRecord.tags` 规范标注为 `string` | 类型存疑（可能为逗号分隔串） | 初版按 `string` 处理，实测后修正类型定义 |
| 频控 5h/2000 次（memo） | 轮询消耗预算 | 进度轮询 60s 且仅页面可见时生效 |
| 更新卡片端点路径参数命名不一致（`{deck_id}/{card_id}`） | 易写错 | 在 `markjiApi.updateCard` 内封装，业务层不感知 |

---

## 16. 修订记录

### v1.1（2026-08-05）

1. **P0 修正**：统一 Token 存储方案 —— Token 仅存 HTTP-only Cookie，前端 store 只保留 `isAuthenticated` 布尔标志（原 §6.1/§6.2 与 §5.3/§14.1 相互矛盾）。
2. **P1 补齐**：新增 BFF 认证端点设计（§5.3.1）；Vite 开发代理与前后端并行启动脚本（§11.1）；`apiClient.upload()` 与统一错误格式约定（§10.1）。
3. **P1 修正**：学习记录「分页加载」改为按日期范围分段加载（该 API 无 `offset` 参数）；功能清单标注公测接口提示与提前复习 10 级限制。
4. **P2 更新**：依赖版本基线升级（Vite 7 / React Router 7 / Zustand 5 等）；Tailwind 钉住 v3.4 并说明 v4 迁移风险；补充 `framer-motion` → `motion` 更名说明。
5. **P2 完善**：react-bits 安装方式补充 URL / jsrepo 等价写法与注意事项；路由树补充 404 与编辑器参数态；目录结构调整（queryKeys 就近、新增 `auth.ts` / `NotFoundPage`）；阶段一新增「设计令牌先行」任务；新增附录 D（已知 API 限制与对策）。
6. **说明**：经核对官网，`@react-bits/<Component>-TS-TW` 命名空间安装方式本身有效，予以保留并补充备选写法。
