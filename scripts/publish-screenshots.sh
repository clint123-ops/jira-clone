#!/usr/bin/env bash
# Publishes `npm run ui-check` screenshots to the `pr-screenshots` branch (without touching the current branch)
# and prints a Markdown table to paste into the PR description.
#
# Usage: scripts/publish-screenshots.sh screenshots/<branch-name>
# REPO_URL can be overridden via env var (defaults to `gh repo view`).
set -euo pipefail

if [ $# -ne 1 ] || [ ! -d "$1" ]; then
  echo "Usage: $0 <screenshots directory>" >&2
  exit 1
fi

SRC="$(cd "$1" && pwd)"
NAME="$(basename "$SRC")"
BRANCH=pr-screenshots
REPO_URL="${REPO_URL:-$(gh repo view --json url -q .url)}"
WT="$(mktemp -d)"
trap 'git worktree remove --force "$WT" >/dev/null 2>&1 || true' EXIT

if git ls-remote --exit-code --heads origin "$BRANCH" >/dev/null 2>&1; then
  git fetch -q origin "$BRANCH"
  git worktree add -q --detach "$WT" "origin/$BRANCH"
else
  git worktree add -q --detach "$WT"
  git -C "$WT" checkout -q --orphan "$BRANCH"
  git -C "$WT" rm -rfq .
fi

rm -rf "${WT:?}/$NAME"
mkdir -p "$WT/$NAME"
cp "$SRC"/*.png "$WT/$NAME/"
git -C "$WT" add "$NAME"
git -C "$WT" commit -q -m "Screenshots: $NAME" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" || true
git -C "$WT" push -q origin "HEAD:refs/heads/$BRANCH"

img() { echo "<img src=\"$REPO_URL/blob/$BRANCH/$NAME/$1?raw=true\" width=\"$2\">"; }

echo "| View | Desktop (1440×900) | Tablet (768×1024) | Mobile (375×812) |"
echo "|---|---|---|---|"
for file in "$SRC"/desktop-*.png; do
  page="$(basename "$file" .png)"
  page="${page#desktop-}"
  echo "| \`$page\` | $(img "desktop-$page.png" 320) | $(img "tablet-$page.png" 200) | $(img "mobile-$page.png" 140) |"
done
