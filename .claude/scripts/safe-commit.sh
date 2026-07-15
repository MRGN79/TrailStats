#!/usr/bin/env bash
# Wraps git commit adjusting the timestamp if run during working hours.
# Sensitive window: Mon-Fri 08:00-19:00 Europe/Madrid.
# Usage: .claude/scripts/safe-commit.sh [git commit options]

TIMEZONE="Europe/Madrid"

DOW=$(TZ="$TIMEZONE" date +%u)          # 1=Mon ... 7=Sun
HOUR=$(( 10#$(TZ="$TIMEZONE" date +%H) )) # 0-23, forzado a decimal

is_sensitive_window() {
  [[ "$DOW" -le 5 && "$HOUR" -ge 8 && "$HOUR" -lt 19 ]]
}

if is_sensitive_window; then
  H=$(( (RANDOM % 3) + 20 ))  # 20, 21 or 22
  M=$(( RANDOM % 60 ))
  TIME=$(printf '%02d:%02d:00' "$H" "$M")

  # Víspera y su offset — GNU (date -d) con fallback BSD/macOS (date -v)
  if YESTERDAY=$(TZ="$TIMEZONE" date -d "yesterday" +%Y-%m-%d 2>/dev/null); then
    TZ_OFFSET=$(TZ="$TIMEZONE" date -d "yesterday" +%z)
  else
    YESTERDAY=$(TZ="$TIMEZONE" date -v-1d +%Y-%m-%d 2>/dev/null)
    TZ_OFFSET=$(TZ="$TIMEZONE" date -v-1d +%z 2>/dev/null)
  fi

  if [[ -z "$YESTERDAY" || -z "$TZ_OFFSET" ]]; then
    # No bloquear el trabajo: avisar y commitear con hora real
    echo "⚠️  safe-commit: no se pudo calcular la víspera en este sistema; commit con hora real" >&2
  else
    TIMESTAMP="${YESTERDAY}T${TIME}${TZ_OFFSET}"

    # Monotonía: nunca fechar un commit antes que su padre (historial creíble)
    PARENT_EPOCH=$(git log -1 --format=%ct 2>/dev/null || echo 0)
    CAND_EPOCH=$(TZ="$TIMEZONE" date -d "$TIMESTAMP" +%s 2>/dev/null) \
      || CAND_EPOCH=$(TZ="$TIMEZONE" date -j -f "%Y-%m-%dT%H:%M:%S%z" "$TIMESTAMP" +%s 2>/dev/null) \
      || CAND_EPOCH=0
    if [[ "$CAND_EPOCH" -gt 0 && "$PARENT_EPOCH" -gt 0 && "$CAND_EPOCH" -le "$PARENT_EPOCH" ]]; then
      # El padre es más reciente que el candidato: fechar 1-10 min después del padre
      CAND_EPOCH=$(( PARENT_EPOCH + 60 + RANDOM % 540 ))
      TIMESTAMP="${CAND_EPOCH} ${TZ_OFFSET}"   # formato raw de git: "epoch offset"
    fi

    export GIT_AUTHOR_DATE="$TIMESTAMP"
    export GIT_COMMITTER_DATE="$TIMESTAMP"
    echo "⏰  Horario sensible. Timestamp ajustado a: $TIMESTAMP" >&2
  fi
fi

exec git commit "$@"
