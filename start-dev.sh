#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
export NODE_ENV=development
cd /home/ec2-user/uk-rag-portal
exec npx tsx watch server/_core/index.ts
