#!/bin/bash
# One-liner to push auction deletion feature to cricket-auction-hub-new
# Run this from your Cricket-Auction-Hub directory

# Configure git user (if not already set)
git config --global user.email "nithyasub2482@gmail.com" && \
git config --global user.name "Nithya" && \

# Update remote URL
git remote set-url origin https://github.com/nithyasub2482-spec/cricket-auction-hub-new.git && \

# Stage all changes
git add . && \

# Create commit
git commit -m "feat: Add auction deletion feature with player/purse restoration

- Add DeleteAuctionParams and DeleteAuctionResponse validation schemas
- Implement DELETE /api/auctions/:id endpoint
- Automatically restore all players to available status
- Refund team purses for sold players
- Clean up all related bids and auction slots
- Add WebSocket notification for deletion events
- Add comprehensive feature documentation" && \

# Push to new repository
git push -u origin main && \

# Show success message
echo "✅ Successfully pushed to cricket-auction-hub-new!" && \
echo "📍 Repository: https://github.com/nithyasub2482-spec/cricket-auction-hub-new" && \
echo "📝 View commits: https://github.com/nithyasub2482-spec/cricket-auction-hub-new/commits/main" && \

# Show latest commits
echo "" && \
echo "Latest commits:" && \
git log --oneline -3
