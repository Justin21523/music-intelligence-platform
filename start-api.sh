#!/usr/bin/env bash
# Start the Music Intelligence Platform API — auto-restarts on crash
# Usage: ./start-api.sh          (foreground, logs to stdout)
#        ./start-api.sh --daemon  (background, logs to /tmp/mip-api.log)

cd "$(dirname "$0")"

export HF_HOME=/home/justin/.cache/huggingface
export HF_HUB_CACHE=/home/justin/.cache/huggingface/hub
export TRANSFORMERS_CACHE=/home/justin/.cache/huggingface

CMD="uv run uvicorn src.api.main:app --host 127.0.0.1 --port 8000"
LOG=/tmp/mip-api.log

if [[ "$1" == "--daemon" ]]; then
  echo "Starting API daemon (log: $LOG) ..."
  nohup bash -c "
    export HF_HOME=/home/justin/.cache/huggingface
    export HF_HUB_CACHE=/home/justin/.cache/huggingface/hub
    export TRANSFORMERS_CACHE=/home/justin/.cache/huggingface
    cd $(pwd)
    while true; do
      echo \"[restart \$(date)] starting uvicorn\" >> $LOG
      $CMD >> $LOG 2>&1
      echo \"[crash \$(date)] exit \$?; restarting in 3s\" >> $LOG
      sleep 3
    done
  " > /dev/null 2>&1 &
  disown
  echo "API daemon started (PID tracked by nohup). Check $LOG for logs."
  echo "To stop: kill \$(lsof -ti:8000)"
else
  echo "Starting API on http://127.0.0.1:8000 (Ctrl+C to stop) ..."
  while true; do
    $CMD
    echo "[restart] API exited with $?; restarting in 3s..."
    sleep 3
  done
fi
