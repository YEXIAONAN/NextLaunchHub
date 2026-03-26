# NextLaunch Hub

NextLaunch Hub 是一个前后端分离的求助协同系统，覆盖公开发起、后台受理、状态流转、协同处理、通知提醒、超时预警与基础项目任务协同等核心场景。

![index](img/index.png)

## 项目概览

- 公开入口支持未登录提交求助
- 后台支持受理、分派、协同、确认、归档
- 首页提供工作台视图、待办摘要与最近记录
- 通知中心支持未读统计、分页筛选与已读操作
- 系统内置超时检查与超时状态展示

## 技术栈

### 前端

- Vue 3
- Vite
- Vue Router
- Pinia
- Element Plus
- Axios
- Socket.IO Client

### 后端

- Node.js
- Express
- MySQL
- mysql2
- JWT
- bcryptjs
- dotenv
- cors
- Socket.IO

## 已实现能力

- 用户登录与角色区分：`admin`、`helper`、`requester`
- 公开求助提交
- 公开求助查询与发起人确认/退回
- 求助中心列表、详情与状态流转
- 管理员改派帮助人员
- 协同人员添加与协同处理记录
- 通知中心、未读统计、分页筛选、已读操作
- 工作台首页统计、待办区、快捷入口、最近记录
- 求助日志时间线
- 超时预警与超时状态展示
- 项目与任务协同基础能力

## 项目结构

```text
NextLaunchHub
├── LICENSE
├── README.md
├── img/
├── server/
│   ├── .env.example
│   ├── package.json
│   ├── sql/
│   │   ├── schema.sql
│   │   └── seed.sql
│   └── src/
└── web/
    ├── .env.example
    ├── package.json
    ├── vite.config.js
    └── src/
```

## 环境要求

- Node.js 18+
- npm 9+
- MySQL 8+

可先检查本地环境：

```bash
node -v
npm -v
mysql --version
```

## 快速开始

### 1. 安装依赖

```bash
cd server
npm install

cd ../web
npm install
```

如果只是拉取代码更新，且 `package.json` 与 `package-lock.json` 没有变化，通常不需要重新安装依赖。

### 2. 配置环境变量

后端：

```bash
cd server
cp .env.example .env
```

参考配置：

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

前端：

```bash
cd web
cp .env.example .env
```

参考配置：

```env
VITE_API_BASE_URL=/api
```

### 3. 初始化数据库

```bash
mysql -uroot -p < server/sql/schema.sql
mysql -uroot -p < server/sql/seed.sql
```

默认数据库名：

```text
nextlaunch_hub
```

### 4. 启动项目

后端开发环境：

```bash
cd server
npm run dev
```

后端生产方式：

```bash
cd server
npm start
```

前端开发环境：

```bash
cd web
npm run dev
```

前端构建：

```bash
cd web
npm run build
```

## 默认访问地址

- 前端：`http://localhost:5173`
- 后端：`http://localhost:3000`
- 健康检查：`GET /api/health`

## 默认测试账号

默认密码：

```text
123456
```

管理员：

```text
admin
```

帮助人员账号：

```text
waiting
xiang
hi-tao
zhouzhaoshuang
```

固定请求帮助者名单：

```text
黄警威
李俊昊
黄正宇
农秋峰
周朝双
程语兴
陈启添
黄郁珊
李易萱
付飞谨
黄思烨
廖铭森
```

## 主要接口

### 认证与公开接口

- `POST /api/auth/login`
- `GET /api/public/requesters?keyword=`
- `GET /api/public/helpers?keyword=`
- `POST /api/public/help-requests`
- `GET /api/public/help-requests/query`
- `POST /api/public/help-requests/:id/confirm`

### 求助单接口

- `GET /api/help-requests`
- `GET /api/help-requests/:id`
- `PATCH /api/help-requests/:id/status`
- `PATCH /api/help-requests/:id/reassign-helper`
- `GET /api/help-requests/:id/assistants`
- `POST /api/help-requests/:id/assistants`
- `POST /api/help-requests/:id/collaboration-log`
- `POST /api/help-requests/check-timeout`

### 工作台与通知

- `GET /api/dashboard/overview`
- `GET /api/notifications`
- `PATCH /api/notifications/:id/read`
- `PATCH /api/notifications/read-all`
- `GET /api/notifications/unread-count`

## 数据库说明

SQL 目录保留的是可直接初始化的最终文件：

- `server/sql/schema.sql`
- `server/sql/seed.sql`

重建本地数据库时，统一执行：

```bash
mysql -uroot -p < server/sql/schema.sql
mysql -uroot -p < server/sql/seed.sql
```

## 开发说明

- 前后端目录独立，需分别安装依赖与启动
- 当前仓库已包含根级 `.gitignore`
- `server/node_modules/`、`web/node_modules/`、`.env`、`.DS_Store` 不应提交到版本库

## License

本项目使用 [MIT License](LICENSE)。
