#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
SERVER_PID=''
WEB_PID=''

cleanup() {
  trap - EXIT INT TERM
  if [[ -n "${SERVER_PID}" ]]; then
    kill "${SERVER_PID}" 2>/dev/null || true
  fi
  if [[ -n "${WEB_PID}" ]]; then
    kill "${WEB_PID}" 2>/dev/null || true
  fi
  wait 2>/dev/null || true
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "缺少 $1，请先安装 Node.js 20 或更高版本。"
    exit 1
  fi
}

install_dependencies() {
  local app_dir="$1"
  local app_name="$2"

  if [[ ! -d "${app_dir}/node_modules" ]]; then
    echo "正在安装${app_name}依赖..."
    (cd "${app_dir}" && npm ci)
  fi
}

require_command node
require_command npm

if [[ ! -f "${PROJECT_DIR}/server/.env" ]]; then
  echo "缺少 server/.env，请先复制 server/.env.example 并填写数据库配置。"
  exit 1
fi

install_dependencies "${PROJECT_DIR}/server" "后端"
install_dependencies "${PROJECT_DIR}/web" "前端"

echo "正在检查数据库连接..."
if ! (cd "${PROJECT_DIR}/server" && npm run check:db); then
  echo "数据库不可用，已取消启动。"
  exit 1
fi

trap cleanup EXIT INT TERM

echo "正在启动 NextLaunch Hub..."
(cd "${PROJECT_DIR}/server" && npm run dev) &
SERVER_PID=$!
(cd "${PROJECT_DIR}/web" && npm run dev) &
WEB_PID=$!

echo "前端：http://localhost:5173"
echo "后端：http://localhost:3000"
echo "按 Ctrl+C 可同时停止前后端。"

while kill -0 "${SERVER_PID}" 2>/dev/null && kill -0 "${WEB_PID}" 2>/dev/null; do
  sleep 1
done

echo "有一个服务已退出，正在停止另一个服务。"
exit 1
