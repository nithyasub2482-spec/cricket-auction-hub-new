# 🏏 Cross-Bidding Scenario: Three Teams Battle for Premium Players

## Overview
This document provides a complete setup and walkthrough for demonstrating **cross-bidding** between three major cricket franchises: Mumbai Indians, Chennai Super Kings, and Rajasthan Royals.

---

## 📋 **Setup Instructions**

### Step 1: Run the Seed Script
First, reset the database with the new team owner accounts:

```bash
# From the Cricket-Auction-Hub root directory
npm run seed
# or
pnpm run seed
```

This will create:
- ✅ 3 Teams with owners
- ✅ 3 Team Owner accounts
- ✅ Sample players for auction
- ✅ Admin and Auctioneer accounts

### Step 2: Verify Accounts Created

After seeding, you should have these accounts:

| Email | Password | Role | Team |
|-------|----------|------|------|
| mumbai@cricket.com | mumbai@123 | Team Owner | Mumbai Indians |
| chennai@cricket.com | chennai@123 | Team Owner | Chennai Super Kings |
| rajasthan@cricket.com | rajasthan@123 | Team Owner | Rajasthan Royals |
| admin@cricket.com | admin123 | Admin | — |
| auctioneer@cricket.com | auction123 | Auctioneer | — |

---

## 🎯 **Cross-Bidding Scenario: The Premium Player Auction**

### Scenario Setup
**Goal**: Demonstrate how 3 teams compete by placing escalating bids on a premium player.

**Player**: Virat Kohli (₹20 Lakhs Base Price)
**Bidding Mode**: Team (allows teams to place bids directly)
**Initial Purse**: Each team has ₹10 Crores

### Timeline of Events

```
┌─────────────────────────────────────────────────────────────┐
│             CROSS-BIDDING SCENARIO TIMELINE                 │
└─────────────────────────────────────────────────────────────┘

TIME    EVENT                           TEAM            BID AMOUNT
────────────────────────────────────────────────────────────────
0:00    Auctioneer selects              —               —
        "Virat Kohli"

0:05    Mumbai Indians places           MI              ₹25 Lakhs
        opening bid

0:10    Chennai Super Kings             CSK             ₹40 Lakhs
        counters with higher bid

0:15    Rajasthan Royals enters         RR              ₹60 Lakhs
        the bidding war

0:20    Mumbai Indians responds         MI              ₹75 Lakhs
        aggressively

0:25    CSK makes strategic bid         CSK             ₹85 Lakhs

0:30    RR places final bid             RR              ₹95 Lakhs

0:35    Mumbai backs out                MI              —
        (insufficient funds/strategy)

0:40    CSK makes final counter         CSK             ₹1 Crore
        (₹1,00,00,000)

0:45    RR drops out                    RR              —

RESULT: Chennai Super Kings wins!
        Final Price: ₹1 Crore
        New Purse: ₹9 Crores remaining
```

---

## 🎬 **Step-by-Step Execution Guide**

### Phase 1: Admin Setup (Auctioneer)

**Login**: auctioneer@cricket.com / auction123

1. **Create Auction**
   - Name: "IPL 2024 - Mega Auction"
   - League: "Indian Premier League"
   - Timer: 60 seconds
   - Bid Increment: ₹10 Lakhs
   - **Bidding Mode: Team** ← IMPORTANT!

2. **Start Auction**
   - Click "Start Auction" button
   - Status should change to "active"

3. **Select Virat Kohli**
   - Go to Auction Control
   - Select "Virat Kohli" as next player
   - Timer starts counting down

### Phase 2: Team Bidding (Three Browsers/Devices)

You'll need **3 browser windows** (or 3 devices) for realistic cross-bidding.

