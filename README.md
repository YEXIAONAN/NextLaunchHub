# NextLaunch Hub

<p align="center">
  <strong>一款现代化的求助协同与项目任务管理系统</strong>
</p>

<p align="center">
  <a href="#功能特性">功能特性</a> •
  <a href="#技术架构">技术架构</a> •
  <a href="#快速开始">快速开始</a> •
  <a href="#部署指南">部署指南</a> •
  <a href="#api-文档">API 文档</a>
</p>

---

## 项目简介

**NextLaunch Hub** 是一个前后端分离的企业级求助协同与项目任务管理系统，专为团队协作场景设计。系统覆盖公开发起求助、后台受理分派、状态流转追踪、多人协同处理、实时通知提醒、超时预警监控以及项目任务协同等核心业务场景。

### 核心价值

- **公开求助入口**：支持未登录用户快速提交求助请求，降低协作门槛
- **全流程状态管理**：从待处理 → 处理中 → 待确认 → 已完成，状态流转清晰可控
- **多人协同处理**：支持添加协同人员、记录处理日志、改派帮助人员
- **实时消息推送**：基于 WebSocket 的实时通知，确保信息及时触达
- **项目任务整合**：项目管理、迭代规划、里程碑追踪、任务分配一站式解决
- **超时预警机制**：自动检测超时求助单，提供视觉提醒

---

## 功能特性

### 求助中心

| 功能 | 描述 |
|------|------|
| 公开提交入口 | 未登录用户可通过公开页面提交求助，从固定名单选择请求人与帮助人 |
| 公开查询追踪 | 支持通过请求单号或请求人姓名查询求助状态 |
| 发起人确认 | 请求帮助者可对处理结果进行确认或退回 |
| 状态流转 | 支持待处理、处理中、待确认、已完成四种状态流转 |
| 协同处理 | 支持添加协同人员、记录处理日志 |
| 改派功能 | 管理员可改派求助单的帮助人员 |
| 超时预警 | 自动检测并标记超时求助单 |

### 项目管理

| 功能 | 描述 |
|------|------|
| 项目创建 | 创建项目并指定项目负责人与优先级 |
| 成员管理 | 添加项目成员并分配项目角色 |
| 迭代规划 | 创建迭代并设定目标、时间范围 |
| 里程碑追踪 | 设置项目里程碑，追踪完成进度 |
| Excel 导出 | 支持项目数据导出为 Excel 文件 |

### 任务管理

| 功能 | 描述 |
|------|------|
| 任务创建 | 在项目下创建任务，关联迭代与里程碑 |
| 任务分配 | 指派任务执行人、设定优先级与截止日期 |
| 进度追踪 | 实时更新任务进度，支持工时预估与实际工时记录 |
| 状态管理 | 支持待开始、进行中、受阻、已完成、已取消五种状态 |

### 工作台

| 功能 | 描述 |
|------|------|
| 统计概览 | 展示待处理、处理中、已完成、超时求助单数量 |
| 我的待办 | 快速查看分配给当前用户的待处理任务 |
| 最近记录 | 展示最近处理的求助单与项目活动 |

### 通知中心

| 功能 | 描述 |
|------|------|
| 实时推送 | 基于 WebSocket 的即时消息推送 |
| 未读统计 | 顶部导航栏实时显示未读消息数量 |
| 分类筛选 | 支持按通知类型筛选查看 |
| 一键已读 | 支持单条标记已读或全部标记已读 |

### 系统管理

| 功能 | 描述 |
|------|------|
| 用户管理 | 管理用户账号、角色、状态 |
| 字典管理 | 维护项目状态、优先级、成员角色等系统字典 |

---

## 技术架构

### 系统架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        用户浏览器                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ 公开求助页面  │  │ 后台管理界面  │  │ 通知中心页面  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │   HTTP / WebSocket │
                    └─────────┬─────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        前端应用 (Vue 3)                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  Vue     │  │  Vue     │  │  Pinia   │  │ Element  │        │
│  │  3.x     │  │  Router  │  │  Store   │  │  Plus    │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                      │
│  │  Axios   │  │ Socket.IO│  │  Vite    │                      │
│  │  HTTP    │  │  Client  │  │  Build   │                      │
│  └──────────┘  └──────────┘  └──────────┘                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │   REST API / WS    │
                    └─────────┬─────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        后端服务 (Node.js)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ Express  │  │ Socket.IO│  │   JWT    │  │ bcryptjs │        │
