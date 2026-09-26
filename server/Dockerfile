# 后端镜像：Node 20 + Express，直接以生产模式启动
FROM node:20-alpine

ENV NODE_ENV=production

WORKDIR /app

# 先只拷贝依赖清单，源码变动时可以复用这一层缓存
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --chown=node:node . .

# 不用 root 跑业务进程
USER node

EXPOSE 3000

CMD ["node", "src/server.js"]
