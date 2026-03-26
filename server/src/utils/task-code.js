import { pool } from '../db/pool.js';

function formatDate(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}${month}${day}`;
}

export async function generateTaskCode(connection = pool) {
  const now = new Date();
  const datePart = formatDate(now);
  const prefix = `TSK${datePart}`;
  const [rows] = await connection.query(
    'SELECT task_code FROM tasks WHERE task_code LIKE ? ORDER BY task_code DESC LIMIT 1',
    [`${prefix}%`]
  );

  let nextSeq = 1;
  if (rows.length > 0) {
    nextSeq = Number(rows[0].task_code.slice(-4)) + 1;
  }

  return `${prefix}${String(nextSeq).padStart(4, '0')}`;
}
