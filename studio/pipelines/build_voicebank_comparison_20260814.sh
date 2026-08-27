#!/usr/bin/env bash
set -euo pipefail

ROOT="/Users/sj/OSMU-archive/haejo-danta/_experiment"
IN="$ROOT/voicebank"
OUT="$ROOT/generated/EC0147-voicebank-훅-2026-08-14-elevenlabs_minimax-40종.wav"
ORDER="$IN/comparison-order.tsv"
TMP=$(mktemp -d /tmp/ec0147-voicebank.XXXXXX)
trap 'rm -rf "$TMP"' EXIT

VOICES=(Arthur Cillian John Callum Holden Bram Marcus Brooks Gideon Sterling Harrison Alistair Kevin Caspian Julian Mark Orion Andre Xavier Vlad)

ffmpeg -hide_banner -loglevel error -f lavfi -i anullsrc=r=44100:cl=mono -t 0.9 -c:a pcm_s16le "$TMP/silence.wav"
printf 'number\tvariant\tvoice\tfile\n' >"$ORDER"

list="$TMP/concat.txt"
: >"$list"
number=0
for voice in "${VOICES[@]}"; do
  for variant in elevenlabs minimax; do
    number=$((number + 1))
    src="$IN/${variant}-${voice}-훅.mp3"
    pcm="$TMP/$(printf '%02d' "$number")-${variant}-${voice}.wav"
    if [[ ! -s "$src" ]]; then
      printf 'missing hook sample: %s\n' "$src" >&2
      exit 1
    fi
    ffmpeg -hide_banner -loglevel error -i "$src" -ar 44100 -ac 1 -c:a pcm_s16le "$pcm"
    printf "file '%s'\n" "$pcm" >>"$list"
    if (( number < 40 )); then
      printf "file '%s'\n" "$TMP/silence.wav" >>"$list"
    fi
    printf '%s\t%s\t%s\t%s\n' "$number" "$variant" "$voice" "$src" >>"$ORDER"
  done
done

ffmpeg -hide_banner -loglevel error -f concat -safe 0 -i "$list" -c:a pcm_s16le "$OUT"
ffprobe -v error -show_entries format=duration,size -of json "$OUT"
