#!/usr/bin/env bash
set -euo pipefail

# Docker 部署的可恢复备份。运行前请在项目根目录准备 .env。
script_dir="$(cd "$(dirname "$0")" && pwd)"
project_dir="$(cd "$script_dir/.." && pwd)"
backup_dir="$project_dir/backups"
timestamp="$(date +%Y%m%d-%H%M%S)"

mkdir -p "$backup_dir"
set -a
source "$project_dir/.env"
set +a

docker compose -f "$project_dir/docker-compose.yml" exec -T mysql \
  mysqldump -uroot -p"$DB_PASSWORD" --single-transaction --routines --events "$DB_NAME" \
  | gzip > "$backup_dir/nextlaunch-hub-$timestamp.sql.gz"

echo "Backup created: $backup_dir/nextlaunch-hub-$timestamp.sql.gz"
