import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './pool.js';

const migrationDir = fileURLToPath(new URL('../../sql/migrations/', import.meta.url));

export async function runMigrations() {
  await pool.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  const files = (await readdir(migrationDir)).filter((file) => file.endsWith('.sql')).sort();
  for (const file of files) {
    const [[applied]] = await pool.query('SELECT version FROM schema_migrations WHERE version = ?', [file]);
    if (applied) continue;
    const sql = await readFile(path.join(migrationDir, file), 'utf8');
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      for (const statement of sql.split(/;\s*(?:\r?\n|$)/).map((item) => item.trim()).filter(Boolean)) {
        await connection.query(statement);
      }
      await connection.query('INSERT INTO schema_migrations (version) VALUES (?)', [file]);
      await connection.commit();
      console.log(`Applied database migration: ${file}`);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}
