import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { query } from './db.js';

dotenv.config();

const app = express();
const port = process.env.AI_SERVER_PORT || 5180;
const apiKey = process.env.ARK_API_KEY;
const modelId = process.env.ARK_MODEL_ID || 'doubao-seed-1-6-251015';

if (!apiKey) {
  console.warn('[AI] 缺少 ARK_API_KEY，请在环境变量中配置。');
}

const client = new OpenAI({
  baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
  apiKey: apiKey,
});

app.use(cors());
// 前端上传本地图片时会以 base64 Data URL 的形式传输，体积较大，这里适当放宽限制
// 如果依然报 PayloadTooLargeError，可以再适当调大（例如 20mb、50mb），或改用图片 URL 方式
app.use(
  express.json({
    limit: '20mb',
  })
);

// 统一处理请求体过大的错误，避免直接返回 HTML 错误页
// 注意：这是一个 4 参中间件，必须放在 body 解析中间件之后
app.use((err, req, res, next) => {
  if (err && err.type === 'entity.too.large') {
    return res.status(413).json({
      error: '请求体过大，请尝试使用更小的图片（或压缩后上传），或改用图片 URL 方式',
    });
  }
  return next(err);
});

/**
 * 简单校验 imageUrl：
 * - 必须是非空字符串
 * - 允许 http/https URL 或 base64 Data URL
 */
function validateImageUrl(raw) {
  if (typeof raw !== 'string') {
    return 'imageUrl 必须是字符串';
  }
  const value = raw.trim();
  if (!value) {
    return 'imageUrl 不能为空';
  }

  // 允许远程 URL 或 data: 开头的本地图片 Data URL
  const isHttpUrl = /^https?:\/\//i.test(value);
  const isDataUrl = /^data:image\/[a-zA-Z0-9.+-]+;base64,/i.test(value);
  if (!isHttpUrl && !isDataUrl) {
    return 'imageUrl 必须是有效的 http/https URL 或图片 Data URL';
  }

  // 简单保护：避免超长字符串导致内存压力
  if (value.length > 5 * 1024 * 1024) {
    return 'imageUrl 过长，请使用更小的图片或改用 URL 方式';
  }

  return null;
}

/**
 * 调用豆包图像理解模型的封装，便于后续复用与调试
 */
async function callDoubaoVision({ imageUrl, question }) {
  const response = await client.responses.create({
    model: modelId,
    input: [
      {
        role: 'user',
        content: [
          {
            type: 'input_image',
            image_url: imageUrl,
          },
          {
            type: 'input_text',
            text: question || '你看见了什么？',
          },
        ],
      },
    ],
  });

  // 不同 SDK / 版本的返回结构可能略有差异，这里做一个比较宽松的兜底解析
  const directText = response.output_text;
  const fromList =
    response.output &&
    Array.isArray(response.output) &&
    response.output
      .flatMap((item) => item.content || [])
      .map((item) => item.text || '')
      .join('');

  const text = directText || fromList || '';

  return {
    text,
    raw: response,
  };
}

/**
 * 将 AI 提取的原始 JSON 结构整理为更稳定的结构，便于存入 jsonb
 */
function normalizeAiExtractedData(aiExtractedData) {
  const raw = aiExtractedData || {};

  const radius = raw['圆角'] || {};
  const shadows = raw['阴影'] || {};
  const glass = raw['背景效果'] || {};
  const animations = raw['交互动画'] || {};

  // 适度的默认值补齐，相当于"审美校验器"的轻量版
  if (!radius['卡片圆角']) radius['卡片圆角'] = 'rounded-2xl';
  if (!radius['按钮圆角']) radius['按钮圆角'] = 'rounded-3xl';
  if (!radius['输入框圆角']) radius['输入框圆角'] = 'rounded-xl';

  if (!shadows['卡片阴影']) shadows['卡片阴影'] = 'shadow-xl';
  if (!glass['毛玻璃']) glass['毛玻璃'] = 'backdrop-blur-md';
  if (!animations['悬停']) animations['悬停'] = 'hover:scale-105 transition-all';

  return {
    radius,
    spacing: raw['间距'] || null,
    colors: raw['配色'] || null,
    shadows,
    glass_effect: glass,
    typography: raw['字体'] || null,
    animations,
  };
}

/**
 * 基于 AI 提取的配置生成一段增强版 System Prompt
 */
