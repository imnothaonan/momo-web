# 墨墨 OpenAPI 规范

> 基于 `https://open.maimemo.com/api_bundle.yaml` 编写  
> **OpenAPI 版本**：3.1.0  
> **API 版本**：v1  
> **标题**：墨墨开放 API

---

## 目录

- [规范元信息](#规范元信息)
- [安全方案](#安全方案)
- [服务器地址](#服务器地址)
- [数据模型（Schemas）](#数据模型schemas)
  - [枚举类型](#枚举类型)
  - [墨墨记忆卡对象](#墨墨记忆卡对象)
  - [墨墨背单词对象](#墨墨背单词对象)
  - [学习数据对象](#学习数据对象)
- [API 端点详细规范](#api-端点详细规范)
  - [墨墨记忆卡 — 文件夹与牌组](#墨墨记忆卡--文件夹与牌组)
  - [墨墨记忆卡 — 章节与卡片](#墨墨记忆卡--章节与卡片)
  - [墨墨记忆卡 — 文件管理](#墨墨记忆卡--文件管理)
  - [墨墨背单词 — 释义](#墨墨背单词--释义)
  - [墨墨背单词 — 助记](#墨墨背单词--助记)
  - [墨墨背单词 — 例句](#墨墨背单词--例句)
  - [墨墨背单词 — 云词本](#墨墨背单词--云词本)
  - [墨墨背单词 — 单词查询](#墨墨背单词--单词查询)
  - [墨墨背单词 — 学习数据（公测）](#墨墨背单词--学习数据公测)
- [附录](#附录)

---

## 规范元信息

| 属性 | 值 |
|------|-----|
| openapi | `3.1.0` |
| title | 墨墨开放 API |
| version | `v1` |
| 认证方式 | OAuth 2.0（Bearer Token） |

---

## 安全方案

### `user` — OAuth 2.0

所有端点均要求用户身份认证。申请到的 token 需要放到 HTTP Header 中：

```
Authorization: Bearer <token>
```

获取 Token 的方式：
1. 通过墨墨背单词 App：我的 → 更多设置 → 实验功能 → 开放 API
2. 在线获取：<https://open.maimemo.com/open/api/v1/tokens/openapi>

---

## 服务器地址

所有端点共享以下服务器配置：

| 环境 | Base URL |
|------|----------|
| 生产服务 | `https://open.maimemo.com/open` |
| 测试服务 | `https://open-dev.maimemo.com/open` |

完整请求 URL = Base URL + 端点路径。  
例如：`GET https://open.maimemo.com/open/api/v1/memo/phrases`

---

## 数据模型（Schemas）

### 枚举类型

#### MarkjiSource

墨墨记忆卡资源来源。

| 值 | 说明 |
|----|------|
| `SELF` | 自建 |
| `FORK` | 派生 |

#### MarkjiStatus

墨墨记忆卡资源状态。

| 值 | 说明 |
|----|------|
| `NORMAL` | 正常 |
| `DELETED` | 删除 |
| `BLOCKED` | 封禁 |

#### MarkjiContentType

墨墨记忆卡内容类型。

| 值 | 说明 |
|----|------|
| `PLAIN` | 纯文本 |

#### MarkjiFolderItemClass

文件夹内对象类型。

| 值 | 说明 |
|----|------|
| `FOLDER` | 文件夹 |
| `DECK` | 牌组 |

#### InterpretationStatus

释义状态。

| 值 | 说明 |
|----|------|
| `PUBLISHED` | 发布 |
| `UNPUBLISHED` | 未发布 |
| `DELETED` | 删除 |

#### NoteStatus

助记状态。

| 值 | 说明 |
|----|------|
| `PUBLISHED` | 发布 |
| `DELETED` | 删除 |

#### NotepadStatus

云词本状态。

| 值 | 说明 |
|----|------|
| `PUBLISHED` | 发布 |
| `UNPUBLISHED` | 未发布 |
| `DELETED` | 删除 |

#### NotepadType

云词本类型。

| 值 | 说明 |
|----|------|
| `FAVORITE` | 我的收藏 |
| `NOTEPAD` | 云词本 |

#### NotepadParsedItemType

云词本解析项类型。

| 值 | 说明 |
|----|------|
| `CHAPTER` | 章节 |
| `WORD` | 单词 |

#### PhraseStatus

例句状态。

| 值 | 说明 |
|----|------|
| `PUBLISHED` | 发布 |
| `DELETED` | 删除 |

#### StudyResponse

学习反馈类型。

| 值 | 说明 |
|----|------|
| `FAMILIAR` | 认识 |
| `VAGUE` | 模糊 |
| `FORGET` | 忘记 |
| `WELL_FAMILIAR` | 熟知 |
| `CANCEL_WELL_FAMILIAR` | 取消熟知 |

#### StudyRecordTags

学习记录标签。

| 值 | 说明 |
|----|------|
| `STICKING` | 黏连 |
| `WELL_FAMILIAR` | 熟知 |

---

### 墨墨记忆卡对象

#### MarkjiRootDeck

根牌组信息。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 牌组 OpenAPI ID |
| `parent_id` | string | 否 | 上游牌组 OpenAPI ID |
| `source` | [MarkjiSource](#markjisource) | 是 | 牌组来源 |
| `status` | [MarkjiStatus](#markjistatus) | 是 | 牌组状态 |
| `name` | string | 是 | 牌组名称 |
| `description` | string | 是 | 牌组简介 |
| `creator` | string | 是 | 用户 OpenAPI ID |
| `authors` | string[] | 是 | 用户 OpenAPI ID 列表 |
| `revision` | integer | 是 | 牌组版本 |
| `is_private` | boolean | 是 | 是否私有 |
| `card_count` | integer | 是 | 卡片数量 |
| `chapter_count` | integer | 是 | 章节数量 |
| `created_time` | ISODate | 是 | 创建时间 |
| `updated_time` | ISODate | 是 | 更新时间 |

#### MarkjiDeck

牌组信息。继承 `MarkjiRootDeck` 所有字段，并增加：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `root_deck` | [MarkjiRootDeck](#markjirootdeck) | 否 | 根牌组（`with_root=true` 时返回） |

#### MarkjiChapterset

章节集。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 章节集 OpenAPI ID |
| `deck_id` | string | 是 | 牌组 OpenAPI ID |
| `revision` | integer | 是 | 章节集版本 |
| `chapter_ids` | string[] | 是 | 章节 OpenAPI ID 列表 |
| `created_time` | ISODate | 是 | 创建时间 |
| `updated_time` | ISODate | 是 | 更新时间 |

#### MarkjiChapter

章节信息。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 章节 OpenAPI ID |
| `deck_id` | string | 是 | 牌组 OpenAPI ID |
| `name` | string | 是 | 章节名称 |
| `revision` | integer | 是 | 章节版本 |
| `card_ids` | string[] | 是 | 卡片 OpenAPI ID 列表 |
| `creator` | string | 是 | 用户 OpenAPI ID |
| `created_time` | ISODate | 是 | 创建时间 |
| `updated_time` | ISODate | 是 | 更新时间 |

#### MarkjiCard

卡片信息。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 卡片 OpenAPI ID |
| `status` | [MarkjiStatus](#markjistatus) | 是 | 卡片状态 |
| `deck_id` | string | 是 | 牌组 OpenAPI ID |
| `parent_id` | string | 否 | 上游卡片 OpenAPI ID |
| `root_id` | string | 否 | 根卡片 OpenAPI ID |
| `revision` | integer | 是 | 卡片版本 |
| `content` | string | 是 | 卡片内容 |
| `content_type` | [MarkjiContentType](#markjicontenttype) | 是 | 内容类型 |
| `files` | [MarkjiFile](#markjifile)[] | 是 | 卡片包含的文件 |
| `creator` | string | 是 | 用户 OpenAPI ID |
| `source` | [MarkjiSource](#markjisource) | 是 | 卡片来源 |
| `grammar_version` | integer | 是 | 语法版本 |
| `card_rids` | string[] | 否 | 引用的根卡片 OpenAPI ID 列表 |
| `created_time` | ISODate | 是 | 创建时间 |
| `updated_time` | ISODate | 是 | 更新时间 |

#### MarkjiFolderItem

文件夹内对象。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `object_id` | string | 是 | 对象 OpenAPI ID（DECK 时为牌组 ID，FOLDER 时为文件夹 ID） |
| `object_class` | [MarkjiFolderItemClass](#markjifolderitemclass) | 是 | 对象类型 |
| `order` | integer | 是 | 排序值 |

#### MarkjiFolder

文件夹。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 文件夹 OpenAPI ID |
| `items` | [MarkjiFolderItem](#markjifolderitem)[] | 是 | 文件夹内对象 |
| `parent_id` | string | 否 | 父文件夹 OpenAPI ID |
| `name` | string | 是 | 文件夹名称 |

#### MarkjiFile

文件信息。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 文件 OpenAPI ID |
| `url` | string | 是 | 文件访问地址 |
| `mime` | string | 是 | MIME 类型 |
| `size` | integer | 是 | 文件大小（KB，按 4KB 对齐） |
| `info` | object (any) | 是 | 文件信息 |
| `expire_time` | ISODate | 是 | 文件访问地址过期时间 |

---

### 墨墨背单词对象

#### Interpretation

释义。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 释义 ID |
| `interpretation` | string | 是 | 释义内容 |
| `tags` | string[] | 是 | 标签列表 |
| `status` | [InterpretationStatus](#interpretationstatus) | 是 | 状态 |
| `created_time` | ISODate | 是 | 创建时间（ISO 8601） |
| `updated_time` | ISODate | 是 | 更新时间（ISO 8601） |

#### Note

助记。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 助记 ID |
| `note_type` | string | 是 | 类型（如"谐音."） |
| `note` | string | 是 | 助记内容 |
| `status` | [NoteStatus](#notestatus) | 是 | 状态 |
| `created_time` | ISODate | 是 | 创建时间（ISO 8601） |
| `updated_time` | ISODate | 是 | 更新时间（ISO 8601） |

#### PhraseHighlightRange

例句中单词高亮区间 `[start, end)`。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `start` | integer | 是 | 高亮起始位置 |
| `end` | integer | 是 | 高亮结束位置（不包含） |

#### Phrase

例句。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 例句 ID |
| `phrase` | string | 是 | 例句内容 |
| `interpretation` | string | 是 | 翻译 |
| `tags` | string[] | 是 | 标签列表 |
| `highlight` | [PhraseHighlightRange](#phrasehighlightrange)[] | 是 | 单词高亮区间（二维数组） |
| `status` | [PhraseStatus](#phrasestatus) | 是 | 状态 |
| `origin` | string | 是 | 来源 |
| `created_time` | ISODate | 是 | 创建时间（ISO 8601） |
| `updated_time` | ISODate | 是 | 更新时间（ISO 8601） |

#### NotepadParsedItem

云词本解析结果项。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `type` | string (`CHAPTER` / `WORD`) | 是 | 类型 |
| `data` | object | 是 | 数据 |
| `data.chapter` | string | 是 | 章节名 |
| `data.word` | string | 否 | 单词（type=WORD 时有值） |

#### Notepad

云词本。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 云词本 ID |
| `type` | [NotepadType](#notepadtype) | 是 | 类型 |
| `creator` | integer | 是 | 创建者 ID |
| `status` | [NotepadStatus](#notepadstatus) | 是 | 状态 |
| `content` | string | 是 | 内容（章节模式 / 文本模式） |
| `title` | string | 是 | 标题 |
| `brief` | string | 是 | 简介 |
| `tags` | string[] | 是 | 标签列表 |
| `list` | [NotepadParsedItem](#notepadparseditem)[] | 是 | 解析结果 |
| `created_time` | ISODate | 是 | 创建时间（ISO 8601） |
| `updated_time` | ISODate | 是 | 更新时间（ISO 8601） |

**内容格式说明**：
- **章节模式**：以 `#` 开头，井号后是章节名称，下方是该章节的单词列表，一行一个
- **文本模式**：不以 `#` 开头，不限格式，会识别尽量多的单词和短语，开头添加 `//` 则还原单词原型后再提取

#### BriefNotepad

简要云词本（列表查询时返回）。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 云词本 ID |
| `type` | [NotepadType](#notepadtype) | 是 | 类型 |
| `creator` | integer | 是 | 创建者 ID |
| `status` | [NotepadStatus](#notepadstatus) | 是 | 状态 |
| `title` | string | 是 | 标题 |
| `brief` | string | 是 | 简介 |
| `tags` | string[] | 是 | 标签列表 |
| `created_time` | ISODate | 是 | 创建时间（ISO 8601） |
| `updated_time` | ISODate | 是 | 更新时间（ISO 8601） |

#### Vocabulary

单词。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 单词 ID |
| `spelling` | string | 是 | 拼写 |

---

### 学习数据对象

#### StudyProgress

今日学习进度。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `finished` | integer | 是 | 已完成的单词数 |
| `total` | integer | 是 | 今日应完成的单词数 |
| `study_time` | integer | 是 | 今日学习时长（毫秒） |

#### StudyTodayItem

今日学习单词。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `voc_id` | string | 是 | 单词 ID |
| `voc_spelling` | string | 是 | 单词拼写 |
| `order` | integer | 是 | 学习顺序 |
| `first_response` | [StudyResponse](#studyresponse) | 否 | 当天第一次反馈 |
| `is_new` | boolean | 是 | 是否是新学单词 |
| `is_finished` | boolean | 是 | 是否已完成当日学习 |

#### StudyRecord

学习记录。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `voc_id` | string | 是 | 单词 ID |
| `voc_spelling` | string | 是 | 单词拼写 |
| `add_date` | ISODate | 是 | 添加日期 |
| `first_study_date` | ISODate | 否 | 首次学习日期 |
| `last_study_date` | ISODate | 否 | 上次学习日期 |
| `next_study_date` | ISODate | 否 | 下次学习日期 |
| `last_response` | [StudyResponse](#studyresponse) | 否 | 上次反馈 |
| `study_count` | integer | 是 | 学习次数（每日最多计入 1 次） |
| `tags` | string (`STICKING` / `WELL_FAMILIAR`) | 是 | 标签 |

---

## API 端点详细规范

### 墨墨记忆卡 — 文件夹与牌组

#### `GET /api/v1/markji/decks/folders` — 获取文件夹列表

| 属性 | 值 |
|------|-----|
| operationId | `maimemo.openapi.markji.v1.MarkjiContentService.ListFolders` |
| Tags | 内容, 墨墨记忆卡 |
| 参数 | 无 |

**响应 200**：

```json
{
  "folders": [MarkjiFolder, ...]
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `folders` | [MarkjiFolder](#markjifolder)[] | 是 | 文件夹列表 |

---

#### `GET /api/v1/markji/decks` — 获取我的牌组列表

| 属性 | 值 |
|------|-----|
| operationId | `maimemo.openapi.markji.v1.MarkjiContentService.ListDecks` |
| Tags | 内容, 墨墨记忆卡 |

**查询参数**：

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| `offset` | query | integer | 否 | 偏移量 |
| `limit` | query | integer | 否 | 每页数量 |
| `folder_id` | query | string | 否 | 文件夹 OpenAPI ID |
| `source` | query | [MarkjiSource](#markjisource) | 否 | 牌组来源 |

**响应 200**：

```json
{
  "decks": [MarkjiDeck, ...],
  "total": 100
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `decks` | [MarkjiDeck](#markjideck)[] | 是 | 牌组列表 |
| `total` | integer | 是 | 总数 |

---

#### `GET /api/v1/markji/decks/{deck}` — 获取牌组信息

| 属性 | 值 |
|------|-----|
| operationId | `maimemo.openapi.markji.v1.MarkjiContentService.GetDeck` |
| Tags | 内容, 墨墨记忆卡 |

**路径参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `deck` | string | 是 | 牌组 OpenAPI ID |

**查询参数**：

| 参数 | 类型 | 必填 | 默认 | 说明 |
|------|------|------|------|------|
| `with_root` | boolean | 否 | `false` | 是否返回根牌组信息 |

**响应 200**：

```json
{
  "deck": MarkjiDeck
}
```

---

### 墨墨记忆卡 — 章节与卡片

#### `GET /api/v1/markji/decks/{deck}/chapters` — 获取牌组章节

| 属性 | 值 |
|------|-----|
| operationId | `maimemo.openapi.markji.v1.MarkjiContentService.ListChapters` |
| Tags | 内容, 墨墨记忆卡 |

**路径参数**：`deck`（string，必填）— 牌组 OpenAPI ID

**查询参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `updated_time` | ISODate | 否 | 只返回更新时间晚于该时间的章节。示例：`2021-07-09T00:16:00.000Z` |
| `with_cards` | boolean | 否 | 是否同时返回章节内卡片。默认 `false` |

**响应 200**：

```json
{
  "chapterset": MarkjiChapterset,
  "chapters": [MarkjiChapter, ...],
  "cards": [MarkjiCard, ...]
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `chapterset` | [MarkjiChapterset](#markjichapterset) | 否 | 章节集 |
| `chapters` | [MarkjiChapter](#markjichapter)[] | 是 | 章节列表 |
| `cards` | [MarkjiCard](#markjicard)[] | 否 | 卡片列表（`with_cards=true` 时返回） |

---

#### `GET /api/v1/markji/decks/{deck}/chapters/{chapter}` — 获取指定章节

| 属性 | 值 |
|------|-----|
| operationId | `maimemo.openapi.markji.v1.MarkjiContentService.GetChapter` |
| Tags | 内容, 墨墨记忆卡 |

**路径参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `deck` | string | 是 | 牌组 OpenAPI ID |
| `chapter` | string | 是 | 章节 OpenAPI ID |

**查询参数**：

| 参数 | 类型 | 必填 | 默认 | 说明 |
|------|------|------|------|------|
| `with_cards` | boolean | 否 | `false` | 是否同时返回章节内卡片 |
| `updated_time` | ISODate | 否 | — | 只返回更新时间晚于该时间的章节 |

**响应 200**：

```json
{
  "chapterset": MarkjiChapterset,
  "chapter": MarkjiChapter,
  "cards": [MarkjiCard, ...]
}
```

---

#### `GET /api/v1/markji/decks/{deck}/cards/{card}` — 获取卡片

| 属性 | 值 |
|------|-----|
| operationId | `maimemo.openapi.markji.v1.MarkjiContentService.GetCard` |
| Tags | 内容, 墨墨记忆卡 |

**路径参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `deck` | string | 是 | 牌组 OpenAPI ID |
| `card` | string | 是 | 卡片 OpenAPI ID |

**响应 200**：

```json
{
  "card": MarkjiCard
}
```

---

#### `POST /api/v1/markji/decks/{deck}/chapters/{chapter}/cards` — 新建卡片

| 属性 | 值 |
|------|-----|
| operationId | `maimemo.openapi.markji.v1.MarkjiContentService.CreateCard` |
| Tags | 内容, 墨墨记忆卡 |
| Content-Type | `application/json` |

**请求体**：

```json
{
  "deck": "牌组ID",
  "chapter": "章节ID",
  "card": {
    "content": "卡片内容",
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

**响应 200**：

```json
{
  "card": MarkjiCard,
  "chapter": MarkjiChapter
}
```

---

#### `POST /api/v1/markji/decks/{deck_id}/cards/{card_id}` — 更新卡片

| 属性 | 值 |
|------|-----|
| operationId | `maimemo.openapi.markji.v1.MarkjiContentService.UpdateCard` |
| Tags | 内容, 墨墨记忆卡 |
| Content-Type | `application/json` |

> **注意**：此端点路径参数使用 `{deck_id}` 和 `{card_id}`（与其他端点的 `{deck}`/`{card}` 命名不同），但实际 ID 通过请求体传递。

**请求体**：

```json
{
  "deck_id": "牌组ID",
  "card_id": "卡片ID",
  "card": {
    "content": "更新后的内容",
    "grammar_version": 1
  }
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `deck_id` | string | 是 | 要更新的牌组 ID |
| `card_id` | string | 是 | 要更新的卡片 ID |
| `card.content` | string | 是 | 卡片内容 |
| `card.grammar_version` | integer | 是 | 语法版本 |

**响应 200**：

```json
{
  "card": MarkjiCard
}
```

---

### 墨墨记忆卡 — 文件管理

#### `POST /api/v1/markji/files` — 上传文件

| 属性 | 值 |
|------|-----|
| operationId | `maimemo.openapi.markji.v1.MarkjiContentService.UploadFile` |
| Tags | 内容, 墨墨记忆卡 |
| Content-Type | `multipart/form-data` |

**请求体**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `deck_id` | string | 否 | 牌组 OpenAPI ID，指定后按牌组编辑权限归属文件 |
| `file` | file | 是 | multipart/form-data 中的文件字段，字段名为 `file` |

**响应 200**：

```json
{
  "file": MarkjiFile
}
```

---

#### `POST /api/v1/markji/files/query` — 查询文件

| 属性 | 值 |
|------|-----|
| operationId | `maimemo.openapi.markji.v1.MarkjiContentService.QueryFiles` |
| Tags | 内容, 墨墨记忆卡 |
| Content-Type | `application/json` |

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

**响应 200**：

```json
{
  "files": [MarkjiFile, ...]
}
```

---

### 墨墨背单词 — 释义

#### `GET /api/v1/memo/interpretations` — 获取释义

| 属性 | 值 |
|------|-----|
| operationId | `maimemo.openapi.memo.interpretation.v1.InterpretationService.ListInterpretations` |
| Tags | 释义, 墨墨背单词 |
| 说明 | 获取单词下自己创建的释义 |

**查询参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `voc_id` | string | 是 | 单词 ID。示例：`5a7BFf4F63612e5AD9fdebB7a50D3881` |

**响应 200**：

```json
{
  "interpretations": [Interpretation, ...]
}
```

---

#### `POST /api/v1/memo/interpretations` — 创建释义

| 属性 | 值 |
|------|-----|
| operationId | `maimemo.openapi.memo.interpretation.v1.InterpretationService.CreateInterpretation` |
| Tags | 释义, 墨墨背单词 |
| Content-Type | `application/json` |

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
| `interpretation.voc_id` | string | 是 | 单词 ID |
| `interpretation.interpretation` | string | 是 | 释义 |
| `interpretation.tags` | string[] | 是 | 标签 |
| `interpretation.status` | [InterpretationStatus](#interpretationstatus) | 是 | 状态 |

**响应 200**：返回 `interpretation`（[Interpretation](#interpretation)）

---

#### `POST /api/v1/memo/interpretations/{id}` — 更新释义

| 属性 | 值 |
|------|-----|
| operationId | `maimemo.openapi.memo.interpretation.v1.InterpretationService.UpdateInterpretation` |
| Tags | 释义, 墨墨背单词 |

**路径参数**：`id`（string，必填）— 释义 ID

**请求体**：

```json
{
  "id": "释义ID",
  "interpretation": {
    "interpretation": "n. 苹果",
    "tags": ["考研"],
    "status": "PUBLISHED"
  }
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 释义 ID |
| `interpretation.interpretation` | string | 是 | 释义 |
| `interpretation.tags` | string[] | 是 | 标签 |
| `interpretation.status` | [InterpretationStatus](#interpretationstatus) | 是 | 状态 |

**响应 200**：返回 `interpretation`（[Interpretation](#interpretation)）

---

#### `DELETE /api/v1/memo/interpretations/{id}` — 删除释义

| 属性 | 值 |
|------|-----|
| operationId | `maimemo.openapi.memo.interpretation.v1.InterpretationService.DeleteInterpretation` |
| Tags | 释义, 墨墨背单词 |

**路径参数**：`id`（string，必填）— 释义 ID

**响应**：无特定响应体定义。

---

### 墨墨背单词 — 助记

#### `GET /api/v1/memo/notes` — 获取助记

| 属性 | 值 |
|------|-----|
| operationId | `maimemo.openapi.memo.note.v1.NoteService.ListNotes` |
| Tags | 助记, 墨墨背单词 |
| 说明 | 获取单词下自己创建的助记 |

**查询参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `voc_id` | string | 是 | 单词 ID |

**响应 200**：

```json
{
  "notes": [Note, ...]
}
```

---

#### `POST /api/v1/memo/notes` — 创建助记

| 属性 | 值 |
|------|-----|
| operationId | `maimemo.openapi.memo.note.v1.NoteService.CreateNote` |
| Tags | 助记, 墨墨背单词 |

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
| `note.voc_id` | string | 是 | 单词 ID |
| `note.note_type` | string | 是 | 类型（如"谐音."） |
| `note.note` | string | 是 | 助记内容 |

**响应 200**：返回 `note`（[Note](#note)）

---

#### `POST /api/v1/memo/notes/{id}` — 更新助记

| 属性 | 值 |
|------|-----|
| operationId | `maimemo.openapi.memo.note.v1.NoteService.UpdateNote` |
| Tags | 助记, 墨墨背单词 |

**路径参数**：`id`（string，必填）— 助记 ID

**请求体**：

```json
{
  "id": "助记ID",
  "note": {
    "note_type": "谐音.",
    "note": "apple"
  }
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 要更新的助记 ID |
| `note.note_type` | string | 是 | 类型 |
| `note.note` | string | 是 | 助记内容 |

**响应 200**：返回 `note`（[Note](#note)）

---

#### `DELETE /api/v1/memo/notes/{id}` — 删除助记

| 属性 | 值 |
|------|-----|
| operationId | `maimemo.openapi.memo.note.v1.NoteService.DeleteNote` |
| Tags | 助记, 墨墨背单词 |

**路径参数**：`id`（string，必填）— 助记 ID

**响应**：无特定响应体定义。

---

### 墨墨背单词 — 例句

#### `GET /api/v1/memo/phrases` — 获取例句

| 属性 | 值 |
|------|-----|
| operationId | `maimemo.openapi.memo.phrase.v1.PhraseService.ListPhrases` |
| Tags | 例句, 墨墨背单词 |
| 说明 | 获取单词下自己创建的例句 |

**查询参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `voc_id` | string | 是 | 单词 ID |

**响应 200**：

```json
{
  "phrases": [Phrase, ...]
}
```

---

#### `POST /api/v1/memo/phrases` — 创建例句

| 属性 | 值 |
|------|-----|
| operationId | `maimemo.openapi.memo.phrase.v1.PhraseService.CreatePhrase` |
| Tags | 例句, 墨墨背单词 |

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
| `phrase.voc_id` | string | 是 | 单词 ID |
| `phrase.phrase` | string | 是 | 例句 |
| `phrase.interpretation` | string | 是 | 翻译 |
| `phrase.tags` | string[] | 是 | 标签 |
| `phrase.origin` | string | 是 | 来源 |

**响应 200**：返回 `phrase`（[Phrase](#phrase)）

---

#### `POST /api/v1/memo/phrases/{id}` — 更新例句

| 属性 | 值 |
|------|-----|
| operationId | `maimemo.openapi.memo.phrase.v1.PhraseService.UpdatePhrase` |
| Tags | 例句, 墨墨背单词 |

**路径参数**：`id`（string，必填）— 例句 ID

**请求体**：

```json
{
  "id": "例句ID",
  "phrase": {
    "phrase": "This is an apple.",
    "interpretation": "这是一个苹果。",
    "tags": ["考研"],
    "origin": "考研"
  }
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 例句 ID |
| `phrase.phrase` | string | 是 | 例句 |
| `phrase.interpretation` | string | 是 | 翻译 |
| `phrase.tags` | string[] | 是 | 标签 |
| `phrase.origin` | string | 是 | 来源 |

**响应 200**：返回 `phrase`（[Phrase](#phrase)）

---

#### `DELETE /api/v1/memo/phrases/{id}` — 删除例句

| 属性 | 值 |
|------|-----|
| operationId | `maimemo.openapi.memo.phrase.v1.PhraseService.DeletePhrase` |
| Tags | 例句, 墨墨背单词 |

**路径参数**：`id`（string，必填）— 例句 ID

**响应 200**：返回 `phrase`（[Phrase](#phrase)）

---

### 墨墨背单词 — 云词本

#### `GET /api/v1/memo/notepads` — 查询云词本

| 属性 | 值 |
|------|-----|
| operationId | `maimemo.openapi.memo.notepad.v1.NotepadService.ListNotepads` |
| Tags | 云词本, 墨墨背单词 |

**查询参数**：

| 参数 | 类型 | 必填 | 默认 | 说明 |
|------|------|------|------|------|
| `limit` | integer | 否 | `10` | 查询数量 |
| `offset` | integer | 否 | `0` | 查询跳过 |
| `ids` | string[] | 否 | — | 词本 ID 列表 |

**响应 200**：

```json
{
  "notepads": [BriefNotepad, ...]
}
```

---

#### `POST /api/v1/memo/notepads` — 创建云词本

| 属性 | 值 |
|------|-----|
| operationId | `maimemo.openapi.memo.notepad.v1.NotepadService.CreateNotepad` |
| Tags | 云词本, 墨墨背单词 |

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

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `notepad.status` | [NotepadStatus](#notepadstatus) | 是 | 状态 |
| `notepad.content` | string | 是 | 内容 |
| `notepad.title` | string | 是 | 标题 |
| `notepad.brief` | string | 是 | 简介 |
| `notepad.tags` | string[] | 是 | 标签 |

**响应 200**：返回 `notepad`（[Notepad](#notepad)）

---

#### `GET /api/v1/memo/notepads/{id}` — 获取云词本

| 属性 | 值 |
|------|-----|
| operationId | `maimemo.openapi.memo.notepad.v1.NotepadService.GetNotepad` |
| Tags | 云词本, 墨墨背单词 |

**路径参数**：`id`（string，必填）— 云词本 ID

**响应 200**：返回 `notepad`（[Notepad](#notepad)）

---

#### `POST /api/v1/memo/notepads/{id}` — 更新云词本

| 属性 | 值 |
|------|-----|
| operationId | `maimemo.openapi.memo.notepad.v1.NotepadService.UpdateNotepad` |
| Tags | 云词本, 墨墨背单词 |

**路径参数**：`id`（string，必填）— 云词本 ID

**请求体**：

```json
{
  "id": "云词本ID",
  "notepad": {
    "status": "PUBLISHED",
    "content": "apple",
    "title": "常用词汇",
    "brief": "常用",
    "tags": ["考研"]
  }
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 云词本 ID |
| `notepad.status` | [NotepadStatus](#notepadstatus) | 是 | 状态 |
| `notepad.content` | string | 是 | 内容 |
| `notepad.title` | string | 是 | 标题 |
| `notepad.brief` | string | 是 | 简介 |
| `notepad.tags` | string[] | 是 | 标签 |

**响应 200**：返回 `notepad`（[Notepad](#notepad)）

---

#### `DELETE /api/v1/memo/notepads/{id}` — 删除云词本

| 属性 | 值 |
|------|-----|
| operationId | `maimemo.openapi.memo.notepad.v1.NotepadService.DeleteNotepad` |
| Tags | 云词本, 墨墨背单词 |

**路径参数**：`id`（string，必填）— 云词本 ID

**响应 200**：返回 `notepad`（[Notepad](#notepad)）

---

### 墨墨背单词 — 单词查询

#### `GET /api/v1/memo/vocabulary` — 获取单词

| 属性 | 值 |
|------|-----|
| operationId | `maimemo.openapi.memo.vocabulary.v1.VocabularyService.GetVocabulary` |
| Tags | 单词, 墨墨背单词 |

**查询参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `spelling` | string | 是 | 单词拼写。示例：`apple` |

**响应 200**：

```json
{
  "voc": Vocabulary
}
```

---

#### `POST /api/v1/memo/vocabulary/query` — 查询单词

| 属性 | 值 |
|------|-----|
| operationId | `maimemo.openapi.memo.vocabulary.v1.VocabularyService.ListVocabulary` |
| Tags | 单词, 墨墨背单词 |
| 说明 | 查询条件互斥，只能生效一个 |

**请求体**：

```json
{
  "spellings": ["hello", "world"],
  "ids": ["id1", "id2"]
}
```

| 字段 | 类型 | 必填 | 限制 | 说明 |
|------|------|------|------|------|
| `spellings` | string[] | 否 | 最多 1000 | 根据拼写查询 |
| `ids` | string[] | 否 | 最多 1000 | 根据ID查询 |

> `spellings` 和 `ids` 互斥，只能传一个。

**响应 200**：

```json
{
  "voc": [Vocabulary, ...]
}
```

---

### 墨墨背单词 — 学习数据（公测）

> **公测说明**：以下接口在公测期间不保证可用性，可能随时调整，需在 App 中开启自动同步。当日未打开 App 进行初始化则无法准确获取数据。

#### `POST /api/v1/memo/study/get_study_progress` — 获取今日学习进度

| 属性 | 值 |
|------|-----|
| operationId | `maimemo.openapi.memo.study.v1.StudyService.GetStudyProgress` |
| Tags | 学习数据（公测）, 墨墨背单词 |

**请求体**：空

**响应 200**：

```json
{
  "progress": {
    "finished": 10,
    "total": 20,
    "study_time": 114514
  }
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `progress.finished` | integer | 是 | 已完成的单词数 |
| `progress.total` | integer | 是 | 今日应完成的单词数 |
| `progress.study_time` | integer | 是 | 今日学习时长（毫秒） |

---

#### `POST /api/v1/memo/study/get_today_items` — 获取今日学习单词

| 属性 | 值 |
|------|-----|
| operationId | `maimemo.openapi.memo.study.v1.StudyService.GetTodayItems` |
| Tags | 学习数据（公测）, 墨墨背单词 |

**请求体**：

```json
{
  "is_finished": false,
  "is_new": false,
  "voc_ids": ["id1", "id2"],
  "spellings": ["hello", "world"],
  "limit": 50
}
```

| 字段 | 类型 | 必填 | 限制 | 说明 |
|------|------|------|------|------|
| `is_finished` | boolean | 否 | — | 筛选是否已完成 |
| `is_new` | boolean | 否 | — | 筛选是否新学单词 |
| `voc_ids` | string[] | 否 | 最多 1000 | 根据单词 ID 列表查询，忽略其他条件 |
| `spellings` | string[] | 否 | 最多 1000 | 根据单词拼写列表查询，忽略其他条件，不可与 `voc_ids` 同时使用 |
| `limit` | integer | 否 | 最大 1000，默认 50 | 最多根据学习顺序获取前 N 条数据 |

**响应 200**：

```json
{
  "today_items": [StudyTodayItem, ...]
}
```

---

#### `POST /api/v1/memo/study/query_study_records` — 查询学习记录

| 属性 | 值 |
|------|-----|
| operationId | `maimemo.openapi.memo.study.v1.StudyService.QueryStudyRecords` |
| Tags | 学习数据（公测）, 墨墨背单词 |

**请求体**：

```json
{
  "next_study_date": {
    "start": "2021-07-09T00:16:00.000Z",
    "end": "2026-04-01T00:00:00+08:00"
  },
  "voc_ids": ["id1", "id2"],
  "spellings": ["hello", "world"],
  "as_count": false,
  "limit": 50
}
```

| 字段 | 类型 | 必填 | 限制 | 说明 |
|------|------|------|------|------|
| `next_study_date` | object | 否 | — | 根据下次学习日期筛选 |
| `next_study_date.start` | ISODate | 否 | — | 大于等于时间，北京时区 |
| `next_study_date.end` | ISODate | 否 | — | 小于等于时间，北京时区 |
| `voc_ids` | string[] | 否 | — | 根据单词 ID 筛选，忽略其他条件 |
| `spellings` | string[] | 否 | 最多 1000 | 根据拼写列表查询，忽略其他条件，不可与 `voc_ids` 同时使用 |
| `as_count` | boolean | 否 | — | 仅计算结果总数，不返回数据列表 |
| `limit` | integer | 否 | 最大 1000，默认 50 | 最多根据下次学习日期获取前 N 条数据 |

**响应 200**：

```json
{
  "records": [StudyRecord, ...],
  "count": 114514
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `records` | [StudyRecord](#studyrecord)[] | 是 | 学习记录列表（`as_count=true` 时为空） |
| `count` | integer | 是 | 结果总数（`as_count=true` 时有效） |

**查询场景举例**：
- 获取规划总量：`as_count=true`
- 获取未来某天要背的单词数：`next_study_date: {end: "2026-04-01T00:00:00+08:00"}, as_count=true`
- 获取未来某天要背的单词列表：`next_study_date: {end: "2026-04-01T00:00:00+08:00"}`

---

#### `POST /api/v1/memo/study/add_words` — 添加单词

| 属性 | 值 |
|------|-----|
| operationId | `maimemo.openapi.memo.study.v1.StudyService.AddWords` |
| Tags | 学习数据（公测）, 墨墨背单词 |

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

| 字段 | 类型 | 必填 | 限制 | 说明 |
|------|------|------|------|------|
| `words` | array | 是 | 最多 1000 | 单词列表，每项含 `id`（单词 ID，通过查询单词接口获取） |
| `words[].id` | string | 是 | — | 单词 ID |
| `advance` | boolean | 是 | — | 是否一并提前复习，无等级限制 |

**响应 200**：

```json
{
  "added_count": 114
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `added_count` | integer | 是 | 成功添加的数量（单词上限不足或已添加过会影响数量） |

---

#### `POST /api/v1/memo/study/advance_study` — 提前复习

| 属性 | 值 |
|------|-----|
| operationId | `maimemo.openapi.memo.study.v1.StudyService.AdvanceStudy` |
| Tags | 学习数据（公测）, 墨墨背单词 |
| 说明 | 将单词提前到当下马上复习，需要升级到 10 级解锁提前复习功能 |

**请求体**：

```json
{
  "voc_ids": ["id1", "id2"]
}
```

| 字段 | 类型 | 必填 | 限制 | 说明 |
|------|------|------|------|------|
| `voc_ids` | string[] | 是 | 最多 1000 | 单词 ID 列表 |

**响应 200**：

```json
{
  "advanced_count": 514
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `advanced_count` | integer | 是 | 成功提前的数量（单词未加入会影响数量） |

---

## 附录

### 请求频控

| 时间窗口 | 限制次数 |
|----------|----------|
| 10 秒 | 20 次 |
| 60 秒 | 40 次 |
| 5 小时 | 2000 次（墨墨背单词） |
| 5 小时 | 8000 次（墨墨记忆卡） |

### 数据格式约定

- **ISODate**：ISO 8601 格式日期字符串，如 `2021-07-09T00:16:00.000Z`
- **北京时区**：学习记录查询中的日期筛选使用北京时区（UTC+8），如 `2026-04-01T00:00:00+08:00`
- **ID 格式**：示例 ID 为 `5a7BFf4F63612e5AD9fdebB7a50D3881` 格式的字符串
- **Content-Type**：除文件上传使用 `multipart/form-data` 外，其余 POST 请求均使用 `application/json`

### operationId 索引

| operationId | 方法 | 路径 |
|-------------|------|------|
| `MarkjiContentService.ListFolders` | GET | `/api/v1/markji/decks/folders` |
| `MarkjiContentService.ListDecks` | GET | `/api/v1/markji/decks` |
| `MarkjiContentService.GetDeck` | GET | `/api/v1/markji/decks/{deck}` |
| `MarkjiContentService.ListChapters` | GET | `/api/v1/markji/decks/{deck}/chapters` |
| `MarkjiContentService.GetChapter` | GET | `/api/v1/markji/decks/{deck}/chapters/{chapter}` |
| `MarkjiContentService.GetCard` | GET | `/api/v1/markji/decks/{deck}/cards/{card}` |
| `MarkjiContentService.CreateCard` | POST | `/api/v1/markji/decks/{deck}/chapters/{chapter}/cards` |
| `MarkjiContentService.UpdateCard` | POST | `/api/v1/markji/decks/{deck_id}/cards/{card_id}` |
| `MarkjiContentService.UploadFile` | POST | `/api/v1/markji/files` |
| `MarkjiContentService.QueryFiles` | POST | `/api/v1/markji/files/query` |
| `InterpretationService.ListInterpretations` | GET | `/api/v1/memo/interpretations` |
| `InterpretationService.CreateInterpretation` | POST | `/api/v1/memo/interpretations` |
| `InterpretationService.UpdateInterpretation` | POST | `/api/v1/memo/interpretations/{id}` |
| `InterpretationService.DeleteInterpretation` | DELETE | `/api/v1/memo/interpretations/{id}` |
| `NoteService.ListNotes` | GET | `/api/v1/memo/notes` |
| `NoteService.CreateNote` | POST | `/api/v1/memo/notes` |
| `NoteService.UpdateNote` | POST | `/api/v1/memo/notes/{id}` |
| `NoteService.DeleteNote` | DELETE | `/api/v1/memo/notes/{id}` |
| `PhraseService.ListPhrases` | GET | `/api/v1/memo/phrases` |
| `PhraseService.CreatePhrase` | POST | `/api/v1/memo/phrases` |
| `PhraseService.UpdatePhrase` | POST | `/api/v1/memo/phrases/{id}` |
| `PhraseService.DeletePhrase` | DELETE | `/api/v1/memo/phrases/{id}` |
| `NotepadService.ListNotepads` | GET | `/api/v1/memo/notepads` |
| `NotepadService.CreateNotepad` | POST | `/api/v1/memo/notepads` |
| `NotepadService.GetNotepad` | GET | `/api/v1/memo/notepads/{id}` |
| `NotepadService.UpdateNotepad` | POST | `/api/v1/memo/notepads/{id}` |
| `NotepadService.DeleteNotepad` | DELETE | `/api/v1/memo/notepads/{id}` |
| `VocabularyService.GetVocabulary` | GET | `/api/v1/memo/vocabulary` |
| `VocabularyService.ListVocabulary` | POST | `/api/v1/memo/vocabulary/query` |
| `StudyService.GetStudyProgress` | POST | `/api/v1/memo/study/get_study_progress` |
| `StudyService.GetTodayItems` | POST | `/api/v1/memo/study/get_today_items` |
| `StudyService.QueryStudyRecords` | POST | `/api/v1/memo/study/query_study_records` |
| `StudyService.AddWords` | POST | `/api/v1/memo/study/add_words` |
| `StudyService.AdvanceStudy` | POST | `/api/v1/memo/study/advance_study` |