**Browser 1: Mumbai Indians Owner**
```
Login: mumbai@cricket.com / mumbai@123

Steps:
1. Go to "My Team" page
2. Watch for live auction update
3. See "Virat Kohli" selected
4. Click "Place Bid" button
5. First bid: ₹25,00,000 (Base: ₹20,00,000 + Increment: ₹5,00,000)
6. Monitor status: "You're Leading!"
```

**Browser 2: Chennai Super Kings Owner**
```
Login: chennai@cricket.com / chennai@123

Steps:
1. Go to "My Team" page
2. Wait for Mumbai's bid to appear (real-time via WebSocket)
3. See "Mumbai Indians - ₹25,00,000"
4. Click "Place Bid"
5. Counter-bid: ₹40,00,000
6. See status change to "You're Leading!"
```

**Browser 3: Rajasthan Royals Owner**
```
Login: rajasthan@cricket.com / rajasthan@123

Steps:
1. Go to "My Team" page
2. See CSK is currently leading with ₹40,00,000
3. Decide to enter bidding war
4. Click "Place Bid"
5. Aggressive bid: ₹60,00,000
6. Become the new "You're Leading!" bidder
```

### Phase 3: Escalating Bids

Continue the bidding war following the timeline above. Each team:

1. **Sees Real-Time Updates**
   - Opponent's current bid updates instantly
   - Live feed shows all bids in chronological order
   - Status badge shows who's leading

2. **Makes Strategic Decisions**
   - Amount to bid (minimum = current bid + increment)
   - Whether to continue or drop out
   - Budget remaining in purse

3. **Can Place Bids**
   - Button disabled if:
     - Team is already leading
     - Insufficient purse remaining
     - Bid is below minimum
   - Button enabled otherwise

---

## 💰 **Purse Management During Bidding**

### Initial State
Each team starts with: **₹10 Crores (100,000,000)**

### During Auction
- **No money deducted yet** - bids are just offers
- Budget shown: "Remaining Purse"
- Team can't bid if amount > remaining purse

### After Player is Sold
- **Money is deducted** from winning team
- Final sold price (₹1 Crore) = ₹1,00,00,000
- CSK purse: 100,000,000 - 100,000,000 = **₹0** (100% spent on this player)

### Squad Impact
After purchase:
- CSK's squad count: 1 player (Virat Kohli)
- CSK can still bid on other players (budget remaining is ₹0, but can use it once refunded or in future auctions)

---

## 📊 **Real-Time Bidding Feed**

When bids are placed, the **Live Feed** (left panel) updates:

```
┌─ Live Feed ─────────────────┐
│                             │
│ Chennai Super Kings         │
│ ₹1,00,00,000               │ ← Latest bid (highlighted)
│ 1:23 PM                     │
│                             │
│ Rajasthan Royals            │
│ ₹95,00,000                  │
│ 1:22 PM                     │
│                             │
│ Mumbai Indians              │
│ ₹75,00,000                  │
│ 1:20 PM                     │
│                             │
│ Chennai Super Kings         │
│ ₹85,00,000                  │
│ 1:19 PM                     │
│                             │
│ Rajasthan Royals            │
│ ₹60,00,000                  │
│ 1:18 PM                     │
│                             │
└─────────────────────────────┘
```

---

## 🎮 **What You'll Observe**

### Real-Time Synchronization
✅ Bids appear instantly across all 3 browsers  
✅ Status badges update in real-time  
✅ Live feed refreshes automatically  
✅ WebSocket notifications trigger audio (optional)

### Bidding Dynamics
✅ Teams can see opponent bids before deciding  
✅ Current bid highlighted prominently  
✅ Incentive to bid higher each round  
✅ Budget constraints create natural end point  

### UX Features
✅ Disable button when you're leading (can't outbid yourself)  
✅ Show next minimum bid amount  
✅ Warn if bid exceeds budget  
✅ Animate bid amounts when they change  

---

## 🏆 **Declaring Winner**

Once bidding ends (all teams drop out or timer runs out):