function buildSystemPromptFromExtracted(data) {
  return `请按照以下当代审美重构 UI：
- 圆角策略：${data.radius?.卡片圆角 || 'rounded-2xl'}
- 阴影深度：${data.shadows?.卡片阴影 || 'shadow-xl'}
- 背景方案：${data.glass_effect?.毛玻璃 || 'backdrop-blur-md'}
- 交互反馈：${data.animations?.悬停 || 'hover:scale-105 transition-all'}
确保界面具有呼吸感，符合 2026 年极简主义标准。`;
}

// ==================== AI 路由 ====================

app.post('/api/describe-image', async (req, res) => {
  try {
    const { imageUrl, text } = req.body || {};

    const validationError = validateImageUrl(imageUrl);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    if (!apiKey) {
      return res.status(500).json({ error: '未配置 ARK_API_KEY' });
    }

    const question =
      typeof text === 'string' && text.trim()
        ? text.trim()
        : '你看见了什么？';

    const result = await callDoubaoVision({
      imageUrl: imageUrl.trim(),
      question,
    });

    return res.json({
      text: result.text,
      raw: result.raw,
    });
  } catch (error) {
    console.error('[AI] /api/describe-image 调用失败：', error);

    // OpenAI SDK / HTTP 错误的一般结构兜底处理
    const anyError = error;
    const status =
      (anyError && anyError.status) ||
      (anyError && anyError.response && anyError.response.status) ||
      500;

    let message = '请求失败，请稍后重试';
    if (anyError && anyError.message) {
      message = anyError.message;
    }
    if (anyError && anyError.response && anyError.response.data) {
      const data = anyError.response.data;
      if (typeof data === 'string') {
        message = data;
      } else if (data.error) {
        message = data.error.message || data.error || message;
      }
    }

    return res.status(status).json({ error: message });
  }
});

// 新端点：从 UI 截图中提取样式参数（视觉反向工程）
app.post('/api/extract-ui-params', async (req, res) => {
  try {
    const { imageUrl } = req.body || {};

    const validationError = validateImageUrl(imageUrl);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    if (!apiKey) {
      return res.status(500).json({ error: '未配置 ARK_API_KEY' });
    }

    // 专门的 UI 参数提取 Prompt
    const extractPrompt = `你是一位专业的 UI 设计分析师。请仔细观察这张 UI 截图，并提取以下样式参数（返回标准 JSON 格式）：

{
  "圆角": {
    "卡片圆角": "rounded-2xl 或其他 Tailwind 类名",
    "按钮圆角": "rounded-3xl 或其他",
    "输入框圆角": "rounded-xl 或其他"
  },
  "间距": {
    "容器内边距": "p-8 或其他",
    "元素间距": "gap-6 或 space-y-4 等"
  },
  "配色": {
    "主色": "indigo-500 或其他颜色",
    "背景色": "zinc-950 或其他",
    "文字透明度": "text-white/60 或其他"
  },
  "阴影": {
    "卡片阴影": "shadow-[0_20px_50px_rgba(0,0,0,0.3)] 或其他",
    "按钮阴影": "shadow-[0_10px_30px_rgba(99,102,241,0.3)] 或其他"
  },
  "背景效果": {
    "毛玻璃": "bg-white/5 backdrop-blur-xl 或其他"
  },
  "字体": {
    "标题": "text-3xl font-semibold tracking-tight 或其他",
    "正文": "text-base leading-relaxed 或其他"
  },
  "交互动画": {
    "悬停": "hover:scale-[1.02] transition-transform duration-300 或其他",
    "点击": "active:scale-95 或其他"
  }
}

请根据截图中实际看到的 UI 元素，尽可能准确地推断出对应的 Tailwind CSS 类名。如果某个参数无法从截图中判断，可以给出合理的推荐值。
**只返回 JSON，不要有任何额外的文字说明。**`;

    const result = await callDoubaoVision({
      imageUrl: imageUrl.trim(),
      question: extractPrompt,
    });

    // 尝试从返回的文本中解析 JSON
    let parsedParams = null;
    try {
      // 如果 result.text 包含 markdown 代码块，提取其中的 JSON
      const jsonMatch = result.text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonText = jsonMatch ? jsonMatch[1] : result.text;
      parsedParams = JSON.parse(jsonText.trim());
    } catch (parseError) {
      console.warn('[AI] 返回内容不是有效 JSON，返回原始文本供前端处理');
    }

    return res.json({
      params: parsedParams,
      rawText: result.text,
      raw: result.raw,
    });
  } catch (error) {
    console.error('[AI] /api/extract-ui-params 调用失败：', error);

    const anyError = error;
    const status =
      (anyError && anyError.status) ||
      (anyError && anyError.response && anyError.response.status) ||
      500;

    let message = '提取 UI 参数失败，请稍后重试';
    if (anyError && anyError.message) {
      message = anyError.message;
    }
    if (anyError && anyError.response && anyError.response.data) {
      const data = anyError.response.data;
      if (typeof data === 'string') {
        message = data;
      } else if (data.error) {
        message = data.error.message || data.error || message;
      }
    }

    return res.status(status).json({ error: message });
  }
});

