import { query } from './db.js';

/**
 * 数据库初始化脚本
 * 创建所有必要的表和索引
 */
async function initDatabase() {
  console.log('[DB] 开始初始化数据库...');

  try {
    // ==================== 1. 创建 projects 表 ====================
    const createProjectsTableSQL = `
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await query(createProjectsTableSQL);
    console.log('[DB] ✅ 表 projects 已创建或已存在');

    // ==================== 2. 创建 ui_presets 表 ====================
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ui_presets (
        id SERIAL PRIMARY KEY,
        preset_name VARCHAR(255) NOT NULL,
        description TEXT,
        config_data JSONB NOT NULL,
        full_prompt TEXT,
        project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await query(createTableSQL);
    console.log('[DB] ✅ 表 ui_presets 已创建或已存在');

    // ==================== 3. 安全地添加 project_id 列（如果表已存在但缺少该列） ====================
    const addProjectIdColumnSQL = `
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'ui_presets' AND column_name = 'project_id'
        ) THEN
          ALTER TABLE ui_presets ADD COLUMN project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL;
        END IF;
      END
      $$;
    `;
    await query(addProjectIdColumnSQL);
    console.log('[DB] ✅ ui_presets.project_id 列已确认存在');

    // ==================== 4. 创建索引 ====================
    const createIndexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_preset_name 
      ON ui_presets(preset_name);
      
      CREATE INDEX IF NOT EXISTS idx_config_data 
      ON ui_presets USING GIN (config_data);
      
      CREATE INDEX IF NOT EXISTS idx_preset_project_id
      ON ui_presets(project_id);

      CREATE INDEX IF NOT EXISTS idx_project_name
      ON projects(name);
    `;
    await query(createIndexesSQL);
    console.log('[DB] ✅ 索引已创建');

    // ==================== 5. 检查数据 ====================
    const projectCount = await query('SELECT COUNT(*) FROM projects');
    const presetCount = await query('SELECT COUNT(*) FROM ui_presets');
    console.log(`[DB] 当前项目数量: ${projectCount.rows[0].count}`);
    console.log(`[DB] 当前配置数量: ${presetCount.rows[0].count}`);

    if (parseInt(presetCount.rows[0].count) === 0) {
      console.log('[DB] 提示：数据库为空，你可以通过前端界面保存第一个配置方案');
    }

    console.log('[DB] ✅ 数据库初始化完成！');
    process.exit(0);
  } catch (error) {
    console.error('[DB] ❌ 数据库初始化失败:', error);
    console.error('\n请检查：');
    console.error('1. PostgreSQL 服务是否已启动？');
    console.error('2. .env 文件中的数据库配置是否正确？');
    console.error('3. 数据库 ui_tools 是否已创建？（可以手动创建：CREATE DATABASE ui_tools;）');
    process.exit(1);
  }
}

initDatabase();
