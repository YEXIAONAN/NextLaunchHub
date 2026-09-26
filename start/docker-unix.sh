#!/usr/bin/env bash
# 一键构建并启动 NextLaunch Hub（Docker 方式，macOS / Linux 通用）
#
# 首次运行会做三件事：
#   1. 在项目根目录生成 .env，里面是随机生成的数据库密码和 JWT 密钥（不会进 git）
#   2. 构建并启动容器，自动建库、导入表结构和演示数据
#   3. 把演示账号的公开密码换成随机密码，并禁用其他示例账号的登录
#
# 注意：数据库密码只在数据卷为空时生效，启动过一次之后改 .env 里的 DB_PASSWORD 不会同步到
# 已有的数据库。真要改，要么进容器改 MySQL 密码，要么 docker compose down -v 清库重来。

set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${PROJECT_DIR}/.env"

# 生成随机串。用子 shell 关掉 pipefail，避免 head 提前退出时 tr 被 SIGPIPE 打断而报错
random_chars() {
  local length="$1"
  local charset="$2"
  (
    set +o pipefail
    if command -v openssl >/dev/null 2>&1; then
      openssl rand -base64 64 | LC_ALL=C tr -dc "${charset}" | head -c "${length}"
    else
      LC_ALL=C tr -dc "${charset}" < /dev/urandom | head -c "${length}"
    fi
  ) 2>/dev/null || true
}

# 读取 .env 里某个键的值，不存在时输出空
# 注意结尾的 || true：键不存在时 grep 返回 1，配合 set -o pipefail 会让整条管道失败，
# 进而让 set -e 直接静默退出
env_value() {
  if [[ -f "${ENV_FILE}" ]]; then
    grep -E "^$1=" "${ENV_FILE}" | tail -1 | cut -d= -f2- | tr -d '[:space:]' || true
  fi
}

# 写入/覆盖 .env 里的某个键，不碰其他键
set_env_value() {
  local key="$1"
  local value="$2"
  local tmp
  if [[ -f "${ENV_FILE}" ]] && grep -qE "^${key}=" "${ENV_FILE}"; then
    tmp="$(mktemp)"
    awk -v k="${key}" -v v="${value}" 'BEGIN{FS="="} $1==k {print k"="v; next} {print}' "${ENV_FILE}" > "${tmp}"
    mv "${tmp}" "${ENV_FILE}"
  else
    printf '%s=%s\n' "${key}" "${value}" >> "${ENV_FILE}"
  fi
}

# 取已有值，没有就现生成一个
ensure_env_value() {
  local key="$1"
  local fallback="$2"
  local current
  current="$(env_value "${key}")"
  if [[ -z "${current}" ]]; then
    current="${fallback}"
    set_env_value "${key}" "${current}"
  fi
  printf '%s' "${current}"
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

# 优先用环境变量，其次读 .env，最后回落到 8080
WEB_PORT_VALUE="${WEB_PORT:-$(env_value WEB_PORT)}"
WEB_PORT_VALUE="${WEB_PORT_VALUE:-8080}"

touch "${ENV_FILE}"
chmod 600 "${ENV_FILE}"

set_env_value WEB_PORT "${WEB_PORT_VALUE}"
ensure_env_value DB_NAME 'nextlaunch_hub' >/dev/null
ensure_env_value DB_PASSWORD "$(random_chars 32 'A-Za-z0-9')" >/dev/null
ensure_env_value JWT_SECRET "$(random_chars 64 'A-Za-z0-9')" >/dev/null
ensure_env_value JWT_EXPIRES_IN '7d' >/dev/null
ensure_env_value COOKIE_SECURE 'false' >/dev/null
ADMIN_PASSWORD_VALUE="$(ensure_env_value ADMIN_PASSWORD "$(random_chars 16 'A-Za-z0-9')")"
ensure_env_value RESET_ADMIN_PASSWORD 'false' >/dev/null
CORS_ORIGIN_VALUE="$(env_value CORS_ORIGIN)"
if [[ -z "${CORS_ORIGIN_VALUE}" ]]; then
  CORS_ORIGIN_VALUE="http://localhost:${WEB_PORT_VALUE}"
  set_env_value CORS_ORIGIN "${CORS_ORIGIN_VALUE}"
fi

# 随机串生成失败时宁可停在这里，也不要带着空密钥启动
for required_key in DB_PASSWORD JWT_SECRET ADMIN_PASSWORD; do
  if [[ -z "$(env_value "${required_key}")" ]]; then
    echo "生成 ${required_key} 失败，请检查系统是否有 openssl 或 /dev/urandom。"
    exit 1
  fi
done

export WEB_PORT="${WEB_PORT_VALUE}"

cd "${PROJECT_DIR}"

echo "正在构建并启动容器，首次构建需要几分钟..."
"${COMPOSE[@]}" up -d --build

echo "正在等待服务就绪..."
READY=0
for _ in $(seq 1 60); do
  if curl -fsS "http://127.0.0.1:${WEB_PORT_VALUE}/api/health" >/dev/null 2>&1; then
    READY=1
    break
  fi
  sleep 2
done

if [[ "${READY}" != "1" ]]; then
  echo ""
  echo "等待超时，服务可能还在启动或已报错，请执行下面命令查看日志："
  echo "  cd ${PROJECT_DIR} && ${COMPOSE[*]} logs --tail=100"
  exit 1
fi

# 每次启动都跑一次：管理员还在用示例密码时才替换，同时禁用其他示例账号的登录
echo "正在检查管理员密码与示例账号..."
if ! "${COMPOSE[@]}" exec -T api node scripts/init-deployment.js; then
  echo ""
  echo "初始化失败。可以稍后手动重试："
  echo "  cd ${PROJECT_DIR} && ${COMPOSE[*]} exec -T api node scripts/init-deployment.js"
fi

echo ""
echo "启动完成，访问地址：http://localhost:${WEB_PORT_VALUE}"
echo "管理员账号：admin"
echo "管理员密码：${ADMIN_PASSWORD_VALUE}"
echo "（密码同时保存在 ${ENV_FILE}，首次部署时写入；如果之后在页面里改过密码，以改过的为准）"
echo "想重新用这里的密码覆盖，把 .env 里的 RESET_ADMIN_PASSWORD 改成 true 后重新执行本脚本。"
echo "局域网其他机器访问时，需要把 .env 里的 CORS_ORIGIN 改成实际地址再重启。"
echo "停止服务：cd ${PROJECT_DIR} && ${COMPOSE[*]} down"
