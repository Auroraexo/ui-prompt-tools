# UI Tools - 全栈 UI 参数管理与 AI 视觉工具

> 一站式 UI 审美参数管理工具，支持配置持久化、Prompt 自动生成，以及 **AI 视觉反向工程**（一键从截图提取样式参数）。

## ✨ 核心功能

### 💾 **配置持久化（NEW!）**
- 将 UI 参数配置保存到 PostgreSQL 数据库
- 多设备同步，团队协作共享配置
- 支持保存/加载/删除多个配置方案
- **告别 localStorage 限制，实现企业级配置管理！**

### 🎨 **视觉反向工程**
- 上传任意 UI 截图，AI 自动提取样式参数
- 支持识别：圆角、间距、配色、阴影、毛玻璃、字体、动画等
- 一键回填到左侧配置表单，实时生成 Prompt
- **告别手动输入，看到即可复制！**

### 📐 7 维度 UI 参数管理
- **容器 & 布局**：内边距、网格、Flex 布局
- **圆角 (Radius)**：卡片、按钮、输入框、徽章
- **背景 (Glass)**：毛玻璃效果、半透明背景
- **阴影 (Shadow)**：软阴影、彩色阴影
- **字体 (Typo)**：标题、正文、标签
- **交互 (Motion)**：悬停、点击动画
- **色彩 (Color)**：主色、背景色、强调色

### 🤖 AI 图像理解
- 基于火山引擎豆包视觉模型
- 支持图片 URL 和本地上传
- 自动保存历史记录（最多 20 条）

### 💾 配置持久化
- 自动保存到 `localStorage`
- 刷新页面不丢失配置

### 📋 一键复制 Prompt
- 实时生成 Cursor 可用的完整提示词
- 包含所有维度的样式指令

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `env.example` 为 `.env`，填入你的火山引擎豆包 API Key：

```bash
ARK_API_KEY=你的API密钥
```

可选配置：
```bash
AI_SERVER_PORT=5180  # 后端服务端口，默认 5180
ARK_MODEL_ID=doubao-seed-1-6-251015  # 豆包模型 ID
```

**如果需要配置持久化功能（保存到数据库）**，请参考 [数据库配置指南](docs/数据库配置指南.md)，额外配置 PostgreSQL：

```bash
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=ui_tools
POSTGRES_USER=postgres
POSTGRES_PASSWORD=你的数据库密码
```

### 3. 初始化数据库（可选）

**如果你配置了 PostgreSQL**，需要先初始化数据库表：

```bash
npm run db:init
```

**如果不需要数据库功能**，跳过此步骤，配置将保存在浏览器 `localStorage`。

### 4. 启动服务

```bash
# 一键启动前后端（推荐）
npm run dev:all

# 或分别启动
npm run dev:server  # 终端 1：后端 AI 服务
npm run dev         # 终端 2：前端
```

访问浏览器显示的本地地址（通常是 `http://localhost:5176`）。

## 📖 使用指南

### 基础使用

1. 在左侧配置区调整各维度参数
2. 右侧实时显示生成的 Prompt
3. 点击"复制"按钮，粘贴到 Cursor

### 配置管理（数据库持久化）

1. 调整好配置后，点击 **"💾 保存当前配置"**
2. 输入配置名称和描述，保存到数据库
3. 在配置列表中点击 **"加载"** 切换不同方案
4. 支持多设备同步和团队协作

详细配置步骤见：[数据库配置指南](docs/数据库配置指南.md)

### 视觉反向工程（一键参数回填）

1. 在右侧"AI 图像理解"卡片中**上传 UI 截图**（或输入图片 URL）
2. 点击 **"✨ 提取参数"** 按钮（绿色）
3. 等待 AI 分析（5-15 秒）
4. 左侧配置自动更新，右侧 Prompt 同步变化
5. 可在自动填充的基础上继续微调

**提示**：
- 建议上传清晰、包含多种 UI 元素的截图
- AI 会尽可能推断 Tailwind 类名
- 无法判断的参数会给出合理推荐值

### AI 图像理解

