#!/usr/bin/env bash
# Wraps git commit adjusting the timestamp if run during working hours.
# Sensitive window: Mon-Fri 08:00-19:00 Europe/Madrid — PUBLIC repos only:
# in a private repo there is no public exposure, so commits use real time.
# Usage: .claude/scripts/safe-commit.sh [git commit options]
#        .claude/scripts/safe-commit.sh --visibility   (prints "public"/"private" and exits)

TIMEZONE="Europe/Madrid"

# Visibilidad del repo — gobierna si la ventana sensible aplica:
#   auto    = detectar (gh CLI o API pública de GitHub; resultado cacheado 24h en .git/)
#   private = forzar privado (nunca ajustar timestamps)
#   public  = forzar público (ajustar siempre en ventana sensible) — usar también si el
#             repo es privado hoy pero podría hacerse público: los timestamps reales
#             commiteados en privado afloran retroactivamente al publicarlo
#
# Se resuelve en cascada, del más específico al más general:
#   1. `git config scaffold.repoVisibility <valor>` — override por clon (vive en .git/config)
#   2. `"repoVisibility"` en .claude/scaffold.json — declaración del proyecto, versionada
#   3. detección automática, y si no es concluyente se asume público (conservador)
# El paso 2 existe porque .git/config no viaja en el repositorio: en un entorno de ejecución
# efímero se destruye con el contenedor, y la detección automática allí suele ser imposible
# (sin gh y con la API de GitHub bloqueada). La declaración versionada es la única duradera.
REPO_VISIBILITY="$(git config --get scaffold.repoVisibility 2>/dev/null || echo auto)"

# Lee "repoVisibility" de .claude/scaffold.json (JSON plano; sin dependencia de jq)
declared_visibility() {
  local root manifest value
  root=$(git rev-parse --show-toplevel 2>/dev/null) || return
  manifest="$root/.claude/scaffold.json"
  [[ -f "$manifest" ]] || return
  value=$(grep -o '"repoVisibility"[[:space:]]*:[[:space:]]*"[^"]*"' "$manifest" 2>/dev/null \
          | head -1 | sed 's/.*"\([^"]*\)"$/\1/')
  case "$value" in
    public|private) echo "$value" ;;
    "") ;;
    *) echo "⚠️  safe-commit: repoVisibility inválido en .claude/scaffold.json ('$value'); se ignora" >&2 ;;
  esac
}

detect_visibility() {
  case "$REPO_VISIBILITY" in
    public|private) echo "$REPO_VISIBILITY"; return ;;
  esac

  local declared
  declared=$(declared_visibility)
  case "$declared" in
    public|private) echo "$declared"; return ;;
  esac

  local git_dir cache value epoch now url slug detected="" code
  now=$(date +%s)
  git_dir=$(git rev-parse --git-dir 2>/dev/null)
  if [[ -n "$git_dir" && -f "$git_dir/scaffold-repo-visibility" ]]; then
    cache="$git_dir/scaffold-repo-visibility"
    read -r value epoch < "$cache" 2>/dev/null
    if [[ ( "$value" == "public" || "$value" == "private" ) && -n "$epoch" && $(( now - epoch )) -lt 86400 ]]; then
      echo "$value"; return
    fi
  fi

  url=$(git config --get remote.origin.url 2>/dev/null)
  case "$url" in
    *github.com*) slug=$(printf '%s' "$url" | sed -E 's#.*github\.com[:/]##; s#\.git$##; s#/$##') ;;
    *) slug="" ;;
  esac

  if [[ -n "$slug" ]]; then
    if command -v gh >/dev/null 2>&1; then
      case "$(gh api "repos/$slug" --jq .private 2>/dev/null)" in
        true)  detected="private" ;;
        false) detected="public" ;;
      esac
    fi
    if [[ -z "$detected" ]] && command -v curl >/dev/null 2>&1; then
      code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "https://api.github.com/repos/$slug" 2>/dev/null)
      case "$code" in
        200) detected="public" ;;
        404) detected="private" ;;  # invisible sin autenticar = sin exposición pública
      esac
    fi
  fi

  if [[ -z "$detected" ]]; then
    # Sin remote GitHub, sin red o respuesta no concluyente (403/proxy): asumir público
    # y seguir protegiendo el timestamp. No se cachea — reintentar en el próximo commit.
    # El aviso hace visible el supuesto: sin él, un repo privado en un entorno donde la
    # detección nunca funciona pasa por público indefinidamente sin que nadie lo note.
    echo "ℹ️  safe-commit: visibilidad no confirmada (sin gh, sin red o API bloqueada); asumiendo público." >&2
    echo "    Decláralo en .claude/scaffold.json — \"repoVisibility\": \"private\" (o \"public\") — para fijarlo." >&2
    echo "public"; return
  fi

  [[ -n "$git_dir" ]] && printf '%s %s\n' "$detected" "$now" > "$git_dir/scaffold-repo-visibility" 2>/dev/null
  echo "$detected"
}

if [[ "$1" == "--visibility" ]]; then
  detect_visibility
  exit 0
fi

DOW=$(TZ="$TIMEZONE" date +%u)          # 1=Mon ... 7=Sun
HOUR=$(( 10#$(TZ="$TIMEZONE" date +%H) )) # 0-23, forzado a decimal

is_sensitive_window() {
  [[ "$DOW" -le 5 && "$HOUR" -ge 8 && "$HOUR" -lt 19 ]]
}

if is_sensitive_window; then
  if [[ "$(detect_visibility)" == "private" ]]; then
    echo "🔒  Repo privado: la ventana sensible no aplica — commit con hora real" >&2
  else
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
      # El padre es más reciente que el candidato: fechar 1-10 min después del padre.
      # El epoch se formatea a ISO antes de exportarse — git no parsea "epoch offset"
      # sin el prefijo "@" y committearía en silencio con la hora real
      CAND_EPOCH=$(( PARENT_EPOCH + 60 + RANDOM % 540 ))
      TIMESTAMP=$(TZ="$TIMEZONE" date -d "@$CAND_EPOCH" +%Y-%m-%dT%H:%M:%S%z 2>/dev/null) \
        || TIMESTAMP=$(TZ="$TIMEZONE" date -r "$CAND_EPOCH" +%Y-%m-%dT%H:%M:%S%z 2>/dev/null) \
        || TIMESTAMP=""
    fi

    # Aserción: nunca exportar nada que no sea una fecha ISO formateada
    if [[ ! "$TIMESTAMP" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}[+-][0-9]{4}$ ]]; then
      echo "⚠️  safe-commit: timestamp no formateado ('$TIMESTAMP'); commit con hora real" >&2
    else
      export GIT_AUTHOR_DATE="$TIMESTAMP"
      export GIT_COMMITTER_DATE="$TIMESTAMP"
      echo "⏰  Horario sensible. Timestamp ajustado a: $TIMESTAMP" >&2
    fi
  fi
  fi
fi

exec git commit "$@"
