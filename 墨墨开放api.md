# 墨墨开放 API

> **版本**：v1  
> **规范版本**：OpenAPI 3.1.0  
> **官方文档**：<https://open.maimemo.com/#/>  
> **API 规范文件**：<https://open.maimemo.com/api_bundle.yaml>

> ⚠️ **实测补充（2026-08-05）**：与官方 yaml 规范对照实测后发现以下文档未覆盖的差异：
> 1. **响应包裹层**：所有响应（含错误）实际均为 `{"errors": [...], "data": ..., "success": bool}`，业务数据在 `data` 字段内。错误时 `errors` 是 `[{code, msg, info}]`，注意错误字段名为 **`msg`（非 `message`）**，且 `info` 提供额外上下文（如 `markji plus required`）。
> 2. **voc_id 格式**：实际返回的单词 ID 为 `voc-` 前缀长串（如 `voc-NW1blNKzzFyi1vH_p2ifRDQ8uk1KpbWMSoGR5lYqFzswoZm8mLro6dOunsfy3MP-`），与文档示例 `5a7BFf4F...` 不同。
> 3. **云词本 limit 上限**：`GET /notepads` 的 `limit` 参数最大为 **10**（超限返回 400 `property 'limit' must be <= 10`）。
> 4. **记忆卡权限**：Markji 相关端点需要单独开通 **Markji Plus** 权限，未开通返回 403 `common_permission_denied`（`info: markji plus required`）。背单词 Token 不自动含记忆卡权限。
> 5. **写权限（POST/DELETE）**：content、notepad、cloud、interpreation/note/phrase/study add_words 等写接口同样受 Token 权限范围限制（实测返回 `common_permission_denied`，无明确 `info`），浏览器侧需将此类错误友好提示。

---

## 目录