1. 输入图片 URL 或上传本地图片
2. 输入提问文本（默认"你看见了什么？"）
3. 点击"生成描述"
4. 查看历史记录，点击可快速回填

## 📁 项目结构

```
ui-tools/
├── server/
│   └── index.js              # 后端 AI 服务（豆包接口封装）
├── src/
│   ├── components/
│   │   ├── AiVisionPanel.tsx # AI 视觉面板（描述 + 参数提取）
│   │   ├── ConfigCard.tsx    # 配置卡片组件
│   │   ├── Header.tsx        # 页面头部
│   │   └── PromptDisplay.tsx # Prompt 展示与复制
│   ├── data/
│   │   └── defaultConfig.ts  # 默认配置数据
│   ├── types/
│   │   └── config.ts         # TypeScript 类型定义
│   ├── utils/
│   │   └── promptGenerator.ts # Prompt 生成逻辑
│   └── App.tsx               # 主应用组件
├── docs/
│   ├── 使用说明.md            # 详细使用文档
│   ├── 测试指南-视觉反向工程.md # 功能测试指南
│   └── 更新日志.md            # 版本更新记录
├── env.example               # 环境变量示例
└── package.json
```

## 🔧 技术栈

- **前端**：React 18 + TypeScript + Vite
- **后端**：Node.js + Express + OpenAI SDK
- **样式**：Tailwind CSS
- **AI 模型**：火山引擎豆包视觉模型

## 🌟 核心 API

### POST `/api/describe-image`
图片理解（描述生成）

请求体：
```json
{
  "imageUrl": "https://example.com/image.jpg",
  "text": "你看见了什么？"
}
```

### POST `/api/extract-ui-params`
UI 参数提取（视觉反向工程）

请求体：
```json
{
  "imageUrl": "https://example.com/screenshot.png"
}
```

响应体：
```json
{
  "params": {
    "圆角": { "卡片圆角": "rounded-2xl", "按钮圆角": "rounded-3xl" },
    "配色": { "主色": "indigo-500", "背景色": "zinc-950" },
    "阴影": { "卡片阴影": "shadow-[0_20px_50px_rgba(0,0,0,0.3)]" }
  },
  "rawText": "AI 返回的原始文本",
  "raw": { /* 完整响应 */ }
}
```

## 📚 详细文档

- [使用说明](docs/使用说明.md) - 完整功能介绍与配置指南
- [视觉反向工程测试指南](docs/测试指南-视觉反向工程.md) - 功能测试步骤与验收标准
- [更新日志](docs/更新日志.md) - 版本历史与技术细节

## 🛠️ 高级配置

### 配置存储格式与迁移（localStorage）

本项目会将当前配置与部分 UI 状态写入浏览器 `localStorage`，并在结构升级时自动迁移。

- **配置 Key**：`ui-tools-config`
  - **v0（旧）**：直接存 `ConfigState`（各维度为数组）
  - **v1（现）**：存为 envelope：

```json
{
  "version": 1,
  "updatedAt": 1710000000000,
  "data": { "圆角 (Radius)": [/* ... */] }
}
```

- **展开/收起状态 Key**：`ui-tools-dimension-ui`（`Record<string, boolean>`）
- **迁移安全策略**：
  - 检测到 v0 时，会先将原始字符串备份到 `ui-tools-config.bak.<timestamp>`，再写回 v1。
  - 读取失败（非 JSON / 结构异常）时会回退到默认配置，不会覆盖旧值。

你可以用下面的命令跑一次最小自测（验证迁移与容错逻辑）：

```bash
npm run storage:selftest
```

如果需要“完全重置本地配置”，可在浏览器 DevTools 中清理上述 Key（或直接清空站点数据）。

### 调整请求体大小限制

如果上传大图时遇到"请求体过大"错误，可以修改 `server/index.js`：

```js
app.use(express.json({ limit: '50mb' })); // 从 20mb 调大到 50mb
```

### 自定义豆包模型

在 `.env` 中设置：

```bash
ARK_MODEL_ID=你的模型ID
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可

MIT License