**Auctioneer Action** (browser 1):
1. Switch to Auction Control page
2. Look for "Mark as Sold" or "Unsold" buttons
3. Click **"Mark as Sold"**
4. Confirm the winning team and final price

**Result Screen**:
```
┌─────────────────────────────┐
│   PLAYER SOLD!              │
│                             │
│ Virat Kohli                 │
│ Sold to: Chennai Super      │
│ Final Price: ₹1,00,00,000   │
│ Winning Team: CSK           │
│                             │
│ [Next Player] [Exit]        │
└─────────────────────────────┘
```

**Broadcast Update**:
- Live Auction page shows final result
- Virat Kohli moves from "available" to "sold"
- CSK's squad updates
- CSK's purse updates

---

## 📱 **Mobile/Multi-Device Setup**

For a more realistic demo, use multiple devices:

**Setup**:
1. **Device 1**: Desktop - Auctioneer (controls auction)
2. **Device 2**: Tablet - Mumbai Indians owner (watches & bids)
3. **Device 3**: Mobile - Chennai Super Kings owner (watches & bids)
4. **Optional Device 4**: Laptop - Rajasthan Royals owner

**Benefits**:
- Shows real-time WebSocket synchronization
- Demonstrates mobile-responsive design
- Shows concurrent bidding behavior
- More engaging demo experience

---

## 🔧 **Troubleshooting**

### Issue: "Place Bid" button not appearing
**Solution**: 
- Ensure auction is in "active" status
- Ensure bidding mode is "team" (not "auctioneer")
- Ensure player is selected and slot is active
- Check browser console for errors

### Issue: Bid not updating in real-time
**Solution**:
- Check WebSocket connection (DevTools Network tab)
- Refresh page to get latest state
- Ensure teams are logged in correctly

### Issue: Purse not updating after sale
**Solution**:
- Refresh "My Team" page
- Check squad details page
- Verify in admin panel that sale was recorded

---

## 📝 **Demo Script**

### 30-Second Demo
1. Login 3 teams simultaneously
2. Auctioneer selects player
3. Each team places 2-3 bids
4. Auctioneer marks as sold
5. Show updated squad/purse

### 5-Minute Demo
1. Setup all accounts
2. Run full cross-bidding scenario
3. Show real-time synchronization
4. Demonstrate budget constraints
5. Show final results

### 15-Minute Interactive Demo
1. Full setup and explanation
2. Audience participates as one team owner
3. Place multiple bids
4. Discuss strategy
5. Q&A on bidding mechanics

---

## 🎓 **Key Takeaways**

This scenario demonstrates:
- ✅ **Real-time Synchronization**: WebSocket updates across devices
- ✅ **Concurrent Bidding**: Multiple teams bidding simultaneously
- ✅ **Budget Management**: Teams make strategic bids within budget
- ✅ **Dynamic Pricing**: Bids escalate based on competition
- ✅ **Winner Determination**: Clear auction resolution
- ✅ **State Management**: Purse and squad updates correctly

---

## 🚀 **Next Steps**

After successful cross-bidding demo:
1. Create multi-player auction scenarios
2. Test with 4-5 teams bidding
3. Implement round-based auctions
4. Add analytics on bid patterns
5. Create historical records of auctions

---

## 📞 **Account Summary**

```bash
# Run seed script to create all accounts
pnpm run seed

# Then use these logins:

# Admin Console
Email: admin@cricket.com
Password: admin123

# Auctioneer (Controls Auction)
Email: auctioneer@cricket.com
Password: auction123

# Mumbai Indians (Team Owner 1)
Email: mumbai@cricket.com
Password: mumbai@123

# Chennai Super Kings (Team Owner 2)
Email: chennai@cricket.com
Password: chennai@123

# Rajasthan Royals (Team Owner 3)
Email: rajasthan@cricket.com
Password: rajasthan@123
```

---

**Ready to see teams battle for players?** 🎯  
Follow the steps above and create an exciting cross-bidding scenario!
