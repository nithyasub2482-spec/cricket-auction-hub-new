# How to Push Auction Deletion Feature to GitHub

## Overview
You have implemented the auction deletion feature with changes to:
1. `lib/api-zod/src/generated/api.ts` - Added validation schemas
2. `artifacts/api-server/src/routes/auctions.ts` - Added DELETE endpoint
3. `AUCTION_DELETION_FEATURE.md` - New documentation file

## Prerequisites
- Git installed and configured
- GitHub account with access to the repository
- Authentication configured (either SSH keys or personal access token)

## Step-by-Step Instructions

### Option 1: Push All Changes at Once (Recommended)

```bash
cd /path/to/Cricket-Auction-Hub

# 1. Stage all changes
git add .

# 2. Create a commit with a descriptive message
git commit -m "feat: Add auction deletion feature with player/purse restoration

- Add DeleteAuctionParams and DeleteAuctionResponse validation schemas
- Implement DELETE /api/auctions/:id endpoint
- Automatically restore all players to 'available' status
- Refund team purses for sold players
- Clean up all related bids and auction slots
- Add WebSocket notification for deletion events
- Add comprehensive documentation"

# 3. Push to GitHub
git push origin main
```

### Option 2: Push Only Specific Files

If you want to be selective about what to commit:

```bash
cd /path/to/Cricket-Auction-Hub

# 1. Stage only the feature files
git add lib/api-zod/src/generated/api.ts
git add artifacts/api-server/src/routes/auctions.ts
git add AUCTION_DELETION_FEATURE.md

# 2. Verify staged files
git status

# 3. Create a commit
git commit -m "feat: Add auction deletion feature with player/purse restoration"

# 4. Push to GitHub
git push origin main
```

### Option 3: Create a Feature Branch (Best Practice for PRs)

```bash
cd /path/to/Cricket-Auction-Hub

# 1. Create and switch to a new feature branch
git checkout -b feature/auction-deletion

# 2. Stage your changes
git add .

# 3. Create a commit
git commit -m "feat: Add auction deletion feature"

# 4. Push the feature branch to GitHub
git push origin feature/auction-deletion

# 5. Then create a Pull Request on GitHub to merge into main
```

## Authentication Setup

### If Using HTTPS (Personal Access Token)
```bash
# GitHub will prompt you for credentials
# Use your GitHub username as the user
# Use a Personal Access Token (PAT) as the password

# To create a PAT:
# 1. Go to GitHub Settings > Developer settings > Personal access tokens
# 2. Click "Generate new token (classic)"
# 3. Select scopes: repo (full control of private repositories)
# 4. Generate and copy the token
# 5. Use this token when prompted for password
```

### If Using SSH (Recommended)
```bash
# Check if SSH key exists
ls -la ~/.ssh/

# If no id_rsa or id_ed25519, generate one
ssh-keygen -t ed25519 -C "nithyasub2482@gmail.com"

# Add SSH key to GitHub:
# 1. Copy public key
cat ~/.ssh/id_ed25519.pub

# 2. Go to GitHub Settings > SSH and GPG keys > New SSH key
# 3. Paste the key and save

# 4. Test SSH connection
ssh -T git@github.com
```

## Verify Changes Before Pushing

```bash
# See all changes made
git diff

# See only file names changed
git diff --name-only

# See staged changes
git diff --staged

# See commit history
git log --oneline -5

# See remote status
git remote -v
```

## After Pushing

```bash
# Verify the push was successful
git log --oneline -5

# Check the GitHub repository online to confirm changes are there
# URL: https://github.com/nithyasub2482-spec/cricket-auction-hub
```

## Troubleshooting

### Issue: "Permission denied (publickey)"
**Solution:** Add SSH key to GitHub or use HTTPS with PAT instead

### Issue: "fatal: 'origin' does not appear to be a 'git' repository"
**Solution:** Check if you're in the correct directory
```bash
cd /path/to/Cricket-Auction-Hub
git remote -v  # Should show origin pointing to GitHub
```

### Issue: "Your branch is ahead of 'origin/main'"
**Solution:** Simply push your commits
```bash
git push origin main
```

### Issue: "Updates were rejected because the tip of your current branch is behind"
**Solution:** Pull latest changes first
```bash
git pull origin main
git push origin main
```

### Issue: Index lock file error
**Solution:** The lock file usually resolves itself; if persistent:
```bash
rm -f .git/index.lock
git status
```

## Quick Command Reference

| Command | Description |
|---------|-------------|
| `git status` | See current status and changes |
| `git add .` | Stage all changes |
| `git add <file>` | Stage specific file |
| `git commit -m "message"` | Create commit with message |
| `git push origin main` | Push to main branch |
| `git push origin feature-branch` | Push to feature branch |
| `git log --oneline` | View commit history |
| `git diff` | See all changes |
| `git reset HEAD <file>` | Unstage a file |
| `git restore <file>` | Discard changes to a file |

## Commit Message Format

Good commit messages follow this format:

```
type(scope): subject

body

footer
```

Example for this feature:
```
feat(auctions): Add deletion endpoint with purse restoration

- Add DeleteAuctionParams and DeleteAuctionResponse schemas
- Implement DELETE /api/auctions/:id endpoint
- Restore players to available status
- Refund team purses for sold players
- Emit WebSocket notifications

Closes #123
```

## What Gets Pushed

When you push, only the following will be included:
- Modified files you staged
- New files you staged
- **NOT** node_modules, build artifacts, or ignored files (per .gitignore)

## After Push - Next Steps

1. **Test Deployment:** Wait for CI/CD to run if configured
2. **Monitor:** Check GitHub Actions if configured
3. **Merge:** If on a feature branch, create a PR and review
4. **Deploy:** Follow your deployment process to production

## Repository Details

- **Repository:** https://github.com/nithyasub2482-spec/cricket-auction-hub
- **Clone URL (HTTPS):** https://github.com/nithyasub2482-spec/cricket-auction-hub.git
- **Clone URL (SSH):** git@github.com:nithyasub2482-spec/cricket-auction-hub.git
- **Default Branch:** main
- **Remote Name:** origin

---

Need help? Check GitHub's documentation at https://docs.github.com/en/get-started/using-git
