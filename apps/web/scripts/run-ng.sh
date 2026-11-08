#!/bin/sh

set -eu

PROJECT_NODE_BIN=""
PROJECT_NODE_MAJOR="$(tr -d '[:space:]' < "$(dirname "$0")/../.nvmrc")"

for candidate in "$HOME"/.nvm/versions/node/v"$PROJECT_NODE_MAJOR".*/bin/node; do
  if [ -x "$candidate" ]; then
    PROJECT_NODE_BIN="$candidate"
  fi
done

if [ -n "$PROJECT_NODE_BIN" ]; then
  exec "$PROJECT_NODE_BIN" ./node_modules/@angular/cli/bin/ng "$@"
fi

exec node ./node_modules/@angular/cli/bin/ng "$@"
