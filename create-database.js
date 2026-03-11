import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// 连接到默认的 postgres 数据库来创建新数据库
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: 'postgres', // 连接到默认数据库
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || '',
  max: 5,
  connectionTimeoutMillis: 5000,
});

async function createDatabase() {
  const dbName = process.env.POSTGRES_DB || 'ui_tools';
  
  console.log('🔗 正在连接到 PostgreSQL 服务器...');
  console.log(`   主机: ${process.env.POSTGRES_HOST}`);
  console.log(`   端口: ${process.env.POSTGRES_PORT}`);
  console.log(`   用户: ${process.env.POSTGRES_USER}`);
  console.log('');

  try {
    const client = await pool.connect();
    console.log('✅ 连接成功！');
    
    // 检查数据库是否已存在
    const checkResult = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );
    
    if (checkResult.rows.length > 0) {
      console.log(`ℹ️  数据库 "${dbName}" 已经存在`);
    } else {
      // 创建数据库
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`✅ 数据库 "${dbName}" 创建成功！`);
    }
    
    client.release();
    await pool.end();
    
    console.log('');
    console.log('🎉 完成！现在可以运行以下命令初始化数据库表：');
    console.log('   npm run db:init');
    
  } catch (error) {
    console.error('❌ 操作失败:', error.message);
    console.error('');
    console.error('🔍 请检查：');
    console.error('   1. PostgreSQL 服务是否正在运行？');
    console.error('   2. .env 文件中的密码是否正确？');
    console.error('   3. 服务器防火墙是否开放 5432 端口？');
    console.error('   4. PostgreSQL 是否配置允许远程连接？');
    console.error('');
    console.error('📚 详细排查步骤见: docs/远程数据库连接指南.md');
    process.exit(1);
  }
}

createDatabase();