│  │  Router  │  │  Server  │  │  Auth    │  │  Crypto  │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│  ┌──────────┐  ┌──────────┐                                    │
│  │  mysql2  │  │   xlsx   │                                    │
│  │  Driver  │  │  Export  │                                    │
│  └──────────┘  └──────────┘                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        数据库 (MySQL 8)                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  users   │  │ projects │  │  tasks   │  │help_reqs │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                      │
│  │notifictns│  │dictionaries│ │  logs    │                      │
│  └──────────┘  └──────────┘  └──────────┘                      │
└─────────────────────────────────────────────────────────────────┘
```

### 技术栈详情

#### 前端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| [Vue 3](https://vuejs.org/) | ^3.5.12 | 渐进式 JavaScript 框架 |
| [Vite](https://vitejs.dev/) | ^6.4.1 | 下一代前端构建工具 |
| [Vue Router](https://router.vuejs.org/) | ^4.4.5 | 官方路由管理器 |
| [Pinia](https://pinia.vuejs.org/) | ^2.3.0 | Vue 官方状态管理库 |
| [Element Plus](https://element-plus.org/) | ^2.8.4 | Vue 3 UI 组件库 |
| [Axios](https://axios-http.com/) | ^1.7.7 | HTTP 客户端 |
| [Socket.IO Client](https://socket.io/) | ^4.8.1 | WebSocket 客户端 |

#### 后端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| [Node.js](https://nodejs.org/) | 18+ | JavaScript 运行时 |
| [Express](https://expressjs.com/) | ^4.19.2 | Web 应用框架 |
| [MySQL 2](https://github.com/sidorares/node-mysql2) | ^3.11.0 | MySQL 数据库驱动 |
| [Socket.IO](https://socket.io/) | ^4.8.1 | WebSocket 服务端 |
| [JWT](https://github.com/auth0/node-jsonwebtoken) | ^9.0.2 | 身份认证令牌 |
| [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | ^2.4.3 | 密码加密 |
| [xlsx](https://sheetjs.com/) | ^0.18.5 | Excel 导出 |
| [dotenv](https://github.com/motdotla/dotenv) | ^16.4.5 | 环境变量管理 |
| [cors](https://github.com/expressjs/cors) | ^2.8.5 | 跨域资源共享 |

#### 数据库

| 技术 | 版本 | 用途 |
|------|------|------|
| [MySQL](https://www.mysql.com/) | 8+ | 关系型数据库 |

---

## 项目结构

```
NextLaunchHub
├── LICENSE                    # MIT 开源协议
├── README.md                  # 项目说明文档
├── .env.example               # 环境变量示例
├── .gitignore                 # Git 忽略规则
├── img/                       # 项目截图
│   ├── index.png
│   └── dashboard.png
├── .github/
│   └── workflows/
│       └── ci.yml             # GitHub Actions CI 配置
├── server/                    # 后端服务
│   ├── package.json
│   ├── package-lock.json
│   ├── .env.example
│   ├── sql/
│   │   ├── schema.sql         # 数据库表结构
│   │   └── seed.sql           # 初始化数据
│   └── src/
│       ├── server.js          # 服务入口
│       ├── app.js             # Express 应用配置
│       ├── config/
│       │   └── env.js         # 环境变量解析
│       ├── db/
│       │   └── pool.js        # 数据库连接池
│       ├── middleware/
│       │   ├── auth.js        # JWT 认证中间件
│       │   └── error-handler.js
│       ├── routes/            # 路由层
│       │   ├── auth-routes.js
│       │   ├── public-routes.js
│       │   ├── help-request-routes.js
│       │   ├── projects-routes.js
│       │   ├── tasks-routes.js
│       │   ├── notifications-routes.js
│       │   ├── dashboard-routes.js
│       │   ├── users-routes.js
│       │   └── ...
│       ├── controllers/       # 控制器层
│       ├── services/          # 服务层
│       ├── realtime/          # WebSocket 实时通信
│       │   ├── socket-server.js
│       │   ├── socket-auth.js
│       │   └── online-user-manager.js
│       └── utils/             # 工具函数
│           ├── response.js
│           ├── http-error.js
│           ├── permission.js
│           └── excel-export.js
└── web/                       # 前端应用
    ├── package.json
    ├── package-lock.json
    ├── index.html
    ├── vite.config.js
    ├── .env.example
    ├── dist/                  # 构建产物
    └── src/
        ├── main.js            # 应用入口
        ├── App.vue            # 根组件
        ├── router/
        │   └── index.js       # 路由配置
        ├── stores/            # Pinia 状态管理
        │   ├── auth.js
        │   ├── notifications.js
        │   ├── dictionaries.js
        │   └── system-notification.js
        ├── api/               # API 接口封装
        │   ├── http.js
        │   └── index.js
        ├── realtime/          # WebSocket 客户端
        │   └── socket.js
        ├── layout/            # 布局组件
        │   └── AdminLayout.vue
        ├── views/             # 页面组件
        │   ├── public/
        │   │   ├── LoginView.vue
        │   │   ├── PublicHelpRequestView.vue
        │   │   └── PublicHelpQueryView.vue
        │   ├── dashboard/
        │   │   └── DashboardView.vue
        │   ├── help-center/
        │   │   ├── HelpCenterListView.vue
        │   │   └── HelpCenterDetailView.vue
        │   ├── projects/
        │   │   ├── ProjectsListView.vue
        │   │   └── ProjectDetailView.vue
        │   ├── tasks/
        │   │   └── TasksListView.vue
        │   ├── notifications/
        │   │   └── NotificationsView.vue
        │   ├── users/
        │   │   └── UsersListView.vue
        │   └── system/
        │       └── DictionariesView.vue
        ├── components/        # 公共组件
        │   └── StatusTag.vue
        └── styles/
            └── theme.css      # 主题样式
