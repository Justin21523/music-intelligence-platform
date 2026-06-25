#!/usr/bin/env bash
# ============================================================
# Music Intelligence Platform — Remote Deploy Script
# Target: <your-host>/projects/music-intelligence-platform/
#
# Usage:
#   export DEPLOY_PASS=<your-ssh-password>
#   bash deploy.sh ssh        # SSH/SCP deploy
#   bash deploy.sh ftp        # FTP deploy (needs lftp)
# ============================================================

set -euo pipefail

SSH_HOST="${DEPLOY_HOST:-live.dothost.net}"
SSH_PORT="${DEPLOY_PORT:-2965}"
SSH_USER="${DEPLOY_USER:-neojustin}"
FTP_HOST="${DEPLOY_HOST:-live.dothost.net}"
REMOTE_WEB_ROOT="${REMOTE_WEB_ROOT:-/public_html}"
REMOTE_PATH="$REMOTE_WEB_ROOT/projects/music-intelligence-platform"
DIST="frontend/dist"
MODE="${1:-ssh}"

if [ -z "${DEPLOY_PASS:-}" ]; then
  echo "ERROR: Set DEPLOY_PASS before running."
  echo "  export DEPLOY_PASS='your-password'"
  exit 1
fi

# ── Rebuild with deployment base path ───────────────────────
echo "→ Building frontend..."
(cd frontend && npm run build)
echo "→ Build complete."

if [ "$MODE" = "ssh" ]; then
  echo "→ Deploying via SSH to $SSH_HOST:$SSH_PORT ..."
  export SSHPASS="$DEPLOY_PASS"

  sshpass -e ssh -p "$SSH_PORT" -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" \
    "mkdir -p $REMOTE_PATH"

  for f in index.html .htaccess favicon.svg icons.svg; do
    [ -f "$DIST/$f" ] && sshpass -e scp -P "$SSH_PORT" -o StrictHostKeyChecking=no \
      "$DIST/$f" "$SSH_USER@$SSH_HOST:$REMOTE_PATH/" && echo "  ✓ $f"
  done

  sshpass -e scp -P "$SSH_PORT" -o StrictHostKeyChecking=no -r \
    "$DIST/assets/" "$SSH_USER@$SSH_HOST:$REMOTE_PATH/assets/"

  echo "✓ SSH deployment complete!"
  echo "  URL: http://$SSH_HOST/projects/music-intelligence-platform/"

elif [ "$MODE" = "ftp" ]; then
  echo "→ Deploying via FTP to $FTP_HOST ..."
  which lftp || { echo "ERROR: lftp not found. Run: sudo apt-get install -y lftp"; exit 1; }

  lftp -u "$SSH_USER,$DEPLOY_PASS" "$FTP_HOST" <<FTPCMDS
set ftp:ssl-allow no
set net:timeout 30
set net:max-retries 5
set net:reconnect-interval-base 5
mkdir -p $REMOTE_PATH
cd $REMOTE_PATH
lcd $DIST
put index.html
put .htaccess
mput favicon.svg icons.svg
mirror -R assets/ assets/
bye
FTPCMDS

  echo "✓ FTP deployment complete!"
  echo "  URL: http://$FTP_HOST/projects/music-intelligence-platform/"
fi
