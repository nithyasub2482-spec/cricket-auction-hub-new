import { useParams } from "wouter";
import { Layout } from "@/components/layout";
import { useGetAuction, getGetAuctionQueryKey, useGetCurrentSlot, getGetCurrentSlotQueryKey, useGetAuctionBids, getGetAuctionBidsQueryKey, usePlaceBid } from "@workspace/api-client-react";
import { useAuctionSocket } from "@/hooks/useAuctionSocket";
import { useBidSounds } from "@/hooks/useBidSounds";
import { CountdownTimer } from "@/components/countdown-timer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Loader2, Gavel, User as UserIcon, Trophy, History, AlertTriangle } from "lucide-react";
import { formatMoney } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";

export default function LiveAuction() {
  const { id } = useParams();
  const auctionId = parseInt(id || "0", 10);
  const { user } = useAuth();
  
  const { connected, timerState, lastEvent } = useAuctionSocket(auctionId);
  useBidSounds(lastEvent, timerState);
  
  const { data: auction, isLoading: auctionLoading } = useGetAuction(auctionId, {
    query: { enabled: !!auctionId, queryKey: getGetAuctionQueryKey(auctionId) }
  });
  
  const { data: slot, isLoading: slotLoading } = useGetCurrentSlot(auctionId, {
    query: { enabled: !!auctionId && auction?.status === "active", queryKey: getGetCurrentSlotQueryKey(auctionId) }
  });
  
  const { data: bids } = useGetAuctionBids(auctionId, {
    query: { enabled: !!auctionId && !!slot?.id, queryKey: getGetAuctionBidsQueryKey(auctionId) }
  });
  
  const placeBidMutation = usePlaceBid();
  
  const handleBid = () => {
    if (!slot || !user?.teamId) return;
    const nextAmount = (slot.currentBid ?? slot.basePrice) + (auction?.bidIncrementMin ?? 0);
    placeBidMutation.mutate({
      id: slot.id,
      data: {
        slotId: slot.id,
        teamId: user.teamId,
        amount: nextAmount,
      }
    });
  };

  const isBiddingActive = auction?.status === "active" && slot?.status === "active";
  const timerExpired = timerState?.expired ?? false;
  const player = slot?.player;

  if (auctionLoading) {
    return (
      <Layout>
        <div className="flex h-[80vh] items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!auction) {
    return (
      <Layout>
        <div className="text-center py-20 text-destructive font-bold text-2xl uppercase tracking-wider">
          Auction Not Found
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-6rem)]">
        
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="flex items-center justify-between bg-card p-4 rounded border border-border">
            <div>
              <h2 className="text-xl font-bold uppercase tracking-tight">{auction.name}</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <div className={`w-2 h-2 rounded-full ${connected ? "bg-green-500" : "bg-red-500"}`} />
                {connected ? "LIVE" : "OFFLINE"}
              </div>
            </div>
            <div className="flex items-center gap-4">
              {timerState && slot?.status === "active" && (
                <CountdownTimer timer={timerState} size="md" />
              )}
              <Badge variant={auction.status === "active" ? "default" : "secondary"} className="uppercase text-lg py-1 px-4">
                {auction.status}
              </Badge>
            </div>
          </div>

          {/* Timer expired banner for team owners */}
          <AnimatePresence>
            {timerExpired && slot?.status === "active" && user?.role === "team_owner" && (
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="flex items-center gap-3 px-5 py-3 rounded border border-destructive/50 bg-destructive/10 text-destructive font-bold uppercase tracking-wider"
              >
                <AlertTriangle className="w-5 h-5 shrink-0" />
                Bidding time has ended — awaiting auctioneer decision
              </motion.div>
            )}
          </AnimatePresence>

          <Card className="flex-1 flex flex-col overflow-hidden border-2 border-border relative bg-card">
            {slotLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-muted-foreground" />
              </div>
            ) : !slot || !player ? (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center space-y-4">
                <Trophy className="w-24 h-24 text-border" />
                <h3 className="text-2xl font-bold uppercase tracking-widest text-foreground">Waiting for Next Player</h3>
                <p>The auctioneer will select the next player shortly.</p>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <div className="bg-secondary/30 p-8 border-b border-border flex gap-8 items-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                    <UserIcon className="w-64 h-64" />
                  </div>
                  
                  <div className="w-32 h-32 bg-background border-4 border-primary rounded-full overflow-hidden shrink-0 shadow-xl flex items-center justify-center relative z-10">
                    {player.photoUrl ? (
                      <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-16 h-16 text-muted-foreground" />
                    )}
                  </div>
                  
                  <div className="flex-1 z-10">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="outline" className="uppercase font-mono bg-background text-primary border-primary/30">
                        {player.category.replace('_', ' ')}
                      </Badge>
                      <span className="text-muted-foreground font-mono text-sm">{player.country}</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-extrabold uppercase tracking-tight text-foreground mb-2">
                      {player.name}
                    </h2>
                    <div className="flex gap-6 mt-4">
                      <div>
                        <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Base Price</div>
                        <div className="text-xl font-mono font-bold text-foreground">{formatMoney(player.basePrice)}</div>
                      </div>
                      {player.battingStyle && (
                        <div>
                          <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Batting</div>
                          <div className="text-sm font-medium text-foreground">{player.battingStyle}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center p-8 bg-background">
                  <div className="text-center space-y-4 w-full max-w-2xl">
                    <div className="text-sm font-bold uppercase tracking-[0.3em] text-muted-foreground">
                      Current Bid
                    </div>
                    
                    <div className="text-6xl md:text-8xl font-black font-mono tracking-tighter text-primary animate-in fade-in zoom-in duration-300">
                      {formatMoney(slot.currentBid ?? slot.basePrice)}
                    </div>
                    
                    {slot.highestBidTeam ? (
                      <div className="inline-flex items-center gap-3 px-6 py-3 bg-secondary rounded-full border border-border mt-4">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: slot.highestBidTeam.primaryColor }}
                        />
                        <span className="font-bold text-xl uppercase tracking-wide">
                          {slot.highestBidTeam.name}
                        </span>
                      </div>
                    ) : (
                      <div className="inline-block px-6 py-3 bg-muted rounded-full text-muted-foreground font-bold uppercase tracking-wide mt-4">
                        Awaiting First Bid
                      </div>
                    )}
                  </div>
                </div>

                {user?.role === "team_owner" && (
                  <div className="p-6 bg-card border-t border-border">
                    <Button 
                      size="lg" 
                      className="w-full text-xl h-20 font-black uppercase tracking-widest gap-4 group"
                      onClick={handleBid}
                      disabled={!isBiddingActive || timerExpired || placeBidMutation.isPending || slot.highestBidTeamId === user.teamId}
                    >
                      <Gavel className="w-8 h-8 group-hover:rotate-12 transition-transform" />
                      {timerExpired
                        ? "Bidding Closed"
                        : slot.highestBidTeamId === user.teamId
                        ? "You are highest bidder"
                        : `Place Bid (${formatMoney((slot.currentBid ?? slot.basePrice) + auction.bidIncrementMin)})`}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="flex-1 flex flex-col border-border bg-card">
            <div className="p-4 border-b border-border font-bold uppercase tracking-wider flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Bid History
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-3 relative">
              {!bids?.length ? (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm uppercase tracking-wider font-bold">
                  No bids yet
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {bids.map((bid) => (
                    <motion.div 
                      key={bid.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-3 rounded bg-secondary/50 border border-border"
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: bid.team?.primaryColor || '#ccc' }}
                        />
                        <span className="font-bold text-sm truncate max-w-[120px]">{bid.team?.shortName || 'Unknown'}</span>
                      </div>
                      <span className="font-mono font-bold text-primary">{formatMoney(bid.amount)}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </Card>
        </div>

      </div>
    </Layout>
  );
}
