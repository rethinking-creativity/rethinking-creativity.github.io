#!/usr/bin/env bash
# Runs `hyperframes check` and a contact sheet for every project (or the ones given).
# Usage: bash review.sh [vertical/01-spot-the-ai ...]    (run from promotion/videos)
# Writes _review/<folder>-<name>.check.txt and _review/<folder>-<name>.jpg
set -u
cd "$(dirname "$0")/.."
mkdir -p _review
dirs=("$@"); [ ${#dirs[@]} -eq 0 ] && dirs=(vertical/* landscape/*)
SKIPCHECK=${SKIPCHECK:-0}
for d in "${dirs[@]}"; do
  tag="${d%%/*}-$(basename "$d")"
  dur=$(grep -o 'data-composition-id="main" data-start="0" data-duration="[0-9.]*"' "$d/index.html" | grep -o '[0-9.]*"$' | tr -d '"')
  times=$(python3 -c "d=$dur; n=8; print(','.join(f'{(i+0.5)*d/n:.2f}' for i in range(n)))")
  [ "$SKIPCHECK" = 1 ] || ( cd "$d" && npx --yes hyperframes@0.9.75 check > "../../_review/$tag.check.txt" 2>&1 )
  ( cd "$d" && npx --yes hyperframes@0.9.75 snapshot --at "$times" > /dev/null 2>&1 )
  snapdir=$(ls -td "$d"/.hyperframes/artifacts/snapshots/*/ 2>/dev/null | head -1)
  i=0; for sheet in "$snapdir"contact-sheet*.jpg; do [ -f "$sheet" ] && cp "$sheet" "_review/$tag-$i.jpg"; i=$((i+1)); done
  echo "done $tag $(grep -o '[0-9]* error(s)' "_review/$tag.check.txt" | sort | uniq -c | tr '\n' ' ')"
done
echo ALL-DONE
