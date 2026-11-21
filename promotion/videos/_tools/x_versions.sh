#!/usr/bin/env bash
# X (Twitter) versions: X has no custom thumbnail, so each film starts with its cover for 0.5 s (silent),
# then the film itself. Vertical films get the Shorts/Reels cover, landscape films the YouTube thumbnail.
# Usage: bash promotion/videos/_tools/x_versions.sh    -> _out/x/NN-look-{vertical,landscape}-x.mp4
set -eu
cd "$(dirname "$0")/.."
mkdir -p _out/x
HOLD=0.5
for v in _out/kinetic/*.mp4; do
  b=$(basename "$v" .mp4)            # e.g. vertical-01-punch
  shape=${b%%-*}; look=${b#*-}       # vertical / 01-punch
  if [ "$shape" = vertical ]; then cover=_out/thumbs/$look-shorts.jpg; size=1080:1920; else cover=_out/thumbs/$look.jpg; size=1920:1080; fi
  ffmpeg -y -loglevel error \
    -loop 1 -framerate 30 -t $HOLD -i "$cover" \
    -f lavfi -t $HOLD -i anullsrc=channel_layout=stereo:sample_rate=48000 \
    -i "$v" \
    -filter_complex "[0:v]scale=$size,setsar=1,format=yuv420p,fps=30[c];[2:v]setsar=1,format=yuv420p,fps=30[m];[c][1:a][m][2:a]concat=n=2:v=1:a=1[outv][outa]" \
    -map "[outv]" -map "[outa]" -c:v libx264 -crf 20 -preset slow -c:a aac -b:a 192k -movflags +faststart \
    "_out/x/$look-$shape-x.mp4"
  echo "ok $look-$shape-x.mp4"
done
