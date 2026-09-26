import crypto from 'node:crypto';
import { pool } from '../db/pool.js';

// 单号格式：HLP + 年月日(8位) + 当日流水号(4位) + 随机码(8位)，例如 HLP202603200001K7M2QX9T
//
// 随机码是安全需求，不是美观需求：公开查询接口只凭「单号 + 发起人姓名」定位记录，
// 而姓名列表本身是公开的，流水号又是连续可枚举的。没有随机码，任何人都能扫出全部求助单。
const RANDOM_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'; // 去掉 0/O/1/I/L 等易混字符
const RANDOM_LENGTH = 8;
const DATE_PREFIX_LENGTH = 11; // 'HLP' 3 位 + 年月日 8 位
const SEQ_LENGTH = 4;

function formatDate(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}${month}${day}`;
}

function randomSuffix(length = RANDOM_LENGTH) {
  let result = '';
  for (let index = 0; index < length; index += 1) {
    result += RANDOM_ALPHABET[crypto.randomInt(RANDOM_ALPHABET.length)];
  }
  return result;
}

export async function generateRequestNo(connection = pool) {
  const now = new Date();
  const datePart = formatDate(now);
  const prefix = `HLP${datePart}`;
  // 先按长度再按字典序，保证取到的是带随机码的新格式单号（历史数据是没有随机码的旧格式）
  const [rows] = await connection.query(
    `SELECT request_no
     FROM help_requests
     WHERE request_no LIKE ?
     ORDER BY LENGTH(request_no) DESC, request_no DESC
     LIMIT 1`,
    [`${prefix}%`]
  );

  let nextSeq = 1;
  if (rows.length > 0) {
    const currentSeq = Number(rows[0].request_no.slice(DATE_PREFIX_LENGTH, DATE_PREFIX_LENGTH + SEQ_LENGTH));
    if (Number.isInteger(currentSeq) && currentSeq > 0) {
      nextSeq = currentSeq + 1;
    }
  }

  return `${prefix}${String(nextSeq).padStart(SEQ_LENGTH, '0')}${randomSuffix()}`;
}
