# NextLaunch Hub

NextLaunch Hub 是一个前后端分离的最小可用项目，当前已实现以下链路：

- 登录
- 未登录提交求助
- 后台主页统计
- 求助中心列表
- 求助详情
- 状态更新
- 通知与处理日志

技术栈：

- 前端：Vue 3、Vite、Vue Router、Pinia、Element Plus、Axios
- 后端：Node.js、Express、MySQL、mysql2/promise、JWT、bcryptjs、dotenv、cors

## 目录说明

```text
NextLaunchHub
├── README.md
├── server
│   ├── .env.example
│   ├── package.json
│   ├── sql
│   │   ├── schema.sql
│   │   └── seed.sql
│   └── src
└── web
    ├── .env.example
    ├── package.json
    ├── vite.config.js
    └── src
```

## 一、环境准备

请先确认本地已安装以下环境：

- Node.js 18 及以上
- npm 9 及以上
- MySQL 8

可选检查命令：

```bash
node -v
npm -v
mysql --version
```

## 二、初始化数据库

### 1. 创建数据库表

进入项目根目录后执行：

```bash
mysql -uroot -p < server/sql/schema.sql
```

### 2. 导入初始化数据

```bash
mysql -uroot -p < server/sql/seed.sql
```

### 3. 默认数据库名

SQL 中默认使用的数据库名为：

```text
nextlaunch_hub
```

如果你修改了数据库名，需要同步修改后端 `.env` 文件中的 `DB_NAME`。

## 三、配置后端环境变量

进入后端目录：

```bash
cd server
```

复制环境变量模板：

```bash
cp .env.example .env
```

默认配置如下：

```env
PORT=3000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=123456
DB_NAME=nextlaunch_hub
JWT_SECRET=nextlaunch-hub-local-secret
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
```

请按你的本地 MySQL 账号密码修改：

- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`

## 四、安装并启动后端

进入后端目录后执行：

```bash
npm install
```

开发模式启动：

```bash
npm run dev
```

生产模式启动：

```bash
npm start
```

后端默认地址：

```text
http://localhost:3000
```

健康检查接口：

```text
GET http://localhost:3000/api/health
```

## 五、配置前端环境变量

新开一个终端，进入前端目录：

```bash
cd web
```

复制环境变量模板：

```bash
cp .env.example .env
```

默认配置如下：

```env
VITE_API_BASE_URL=/api
```

当前前端已配置 Vite 代理，会把 `/api` 请求转发到：

```text
http://localhost:3000
```

如果你修改了后端端口，请同步修改 [web/vite.config.js](/Users/waiting/Desktop/Project/NextLaunchHub/web/vite.config.js) 中的代理目标地址。

## 六、安装并启动前端

进入前端目录后执行：

```bash
npm install
```

启动开发环境：

```bash
npm run dev
```

前端默认地址：

```text
http://localhost:5173
```

## 七、默认测试账号

初始化数据已写入以下账号，密码均为：

```text
123456
```

管理员账号：

```text
admin
```

帮助人员账号：

```text
helper.chen
helper.lin
helper.zhou
```

## 八、主要接口

后端统一前缀：

```text
/api
```

当前已实现接口：

- `POST /api/auth/login`
- `GET /api/public/requesters?keyword=`
- `GET /api/public/helpers?keyword=`
- `POST /api/public/help-requests`
- `GET /api/help-requests`
- `GET /api/help-requests/:id`
- `PATCH /api/help-requests/:id/status`
- `GET /api/notifications`
- `GET /api/dashboard/overview`

## 九、启动顺序建议

建议按以下顺序启动：

1. 启动 MySQL
2. 执行 `server/sql/schema.sql`
3. 执行 `server/sql/seed.sql`
4. 启动后端服务
5. 启动前端服务
6. 浏览器访问 `http://localhost:5173`

## 十、本地联调检查清单

### 1. 登录检查

- 打开 `http://localhost:5173/login`
- 使用 `admin / 123456` 登录
- 登录成功后应跳转到 `/dashboard`

### 2. 后台主页检查

- 顶部栏正常显示系统名称
- 左侧菜单正常显示
- 四个统计卡片正常显示数量
- 最近 5 条求助记录可以加载

### 3. 提交求助检查

- 打开 `http://localhost:5173/help-request`
- 发起人姓名可通过后端检索
- 帮助人员可通过后端检索
- 提交成功后弹窗显示求助单号

### 4. 列表权限检查

使用 `helper.chen / 123456` 登录：

- 进入 `/help-center`
- 只能看到分配给陈志远的求助单

使用 `admin / 123456` 登录：

- 进入 `/help-center`
- 可以看到全部求助单

### 5. 详情与状态检查

- 点击列表中的“查看详情”
- 详情页能显示完整字段
- 点击“标记为处理中 / 待确认 / 已完成”
- 状态变更后详情页应刷新
- 日志列表应新增一条状态变更记录

### 6. 通知检查

- 提交求助后，`notifications` 表会新增一条发给对应帮助人员的通知
- 状态更新后，`notifications` 表会新增一条发给发起人的通知

## 十一、常见问题

### 1. 前端请求失败或跨域报错

优先检查：

- 后端是否已启动
- 前端是否通过 `npm run dev` 启动
- 后端 `.env` 中 `CORS_ORIGIN` 是否为 `http://localhost:5173`
- 前端 `VITE_API_BASE_URL` 是否为 `/api`

### 2. 登录失败

优先检查：

- 是否已执行 `seed.sql`
- 数据库连接信息是否正确
- `users` 表中是否存在初始化账号

### 3. 页面没有数据

优先检查：

- `help_requests` 表是否已导入初始化数据
- 后端控制台是否有报错
- 浏览器开发者工具的 Network 中接口是否返回 `code: 0`

## 十二、补充说明

当前终端环境如果未安装 Node.js，将无法直接在当前会话中执行 `npm install` 和 `npm run dev`。这种情况下，请在你本地终端中按本说明执行即可。
