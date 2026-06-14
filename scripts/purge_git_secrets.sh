#!/bin/bash
# Script to purge sensitive environment files from Git history

echo "=== Lore Git Secret Purging Utility ==="
echo "WARNING: This script will rewrite Git history to remove any tracked .env files."
echo "You will need to force push changes to your remote afterwards (git push origin --force)."
echo ""

# Confirm before proceeding
read -p "Are you sure you want to proceed? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Aborted."
    exit 1
fi

if command -v git-filter-repo &> /dev/null
then
    echo "Using modern git-filter-repo..."
    git-filter-repo --path .env --path .env.local --invert-paths --force
else
    echo "git-filter-repo not found. Falling back to built-in git filter-branch..."
    git filter-branch --force --index-filter \
      "git rm --cached --ignore-unmatch .env .env.local **/.*env **/.*env.local" \
      --prune-empty --tag-name-filter cat -- --all
fi

echo "=== Purging Complete ==="
echo "To clean local garbage collection and shrink the repo:"
echo "git reflog expire --expire=now --all && git gc --prune=now --aggressive"
echo ""
echo "Don't forget to run: git push origin --force"
