#!/bin/bash
set -e
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  . "$NVM_DIR/nvm.sh"
fi
if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: node not found. Check NVM or PATH." >&2
  exit 1
fi
export NODE_ENV=production
cd /home/ec2-user/uk-rag-portal
exec node dist/index.js
