#!/bin/bash
# Pip wrapper for runtime AI security agent

AGENT_BIN="${RUNTIME_AI_AGENT_PATH:-$HOME/.runtime-ai-security/agent}"
REAL_PIP=$(which -a pip pip3 | grep -v runtime-ai-security | head -1)

if [ -z "$REAL_PIP" ]; then
    echo "Error: pip not found" >&2
    exit 1
fi

# Check if this is an install command
if [[ "$1" == "install" ]]; then
    # Notify agent
    if [ -x "$AGENT_BIN" ]; then
        PACKAGES=""
        for arg in "$@"; do
            if [[ ! "$arg" =~ ^- ]] && [[ "$arg" != "install" ]]; then
                PACKAGES="$PACKAGES $arg"
            fi
        done
        
        if [ -n "$PACKAGES" ]; then
            echo "Runtime AI Security: Scanning packages:$PACKAGES" >&2
            # TODO: IPC call to agent
            # $AGENT_BIN scan-package --ecosystem=pip --packages="$PACKAGES"
        fi
    fi
fi

# Execute real pip
exec "$REAL_PIP" "$@"
