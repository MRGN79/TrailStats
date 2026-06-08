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

  YESTERDAY=$(TZ="$TIMEZONE" date -d "yesterday" +%Y-%m-%d)
  TZ_OFFSET=$(TZ="$TIMEZONE" date +%z)
  TIMESTAMP="${YESTERDAY}T$(printf '%02d:%02d:00' "$H" "$M")${TZ_OFFSET}"

  export GIT_AUTHOR_DATE="$TIMESTAMP"
  export GIT_COMMITTER_DATE="$TIMESTAMP"

  echo "⏰  Horario sensible. Timestamp ajustado a: $TIMESTAMP" >&2
fi

exec git commit "$@"
