#!/usr/bin/env bash
# Generates the RS256 keypair for AI Gateway tokens and prints the env lines.
# Run once per environment; rotate quarterly (bump AI_JWT_KID, keep old key in
# JWKS until all 5-min tokens expire).
set -euo pipefail

KID="ai-$(date +%Y-%m)"
PRIV=$(openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 2>/dev/null)

echo "# Add to .env.local AND Vercel env (both required — shared verification):"
echo "AI_JWT_KID=$KID"
echo "AI_JWT_PRIVATE_KEY=$(printf '%s' "$PRIV" | base64 | tr -d '\n')"
