import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// PostgreSQL 连接池配置
// 注意：使用远程数据库时，初次建连可能稍慢，这里适当放宽超时时间
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'ui_tools',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres', // 确保密码是字符串
  max: 20, // 连接池最大连接数
  idleTimeoutMillis: 60000, // 连接空闲 60 秒后回收
  connectionTimeoutMillis: 15000, // 建连超时 15 秒（避免远程连接过快超时）
});

// 测试连接
pool.on('connect', () => {
  console.log('[DB] PostgreSQL 连接池已建立');
});

pool.on('error', (err) => {
  console.error('[DB] PostgreSQL 连接池错误:', err);
});

/**
 * 执行 SQL 查询
 * @param {string} text SQL 查询语句
 * @param {Array} params 查询参数
 * @returns {Promise} 查询结果
 */
export async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('[DB] 查询执行', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('[DB] 查询失败:', error);
    throw error;
  }
}

/**
 * 获取数据库客户端（用于事务）
 */
export async function getClient() {
  const client = await pool.connect();
  return client;
}

export default pool;
