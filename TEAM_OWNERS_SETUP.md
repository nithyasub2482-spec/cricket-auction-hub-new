# 🏏 Team Owners Setup - Mumbai Indians, Chennai Super Kings, Rajasthan Royals

## Quick Summary

Three premium cricket franchises with dedicated team owner accounts have been added to the system for demonstrating real-world cross-bidding scenarios.

## 🔐 Team Owner Accounts

### Mumbai Indians
- **Email**: mumbai@cricket.com
- **Password**: mumbai@123
- **Owner**: Rajesh Masrani
- **Team Color**: Blue (#004BA0)
- **Initial Purse**: ₹10 Crores
- **Role**: team_owner

### Chennai Super Kings
- **Email**: chennai@cricket.com
- **Password**: chennai@123
- **Owner**: N Srinivasan
- **Team Color**: Yellow (#FFFF00)
- **Initial Purse**: ₹10 Crores
- **Role**: team_owner

### Rajasthan Royals
- **Email**: rajasthan@cricket.com
- **Password**: rajasthan@123
- **Owner**: Manoj Badale
- **Team Color**: Pink (#EA7260)
- **Initial Purse**: ₹10 Crores
- **Role**: team_owner

## 📋 What Was Changed

### 1. Database Seed Script
**File**: `scripts/src/seed.ts`

**Added**:
- ✅ Rajasthan Royals team
- ✅ Owner information for all 3 teams
- ✅ 3 team owner user accounts
- ✅ Proper team-to-owner associations

### 2. Teams Created
```
Mumbai Indians (MI)
├─ Owner: Rajesh Masrani
├─ Purse: ₹10 Crores
└─ Logo Color: Blue

Chennai Super Kings (CSK)
├─ Owner: N Srinivasan
├─ Purse: ₹10 Crores
└─ Logo Color: Yellow

Rajasthan Royals (RR)
├─ Owner: Manoj Badale
├─ Purse: ₹10 Crores
└─ Logo Color: Pink
```

## 🚀 How to Use

### Step 1: Run Seed Script
```bash
cd C:\Users\rajes\OneDrive\Documents\Cricket-Auction-Hub
npm run seed
# or
pnpm run seed
```

This will:
- Reset database
- Create 3 teams with owners
- Create 5 sample players
- Create all user accounts (admin, auctioneer, 3 team owners)

### Step 2: Login as Team Owner
1. Open the app login page
2. Use one of the team owner emails
3. Enter the password
4. Go to "My Team" page
5. Watch for live auctions

### Step 3: Participate in Cross-Bidding
1. When auctioneer selects a player
2. You'll see live auction updates
3. Click "Place Bid" to place bids
4. See real-time competition from other teams

## 📊 Demo Scenario

A complete **cross-bidding scenario** is documented in:
**`CROSS_BIDDING_SCENARIO.md`**

This includes:
- 🎬 Step-by-step bidding timeline
- 💰 Budget management during auction
- 📱 Multi-device setup instructions
- 🏆 Winner declaration process
- 🔧 Troubleshooting guide

## 🎯 Key Features Demonstrated

✅ **Concurrent Bidding**: Multiple teams bidding simultaneously  
✅ **Real-Time Updates**: WebSocket synchronization across devices  
✅ **Budget Constraints**: Teams bid within their purse limits  
✅ **Live Feed**: See all bids in chronological order  
✅ **Winner Declaration**: Auctioneer marks player as sold  
✅ **Purse Updates**: Winning team's budget auto-updates  

## 📱 Testing Setup

### Single Device (Sequential)
1. Login as auctioneer
2. Create auction
3. Logout, login as Team Owner 1
4. Place bid
5. Logout, login as Team Owner 2
6. See updated bid, counter-bid
7. Repeat with Team Owner 3

### Multiple Devices (Concurrent)
1. Device 1: Auctioneer (Laptop)
2. Device 2: Team Owner 1 (Desktop)
3. Device 3: Team Owner 2 (Tablet)
4. Device 4: Team Owner 3 (Mobile)
5. All open simultaneously
6. Real-time bidding war visible across devices

## 📄 All User Accounts

| Email | Password | Role | Team |
|-------|----------|------|------|
| admin@cricket.com | admin123 | Admin | — |
| auctioneer@cricket.com | auction123 | Auctioneer | — |
| mumbai@cricket.com | mumbai@123 | Team Owner | Mumbai Indians |
| chennai@cricket.com | chennai@123 | Team Owner | Chennai Super Kings |
| rajasthan@cricket.com | rajasthan@123 | Team Owner | Rajasthan Royals |

## 🎓 What This Demonstrates

### For Development
- ✅ Role-based access control
- ✅ Team-owner relationships
- ✅ Real-time WebSocket bidding
- ✅ Budget constraint validation
- ✅ Auction state management

### For Business/Product
- ✅ Realistic cricket franchise bidding
- ✅ Competitive auction dynamics
- ✅ Financial constraint handling
- ✅ User experience for team owners
- ✅ Real-time platform scalability

## 🔄 Database Schema

Each team now has:
- `id`: Unique identifier
- `name`: Full team name
- `shortName`: 2-3 letter abbreviation
- `primaryColor`: Team brand color
- `purse`: Initial budget
- `remainingPurse`: Available budget
- `ownerName`: Owner/franchise representative
- `ownerId`: Link to user account (when assigned)

Each team owner user has:
- `email`: Login email
- `passwordHash`: Hashed password
- `name`: Owner name
- `role`: "team_owner"
- `teamId`: Foreign key to teams table

## 🔗 Files Modified

1. **scripts/src/seed.ts**
   - Added Rajasthan Royals team
   - Added owner information
   - Added team owner accounts
   - Setup team-user associations

2. **Documentation**
   - CROSS_BIDDING_SCENARIO.md (new)
   - TEAM_OWNERS_SETUP.md (this file)

## ⚙️ Technical Details

### Bidding Mode
Teams can only place bids when auction is in **"team" bidding mode** (not "auctioneer" mode).

### Purse Validation
- Teams can't bid amounts exceeding remaining purse
- "Place Bid" button disabled if insufficient funds
- After purchase, purse automatically updates

### Real-Time Synchronization
- WebSocket notifies all connected clients of bids
- Live feed updates instantly
- Status badges change in real-time
- No page refresh needed

## 🚀 Next Steps

1. **Run seed script** to create all accounts
2. **Follow CROSS_BIDDING_SCENARIO.md** for demo
3. **Test bidding** with 2-3 teams
4. **Verify purse updates** after purchases
5. **Monitor WebSocket** for real-time updates

## 💡 Tips for Demo

- Use different browsers/devices for realistic experience
- Bet on the same player with multiple teams
- Watch real-time bid updates
- Show budget constraints in action
- Explain strategic bidding decisions

---

**Status**: ✅ Ready to use  
**Seed Script**: ✅ Updated  
**Demo Guide**: ✅ Complete  
**Testing**: ✅ Can begin immediately
