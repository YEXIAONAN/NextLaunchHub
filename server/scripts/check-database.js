import { env } from '../src/config/env.js';
import { pool } from '../src/db/pool.js';

try {
  await pool.query('SELECT 1');
  console.log(`数据库连接正常：${env.dbHost}:${env.dbPort}/${env.dbName}`);
} catch (error) {
  console.error(`无法连接数据库：${env.dbHost}:${env.dbPort}/${env.dbName}`);
  console.error(`原因：${error.code || error.message}`);
  console.error('请检查 MySQL 是否启动、server/.env 配置是否正确，以及内网或 VPN 是否已连接。');
  process.exitCode = 1;
} finally {
  await pool.end();
}