// ==================== 项目管理路由 ====================

/**
 * 获取所有项目列表（包含每个项目关联的配置数量）
 * GET /api/projects
 */
app.get('/api/projects', async (req, res) => {
  try {
    const result = await query(
      `SELECT p.*, COALESCE(cnt.preset_count, 0)::int AS preset_count
       FROM projects p
       LEFT JOIN (
         SELECT project_id, COUNT(*) AS preset_count
         FROM ui_presets
         WHERE project_id IS NOT NULL
         GROUP BY project_id
       ) cnt ON cnt.project_id = p.id
       ORDER BY p.updated_at DESC`
    );

    return res.json({
      success: true,
      projects: result.rows,
    });
  } catch (error) {
    console.error('[API] 获取项目列表失败:', error);
    return res.status(500).json({ error: '获取项目列表失败：' + error.message });
  }
});

/**
 * 创建项目
 * POST /api/projects
 * Body: { name, description }
 */
app.post('/api/projects', async (req, res) => {
  try {
    const { name, description } = req.body || {};

    if (!name || !name.trim()) {
      return res.status(400).json({ error: '项目名称不能为空' });
    }

    const result = await query(
      `INSERT INTO projects (name, description) VALUES ($1, $2) RETURNING *`,
      [name.trim(), description || null]
    );

    return res.json({
      success: true,
      project: result.rows[0],
    });
  } catch (error) {
    console.error('[API] 创建项目失败:', error);
    return res.status(500).json({ error: '创建项目失败：' + error.message });
  }
});

/**
 * 更新项目
 * PUT /api/projects/:id
 */
app.put('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body || {};

    if (!name || !name.trim()) {
      return res.status(400).json({ error: '项目名称不能为空' });
    }

    const result = await query(
      `UPDATE projects SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *`,
      [name.trim(), description || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '项目不存在' });
    }

    return res.json({
      success: true,
      project: result.rows[0],
    });
  } catch (error) {
    console.error('[API] 更新项目失败:', error);
    return res.status(500).json({ error: '更新项目失败：' + error.message });
  }
});

/**
 * 删除项目
 * DELETE /api/projects/:id
 */
app.delete('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 将关联的配置设为未分类
    await query('UPDATE ui_presets SET project_id = NULL WHERE project_id = $1', [id]);

    const result = await query('DELETE FROM projects WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '项目不存在' });
    }

    return res.json({
      success: true,
      message: '项目已删除',
    });
  } catch (error) {
    console.error('[API] 删除项目失败:', error);
    return res.status(500).json({ error: '删除项目失败：' + error.message });
  }
});

// ==================== 配置管理路由 ====================

/**
 * 保存配置到数据库
 * POST /api/presets
 * Body: { preset_name, description, config_data, project_id? }
 */
