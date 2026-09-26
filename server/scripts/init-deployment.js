// 部署初始化：把仓库里公开的示例密码换掉。
//
// 用法（由 start/docker-unix.sh 在容器启动后自动调用）：
//   INIT_ADMIN_PASSWORD=<新密码> node scripts/init-deployment.js
//
// 背景：server/sql/seed.sql 是给本地开发用的演示数据，里面所有账号的密码都是
// 明文写在公开仓库里的 123456，而一键部署会把它一起导入。
//
// 这个脚本是幂等的，每次启动都可以跑：
//   - 管理员密码还停在示例密码时，才改成 INIT_ADMIN_PASSWORD（改过就不会再覆盖）
//   - 需要强制重置时，设置 RESET_ADMIN_PASSWORD=true
//   - 其他仍在用示例密码的账号一律禁止登录（管理员可在「用户管理」里重设密码后重新启用）
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { pool } from '../src/db/pool.js';

// seed.sql 里所有演示账号共用的那个 bcrypt 哈希（对应明文 123456）
const DEMO_PASSWORD_HASH = '$2b$10$Wdj1lOudt3JXEc6TBI2C6.Wafuv33FRdv9jRd9qtVdPYWmKmbtiTm';
const MIN_PASSWORD_LENGTH = 8;
const GENERATED_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

function generatePassword(length = 16) {
  let result = '';
  for (let index = 0; index < length; index += 1) {
    result += GENERATED_ALPHABET[crypto.randomInt(GENERATED_ALPHABET.length)];
  }
  return result;
}

let adminPassword = (process.env.INIT_ADMIN_PASSWORD || '').trim();
let generatedPassword = false;
const forceReset = process.env.RESET_ADMIN_PASSWORD === 'true';

try {
  const [[admin]] = await pool.query(
    `SELECT id, username, password
     FROM users
     WHERE role = 'admin'
     ORDER BY id ASC
     LIMIT 1`
  );

  if (!admin) {
    throw new Error('没有找到 role = admin 的账号');
  }

  const usingDemoPassword = admin.password === DEMO_PASSWORD_HASH;

  if (usingDemoPassword || forceReset) {
    if (!adminPassword) {
      // 没配 ADMIN_PASSWORD 时绝不能把管理员留在公开的示例密码上，现生成一个
      adminPassword = generatePassword();
      generatedPassword = true;
    }

    if (adminPassword.length < MIN_PASSWORD_LENGTH) {
      console.error(`ADMIN_PASSWORD 至少需要 ${MIN_PASSWORD_LENGTH} 位，未修改管理员密码。`);
      process.exitCode = 1;
    } else {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await pool.query(
        `UPDATE users
         SET password = ?, updated_at = NOW()
         WHERE id = ?`,
        [hashedPassword, admin.id]
      );

      if (generatedPassword) {
        console.log('没有配置 ADMIN_PASSWORD，已自动生成一个随机密码（会出现在容器日志里，请尽快保存并改用自己的密码）：');
        console.log(`    管理员密码：${adminPassword}`);
      } else {
        console.log(`已把管理员 ${admin.username} 的密码从示例密码改成 .env 里的 ADMIN_PASSWORD。`);
      }
    }
  } else {
    console.log(`管理员 ${admin.username} 已使用自定义密码，保持不变。`);
  }

  // 仍在用公开示例密码的账号一律禁止登录，避免留下后门
  const [toDisable] = await pool.query(
    `SELECT id, username, real_name
     FROM users
     WHERE can_login = 1
       AND role <> 'admin'
       AND password = ?
     ORDER BY id ASC`,
    [DEMO_PASSWORD_HASH]
  );

  if (toDisable.length > 0) {
    await pool.query(
      `UPDATE users
       SET can_login = 0, updated_at = NOW()
       WHERE id IN (?)`,
      [toDisable.map((row) => row.id)]
    );
    console.log(`已禁止 ${toDisable.length} 个仍在用示例密码的账号登录：${toDisable.map((row) => `${row.username}(${row.real_name})`).join('、')}`);
    console.log('需要这些账号时，请用管理员在「用户管理」里重设密码并重新启用登录。');
  } else {
    console.log('没有仍在用示例密码的账号。');
  }
} catch (error) {
  console.error(`初始化失败：${error.message}`);
  process.exitCode = 1;
} finally {
  await pool.end();
}
