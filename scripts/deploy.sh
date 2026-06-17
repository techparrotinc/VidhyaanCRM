#!/bin/bash

# Exit on error
set -e

# Get current branch name
BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Check if there are changes to commit
if [ -z "$(git status --porcelain)" ]; then
  echo "No changes to commit or push."
else
  # Stage all changes
  echo "Staging changes..."
  git add .

  # Set commit message
  COMMIT_MSG="Update: $(date)"
  if [ -n "$1" ]; then
    COMMIT_MSG="$1"
  fi

  # Commit
  echo "Committing changes with message: '$COMMIT_MSG'..."
  git commit -m "$COMMIT_MSG"
fi

# Push to GitHub
echo "Pushing branch '$BRANCH' to GitHub..."
git push origin "$BRANCH"

# Deploy to Vercel
if command -v vercel &> /dev/null; then
  echo "Vercel CLI found. Deploying to production..."
  vercel --prod --yes
else
  echo "Vercel CLI not found in PATH."
  echo "If your GitHub repository is connected to Vercel, the push has already triggered a deployment!"
fi

echo "Done!"
