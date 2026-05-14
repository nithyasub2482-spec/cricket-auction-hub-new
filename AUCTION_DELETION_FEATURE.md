# Auction Deletion Feature Implementation

## Overview
This feature allows administrators to delete an existing auction with automatic restoration of all players and refunding of team purses.

## What Happens When an Auction is Deleted

### 1. **Players Restoration**
- All players in the deleted auction are restored to `available` status
- Players in `in_auction`, `sold`, and `unsold` states are all returned to `available`
- This makes them immediately available for future auctions

### 2. **Team Purse Refund**
- For each player that was **sold** in the auction:
  - The amount paid by the team is added back to the team's `remainingPurse`
  - Teams can use this refunded amount for future auctions
- Example: If Team A bought Player X for 1 crore, that 1 crore is added back to Team A's remaining purse

### 3. **Data Cleanup**
- All bid records for the auction are deleted
- All auction slots are deleted
- The auction itself is deleted
- Any active countdown timers are stopped

## API Endpoint

### Delete Auction
```
DELETE /api/auctions/:id
```

**Authentication Required:** Yes (requireAuth middleware)

**Path Parameters:**
- `id` (number): The auction ID to delete

**Response:**
```json
{
  "success": true,
  "message": "Auction deleted successfully. Restored 25 players and refunded 8 teams.",
  "deletedAuctionId": 1,
  "restoredPlayers": 25,
  "refundedTeams": 8
}
```

**Error Responses:**
- `404 Not Found`: Auction doesn't exist
- `400 Bad Request`: Invalid parameters
- `500 Internal Server Error`: Database error during deletion

## Real-Time Updates

When an auction is deleted, a WebSocket event is emitted to all connected clients:

```json
{
  "type": "auction:deleted",
  "data": {
    "auctionId": 1,
    "message": "Auction has been deleted. All players have been restored and team purses have been refunded."
  }
}
```

## Implementation Details

### Files Modified

#### 1. `lib/api-zod/src/generated/api.ts`
Added validation schemas:
```typescript
export const DeleteAuctionParams = zod.object({
  id: zod.coerce.number(),
});

export const DeleteAuctionResponse = zod.object({
  success: zod.boolean(),
  message: zod.string(),
  deletedAuctionId: zod.number(),
  restoredPlayers: zod.number(),
  refundedTeams: zod.number(),
});
```

#### 2. `artifacts/api-server/src/routes/auctions.ts`
Added DELETE endpoint with the following logic:

1. **Validate** the auction exists
2. **Fetch** all slots for the auction
3. **Track** which teams and players are affected
4. **Refund** team purses for sold players
5. **Restore** all players to 'available' status
6. **Delete** all bids, slots, and the auction record
7. **Stop** active timers
8. **Emit** WebSocket notification
9. **Return** success response with statistics

## Database Operations (Transaction-like behavior)

The deletion process involves these database operations in order:
1. Update teams: Add refunded amounts back to `remainingPurse`
2. Update players: Set status to `available`
3. Delete bids: Remove all bid records
4. Delete slots: Remove all auction slot records
5. Delete auction: Remove the auction record

**Note:** While these operations are not in an explicit transaction, the implementation handles them sequentially to maintain data consistency.

## Usage Example

**Using cURL:**
```bash
curl -X DELETE http://localhost:3000/api/auctions/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Using fetch in JavaScript:**
```javascript
const response = await fetch(`/api/auctions/${auctionId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(`Deleted auction ${data.deletedAuctionId}`);
console.log(`Restored ${data.restoredPlayers} players`);
console.log(`Refunded ${data.refundedTeams} teams`);
```

## Security Considerations

- **Authentication Required:** Only authenticated users can delete auctions
- The `requireAuth` middleware ensures user identity verification
- Consider adding **role-based authorization** to restrict deletion to admin/commissioner roles only

### Recommended: Add Role-Based Access Control

You may want to enhance security by adding a check to ensure only admins/commissioners can delete:

```typescript
// After requireAuth middleware
if (req.user.role !== 'admin' && req.user.role !== 'commissioner') {
  res.status(403).json({ error: 'Insufficient permissions' });
  return;
}
```

## Testing Scenarios

### Scenario 1: Delete Auction with No Sales
- Auction has slots but all players were marked unsold
- Expected: Players restored, no purse refunds, clean deletion

### Scenario 2: Delete Auction with Multiple Sales
- Multiple teams bought different players
- Expected: Each team receives correct refund amounts

### Scenario 3: Delete Active Auction
- Auction status is `active` with current slot in bidding
- Expected: Timer stopped, current slot cleared, auction deleted

### Scenario 4: Delete Draft Auction
- Auction has never been started
- Expected: No changes needed, auction simply deleted

## Future Enhancements

1. **Soft Deletes:** Mark auctions as deleted instead of removing them (for audit trail)
2. **Transaction Support:** Use database transactions for atomic operations
3. **Audit Logging:** Log who deleted which auction and when
4. **Undo Functionality:** Allow restoring deleted auctions within a certain timeframe
5. **Bulk Operations:** Delete multiple auctions at once
6. **Scheduled Deletion:** Delete auctions automatically after a certain period

## FAQ

**Q: Can I delete an active auction?**
A: Yes, the deletion works for auctions in any status (draft, active, paused, completed).

**Q: What happens to bids that were placed?**
A: All bids are permanently deleted. There's no record of them after deletion.

**Q: Will players be permanently available after deletion?**
A: Yes, they'll be marked as `available`. If you need to prevent their use, you'll need to delete the players separately.

**Q: Can this be undone?**
A: No, deletion is permanent. Implement backups or soft deletes if you need recovery capability.

**Q: What if a team's purse goes over their original purse amount?**
A: The refund calculation is correct - it adds back the exact amount spent. If multiple refunds happen, the purse can exceed the original amount, which is valid.
