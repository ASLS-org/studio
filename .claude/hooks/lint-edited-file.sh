#!/bin/sh
# PostToolUse hook: lint the .js/.vue file Claude just edited (no --fix) and report problems back.
# Exit 2 sends stderr to Claude; anything else is silent.

file=$(jq -r '.tool_input.file_path // empty')

case "$file" in
  */node_modules/* | */dist/* | */out/* | */orbitcontrol.zup.patch.js) exit 0 ;;
  "$CLAUDE_PROJECT_DIR"/src/*.js | "$CLAUDE_PROJECT_DIR"/src/*.vue) ;;
  *) exit 0 ;;
esac

[ -f "$file" ] || exit 0

cd "$CLAUDE_PROJECT_DIR" || exit 0
if ! out=$(npx --no-install eslint -f unix "$file" 2>&1); then
  printf 'ESLint problems in %s (fix those in lines you touched):\n%s\n' "$file" "$out" >&2
  exit 2
fi
exit 0
