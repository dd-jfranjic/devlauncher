# Auto-start Fiskal AI on WSL startup (only once per session, only for Fiskal AI project)
LOCKFILE="/tmp/.fiskal-ai-started"
if [ -f /home/jfranjic/.wsl-startup.sh ] && [ ! -f "$LOCKFILE" ]; then
  # Check current directory - only start if we are in Fiskal AI project directory
  CURRENT_DIR=$(pwd)
  if [[ "$CURRENT_DIR" == "/home/jfranjic/dev-projects/fiskal-ai"* ]]; then
    echo "Starting Fiskal AI services (in Fiskal AI project directory)..."
    touch "$LOCKFILE"
    /home/jfranjic/.wsl-startup.sh
  fi
fi