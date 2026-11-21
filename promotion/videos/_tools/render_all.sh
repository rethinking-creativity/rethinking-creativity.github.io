#!/usr/bin/env bash
# Renders every project (or those given) to _out/<folder>-<name>.mp4 at delivery quality.
# Usage: bash render_all.sh [vertical/01-spot-the-ai ...]   (run from promotion/videos)
set -u
cd "$(dirname "$0")/.."
mkdir -p _out
dirs=("$@"); [ ${#dirs[@]} -eq 0 ] && dirs=(vertical/* landscape/*)
for d in "${dirs[@]}"; do
  tag="${d%%/*}-$(basename "$d")"
  ( cd "$d" && npx --yes hyperframes@0.9.75 render -q delivery -o "../../_out/$tag.mp4" > "../../_out/$tag.log" 2>&1 )
  if [ -f "_out/$tag.mp4" ]; then echo "ok $tag $(du -h "_out/$tag.mp4" | cut -f1)"; else echo "FAIL $tag"; fi
done
echo ALL-DONE
