import { pool } from '../db/pool.js';

export async function searchRequesters(keyword = '') {
  const [rows] = await pool.query(
    `SELECT id, real_name
     FROM users
     WHERE role = 'requester'
       AND status = 1
       AND real_name LIKE ?
     ORDER BY real_name ASC
     LIMIT 20`,
    [`%${keyword}%`]
  );
  return rows;
}

export async function searchHelpers(keyword = '') {
  const [rows] = await pool.query(
    `SELECT id, real_name, username
     FROM users
     WHERE role = 'helper'
       AND status = 1
       AND real_name LIKE ?
     ORDER BY real_name ASC
     LIMIT 20`,
    [`%${keyword}%`]
  );
  return rows;
}
