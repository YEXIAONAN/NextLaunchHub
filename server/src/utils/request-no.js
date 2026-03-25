import { pool } from '../db/pool.js';

function formatDate(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}${month}${day}`;
}

export async function generateRequestNo(connection = pool) {
  const now = new Date();
  const datePart = formatDate(now);
  const prefix = `HLP${datePart}`;
  const [rows] = await connection.query(
    'SELECT request_no FROM help_requests WHERE request_no LIKE ? ORDER BY request_no DESC LIMIT 1',
    [`${prefix}%`]
  );

  let nextSeq = 1;
  if (rows.length > 0) {
    const currentNo = rows[0].request_no;
    nextSeq = Number(currentNo.slice(-4)) + 1;
  }

  return `${prefix}${String(nextSeq).padStart(4, '0')}`;
}
