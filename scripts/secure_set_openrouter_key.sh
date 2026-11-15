#!/usr/bin/env bash
set -e

# Ubuntu Secure Credential Setup for OpenRouter
# Uses hidden tty input (read -s) so your secret is never echoed to screen or logged in ~/.bash_history.

ENV_FILE="/home/zurus06/Documents/Blockathon/server/.env"

echo "=========================================================="
echo "🔐 Ubuntu Secure Credential Setup for OpenRouter"
echo "=========================================================="
echo "Your API key will remain hidden while pasting, kept out of"
echo "bash history, and written directly to server/.env (chmod 600)."
echo ""

# Capture input silently without terminal echo
read -s -p "Paste your OpenRouter API Key: " OPENROUTER_INPUT
echo ""

if [ -z "$OPENROUTER_INPUT" ]; then
  echo "❌ Error: Empty key provided."
  exit 1
fi

# Remove any old OPENROUTER_API_KEY entry from .env
if [ -f "$ENV_FILE" ]; then
  grep -v "^OPENROUTER_API_KEY=" "$ENV_FILE" > "${ENV_FILE}.tmp" || true
  mv "${ENV_FILE}.tmp" "$ENV_FILE"
fi

# Securely append to .env and enforce restrictive user-only permissions
echo "OPENROUTER_API_KEY=\"$OPENROUTER_INPUT\"" >> "$ENV_FILE"
chmod 600 "$ENV_FILE"

# Clear variable from shell memory
unset OPENROUTER_INPUT

echo ""
echo "✅ OpenRouter API Key successfully and securely stored in server/.env!"
echo "Permissions set to 600 (owner-only access)."
echo "=========================================================="