app.post('/api/presets', async (req, res) => {
  try {
    const { preset_name, description, config_data, project_id } = req.body;

    if (!preset_name || !preset_name.trim()) {
      return res.status(400).json({ error: '配置名称不能为空' });
    }

    if (!config_data || typeof config_data !== 'object') {
      return res.status(400).json({ error: '配置数据格式不正确' });
    }

    // 生成完整的 Prompt（基于配置数据）
    const full_prompt = generatePromptFromConfig(config_data);

    const result = await query(
      `INSERT INTO ui_presets (preset_name, description, config_data, full_prompt, project_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [preset_name.trim(), description || null, JSON.stringify(config_data), full_prompt, project_id || null]
    );

    return res.json({
      success: true,
      preset: result.rows[0],
    });
  } catch (error) {
    console.error('[API] 保存配置失败:', error);
    return res.status(500).json({ error: '保存配置失败：' + error.message });
  }
});

/**
 * 保存 AI 提取的 JSON 参数为一个新的预设
 * POST /api/vision-presets
 * Body: { aiExtractedData, themeName, project_id? }
 */
app.post('/api/vision-presets', async (req, res) => {
  try {
    const { aiExtractedData, themeName, project_id } = req.body || {};

    if (!themeName || !themeName.trim()) {
      return res.status(400).json({ error: '缺少方案名称 themeName' });
    }

    if (!aiExtractedData || typeof aiExtractedData !== 'object') {
      return res.status(400).json({ error: '缺少或非法的 aiExtractedData' });
    }

    const configToSave = normalizeAiExtractedData(aiExtractedData);
    const fullPrompt = buildSystemPromptFromExtracted(configToSave);

    const result = await query(
      `INSERT INTO ui_presets (preset_name, description, config_data, full_prompt, project_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        themeName.trim(),
        '来自 AI 参数提取的配置',
        JSON.stringify(configToSave),
        fullPrompt,
        project_id || null,
      ]
    );

    return res.json({
      success: true,
      preset: result.rows[0],
    });
  } catch (error) {
    console.error('[API] 保存 AI 提取配置失败:', error);
    return res.status(500).json({ error: '保存 AI 提取配置失败：' + error.message });
  }
});

/**
 * 获取所有配置列表（支持按项目筛选）
 * GET /api/presets
 * Query: project_id (可选，不传或为空则返回全部)
 */
app.get('/api/presets', async (req, res) => {
  try {
    const { project_id } = req.query;

    let sql = 'SELECT id, preset_name, description, project_id, created_at, updated_at FROM ui_presets';
    const params = [];

    if (project_id && project_id !== '' && project_id !== 'null') {
      sql += ' WHERE project_id = $1';
      params.push(project_id);
    }

    sql += ' ORDER BY created_at DESC';

    const result = await query(sql, params);

    return res.json({
      success: true,
      presets: result.rows,
    });
  } catch (error) {
    console.error('[API] 获取配置列表失败:', error);
    return res.status(500).json({ error: '获取配置列表失败：' + error.message });
  }
});

/**
 * 获取单个配置详情
 * GET /api/presets/:id
 */
app.get('/api/presets/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT * FROM ui_presets WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '配置不存在' });
    }

    return res.json({
      success: true,
      preset: result.rows[0],
    });
  } catch (error) {
    console.error('[API] 获取配置详情失败:', error);
    return res.status(500).json({ error: '获取配置详情失败：' + error.message });
  }
});

/**
 * 更新配置
 * PUT /api/presets/:id
 */
