#!/bin/bash
# Update CHANGELOG.md from git commits

set -e

VERSION=${1:-"Unreleased"}
SINCE=${2:-"HEAD~10"}

echo "# Generating CHANGELOG entries"
echo "Version: $VERSION"
echo "Since: $SINCE"
echo ""

# Get commit messages since last tag
git log $SINCE..HEAD --pretty=format:"%s" --no-merges | \
while read -r msg; do
    # Categorize commits
    if [[ $msg =~ ^feat:|^add: ]]; then
        echo "### Added"
        echo "- ${msg#*:}"
    elif [[ $msg =~ ^fix: ]]; then
        echo "### Fixed"
        echo "- ${msg#*:}"
    elif [[ $msg =~ ^refactor:|^perf: ]]; then
        echo "### Changed"
        echo "- ${msg#*:}"
    elif [[ $msg =~ ^docs: ]]; then
        echo "### Documentation"
        echo "- ${msg#*:}"
    fi
done | sort -u

echo ""
echo "---"
echo "Generated: $(date)"
