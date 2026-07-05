#!/usr/bin/env bash
# ------------------------------------------------------------------------------
# deploy-web.sh — Deploy the Next.js web admin to Vercel.
#
# Behaviour:
#   • Resolves the Vercel CLI (locally installed or via npx).
#   • If a `.vercel/project.json` link doesn't exist, links the project
#     (--yes) using VERCEL_PROJECT_ID / VERCEL_ORG_ID from the env, otherwise
#     creates a new project.
#   • Reads every `KEY=VALUE` from `web/.env.local` and pushes it to Vercel
#     via `vercel env add` (idempotent — Vercel skips duplicates).
#   • Runs `vercel deploy --prod --yes` and prints the final URL.
#
# Required env:
#   VERCEL_TOKEN      Personal token (https://vercel.com/account/tokens)
#
# Optional env (only needed for non-interactive first-time link):
#   VERCEL_ORG_ID     Vercel team / user id
#   VERCEL_PROJECT_ID Existing project id (to link to)
#
# Usage:
#   ./scripts/deploy-web.sh
#   VERCEL_TOKEN=... ./scripts/deploy-web.sh
#   ./scripts/deploy-web.sh --skip-env   # don't push env vars
# ------------------------------------------------------------------------------
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
# shellcheck source=_lib.sh
source "${SCRIPT_DIR}/_lib.sh"

REPO_ROOT="$(cd -- "${SCRIPT_DIR}/.." &>/dev/null && pwd)"
WEB_DIR="${REPO_ROOT}/web"
ENV_FILE="${WEB_DIR}/.env.local"
SKIP_ENV=0
SKIP_BUILD=0

usage_and_exit() {
  cat <<EOF
${C_BOLD}deploy-web.sh${C_RESET} — Deploy the web admin to Vercel.

${C_BOLD}USAGE${C_RESET}
  ./scripts/deploy-web.sh [options]

${C_BOLD}OPTIONS${C_RESET}
      --skip-env     Don't push env vars to Vercel (assume they're already set)
      --skip-build   Skip local 'vercel build' (faster, but no local sanity check)
  -h, --help         Show this help

${C_BOLD}REQUIRED ENV${C_RESET}
  VERCEL_TOKEN       Vercel personal access token

${C_BOLD}OPTIONAL ENV${C_RESET}
  VERCEL_ORG_ID      Vercel org/user id (for first-time project link)
  VERCEL_PROJECT_ID  Vercel project id (to link to existing project)
EOF
  exit 0
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help) usage_and_exit ;;
    --skip-env) SKIP_ENV=1; shift ;;
    --skip-build) SKIP_BUILD=1; shift ;;
    *) die "Unknown option: $1 (try --help)" ;;
  esac
done

# ---- Preflight --------------------------------------------------------------
banner "BlinkGo — deploy web to Vercel"

[[ -n "${VERCEL_TOKEN:-}" ]] || die "VERCEL_TOKEN env var is required (https://vercel.com/account/tokens)"
[[ -d "$WEB_DIR" ]] || die "web/ directory not found at $WEB_DIR"

# ---- Resolve Vercel CLI ----------------------------------------------------
VERCEL_BIN="vercel"
if ! command -v vercel >/dev/null 2>&1; then
  log_warn "Vercel CLI not installed locally — falling back to 'npx vercel'"
  VERCEL_BIN="npx --yes vercel"
fi

vercel() {
  # Subshell wrapper so 'command vercel' isn't recursively called.
  if [[ "$VERCEL_BIN" == "npx --yes vercel" ]]; then
    command npx --yes vercel "$@"
  else
    command vercel "$@"
  fi
}

# ---- Authenticate -----------------------------------------------------------
log_step "Authenticating with Vercel"
# Pipe the token into `vercel login` (which reads from stdin in non-TTY mode).
if [[ -n "${VERCEL_TOKEN:-}" ]]; then
  # Newer CLI: just use --token flag and skip the interactive login.
  export VERCEL_TOKEN
  log_ok "Using VERCEL_TOKEN (token-based auth)"
else
  echo "$VERCEL_TOKEN" | vercel login --stdin
fi

# Sanity check: who am I?
vercel whoami --token "$VERCEL_TOKEN" 2>/dev/null | head -n1 \
  | { read -r first_line; log_ok "Logged in as: ${first_line:-unknown}"; }