app.put('/api/presets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { preset_name, description, config_data, project_id } = req.body;

    if (!preset_name || !preset_name.trim()) {
      return res.status(400).json({ error: '配置名称不能为空' });
    }

    if (!config_data || typeof config_data !== 'object') {
      return res.status(400).json({ error: '配置数据格式不正确' });
    }

    const full_prompt = generatePromptFromConfig(config_data);

    const result = await query(
      `UPDATE ui_presets 
       SET preset_name = $1, description = $2, config_data = $3, full_prompt = $4, project_id = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [preset_name.trim(), description || null, JSON.stringify(config_data), full_prompt, project_id || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '配置不存在' });
    }

    return res.json({
      success: true,
      preset: result.rows[0],
    });
  } catch (error) {
    console.error('[API] 更新配置失败:', error);
    return res.status(500).json({ error: '更新配置失败：' + error.message });
  }
});

/**
 * 删除配置
 * DELETE /api/presets/:id
 */
app.delete('/api/presets/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM ui_presets WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '配置不存在' });
    }

    return res.json({
      success: true,
      message: '配置已删除',
    });
  } catch (error) {
    console.error('[API] 删除配置失败:', error);
    return res.status(500).json({ error: '删除配置失败：' + error.message });
  }
});

/**
 * 克隆配置
 * POST /api/presets/:id/clone
 * Body: { newName, project_id? }
 */
app.post('/api/presets/:id/clone', async (req, res) => {
  try {
    const { id } = req.params;
    const { newName, project_id } = req.body || {};

    if (!newName || !newName.trim()) {
      return res.status(400).json({ error: '缺少新名称 newName' });
    }

    // 如果指定了 project_id，克隆到目标项目；否则保留原项目
    let sql, params;
    if (project_id !== undefined) {
      sql = `INSERT INTO ui_presets (preset_name, description, config_data, full_prompt, project_id)
             SELECT $1, description, config_data, full_prompt, $3
             FROM ui_presets
             WHERE id = $2
             RETURNING *`;
      params = [newName.trim(), id, project_id || null];
    } else {
      sql = `INSERT INTO ui_presets (preset_name, description, config_data, full_prompt, project_id)
             SELECT $1, description, config_data, full_prompt, project_id
             FROM ui_presets
             WHERE id = $2
             RETURNING *`;
      params = [newName.trim(), id];
    }

    const result = await query(sql, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '源配置不存在' });
    }

    return res.json({
      success: true,
      preset: result.rows[0],
    });
  } catch (error) {
    console.error('[API] 克隆配置失败:', error);
    return res.status(500).json({ error: '克隆配置失败：' + error.message });
  }
});

/**
 * 将配置关联到项目
 * PUT /api/presets/:id/project
 * Body: { project_id }
 */
app.put('/api/presets/:id/project', async (req, res) => {
  try {
    const { id } = req.params;
    const { project_id } = req.body || {};

    const result = await query(
      `UPDATE ui_presets SET project_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [project_id || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '配置不存在' });
    }

    return res.json({
      success: true,
      preset: result.rows[0],
    });
  } catch (error) {
    console.error('[API] 关联项目失败:', error);
    return res.status(500).json({ error: '关联项目失败：' + error.message });
  }
});

// ==================== 文件导出/写回路由 ====================

/**
 * 将内容写入本地文件（相对于项目根目录）
 * POST /api/export/write
 * Body: { filePath, content }
 */
app.post('/api/export/write', async (req, res) => {
  try {
    const { filePath, content } = req.body || {};

    if (!filePath || !filePath.trim()) {
      return res.status(400).json({ error: '文件路径不能为空' });
    }

    if (typeof content !== 'string') {
      return res.status(400).json({ error: '文件内容必须是字符串' });
    }

    // 安全检查：不允许向上遍历目录
    const normalizedPath = path.normalize(filePath.trim());
    if (normalizedPath.startsWith('..') || path.isAbsolute(normalizedPath)) {
      return res.status(400).json({ error: '不允许使用绝对路径或向上遍历（..）' });
    }

    // 黑名单文件（防止覆盖关键文件）
    const blacklist = ['.env', 'package.json', 'package-lock.json', 'node_modules'];
    const baseName = path.basename(normalizedPath);
    if (blacklist.includes(baseName) || normalizedPath.includes('node_modules')) {
      return res.status(400).json({ error: `不允许写入 ${baseName}（安全限制）` });
    }

    const fullPath = path.resolve(process.cwd(), normalizedPath);

    // 确保目标目录存在
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(fullPath, content, 'utf-8');

    console.log(`[Export] 已写入文件: ${fullPath}`);

    return res.json({
      success: true,
      filePath: normalizedPath,
      fullPath,
    });
  } catch (error) {
    console.error('[Export] 文件写入失败:', error);
    return res.status(500).json({ error: '文件写入失败：' + error.message });
  }
});

/**
 * 根据配置数据生成完整的 Prompt
 */
function generatePromptFromConfig(configData) {
  const dimensions = Object.keys(configData);
  let prompt = 'UI 参数配置：\n\n';

  dimensions.forEach((dimension) => {
    const items = configData[dimension];
    if (Array.isArray(items) && items.length > 0) {
      prompt += `【${dimension}】\n`;
      items.forEach((item) => {
        if (item.promptFragment) {
          prompt += `- ${item.promptFragment}\n`;
        }
      });
      prompt += '\n';
    }
  });

  return prompt.trim();
}

// 兜底错误处理中间件：确保所有未捕获错误也以 JSON 形式返回
app.use((err, req, res, next) => {
  console.error('[AI] 未捕获的服务器错误：', err);
  if (res.headersSent) {
    return next(err);
  }
  return res.status(500).json({
    error: '服务器内部错误，请稍后重试',
  });
});

app.listen(port, () => {
  console.log(`[AI] 服务已启动: http://localhost:${port}`);
});
