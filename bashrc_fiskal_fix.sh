# Auto-start Fiskal AI services when in Fiskal AI project directory
fiskal_startup_check() {
  LOCKFILE="/tmp/.fiskal-ai-started-$$"  # Use PID to make it session-specific
  if [ -f /home/jfranjic/.wsl-startup.sh ] && [ ! -f "$LOCKFILE" ]; then
    # Check current directory after any cd commands
    CURRENT_DIR=$(pwd)
    if [[ "$CURRENT_DIR" == "/home/jfranjic/fiskal-ai-wsl"* ]]; then
      echo "Starting Fiskal AI services (in Fiskal AI project directory)..."
      touch "$LOCKFILE"
      /home/jfranjic/.wsl-startup.sh
    fi
  fi
}

# Hook into the PROMPT_COMMAND to check directory after each command
if [[ "$PROMPT_COMMAND" != *"fiskal_startup_check"* ]]; then
  PROMPT_COMMAND="fiskal_startup_check; $PROMPT_COMMAND"
fi