# ---- Link or create project -------------------------------------------------
log_step "Linking Vercel project"
LINK_DIR="${WEB_DIR}/.vercel"
if [[ -f "${LINK_DIR}/project.json" ]]; then
  log_ok "Already linked: $(jq -r '.projectId' "${LINK_DIR}/project.json" 2>/dev/null || echo unknown)"
else
  mkdir -p "$LINK_DIR"
  (
    cd "$WEB_DIR"
    if [[ -n "${VERCEL_PROJECT_ID:-}" && -n "${VERCEL_ORG_ID:-}" ]]; then
      log_info "Linking to existing project ${VERCEL_PROJECT_ID}"
      vercel link --yes \
        --token "$VERCEL_TOKEN" \
        --project-id "$VERCEL_PROJECT_ID" \
        --org-id "$VERCEL_ORG_ID"
    else
      log_info "Creating new Vercel project (no VERCEL_PROJECT_ID set)"
      vercel link --yes --token "$VERCEL_TOKEN"
    fi
  )
fi

# ---- Push env vars ----------------------------------------------------------
if [[ "$SKIP_ENV" == "1" ]]; then
  log_step "Skipping env var sync (--skip-env)"
else
  log_step "Pushing env vars from web/.env.local"
  if [[ ! -f "$ENV_FILE" ]]; then
    log_warn "No $ENV_FILE found — assuming env vars are already set in Vercel"
  else
    # Pull every KEY=VALUE, ignore blank lines and comments.
    # We pipe the values to `vercel env add <key> production` via stdin.
    # Note: `vercel env add` is idempotent in the sense that re-adding the
    # same value is harmless (it just overwrites).
    PUSHED=0
    SKIPPED=0
    while IFS= read -r line; do
      # Skip blanks/comments.
      [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
      # Must be KEY=VALUE.
      if [[ "$line" =~ ^[[:space:]]*([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
        key="${BASH_REMATCH[1]}"
        # Strip optional surrounding quotes.
        value="${BASH_REMATCH[2]}"
        value="${value%\"}"; value="${value#\"}"
        value="${value%\'}"; value="${value#\'}"

        # Decide which envs to target. Push to preview+production by default.
        # You can limit this to "production" by exporting VERCEL_ENVS=production.
        envs="${VERCEL_ENVS:-preview production}"

        for env in $envs; do
          log_substep "  ${key} → ${env}"
          # `vercel env add` reads the value from stdin. Use --force to
          # overwrite the existing value silently.
          if printf '%s' "$value" | vercel env add "$key" "$env" \
               --yes --token "$VERCEL_TOKEN" --force 2>/dev/null; then
            PUSHED=$((PUSHED + 1))
          else
            SKIPPED=$((SKIPPED + 1))
          fi
        done
      fi
    done < "$ENV_FILE"
    log_ok "Env sync done (pushed: $PUSHED, skipped: $SKIPPED)"
  fi
fi

# ---- Local sanity build (optional) ------------------------------------------
if [[ "$SKIP_BUILD" == "0" ]]; then
  log_step "Running local build sanity check"
  if ( cd "$WEB_DIR" && npm run build ); then
    log_ok "Local build OK"
  else
    die "Local web build FAILED — fix and retry"
  fi
fi

# ---- Deploy -----------------------------------------------------------------
log_step "Deploying to production"
(
  cd "$WEB_DIR"
  DEPLOY_OUTPUT=$(vercel deploy --prod --yes --token "$VERCEL_TOKEN" 2>&1)
  echo "$DEPLOY_OUTPUT"
)

# Pull the URL out of the deploy output (last non-empty line that starts with https).
DEPLOY_URL=$(vercel inspect --yes --token "$VERCEL_TOKEN" 2>/dev/null \
             | awk '/^URL:/ {print $2; exit}' || true)
if [[ -z "$DEPLOY_URL" ]]; then
  # Fall back to parsing the deploy output we captured.
  DEPLOY_URL=$(printf '%s\n' "$DEPLOY_OUTPUT" \
               | grep -Eo 'https://[a-z0-9.-]+\.vercel\.app' \
               | tail -n1 || true)
fi

if [[ -n "$DEPLOY_URL" ]]; then
  log_ok "Deployed: ${C_BOLD}${C_CYAN}${DEPLOY_URL}${C_RESET}"
  printf '%s' "$DEPLOY_URL"
else
  log_warn "Deployed, but couldn't extract URL. Check Vercel dashboard."
fi
