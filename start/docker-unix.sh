#!/usr/bin/env bash
# 一键构建并启动 NextLaunch Hub（Docker 方式，macOS / Linux 通用）

set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd -- "${SCRIPT_DIR}/.." && pwd)"

# 优先用环境变量，其次读项目根目录 .env，最后回落到 8080
read_web_port() {
  if [[ -n "${WEB_PORT:-}" ]]; then
    echo "${WEB_PORT}"
    return
  fi

  if [[ -f "${PROJECT_DIR}/.env" ]]; then
    local value
    value="$(grep -E '^WEB_PORT=' "${PROJECT_DIR}/.env" | tail -1 | cut -d= -f2- | tr -d '[:space:]')"
    if [[ -n "${value}" ]]; then
      echo "${value}"
      return
    fi
  fi

  echo '8080'
}

if ! command -v docker >/dev/null 2>&1; then
  echo "缺少 docker，请先安装 Docker Desktop。"
  exit 1
fi

if docker compose version >/dev/null 2>&1; then
  COMPOSE=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE=(docker-compose)
else
  echo "缺少 docker compose，请先安装 Docker Compose。"
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "Docker 没在运行，请先启动 Docker Desktop 再执行本脚本。"
  exit 1
fi

WEB_PORT_VALUE="$(read_web_port)"
export WEB_PORT="${WEB_PORT_VALUE}"

cd "${PROJECT_DIR}"

echo "正在构建并启动容器，首次构建需要几分钟..."
"${COMPOSE[@]}" up -d --build

echo "正在等待服务就绪..."
for _ in $(seq 1 60); do
  if curl -fsS "http://127.0.0.1:${WEB_PORT_VALUE}/api/health" >/dev/null 2>&1; then
    echo ""
    echo "启动完成，访问地址：http://localhost:${WEB_PORT_VALUE}"
    echo "默认管理员账号：admin / 123456"
    echo "停止服务：cd ${PROJECT_DIR} && ${COMPOSE[*]} down"
    exit 0
  fi
  sleep 2
done

echo ""
echo "等待超时，服务可能还在启动或已报错，请执行下面命令查看日志："
echo "  cd ${PROJECT_DIR} && ${COMPOSE[*]} logs --tail=100"
exit 1
