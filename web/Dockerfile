# 前端镜像：第一阶段构建静态资源，第二阶段用 Nginx 托管
FROM node:20-alpine AS builder

WORKDIR /app

# 先只拷贝依赖清单，源码变动时可以复用这一层缓存
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