```

---

## 环境要求

### 本地开发环境

| 软件 | 版本要求 | 检查命令 |
|------|----------|----------|
| Node.js | >= 18.0.0 | `node -v` |
| npm | >= 9.0.0 | `npm -v` |
| MySQL | >= 8.0 | `mysql --version` |

### 推荐配置

- **操作系统**: macOS / Linux / Windows 10+
- **内存**: >= 4GB
- **磁盘空间**: >= 1GB

---

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/your-username/NextLaunchHub.git
cd NextLaunchHub
```

### 2. 安装依赖

后端依赖：

```bash
cd server
npm install
```

前端依赖：

```bash
cd ../web
npm install
```

### 3. 配置环境变量

**后端配置** (`server/.env`)：

```bash
cd server
cp .env.example .env
```

编辑 `.env` 文件：

```env
# 服务端口
PORT=3000

# 数据库配置
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=nextlaunch_hub

# JWT 配置
JWT_SECRET=your-jwt-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# CORS 配置（多个源用逗号分隔）
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
```

**前端配置** (`web/.env`)：

```bash
cd ../web
cp .env.example .env
```

编辑 `.env` 文件：

```env
# API 基础地址
VITE_API_BASE_URL=/api
```

### 4. 初始化数据库

创建数据库并导入初始数据：

```bash
# 方式一：命令行导入
mysql -uroot -p < server/sql/schema.sql
mysql -uroot -p < server/sql/seed.sql

# 方式二：MySQL 客户端工具导入
# 使用 Navicat、DBeaver 等工具执行 schema.sql 和 seed.sql
```

### 5. 启动服务

**启动后端服务**：

```bash
cd server

# 开发模式（支持热重载）
npm run dev

# 生产模式
npm start
```

**启动前端服务**：

```bash
cd web

# 开发模式
npm run dev

# 构建生产版本
npm run build

# 预览构建产物
npm run preview
```

### 6. 访问应用

- **前端地址**: http://localhost:5173
- **后端地址**: http://localhost:3000
- **健康检查**: http://localhost:3000/api/health

---

## 部署指南

### 生产环境部署

#### 方式一：传统服务器部署

##### 1. 服务器准备

```bash
# 安装 Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 MySQL 8
sudo apt install mysql-server
sudo mysql_secure_installation
```

##### 2. 部署后端

```bash
# 克隆代码
git clone https://github.com/your-username/NextLaunchHub.git
cd NextLaunchHub/server

# 安装生产依赖
npm ci --only=production

# 配置环境变量
cp .env.example .env
vim .env  # 修改生产配置

# 使用 PM2 管理进程
npm install -g pm2
pm2 start src/server.js --name nextlaunch-hub-api
pm2 save
pm2 startup
```

##### 3. 部署前端

