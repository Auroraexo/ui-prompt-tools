import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'postgres',  // 先连接默认数据库
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  connectionTimeoutMillis: 5000,
});

async function testConnection() {
  console.log('🔗 正在测试远程数据库连接...\n');
  console.log('📋 连接信息:');
  console.log(`   主机: ${process.env.POSTGRES_HOST || '未配置'}`);
  console.log(`   端口: ${process.env.POSTGRES_PORT || '5432'}`);
  console.log(`   数据库: ${process.env.POSTGRES_DB || 'ui_tools'}`);
  console.log(`   用户: ${process.env.POSTGRES_USER || '未配置'}`);
  console.log('');

  try {
    console.log('⏳ 正在连接...');
    const client = await pool.connect();
    console.log('✅ 连接成功！\n');

    // 查询 PostgreSQL 版本
    const versionResult = await client.query('SELECT version()');
    console.log('📊 PostgreSQL 版本:');
    console.log(`   ${versionResult.rows[0].version}\n`);

    // 检查 ui_tools 数据库是否存在
    const dbCheckResult = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [process.env.POSTGRES_DB || 'ui_tools']
    );

    if (dbCheckResult.rows.length > 0) {
      console.log(`✅ 数据库 "${process.env.POSTGRES_DB || 'ui_tools'}" 已存在`);
      
      // 连接到目标数据库检查表
      client.release();
      const targetPool = new Pool({
        host: process.env.POSTGRES_HOST,
        port: parseInt(process.env.POSTGRES_PORT || '5432'),
        database: process.env.POSTGRES_DB || 'ui_tools',
        user: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
      });
      
      const targetClient = await targetPool.connect();
      const tableCheckResult = await targetClient.query(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ui_presets')"
      );
      
      if (tableCheckResult.rows[0].exists) {
        console.log('✅ 表 "ui_presets" 已存在\n');
        
        // 查询表中的记录数
        const countResult = await targetClient.query('SELECT COUNT(*) FROM ui_presets');
        console.log(`📊 当前配置数量: ${countResult.rows[0].count}\n`);
      } else {
        console.log('⚠️  表 "ui_presets" 不存在');
        console.log('💡 请运行: npm run db:init\n');
      }
      
      targetClient.release();
      await targetPool.end();
    } else {
      console.log(`⚠️  数据库 "${process.env.POSTGRES_DB || 'ui_tools'}" 不存在`);
      console.log('\n💡 请在服务器上创建数据库:');
      console.log(`   docker exec -it <container_name> psql -U postgres -c "CREATE DATABASE ${process.env.POSTGRES_DB || 'ui_tools'};"\n`);
      client.release();
    }

    await pool.end();
    
    console.log('✅ 测试完成！数据库连接正常。');
    console.log('\n🚀 下一步: npm run db:init && npm run dev:all');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ 连接失败:', error.message);
    console.error('\n🔍 可能的原因:');
    console.error('   1. 服务器防火墙未开放 5432 端口');
    console.error('   2. PostgreSQL 容器未启动');
    console.error('   3. .env 文件中的密码不正确');
    console.error('   4. PostgreSQL 未配置允许远程连接\n');
    console.error('📚 详细排查步骤见: docs/远程数据库连接指南.md\n');
    process.exit(1);
  }
}

testConnection();
