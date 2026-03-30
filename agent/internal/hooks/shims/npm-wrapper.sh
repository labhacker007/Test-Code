#!/bin/bash
# NPM wrapper for runtime AI security agent

AGENT_BIN="${RUNTIME_AI_AGENT_PATH:-$HOME/.runtime-ai-security/agent}"
REAL_NPM=$(which -a npm | grep -v runtime-ai-security | head -1)

if [ -z "$REAL_NPM" ]; then
    echo "Error: npm not found" >&2
    exit 1
fi

# Check if this is an install command
if [[ "$1" == "install" ]] || [[ "$1" == "i" ]] || [[ "$1" == "add" ]]; then
    # Notify agent (via socket or file)
    if [ -x "$AGENT_BIN" ]; then
        # Extract package names
        PACKAGES=""
        for arg in "$@"; do
            if [[ ! "$arg" =~ ^- ]] && [[ "$arg" != "install" ]] && [[ "$arg" != "i" ]] && [[ "$arg" != "add" ]]; then
                PACKAGES="$PACKAGES $arg"
            fi
        done
        
        if [ -n "$PACKAGES" ]; then
            echo "Runtime AI Security: Scanning packages:$PACKAGES" >&2
            # TODO: IPC call to agent for pre-install scan
            # $AGENT_BIN scan-package --ecosystem=npm --packages="$PACKAGES"
        fi
    fi
fi

# Execute real npm
exec "$REAL_NPM" "$@"
