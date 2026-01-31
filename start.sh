#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
export NODE_ENV=production
cd /home/ec2-user/uk-rag-portal
exec node dist/index.js
