#!/usr/bin/env bash
set -u

ROOT="/Users/sj/OSMU-archive/haejo-danta/_experiment"
OUT="$ROOT/voicebank"
LOG="$OUT/_logs"
RESULTS="$OUT/_results"
mkdir -p "$OUT" "$LOG" "$RESULTS"

HOOK='토요일 2시, 카페 웨이팅이 32번이었음. 그날 장사 진짜 잘됐다는 뜻임. 근데 그날 저녁 뉴스는 경기가 불황이라고 함.'
EXPLAIN='경기는 나라 전체가 평소보다 잘 돌고 있는지를 말함. 그래서 나라는 전국의 생산, 소비, 고용 지표를 다 모아서 지수 하나로 만듦. 그게 경기종합지수임.'

VOICES=(
  'Arthur|30fc8796-ceb6-4a66-b3a7-4a145ef7f346'
  'Cillian|d8ba9f14-8a24-44db-932b-99e16c45bd32'
  'John|6b528d43-c056-4a2f-9d82-1591a7ba13b0'
  'Callum|858499d9-fef5-40e1-bc29-b4dc661dc283'
  'Holden|3c9d6053-6334-592c-8997-4e325286af3f'
  'Bram|549ff70a-3ee7-4f04-a4d9-89a24fab7709'
  'Marcus|6f98d3dd-324f-4845-8c28-c1d1647a06cd'
  'Brooks|c2acff45-84b2-4974-892d-89fa2d4e5598'
  'Gideon|1ad38ba4-9cc4-4f2f-9fde-b0fefdf67ae5'
  'Sterling|dc382508-c8bd-443c-8cb2-46e57b8d2e6f'
  'Harrison|573e5163-59b3-4926-aab1-951ef2985f81'
  'Alistair|d9d5c263-f84e-4752-97b5-3750fcc6fd2f'
  'Kevin|f1373f24-3b96-433f-9a68-e595810ef608'
  'Caspian|ef70cc83-3015-4bad-9359-0ea968c43ec0'
  'Julian|95429266-c0ac-4137-a209-63b8812b0f23'
  'Mark|27c04473-84a9-4b60-a41f-c8e8458bd4f1'
  'Orion|ed69c516-92d2-4b30-a967-617737a342e5'
  'Andre|f1e8226e-2248-4d5f-b43c-0a79e9949dbf'
  'Xavier|43173c95-3ec8-446a-a162-6504332c578b'
  'Vlad|e5666b9c-99a2-4fac-8b4e-abee078b186d'
)

run_one() {
  local variant="$1" name="$2" voice_id="$3" kind="$4" prompt="$5"
  local slug="${variant}-${name}-${kind}"
  local audio="$OUT/${slug}.mp3"
  local raw="$LOG/${slug}.json"
  local err="$LOG/${slug}.stderr.txt"
  local result="$RESULTS/${slug}.tsv"
  local url status job_id message gender age supported

  if [[ -s "$result" && -s "$audio" ]] && awk -F '\t' '$6=="success" {ok=1} END {exit !ok}' "$result"; then
    return 0
  fi

  if [[ "$variant" == "elevenlabs" && "$name" == "John" && "$kind" == "훅" ]]; then
    higgsfield generate get 864b22fe-1e08-46b2-968d-650fcf365884 --json >"$raw" 2>"$err" || true
  else
    higgsfield generate create text2speech_v2 \
      --prompt "$prompt" \
      --variant "$variant" \
      --voice-id "$voice_id" \
      --voice-type preset \
      --wait --json >"$raw" 2>"$err" || true
  fi

  status=$(jq -r 'if type=="array" then (.[0].status // "unknown") else (.status // "unknown") end' "$raw" 2>/dev/null || printf 'invalid_json')
  url=$(jq -r 'if type=="array" then (.[0].result_url // empty) else (.result_url // empty) end' "$raw" 2>/dev/null || true)
  job_id=$(jq -r 'if type=="array" then (.[0].id // empty) else (.id // empty) end' "$raw" 2>/dev/null || true)
  gender=$(jq -r 'if type=="array" then (.[0].params.voice.gender // "unknown") else (.params.voice.gender // "unknown") end' "$raw" 2>/dev/null || printf 'unknown')
  age=$(jq -r 'if type=="array" then (.[0].params.voice.age // "unknown") else (.params.voice.age // "unknown") end' "$raw" 2>/dev/null || printf 'unknown')
  supported=$(jq -r 'if type=="array" then ((.[0].params.voice.supported_models // [])|join(",")) else ((.params.voice.supported_models // [])|join(",")) end' "$raw" 2>/dev/null || true)
  message=$(tr '\n\t' '  ' <"$err" | sed 's/  */ /g')

  if [[ "$status" == "completed" && -n "$url" ]]; then
    if curl -L --fail --silent --show-error "$url" -o "$audio" 2>>"$err"; then
      if ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "$audio" >/dev/null 2>>"$err"; then
        printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\n' "$variant" "$name" "$voice_id" "$kind" "$audio" success 0.3 "$job_id" "$gender" "$age" "$supported" >"$result"
        return 0
      fi
    fi
    status="download_or_probe_failed"
  fi

  message=$(tr '\n\t' '  ' <"$err" | sed 's/  */ /g')
  if [[ -z "$message" ]]; then
    message=$(jq -c 'if type=="array" then .[0] else . end' "$raw" 2>/dev/null || printf 'no_error_message')
  fi
  printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\n' "$variant" "$name" "$voice_id" "$kind" "$audio" "failed:$status:$message" 0.0 "$job_id" "$gender" "$age" "$supported" >"$result"
}

max_parallel=4
pids=()
for voice in "${VOICES[@]}"; do
  IFS='|' read -r name voice_id <<<"$voice"
  for variant in elevenlabs minimax; do
    for kind in 훅 설명; do
      if [[ "$kind" == "훅" ]]; then prompt="$HOOK"; else prompt="$EXPLAIN"; fi
      run_one "$variant" "$name" "$voice_id" "$kind" "$prompt" &
      pids+=("$!")
      if (( ${#pids[@]} >= max_parallel )); then
        wait "${pids[0]}" || true
        pids=("${pids[@]:1}")
      fi
    done
  done
done
for pid in "${pids[@]}"; do
  wait "$pid" || true
done

{
  printf 'variant\tvoice\tvoice_id\tkind\tfile\tstatus\tcredits\tjob_id\tgender\tage\tsupported_models\n'
  find "$RESULTS" -type f -name '*.tsv' -print0 | sort -z | xargs -0 cat
} >"$OUT/manifest.tsv"

printf 'success=%s failed=%s files=%s\n' \
  "$(awk -F '\t' 'NR>1 && $6=="success" {n++} END {print n+0}' "$OUT/manifest.tsv")" \
  "$(awk -F '\t' 'NR>1 && $6!="success" {n++} END {print n+0}' "$OUT/manifest.tsv")" \
  "$(find "$OUT" -maxdepth 1 -type f -name '*.mp3' | wc -l | tr -d ' ')"
