#!/bin/bash
# Validate documentation consistency

set -e

PROJECT_ROOT="${1:-.}"
ERRORS=0

echo "📚 Documentation Validation"
echo "============================"
echo ""

# Check 1: Required files exist
echo "1. Checking required files..."
REQUIRED_FILES=(
    "README.md"
    "ARCHITECTURE.md"
    "CHANGELOG.md"
    "CONTRIBUTING.md"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [[ -f "$PROJECT_ROOT/$file" ]]; then
        echo "   ✓ $file"
    else
        echo "   ✗ $file - MISSING"
        ((ERRORS++))
    fi
done
echo ""

# Check 2: No broken internal links
echo "2. Checking internal links..."
BROKEN_LINKS=$(find "$PROJECT_ROOT" -name "*.md" -type f -exec grep -oP '\[.*?\]\(\K[^)]+(?=\))' {} + 2>/dev/null | \
    grep -v '^http' | \
    while read -r link; do
        if [[ ! -f "$PROJECT_ROOT/$link" ]] && [[ ! -d "$PROJECT_ROOT/$link" ]]; then
            echo "$link"
        fi
    done)

if [[ -z "$BROKEN_LINKS" ]]; then
    echo "   ✓ All internal links valid"
else
    echo "   ✗ Broken links found:"
    echo "$BROKEN_LINKS" | sed 's/^/     /'
    ((ERRORS++))
fi
echo ""

# Check 3: Version consistency
echo "3. Checking version consistency..."
VERSIONS=$(grep -rh "Version.*0\.[0-9]\+\.[0-9]\+" "$PROJECT_ROOT"/*.md 2>/dev/null | \
    grep -oP '0\.[0-9]+\.[0-9]+' | sort -u)

VERSION_COUNT=$(echo "$VERSIONS" | wc -l)
if [[ $VERSION_COUNT -eq 1 ]]; then
    echo "   ✓ Consistent version: $VERSIONS"
elif [[ $VERSION_COUNT -eq 0 ]]; then
    echo "   ⚠ No version found in docs"
else
    echo "   ✗ Multiple versions found:"
    echo "$VERSIONS" | sed 's/^/     /'
    ((ERRORS++))
fi
echo ""

# Check 4: ARCHITECTURE.md has diagrams
echo "4. Checking ARCHITECTURE.md structure..."
if [[ -f "$PROJECT_ROOT/ARCHITECTURE.md" ]]; then
    if grep -q "┌─" "$PROJECT_ROOT/ARCHITECTURE.md" || grep -q "\`\`\`mermaid" "$PROJECT_ROOT/ARCHITECTURE.md"; then
        echo "   ✓ Contains diagrams"
    else
        echo "   ⚠ No diagrams found - consider adding visual representations"
    fi
    
    REQUIRED_SECTIONS=("Threat model" "Component" "Architecture")
    for section in "${REQUIRED_SECTIONS[@]}"; do
        if grep -qi "$section" "$PROJECT_ROOT/ARCHITECTURE.md"; then
            echo "   ✓ Section '$section' present"
        else
            echo "   ⚠ Section '$section' missing"
        fi
    done
else
    echo "   ✗ ARCHITECTURE.md not found"
    ((ERRORS++))
fi
echo ""

# Check 5: Code examples are properly formatted
echo "5. Checking code examples..."
INVALID_BLOCKS=$(find "$PROJECT_ROOT" -name "*.md" -type f -exec grep -n '```' {} + 2>/dev/null | \
    grep -v '```[a-z]*$' | \
    grep -v '```:' | \
    wc -l)

if [[ $INVALID_BLOCKS -eq 0 ]]; then
    echo "   ✓ All code blocks properly formatted"
else
    echo "   ⚠ Found $INVALID_BLOCKS potentially invalid code blocks"
fi
echo ""

# Summary
echo "============================"
if [[ $ERRORS -eq 0 ]]; then
    echo "✅ Documentation validation passed"
    exit 0
else
    echo "❌ Found $ERRORS error(s)"
    exit 1
fi
