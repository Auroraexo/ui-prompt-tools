import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'ui_tools',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || '',
});

async function verifyImport() {
  console.log('🔍 正在验证数据库导入...\n');

  try {
    const client = await pool.connect();
    
    // 查询总数
    const countResult = await client.query('SELECT COUNT(*) FROM ui_presets');
    const count = parseInt(countResult.rows[0].count);
    console.log(`📊 数据库中共有 ${count} 条配置\n`);
    
    // 查询所有配置
    const result = await client.query(
      'SELECT id, preset_name, description, created_at FROM ui_presets ORDER BY id'
    );
    
    console.log('📋 配置列表：');
    console.log('─'.repeat(80));
    result.rows.forEach(row => {
      console.log(`ID: ${row.id}`);
      console.log(`名称: ${row.preset_name}`);
      console.log(`描述: ${row.description || '无'}`);
      console.log(`创建时间: ${row.created_at}`);
      console.log('─'.repeat(80));
    });
    
    // 查询第一条配置的详细信息
    if (count > 0) {
      const detailResult = await client.query(
        'SELECT * FROM ui_presets WHERE id = 1'
      );
      
      if (detailResult.rows.length > 0) {
        const preset = detailResult.rows[0];
        console.log('\n📝 第一条配置详情：');
        console.log('─'.repeat(80));
        console.log(`配置名称: ${preset.preset_name}`);
        console.log(`配置维度数量: ${Object.keys(preset.config_data).length}`);
        console.log(`配置维度: ${Object.keys(preset.config_data).join(', ')}`);
        console.log(`\n生成的提示词预览（前200字符）:`);
        console.log(preset.full_prompt.substring(0, 200) + '...');
        console.log('─'.repeat(80));
      }
    }
    
    client.release();
    await pool.end();
    
    console.log('\n✅ 验证完成！数据库导入成功！');
    
  } catch (error) {
    console.error('❌ 验证失败:', error.message);
    process.exit(1);
  }
}

verifyImport();