- [概述](#概述)
- [认证方式](#认证方式)
- [服务地址](#服务地址)
- [请求频控](#请求频控)
- [API 分类总览](#api-分类总览)
- [墨墨记忆卡（Markji）端点](#墨墨记忆卡markji端点)
- [墨墨背单词（Memo）端点](#墨墨背单词memo端点)
- [墨墨记忆卡制卡指南](#墨墨记忆卡制卡指南)

---

## 概述

墨墨开放 API 是墨墨背单词与墨墨记忆卡（Markji）对外开放的接口服务，允许第三方应用通过 HTTP 请求操作用户的单词学习数据、释义、助记、例句、云词本、记忆卡牌组及卡片等内容。

API 覆盖两大产品线：

| 产品 | 说明 |
|------|------|
| **墨墨背单词**（Memo） | 提供单词查询、释义管理、助记管理、例句管理、云词本管理及学习数据（公测）接口 |
| **墨墨记忆卡**（Markji） | 提供牌组、章节、卡片、文件夹及文件管理接口 |

---

## 认证方式

API 采用 **OAuth 2.0** 身份认证。所有请求均需在 Header 中携带 Bearer Token：

```
Authorization: Bearer <your_token>
```

### 获取 Token

有两种方式获取请求凭证：

1. **通过墨墨背单词 App**：我的 → 更多设置 → 实验功能 → 开放 API
2. **在线获取**：点击 <https://open.maimemo.com/open/api/v1/tokens/openapi>

### 请求示例

```bash
curl --request GET \
  --url https://open.maimemo.com/open/api/v1/phrases \
  --header 'Accept: application/json' \
  --header 'Authorization: Bearer xxx'
```

> **注意**：官方文档中 Header 写法为 `Authorization: Beraer XXX`，实际应为 `Bearer`。

---

## 服务地址

| 环境 | URL |
|------|-----|
| 生产服务 | `https://open.maimemo.com/open` |
| 测试服务 | `https://open-dev.maimemo.com/open` |

所有 API 路径前缀为 `/api/v1/`，完整请求 URL = 服务地址 + API 路径。  
例如：`https://open.maimemo.com/open/api/v1/memo/phrases`

---

## 请求频控

| 时间窗口 | 限制次数 |
|----------|----------|
| 10 秒 | 20 次 |
| 60 秒 | 40 次 |
| 5 小时 | 2000 次（墨墨背单词） |
| 5 小时 | 8000 次（墨墨记忆卡） |

---

## API 分类总览

### 墨墨记忆卡（Markji）— 内容管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/markji/decks/folders` | 获取文件夹列表 |
| GET | `/api/v1/markji/decks` | 获取我的牌组列表 |
| GET | `/api/v1/markji/decks/{deck}` | 获取牌组信息 |
| GET | `/api/v1/markji/decks/{deck}/chapters` | 获取牌组章节 |
| GET | `/api/v1/markji/decks/{deck}/chapters/{chapter}` | 获取指定章节 |
| GET | `/api/v1/markji/decks/{deck}/cards/{card}` | 获取卡片 |
| POST | `/api/v1/markji/decks/{deck}/chapters/{chapter}/cards` | 新建卡片 |
| POST | `/api/v1/markji/decks/{deck_id}/cards/{card_id}` | 更新卡片 |
| POST | `/api/v1/markji/files` | 上传文件 |
| POST | `/api/v1/markji/files/query` | 查询文件 |

### 墨墨背单词（Memo）— 释义管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/memo/interpretations` | 获取释义（需 voc_id） |
| POST | `/api/v1/memo/interpretations` | 创建释义 |
| POST | `/api/v1/memo/interpretations/{id}` | 更新释义 |
| DELETE | `/api/v1/memo/interpretations/{id}` | 删除释义 |

### 墨墨背单词（Memo）— 助记管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/memo/notes` | 获取助记（需 voc_id） |
| POST | `/api/v1/memo/notes` | 创建助记 |
| POST | `/api/v1/memo/notes/{id}` | 更新助记 |
| DELETE | `/api/v1/memo/notes/{id}` | 删除助记 |

### 墨墨背单词（Memo）— 例句管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/memo/phrases` | 获取例句（需 voc_id） |
| POST | `/api/v1/memo/phrases` | 创建例句 |
| POST | `/api/v1/memo/phrases/{id}` | 更新例句 |
| DELETE | `/api/v1/memo/phrases/{id}` | 删除例句 |

### 墨墨背单词（Memo）— 云词本管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/memo/notepads` | 查询云词本列表 |
| POST | `/api/v1/memo/notepads` | 创建云词本 |
| GET | `/api/v1/memo/notepads/{id}` | 获取云词本详情 |
| POST | `/api/v1/memo/notepads/{id}` | 更新云词本 |
| DELETE | `/api/v1/memo/notepads/{id}` | 删除云词本 |

### 墨墨背单词（Memo）— 单词查询

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/memo/vocabulary` | 获取单个单词（需 spelling） |
| POST | `/api/v1/memo/vocabulary/query` | 批量查询单词（按拼写或 ID，最多 1000） |

### 墨墨背单词（Memo）— 学习数据（公测）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/memo/study/get_study_progress` | 获取今日学习进度 |
| POST | `/api/v1/memo/study/get_today_items` | 获取今日学习单词 |
| POST | `/api/v1/memo/study/query_study_records` | 查询学习记录 |
| POST | `/api/v1/memo/study/add_words` | 添加单词 |
| POST | `/api/v1/memo/study/advance_study` | 提前复习 |

> **公测说明**：学习数据接口在公测期间不保证可用性，可能随时调整，需在 App 中开启自动同步。当日未打开 App 进行初始化则无法准确计算。

---

## 墨墨记忆卡（Markji）端点

### 获取文件夹列表

```
GET /api/v1/markji/decks/folders
```

**响应**：返回 `folders` 数组，每个元素为 `MarkjiFolder` 对象（包含 id、items、name）。

---

### 获取我的牌组列表

```
GET /api/v1/markji/decks
```

**查询参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `offset` | integer | 否 | 偏移量 |
| `limit` | integer | 否 | 每页数量 |
| `folder_id` | string | 否 | 文件夹 OpenAPI ID |
| `source` | MarkjiSource | 否 | 牌组来源（`SELF` 自建 / `FORK` 派生） |

**响应**：返回 `decks` 数组（`MarkjiDeck`）和 `total` 总数。

---

### 获取牌组信息

```
GET /api/v1/markji/decks/{deck}
```

**路径参数**：`deck` — 牌组 OpenAPI ID  
**查询参数**：`with_root`（boolean）— 是否返回根牌组信息

**响应**：返回 `deck` 对象（`MarkjiDeck`）。

---

### 获取牌组章节

```
GET /api/v1/markji/decks/{deck}/chapters
```

**查询参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| `updated_time` | ISODate | 只返回更新时间晚于该时间的章节 |
| `with_cards` | boolean | 是否同时返回章节内卡片 |

**响应**：返回 `chapterset`（`MarkjiChapterset`）、`chapters` 数组（`MarkjiChapter`）、`cards` 数组（`MarkjiCard`）。

---

### 获取指定章节

```
GET /api/v1/markji/decks/{deck}/chapters/{chapter}
```

**路径参数**：`deck`、`chapter`  
**查询参数**：`with_cards`（boolean）、`updated_time`（ISODate）

**响应**：返回 `chapterset`、`chapter`、`cards`。

---

### 获取卡片

```
GET /api/v1/markji/decks/{deck}/cards/{card}
```

**路径参数**：`deck`、`card`

**响应**：返回 `card` 对象（`MarkjiCard`）。

---

### 新建卡片

```
POST /api/v1/markji/decks/{deck}/chapters/{chapter}/cards
```

**请求体**：

```json
{
  "deck": "牌组ID",
  "chapter": "章节ID",
  "card": {
    "content": "卡片内容（Markji 语法）",
    "grammar_version": 1
  },
  "order": 0
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `deck` | string | 是 | 牌组 OpenAPI ID |
| `chapter` | string | 是 | 章节 OpenAPI ID |
| `card.content` | string | 是 | 卡片内容 |
| `card.grammar_version` | integer | 是 | 语法版本 |
| `order` | integer | 否 | 插入位置，不传则追加到章节末尾 |

**响应**：返回 `card`（`MarkjiCard`）和 `chapter`（`MarkjiChapter`）。

---

### 更新卡片

```
POST /api/v1/markji/decks/{deck_id}/cards/{card_id}
```

**请求体**：

```json
{
  "deck_id": "牌组ID",
  "card_id": "卡片ID",
  "card": {
    "content": "更新后的卡片内容",
    "grammar_version": 1
  }
}
```

**响应**：返回更新后的 `card`（`MarkjiCard`）。

---

### 上传文件

```
POST /api/v1/markji/files
```

**请求体**（multipart/form-data）：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `deck_id` | string | 否 | 牌组 OpenAPI ID，指定后按牌组编辑权限归属文件 |
| `file` | file | 是 | 文件字段，字段名为 `file` |

**响应**：返回 `file` 对象（`MarkjiFile`，包含 id、url、mime、size、info、expire_time）。

---

### 查询文件

```
POST /api/v1/markji/files/query
```

**请求体**：

```json
{
  "ids": ["文件ID1", "文件ID2"],
  "expires": 2592000
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `ids` | string[] | 是 | 文件 OpenAPI ID 列表 |
| `expires` | integer | 否 | 文件外链有效期，默认 30 天，单位秒 |

**响应**：返回 `files` 数组（`MarkjiFile`）。

---

## 墨墨背单词（Memo）端点

### 释义管理

#### 获取释义

```
GET /api/v1/memo/interpretations?voc_id={voc_id}
```

获取单词下自己创建的释义。

**查询参数**：`voc_id`（string，必填）— 单词 ID

**响应**：返回 `interpretations` 数组（`Interpretation`）。

#### 创建释义

```
POST /api/v1/memo/interpretations
```

**请求体**：

```json
{
  "interpretation": {
    "voc_id": "5a7BFf4F63612e5AD9fdebB7a50D3881",
    "interpretation": "n. 苹果",
    "tags": ["考研"],
    "status": "PUBLISHED"
  }
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `voc_id` | string | 是 | 单词 ID |
| `interpretation` | string | 是 | 释义内容 |
| `tags` | string[] | 是 | 标签列表 |
| `status` | InterpretationStatus | 是 | 状态（`PUBLISHED` / `UNPUBLISHED` / `DELETED`） |

#### 更新释义

```
POST /api/v1/memo/interpretations/{id}
```

**路径参数**：`id` — 释义 ID  
**请求体**：`interpretation`（含 interpretation、tags、status）、`id`

#### 删除释义

```
DELETE /api/v1/memo/interpretations/{id}
```

---

### 助记管理

#### 获取助记

```
GET /api/v1/memo/notes?voc_id={voc_id}
```

获取单词下自己创建的助记。

**查询参数**：`voc_id`（string，必填）

#### 创建助记

```
POST /api/v1/memo/notes
```

**请求体**：

```json
{
  "note": {
    "voc_id": "5a7BFf4F63612e5AD9fdebB7a50D3881",
    "note_type": "谐音.",
    "note": "apple"
  }
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `voc_id` | string | 是 | 单词 ID |
| `note_type` | string | 是 | 助记类型（如"谐音."） |
| `note` | string | 是 | 助记内容 |

#### 更新助记

```
POST /api/v1/memo/notes/{id}
```

#### 删除助记

```
DELETE /api/v1/memo/notes/{id}
```

---

### 例句管理

#### 获取例句

```
GET /api/v1/memo/phrases?voc_id={voc_id}
```

获取单词下自己创建的例句。

#### 创建例句

```
POST /api/v1/memo/phrases
```

**请求体**：

```json
{
  "phrase": {
    "voc_id": "5a7BFf4F63612e5AD9fdebB7a50D3881",
    "phrase": "This is an apple.",
    "interpretation": "这是一个苹果。",
    "tags": ["考研"],
    "origin": "考研"
  }
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `voc_id` | string | 是 | 单词 ID |
| `phrase` | string | 是 | 例句内容 |
| `interpretation` | string | 是 | 翻译 |
| `tags` | string[] | 是 | 标签列表 |
| `origin` | string | 是 | 来源 |

#### 更新例句

```
POST /api/v1/memo/phrases/{id}
```

#### 删除例句

```
DELETE /api/v1/memo/phrases/{id}
```

---

### 云词本管理

#### 查询云词本列表

```
GET /api/v1/memo/notepads
```

**查询参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `limit` | integer | 否 | 查询数量，默认 10 |
| `offset` | integer | 否 | 查询跳过，默认 0 |
| `ids` | string[] | 否 | 词本 ID 列表 |

**响应**：返回 `notepads` 数组（`BriefNotepad`）。

#### 创建云词本

```
POST /api/v1/memo/notepads
```

**请求体**：

```json
{
  "notepad": {
    "status": "PUBLISHED",
    "content": "apple",
    "title": "常用词汇",
    "brief": "常用",
    "tags": ["考研"]
  }
}
```

**内容格式说明**：
- **章节模式**：以 `#` 开头，井号后是章节名称，下方是该章节的单词列表，一行一个
- **文本模式**：不以 `#` 开头，不限格式，会识别尽量多的单词和短语，开头添加 `//` 则还原单词原型后再提取

#### 获取云词本

```
GET /api/v1/memo/notepads/{id}
```

#### 更新云词本

```
POST /api/v1/memo/notepads/{id}
```

#### 删除云词本

```
DELETE /api/v1/memo/notepads/{id}
```

---

### 单词查询

#### 获取单个单词

```
GET /api/v1/memo/vocabulary?spelling={spelling}
```

**查询参数**：`spelling`（string，必填）— 单词拼写

**响应**：返回 `voc` 对象（`Vocabulary`，含 id 和 spelling）。

#### 批量查询单词

```
POST /api/v1/memo/vocabulary/query
```

**请求体**：

```json
{
  "spellings": ["hello", "world"],
  "ids": ["id1", "id2"]
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `spellings` | string[] | 根据拼写查询，最多 1000 |
| `ids` | string[] | 根据ID查询，最多 1000 |

> **注意**：查询条件互斥，只能生效一个。

**响应**：返回 `voc` 数组（`Vocabulary`）。

---

### 学习数据（公测）

#### 获取今日学习进度

```
POST /api/v1/memo/study/get_study_progress
```

无请求体。

**响应**：

```json
{
  "progress": {
    "finished": 10,
    "total": 20,
    "study_time": 114514
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `finished` | integer | 已完成的单词数 |
| `total` | integer | 今日应完成的单词数 |
| `study_time` | integer | 今日学习时长（毫秒） |

> 当日未打开 App 进行初始化则无法准确计算总数。

#### 获取今日学习单词

```
POST /api/v1/memo/study/get_today_items
```

**请求体**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `is_finished` | boolean | 筛选是否已完成 |
| `is_new` | boolean | 筛选是否新学单词 |
| `voc_ids` | string[] | 根据单词 ID 列表查询，最多 1000，忽略其他条件 |
| `spellings` | string[] | 根据单词拼写列表查询，最多 1000，忽略其他条件，不可与 voc_ids 同时使用 |
| `limit` | integer | 最多获取前 1000 条，默认 50 |

**响应**：返回 `today_items` 数组（`StudyTodayItem`，含 voc_id、voc_spelling、order、first_response、is_new、is_finished）。

#### 查询学习记录

```
POST /api/v1/memo/study/query_study_records
```

**请求体**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `next_study_date` | object | 根据下次学习日期筛选（含 `start` 和 `end`，ISODate，北京时区） |
| `voc_ids` | string[] | 根据单词 ID 筛选，忽略其他条件 |
| `spellings` | string[] | 根据拼写列表查询，最多 1000，忽略其他条件，不可与 voc_ids 同时使用 |
| `as_count` | boolean | 仅计算结果总数，不返回数据列表 |
| `limit` | integer | 最多获取前 1000 条，默认 50 |

**响应**：

```json
{
  "records": [...],
  "count": 114514
}
```

> 当 `as_count=true` 时，`records` 为空，仅返回 `count`。

**查询场景举例**：
- 获取规划总量：`as_count=true`
- 获取未来某天要背的单词数：`next_study_date: {end: "2026-04-01T00:00:00+08:00"}, as_count=true`
- 获取未来某天要背的单词列表：`next_study_date: {end: "2026-04-01T00:00:00+08:00"}`

#### 添加单词

```
POST /api/v1/memo/study/add_words
```

**请求体**：

```json
{
  "words": [
    { "id": "id1" },
    { "id": "id2" }
  ],
  "advance": false
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `words` | array | 是 | 单词列表，最多一次添加 1000 个，每项含 `id` |
| `advance` | boolean | 是 | 是否一并提前复习，无等级限制 |

**响应**：返回 `added_count`（成功添加的数量，单词上限不足或已添加过会影响数量）。

#### 提前复习

```
POST /api/v1/memo/study/advance_study
```

**请求体**：

```json
{
  "voc_ids": ["id1", "id2"]
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `voc_ids` | string[] | 是 | 单词 ID 列表，最多 1000 |

**响应**：返回 `advanced_count`（成功提前的数量，单词未加入会影响数量）。

> 需要升级到 10 级解锁提前复习功能。

---

## 墨墨记忆卡制卡指南

Markji 也称"墨墨记忆卡"。本节用于编写可直接粘贴到 Markji 中的内容。普通文字可以直接输入；需要挖空、样式、选择题、公式或媒体时，再使用对应语法。

### 基本结构

```
[名称#参数1,参数2#内容]
```

### 核心约束

1. 标签和参数**区分大小写**。必须写成 `T`、`P`、`F`、`Choice`、`Pic`、`Audio`、`Card`、`E` 等规定形式。
2. `#` 分隔名称、参数和内容。没有参数时也要保留两个 `#`，例如 `[E##x+y]`、`[Choice##...]`。
3. 多个参数使用英文逗号 `,` 分隔；标签名、参数和分隔符之间不要加空格。
4. 每个语法都必须有未被转义的右中括号 `]` 作为结尾。
5. 普通换行会产生新段落。块级语法应从一行的开头开始。
6. 除明确允许的位置外，不要嵌套语法。
7. 文字内容里需要显示普通中括号时，写成 `\[` 和 `\]`。
8. 不要依赖错误语法被自动修复；无法确认时使用纯文本。

### 行内语法

#### 文字样式 `[T#参数#文字]`

| 参数 | 效果 | 示例 |
|------|------|------|
| `B` | 加粗 | `[T#B#重点]` |
| `I` | 斜体 | `[T#I#术语]` |
| `U` | 下划线 | `[T#U#关键词]` |
| `!rrggbb` | 文字颜色 | `[T#!e53935#红色文字]` |
| `!!rrggbb` | 背景颜色 | `[T#!!fff59d#高亮文字]` |
| `up` | 上标 | `x[T#up#2]` |
| `down` | 下标 | `H[T#down#2]O` |
| `link/"网址"` | 超链接 | `[T#link/"https://markji.com"#访问网站]` |

组合示例：`[T#B,U,!e53935#红色加粗下划线]`

**约束**：
- 颜色必须是 6 位小写十六进制字符，不要带 `#`
- `up` 和 `down` 不要同时使用
- 链接网址必须放在英文双引号中
- 样式内容中不要再放其他语法

#### 挖空 `[F#编号#要隐藏的内容]`

```
光合作用主要发生在[F#1#叶绿体]中。
```

- 编号从 `1` 开始的正整数
- 相同编号属于同一组（一起显示/隐藏）
- 挖空内容中不要嵌套其他语法

#### 音频 `[Audio#ID/音频ID#显示文字]`

| 参数 | 含义 |
|------|------|
| `ID/音频ID` | 指定已有音频 |
| `M` | 手动播放 |
| `A` | 自动播放（不写 `M` 时默认） |
| `D` | 播放行为跟随用户设置 |

示例：`[Audio#M,ID/audio123#点击播放发音]`

#### 卡片引用 `[Card#ID/卡片ID#显示文字]`

关联多张卡片用 `-` 分隔：`[Card#ID/abc123-def456#查看相关卡片]`

### 块级语法

#### 段落样式 `[P#参数#段落内容]`

| 参数 | 效果 |
|------|------|
| `H1` | 标题 |
| `L` | 无序列表 |
| `I<n>` | 缩进级别 |
| `left` | 左对齐 |
| `center` | 居中 |
| `right` | 右对齐 |

示例：`[P#H1,center#细胞呼吸]`

#### 选择题

```
[Choice#参数#
* 正确选项
- 错误选项
]
```

| 参数 | 含义 |
|------|------|
| `fixed` | 保持选项顺序；省略时默认随机排列 |
| `multi` | 多选题 |

- `* ` 表示正确选项，`- ` 表示错误选项（符号后有一个空格）
- 多个正确选项必须加 `multi`
- 选项内只使用普通文字和 `[T#...#...]` 文字样式

#### 图片与画廊

```
[Pic#ID/图片ID#]              # 单张图片
[Pic#ID/图片ID,MID/遮罩ID#]   # 带遮罩
```

相邻不换行的多张图片组成画廊，换行则形成独立图片区块。

#### 独立公式

```
[E##E=mc^2]
```

#### 答案分隔线

```
---
```

三个半角连字符，单独占一行，用于分隔问题和答案。

### 嵌套规则

| 容器 | 可放入的语法 |
|------|-------------|
| 普通段落 | `T`、`F`、`Audio`、`Card` |
| `P` 段落 | `T`、`F`、`Audio`、`Card` |
| `Choice` 选项 | 仅 `T` |
| `T` / `F` / `Audio` / `Card` 内容 | 不放其他语法 |
| `Pic` | 内容必须为空 |
| `E` 公式 | 只写公式内容 |

### 完整示例

```
[P#H1#细胞结构]
[T#B#线粒体]是细胞进行[F#1#有氧呼吸]的主要场所。
---
它常被称为细胞的"动力工厂"。
```

### 输出前检查清单

1. 所有标签和参数是否使用规定的大小写？
2. 每个语法是否有两个 `#` 和正确的结尾 `]`？
3. 所有块级语法是否从新一行的第一个字符开始？
4. 选择题选项是否使用准确的 `* ` 或 `- ` 前缀？
5. 多选题是否写了 `multi`，需要固定顺序时是否写了 `fixed`？
6. 所有挖空是否使用正整数编号？
7. 普通文字中的 `[` 和 `]` 是否已转义为 `\[` 和 `\]`？
8. 是否没有在不支持的位置嵌套语法？
9. 所有标题是否只使用 `H1`？
10. 所有颜色是否为 6 位小写十六进制字符？
11. 是否没有编造图片、遮罩、音频或关联卡片 ID？
12. 是否避免了未列出的参数和不必要的复杂样式？
