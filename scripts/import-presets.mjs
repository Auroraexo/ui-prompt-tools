import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  database: process.env.POSTGRES_DB || 'ui_tools',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || '',
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

function generatePromptFromConfig(configData) {
  if (!configData || typeof configData !== 'object') return '';

  const dimensions = Object.keys(configData);
  let prompt = 'UI 参数配置：\n\n';

  for (const dimension of dimensions) {
    const items = configData[dimension];
    if (Array.isArray(items) && items.length > 0) {
      prompt += `【${dimension}】\n`;
      for (const item of items) {
        if (item.promptFragment) {
          prompt += `- ${item.promptFragment}\n`;
        } else if (item.cssClass) {
          prompt += `- 使用 ${item.cssClass}\n`;
        }
      }
      prompt += '\n';
    }
  }

  return prompt.trim();
}

async function importPresets() {
  const filePath = path.resolve(process.cwd(), 'presets.json');

  if (!fs.existsSync(filePath)) {
    console.error('❌ 未找到 presets.json 文件，请在项目根目录创建该文件。');
    process.exit(1);
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  let presets;

  try {
    presets = JSON.parse(raw);
  } catch (error) {
    console.error('❌ 解析 presets.json 失败：', error);
    process.exit(1);
  }

  if (!Array.isArray(presets) || presets.length === 0) {
    console.error('⚠️ presets.json 为空或不是数组。');
    process.exit(0);
  }

  console.log(
    `🔄 准备导入 ${presets.length} 条配置到数据库 "${
      process.env.POSTGRES_DB || 'ui_tools'
    }" ...\n`
  );

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const [index, preset] of presets.entries()) {
      if (!preset.preset_name || !preset.config_data) {
        console.warn(
          `⚠️ 第 ${index + 1} 条数据缺少 preset_name 或 config_data，已跳过。`
        );
        continue;
      }

      const fullPrompt = generatePromptFromConfig(preset.config_data);

      const result = await client.query(
        `INSERT INTO ui_presets (preset_name, description, config_data, full_prompt)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [
          preset.preset_name.trim(),
          preset.description || null,
          JSON.stringify(preset.config_data),
          fullPrompt,
        ]
      );

      console.log(`✅ 已导入配置 [${preset.preset_name}] (id=${result.rows[0].id})`);
    }

    await client.query('COMMIT');
    console.log('\n🎉 全部导入完成！');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ 导入过程中出错，已回滚事务：', error);
  } finally {
    client.release();
    await pool.end();
  }
}

importPresets().catch((err) => {
  console.error('❌ 脚本异常退出：', err);
  process.exit(1);
});