```bash
cd ../web

# 安装依赖
npm ci

# 配置环境变量
cp .env.example .env
vim .env  # 配置生产环境 API 地址

# 构建
npm run build

# 使用 Nginx 托管静态文件
sudo cp -r dist/* /var/www/nextlaunch-hub/
```

##### 4. Nginx 配置示例

```nginx
# /etc/nginx/sites-available/nextlaunch-hub
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /var/www/nextlaunch-hub;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # API 代理
    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket 代理
    location /socket.io {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

```bash
# 启用站点
sudo ln -s /etc/nginx/sites-available/nextlaunch-hub /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 方式二：Docker 部署

##### 1. 创建 Dockerfile（后端）

在 `server/` 目录创建 `Dockerfile`：

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "src/server.js"]
```

##### 2. 创建 Dockerfile（前端）

在 `web/` 目录创建 `Dockerfile`：

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

##### 3. Docker Compose

在项目根目录创建 `docker-compose.yml`：

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: your_password
      MYSQL_DATABASE: nextlaunch_hub
    volumes:
      - mysql_data:/var/lib/mysql
      - ./server/sql:/docker-entrypoint-initdb.d
    ports:
      - "3306:3306"
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build: ./server
    environment:
      PORT: 3000
      DB_HOST: mysql
      DB_PORT: 3306
      DB_USER: root
      DB_PASSWORD: your_password
      DB_NAME: nextlaunch_hub
      JWT_SECRET: your-production-secret
      JWT_EXPIRES_IN: 7d
      CORS_ORIGIN: http://localhost
    ports:
      - "3000:3000"
    depends_on:
      mysql:
        condition: service_healthy

  web:
    build: ./web
    ports:
      - "80:80"
    depends_on:
      - api

volumes:
  mysql_data:
```

```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f
```

#### 方式三：Vercel + Railway 部署

##### 前端部署到 Vercel

