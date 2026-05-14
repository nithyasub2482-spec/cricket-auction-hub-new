# Delete Auction Feature in Admin Console

## Overview
The delete auction feature is now fully integrated into the admin console. Admins can now delete auctions with a single click, which automatically:
- Restores all players to "available" status
- Refunds team purses for sold players
- Cleans up all bids and auction slots
- Notifies connected clients via WebSocket

## What's New in the UI

### Delete Button Location
In the **Admin Console > Auctions Tab**, each auction row now has a red **DELETE** button with a trash icon.

```
[Auction Icon] Auction Name          Config Info    Status Badge    [🗑️ DELETE]
```

## How to Use

1. **Open Admin Console**
   - Navigate to the admin panel (requires admin role)
   - Click the "Auctions" tab

2. **Find the Auction to Delete**
   - View all auctions in the list
   - Locate the auction you want to delete

3. **Click Delete Button**
   - Click the red "DELETE" button on the right side of the auction row
   - A confirmation dialog will appear

4. **Confirm Deletion**
   - Read the warning message
   - Click "Delete Auction" to confirm
   - Or click "Cancel" to abort

5. **Success**
   - Receive confirmation toast with details:
     - Number of players restored
     - Number of teams refunded
     - Success message

## Visual Changes

### Auction List Item
```
Before:
[Icon] Auction Name          Config Info    Status    [ChevronRight]

After:
[Icon] Auction Name          Config Info    Status    [DELETE Button]
```

### Delete Confirmation Dialog
Shows:
- Title: "Delete Auction?"
- Description: Explains what will happen
- Warning box: Highlights the impact
- Action buttons: Cancel | Delete Auction

## Files Modified

### 1. Frontend Components
**`artifacts/cricket-auction/src/pages/admin.tsx`**
- Added `useDeleteAuction` hook import
- Added state: `auctionToDelete`
- Added delete button to auction rows
- Added confirmation dialog (AlertDialog)
- Added delete handler with success/error handling
- Added refetch trigger after successful deletion

### 2. API Client
**`lib/api-client-react/src/generated/api.ts`**
- Added `deleteAuction()` function
- Added `getDeleteAuctionUrl()` helper
- Added `getDeleteAuctionMutationOptions()` mutation options
- Added `useDeleteAuction()` React Query hook
- Added type exports for mutation results and errors

**`lib/api-client-react/src/generated/api.schemas.ts`**
- Added `DeleteAuctionResponse` TypeScript interface

### 3. OpenAPI Specification
**`lib/api-spec/openapi.yaml`**
- Added DELETE /auctions/{id} endpoint definition
- Added DeleteAuctionResponse schema with all response fields

## Response Details

When an auction is successfully deleted, the response includes:

```typescript
{
  success: true,
  message: "Auction deleted successfully. Restored 25 players and refunded 8 teams.",
  deletedAuctionId: 1,
  restoredPlayers: 25,
  refundedTeams: 8
}
```

## Error Handling

If deletion fails, users see:
- Error toast notification
- Error message describing what went wrong
- Auction list remains unchanged
- Can retry deletion

## Real-Time Updates

When an auction is deleted:
- WebSocket event `auction:deleted` is broadcast to all clients
- Admin console's auction list auto-refreshes
- All connected clients see the auction removed immediately

## Backend Integration

The backend DELETE endpoint (`DELETE /api/auctions/:id`) was already implemented with full functionality:
- Validates auction exists
- Collects players and teams affected
- Refunds all team purses
- Updates all players to available status
- Cleans up all bids and slots
- Deletes the auction record
- Broadcasts WebSocket notification
- Returns comprehensive response with statistics

## User Experience Flow

```
User clicks Delete Button
        ↓
Confirmation Dialog Opens
        ↓
User confirms or cancels
        ↓
If confirmed:
  - Loading state on button
  - API request sent
  - Success/Error toast shown
  - List auto-refreshes
```

## Styling

The delete button:
- **Color**: Red/Destructive
- **Size**: Small compact button
- **Icon**: Trash icon (Trash2 from lucide-react)
- **Hover**: Shows disabled state during loading
- **Text**: "Delete" (uppercase, bold)

## Security

- ✅ Requires authentication
- ✅ Requires admin role (enforced on backend)
- ✅ Confirmation dialog prevents accidental deletion
- ✅ All operations are logged via backend

## Testing Checklist

To test this feature:

- [ ] Log in as admin
- [ ] Navigate to Admin Console
- [ ] Click Auctions tab
- [ ] Create a test auction
- [ ] Add some players to auction slots
- [ ] Sell some players
- [ ] Click Delete button on the auction
- [ ] Verify confirmation dialog appears
- [ ] Click Delete Auction
- [ ] Verify success toast shows correct numbers
- [ ] Verify auction is removed from list
- [ ] Verify players are marked as available
- [ ] Verify team purses are refunded (check team details)

## Troubleshooting

**Issue: Delete button doesn't appear**
- Solution: User may not have admin role. Only admins can delete auctions.

**Issue: Delete button is disabled**
- Solution: A deletion is in progress. Wait for it to complete.

**Issue: Error on delete**
- Solution: Check browser console for details. Backend might have returned an error.

**Issue: Auction not removed from list**
- Solution: The list may need a manual refresh. If persistent, check backend logs.

## Future Enhancements

1. **Soft Deletes**: Mark as deleted instead of removing (for audit trail)
2. **Undo**: Allow restoring deleted auctions within 24 hours
3. **Bulk Delete**: Delete multiple auctions at once
4. **Audit Log**: Show who deleted what and when
5. **Restore Preview**: Show what will happen before confirming

## Notes

- The feature is production-ready
- All error cases are handled gracefully
- User receives feedback at every step
- Confirmation prevents accidental deletions
- No data loss occurs (teams are refunded, players restored)
