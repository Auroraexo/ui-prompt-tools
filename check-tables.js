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

async function checkTables() {
  console.log('🔍 正在查询数据库表信息...\n');

  try {
    const client = await pool.connect();
    
    // 查询所有用户表
    const result = await client.query(`
      SELECT 
        schemaname,
        tablename,
        tableowner
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);
    
    console.log(`📊 数据库 "${process.env.POSTGRES_DB}" 中共有 ${result.rows.length} 个表\n`);
    
    if (result.rows.length > 0) {
      console.log('📋 表列表：');
      console.log('─'.repeat(80));
      result.rows.forEach((row, index) => {
        console.log(`${index + 1}. ${row.tablename}`);
        console.log(`   Schema: ${row.schemaname}`);
        console.log(`   Owner: ${row.tableowner}`);
        console.log('─'.repeat(80));
      });
      
      // 查询每个表的详细信息
      console.log('\n📝 表详细信息：\n');
      
      for (const row of result.rows) {
        const tableName = row.tablename;
        
        // 查询列信息
        const columnsResult = await client.query(`
          SELECT 
            column_name,
            data_type,
            character_maximum_length,
            is_nullable,
            column_default
          FROM information_schema.columns
          WHERE table_schema = 'public' 
            AND table_name = $1
          ORDER BY ordinal_position;
        `, [tableName]);
        
        // 查询行数
        const countResult = await client.query(`SELECT COUNT(*) FROM ${tableName}`);
        const rowCount = countResult.rows[0].count;
        
        console.log(`表名: ${tableName}`);
        console.log(`行数: ${rowCount}`);
        console.log(`列数: ${columnsResult.rows.length}`);
        console.log('列信息:');
        columnsResult.rows.forEach(col => {
          const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
          const maxLength = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
          const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
          console.log(`  - ${col.column_name}: ${col.data_type}${maxLength} ${nullable}${defaultVal}`);
        });
        console.log('═'.repeat(80));
        console.log('');
      }
    } else {
      console.log('⚠️  数据库中没有表');
    }
    
    client.release();
    await pool.end();
    
    console.log('✅ 查询完成！');
    
  } catch (error) {
    console.error('❌ 查询失败:', error.message);
    process.exit(1);
  }
}

checkTables();
