#!/usr/bin/env node
// 样式覆盖校验：模板里用到的 class，theme.css 里必须有定义。
//
// 全站 94% 的样式集中在 src/styles/theme.css 一个文件里，模板本身不带样式。
// 所以改 theme.css 时最容易出的错，就是顺手删掉（或改名）某个类，而对应的地方
// 在页面上直接裸奔 —— 构建不会报错，只有肉眼能看出来。这个脚本把那一步变成可校验的。
//
// 用法：npm run check:styles

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const srcDir = join(root, 'src');
const themeFile = join(srcDir, 'styles', 'theme.css');

// 模板里靠运行时拼出来的类，静态扫不到。这里登记前缀，展开成 CSS 里的实际类名。
// 例如 `task-status-${row.status}` 覆盖 task-status-todo / task-status-done ...
const DYNAMIC_PREFIXES = [
  'dashboard-stat-',
  'milestone-status-',
  'project-priority-',
  'project-status-',
  'task-priority-',
  'task-status-',
  'user-role-',
  'user-status-'
];

// 由 ui-preferences.js 在 .app-shell 上挂的偏好类，同样扫不到
const PREFERENCE_CLASSES = [
  'density-comfortable',
  'density-compact',
  'density-spacious',
  'modern-visual-enabled',
  'modern-visual-disabled',
  'sidebar-compact-enabled',
  'sidebar-compact-disabled',
  'topbar-fixed-enabled',
  'topbar-fixed-disabled',
  'zebra-table-enabled',
  'zebra-table-disabled',
  'card-shadow-enabled',
  'card-shadow-disabled',
  'status-contrast-enabled',
  'status-contrast-disabled'
];

// Element Plus 在运行时加的状态类，不由我们定义
const RUNTIME_CLASSES = ['is-focus', 'is-focused', 'is-light', 'router-link-active'];

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return walk(full);
    return full.endsWith('.vue') ? [full] : [];
  });
}

// 剥掉 <style> 和 <script>，剩下的就是模板区。
// 不能简单地匹配 <template>...</template>：模板里嵌套的 <template #dropdown>
// 会让非贪婪匹配提前结束，把后面的内容整段漏掉。
function templateOf(text) {
  return text
    .replace(/<style[^>]*>[\s\S]*?<\/style>/g, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/g, '');
}

const used = new Map();
for (const file of walk(srcDir)) {
  const body = templateOf(readFileSync(file, 'utf8'));
  const where = relative(root, file);

  const record = (value) => {
    for (const name of value.split(/\s+/).filter(Boolean)) {
      if (!used.has(name)) used.set(name, new Set());
      used.get(name).add(where);
    }
  };

  // 静态 class="..."。前面的 (?<!:) 是为了排掉 :class="..." —— 否则绑定表达式
  // （`task-status-${row.status}`、对象字面量里的 { } 之类）会被当成类名。
  for (const [, value] of body.matchAll(/(?<!:)class="([^"]*)"/g)) {
    record(value);
  }

  // :class 绑定里写成字符串字面量的静态类，例如 :class="['page-card', {...}]"
  for (const [, value] of body.matchAll(/:class="([^"]*)"/g)) {
    for (const literal of value.matchAll(/'([^']*)'/g)) {
      record(literal[1]);
    }
  }
}

const css = readFileSync(themeFile, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const defined = new Set();
for (const [, name] of css.matchAll(/\.([a-zA-Z][\w-]*)/g)) {
  defined.add(name);
}

const dynamic = new Set([...DYNAMIC_PREFIXES, ...PREFERENCE_CLASSES, ...RUNTIME_CLASSES]);
const missing = [...used.entries()]
  .filter(([name]) => !defined.has(name) && !dynamic.has(name))
  .sort(([a], [b]) => a.localeCompare(b));

// 反向：CSS 里定义了但模板（含动态前缀展开）从没用过的类
const reachable = new Set(used.keys());
for (const prefix of DYNAMIC_PREFIXES) {
  for (const name of defined) {
    if (name.startsWith(prefix)) reachable.add(name);
  }
}
for (const name of PREFERENCE_CLASSES) reachable.add(name);

const unused = [...defined]
  .filter((name) => !name.startsWith('el-') && !reachable.has(name))
  .sort();

console.log(`模板类 ${used.size} 个 · theme.css 定义 ${defined.size} 个`);
console.log(`\n未定义的模板类（${missing.length}）`);
for (const [name, files] of missing) {
  console.log(`  ${name}  ← ${[...files].join(', ')}`);
}

if (process.argv.includes('--list-unused')) {
  console.log(`\n定义了但没人用（${unused.length}，仅供参考，不判失败）`);
  console.log('  ' + unused.join(', '));
}

if (missing.length > 0) {
  console.error(`\n✗ 有 ${missing.length} 个类在 theme.css 里没有定义`);
  process.exit(1);
}
console.log('\n✓ 模板用到的类都有样式定义');
