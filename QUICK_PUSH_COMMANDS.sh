#!/bin/bash
# Quick Push Commands for Auction Deletion Feature
# Run these commands in order from the Cricket-Auction-Hub directory

# Navigate to the repository
cd Cricket-Auction-Hub

# Check current status
echo "=== Current Git Status ==="
git status

echo ""
echo "=== Staging Changes ==="
# Stage all changes
git add .
echo "✓ All changes staged"

echo ""
echo "=== Creating Commit ==="
# Create a descriptive commit
git commit -m "feat: Add auction deletion feature with player/purse restoration

- Add DeleteAuctionParams and DeleteAuctionResponse validation schemas
- Implement DELETE /api/auctions/:id endpoint
- Automatically restore all players to 'available' status
- Refund team purses for sold players
- Clean up all related bids and auction slots
- Add WebSocket notification for deletion events
- Add comprehensive feature documentation"

echo ""
echo "=== Pushing to GitHub ==="
# Push to the main branch
git push origin main

echo ""
echo "=== Verification ==="
# Show the latest commits
echo "Latest commits:"
git log --oneline -3

echo ""
echo "✓ Push complete! Check GitHub at:"
echo "  https://github.com/nithyasub2482-spec/cricket-auction-hub"