1. Fork 本项目到你的 GitHub 账号
2. 访问 [Vercel](https://vercel.com/) 并导入项目
3. 配置项目：
   - **Framework Preset**: Vite
   - **Root Directory**: `web`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. 配置环境变量：
   - `VITE_API_BASE_URL`: 你的后端 API 地址

##### 后端部署到 Railway

1. 访问 [Railway](https://railway.app/) 并导入项目
2. 配置项目：
   - **Root Directory**: `server`
   - **Start Command**: `node src/server.js`
3. 添加 MySQL 数据库
4. 配置环境变量（参考 `.env.example`）
5. 执行 SQL 初始化脚本

---

## API 文档

### 认证接口

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| POST | `/api/auth/login` | 用户登录 | 否 |

### 公开接口

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | `/api/public/requesters` | 获取请求人列表 | 否 |
| GET | `/api/public/helpers` | 获取帮助人员列表 | 否 |
| GET | `/api/public/projects` | 获取公开项目列表 | 否 |
| GET | `/api/public/projects/:id/tasks` | 获取项目任务列表 | 否 |
| POST | `/api/public/help-requests` | 提交求助单 | 否 |
| GET | `/api/public/help-requests/query` | 查询求助单状态 | 否 |
| POST | `/api/public/help-requests/:id/confirm` | 发起人确认/退回 | 否 |

### 求助单接口

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | `/api/help-requests` | 获取求助单列表 | 是 |
| GET | `/api/help-requests/:id` | 获取求助单详情 | 是 |
| PATCH | `/api/help-requests/:id/status` | 更新求助单状态 | 是 |
| PATCH | `/api/help-requests/:id/reassign-helper` | 改派帮助人员 | 是 |
| GET | `/api/help-requests/:id/assistants` | 获取协同人员列表 | 是 |
| POST | `/api/help-requests/:id/assistants` | 添加协同人员 | 是 |
| POST | `/api/help-requests/:id/collaboration-log` | 添加处理日志 | 是 |
| POST | `/api/help-requests/check-timeout` | 检查超时求助单 | 是 |

### 项目接口

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | `/api/projects` | 获取项目列表 | 是 |
| POST | `/api/projects` | 创建项目 | 是 |
| GET | `/api/projects/:id` | 获取项目详情 | 是 |
| PATCH | `/api/projects/:id` | 更新项目 | 是 |
| GET | `/api/projects/:id/members` | 获取项目成员 | 是 |
| POST | `/api/projects/:id/members` | 添加项目成员 | 是 |
| GET | `/api/projects/:id/tasks` | 获取项目任务 | 是 |
| GET | `/api/projects/:id/iterations` | 获取迭代列表 | 是 |
| POST | `/api/projects/:id/iterations` | 创建迭代 | 是 |
| GET | `/api/projects/:id/milestones` | 获取里程碑列表 | 是 |
| POST | `/api/projects/:id/milestones` | 创建里程碑 | 是 |

### 任务接口

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | `/api/tasks` | 获取任务列表 | 是 |
| POST | `/api/tasks` | 创建任务 | 是 |
| GET | `/api/tasks/:id` | 获取任务详情 | 是 |
| PATCH | `/api/tasks/:id` | 更新任务 | 是 |
| PATCH | `/api/tasks/:id/status` | 更新任务状态 | 是 |

### 通知接口

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | `/api/notifications` | 获取通知列表 | 是 |
| PATCH | `/api/notifications/:id/read` | 标记已读 | 是 |
| PATCH | `/api/notifications/read-all` | 全部标记已读 | 是 |
| GET | `/api/notifications/unread-count` | 获取未读数量 | 是 |

### 工作台接口

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | `/api/dashboard/overview` | 获取工作台概览 | 是 |

### 用户管理接口

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | `/api/users` | 获取用户列表 | 是 |
| POST | `/api/users` | 创建用户 | 是 |
| PATCH | `/api/users/:id` | 更新用户 | 是 |
| PATCH | `/api/users/:id/reset-password` | 重置密码 | 是 |

### 字典管理接口

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | `/api/dictionaries` | 获取字典列表 | 是 |
| GET | `/api/admin/dictionaries` | 获取字典列表（管理） | 是 |
| POST | `/api/admin/dictionaries` | 创建字典项 | 是 |
| PATCH | `/api/admin/dictionaries/:id` | 更新字典项 | 是 |

---

## 数据库设计

### ER 图

```
┌─────────────┐       ┌─────────────────┐       ┌───────────────┐
│   users     │       │    projects     │       │    tasks      │
├─────────────┤       ├─────────────────┤       ├───────────────┤
│ id          │◄──────│ owner_user_id   │       │ project_id    │──────►│
│ username    │       │ created_by      │──────►│ assignee_id   │──────►│
│ password    │       │ project_code    │       │ task_code     │       │
│ real_name   │       │ project_name    │       │ title         │       │
│ role        │       │ status          │       │ status        │       │
│ is_helper   │       │ priority        │       │ priority      │       │
│ is_requester│       │ progress        │       │ progress      │       │
└─────────────┘       └─────────────────┘       └───────────────┘
      │                     │     │                    │
      │                     │     │                    │
      │               ┌─────┘     └──────┐             │
      │               │                  │             │
      │        ┌──────▼──────┐    ┌──────▼──────┐      │
      │        │ iterations  │    │ milestones  │      │
      │        ├─────────────┤    ├─────────────┤      │
      │        │ project_id  │    │ project_id  │      │
      │        │ status      │    │ status      │      │
      │        └─────────────┘    └─────────────┘      │
      │                                              │
      │         ┌──────────────────────────────────────┘
      │         │
      │   ┌─────▼────────────────┐
      │   │   help_requests      │
      │   ├──────────────────────┤
      ├──►│ requester_user_id    │
      ├──►│ helper_user_id       │
      │   │ request_no           │
      │   │ title                │
      │   │ status               │
      │   │ is_timeout           │
      │   └──────────────────────┘
      │              │
      │   ┌──────────▼───────────┐
      │   │ help_request_logs    │
      │   ├──────────────────────┤
      ├──►│ operator_user_id     │
      │   │ action_type          │
      │   └──────────────────────┘
      │
      │   ┌──────────────────────┐
      │   │   notifications      │
      │   ├──────────────────────┤
      └──►│ receiver_user_id     │
          │ type                 │
          │ title                │
          │ is_read              │
          └──────────────────────┘
```

### 核心数据表

| 表名 | 描述 |
|------|------|
| `users` | 用户表：存储用户账号、角色、状态信息 |
| `projects` | 项目表：存储项目基本信息 |
| `project_members` | 项目成员关联表 |
| `project_iterations` | 项目迭代表 |
| `project_milestones` | 项目里程碑表 |
| `project_logs` | 项目操作日志表 |
| `tasks` | 任务表：存储任务基本信息 |
| `task_logs` | 任务操作日志表 |
| `help_requests` | 求助单表：存储求助请求信息 |
| `help_request_logs` | 求助单操作日志表 |
| `help_request_assistants` | 求助单协同人员关联表 |
| `notifications` | 通知表：存储系统通知消息 |
| `system_dictionaries` | 系统字典表：存储状态、优先级等枚举值 |

---

## 用户角色与权限

### 角色说明

| 角色 | 标识 | 说明 |
|------|------|------|
| 管理员 | `admin` | 拥有系统全部权限，可管理用户和字典 |
| 帮助人员 | `helper` | 可处理求助单、参与项目任务 |
| 请求帮助者 | `requester` | 仅可通过公开入口提交和查询求助 |

### 权限矩阵

| 功能 | admin | helper | requester | 公开 |
|------|-------|--------|-----------|------|
| 提交求助 | ✓ | ✓ | ✓ | ✓ |
| 查询求助状态 | ✓ | ✓ | ✓ | ✓ |
| 确认/退回求助 | - | - | ✓ | ✓ |
| 查看求助中心 | ✓ | ✓ | - | - |
| 处理求助单 | ✓ | ✓ | - | - |
| 改派帮助人员 | ✓ | - | - | - |
| 项目管理 | ✓ | ✓ | - | - |
| 任务管理 | ✓ | ✓ | - | - |
| 用户管理 | ✓ | - | - | - |
| 字典管理 | ✓ | - | - | - |

---

## 默认账号

### 管理员账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | 123456 | admin |

### 帮助人员账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| waiting | 123456 | helper |
| xiang | 123456 | helper |
| hi-tao | 123456 | helper |
| zhouzhaoshuang | 123456 | helper |

### 请求帮助者名单

| 姓名 | 用户名 |
|------|--------|
| 黄警威 | huangjingwei |
| 李俊昊 | lijunhao |
| 黄正宇 | huangzhengyu |
| 农秋峰 | nongqiufeng |
| 周朝双 | zhouzhaoshuang |
| 程语兴 | chengyuxing |
| 陈启添 | chenqitian |
| 黄郁珊 | huangyushan |
| 李易萱 | liyixuan |
| 付飞谨 | fufeijin |
| 黄思烨 | huangsiyie |
| 廖铭森 | liaomingsen |

> ⚠️ **安全提示**：生产环境请务必修改默认密码！

---

## 开发指南

### 本地开发流程

```bash
# 1. 创建功能分支
git checkout -b feature/your-feature

# 2. 开发代码
# ... 编写代码 ...

# 3. 提交代码
git add .
git commit -m "feat: 添加某某功能"

# 4. 推送分支
git push origin feature/your-feature

# 5. 创建 Pull Request
```

### 代码规范

- 前端代码遵循 [Vue 官方风格指南](https://vuejs.org/style-guide/)
- 后端代码遵循 [JavaScript Standard Style](https://standardjs.com/)
- 提交信息遵循 [Conventional Commits](https://www.conventionalcommits.org/)

### 分支策略

| 分支 | 说明 |
|------|------|
| `main` / `master` | 生产环境代码 |
| `develop` | 开发环境代码 |
| `feature/*` | 功能开发分支 |
| `hotfix/*` | 紧急修复分支 |

---

## 常见问题

### Q1: 数据库连接失败？

检查以下项目：
1. MySQL 服务是否启动
2. `.env` 中的数据库配置是否正确
3. 数据库用户是否有足够权限

### Q2: 前端无法访问后端 API？

检查以下项目：
1. 后端服务是否启动
2. Vite 代理配置是否正确
3. CORS 配置是否包含前端地址

### Q3: WebSocket 连接失败？

检查以下项目：
1. Socket.IO 服务是否正常启动
2. JWT Token 是否有效
3. Nginx 代理是否正确配置 WebSocket

### Q4: 构建后页面空白？

检查以下项目：
1. `vite.config.js` 是否正确配置 `base` 路径
2. 静态资源是否正确部署
3. 路由模式是否与部署路径匹配

---

## 更新日志

### v1.0.0 (2026-03)

- 初始版本发布
- 求助中心核心功能
- 项目任务管理
- 通知中心
- 用户与字典管理
- 实时消息推送
- 超时预警

---

## 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: 添加某某功能'`)
4. 推送分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

---

## License

本项目基于 [MIT License](LICENSE) 开源。

---

## 联系方式

如有问题或建议，欢迎提交 [Issue](https://github.com/YEXIAONAN/NextLaunchHub/issues)。
