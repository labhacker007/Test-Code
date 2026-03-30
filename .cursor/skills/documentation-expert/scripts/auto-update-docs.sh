#!/bin/bash
# Auto-update documentation when code changes
# Install as git post-commit hook: ln -s ../../.cursor/skills/documentation-expert/scripts/auto-update-docs.sh .git/hooks/post-commit

set -e

PROJECT_ROOT="$(git rev-parse --show-toplevel)"
cd "$PROJECT_ROOT"

echo "📝 Checking if documentation needs update..."

# Get files changed in last commit
CHANGED_FILES=$(git diff HEAD~1 --name-only)

# Check if structural changes
if echo "$CHANGED_FILES" | grep -qE '(internal/|pkg/|cmd/|cloud/).*\.go$'; then
    echo "   → Code structure changed"
    
    # Regenerate architecture diagram
    if command -v python3 &> /dev/null; then
        python3 .cursor/skills/documentation-expert/scripts/generate-diagram.py > docs/ARCHITECTURE-AUTO.md
        echo "   ✓ Architecture diagram updated: docs/ARCHITECTURE-AUTO.md"
    fi
    
    # Update component list
    echo "   ℹ Consider updating ARCHITECTURE.md component descriptions"
fi

# Check if API changes
if echo "$CHANGED_FILES" | grep -qE 'handler\.go|router\.go'; then
    echo "   → API endpoints may have changed"
    echo "   ℹ Consider updating docs/API.md"
fi

# Check if schema changes
if echo "$CHANGED_FILES" | grep -qE 'schema\.json|events\.go'; then
    echo "   → Event/policy schemas changed"
    echo "   ℹ Consider updating docs/SCHEMAS.md"
fi

# Check if dependencies changed
if echo "$CHANGED_FILES" | grep -qE 'go\.mod|go\.sum'; then
    echo "   → Dependencies changed"
    echo "   ℹ Consider updating README.md prerequisites"
fi

# Suggest CHANGELOG update
LAST_CHANGELOG_UPDATE=$(git log -1 --format=%ct -- CHANGELOG.md 2>/dev/null || echo 0)
LAST_CODE_UPDATE=$(git log -1 --format=%ct -- "*.go" 2>/dev/null || echo 0)

if [[ $LAST_CODE_UPDATE -gt $LAST_CHANGELOG_UPDATE ]]; then
    echo "   ⚠ CHANGELOG.md not updated recently"
    echo "   ℹ Run: .cursor/skills/documentation-expert/scripts/update-changelog.sh"
fi

echo ""
echo "💡 To validate all docs: make docs-validate"
echo ""
