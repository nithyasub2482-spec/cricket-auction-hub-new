import React, { useState } from "react";
import { useParams } from "wouter";
import { Layout } from "@/components/layout";
import { 
  useGetAuction, getGetAuctionQueryKey, 
  useGetCurrentSlot, getGetCurrentSlotQueryKey,
  useSelectNextPlayer, useStartAuction, usePauseAuction, useResumeAuction,
  useMarkPlayerSold, useMarkPlayerUnsold, useListPlayers, useListTeams, usePlaceBid
} from "@workspace/api-client-react";
import { useAuctionSocket } from "@/hooks/useAuctionSocket";
import { useBidSounds } from "@/hooks/useBidSounds";
import { CountdownTimer } from "@/components/countdown-timer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Play, Pause, Gavel, XCircle, Search, Bell, Shield, UserPlus, Info, Star } from "lucide-react";
import { formatMoney, cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

export default function AuctionControl() {
  const { id: auctionIdParam } = useParams();
  const auctionId = parseInt(auctionIdParam || "0", 10);
  
  const { timerState, lastEvent } = useAuctionSocket(auctionId);
  useBidSounds(lastEvent, timerState);
  
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: auction, isLoading: auctionLoading } = useGetAuction(auctionId, {
    query: { enabled: !!auctionId, queryKey: getGetAuctionQueryKey(auctionId) }
  });
  
  const { data: slot } = useGetCurrentSlot(auctionId, {
    query: { enabled: !!auctionId && (auction?.status === "active" || auction?.status === "paused"), queryKey: getGetCurrentSlotQueryKey(auctionId) }
  });
  
  const { data: players } = useListPlayers({ status: "unsold", search: searchTerm });
  const { data: teams } = useListTeams();
  
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  
  const startMutation = useStartAuction();
  const pauseMutation = usePauseAuction();
  const resumeMutation = useResumeAuction();
  const selectPlayerMutation = useSelectNextPlayer();
  const markSoldMutation = useMarkPlayerSold();
  const markUnsoldMutation = useMarkPlayerUnsold();
  const placeBidMutation = usePlaceBid();

  const timerExpired = timerState?.expired ?? false;
  const hasActiveBid = !!slot?.highestBidTeamId;
  const nextBidAmount = slot ? (slot.currentBid ? slot.currentBid + auction!.bidIncrementMin : slot.basePrice) : 0;

  if (auctionLoading) {
    return (
      <Layout>
        <div className="flex h-[80vh] items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!auction) return null;

  return (
    <Layout>
      <div className="max-w-[1600px] mx-auto space-y-8 h-full flex flex-col">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-8">
           <div className="space-y-1">
              <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.2em] text-[10px]">
                 <Shield className="w-3 h-3 fill-current" /> Command Center
              </div>
              <h1 className="text-3xl font-display font-black uppercase tracking-tight text-white">{auction.name}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground uppercase font-bold tracking-widest">
                 <span>{auction.leagueName}</span>
                 <span className="w-1 h-1 rounded-full bg-white/20" />
                 <span className="text-primary">{players?.length ?? 0} Players Remaining</span>
              </div>
           </div>
           
           <div className="flex items-center gap-4">
              <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/5">
                {auction.status === "draft" && (
                  <Button 
                    className="h-12 px-8 rounded-xl font-black uppercase tracking-wider shadow-lg shadow-primary/20"
                    onClick={() => startMutation.mutate({ id: auctionId })}
                    disabled={startMutation.isPending}
                  >
                    <Play className="w-4 h-4 mr-2 fill-current" /> Start Event
                  </Button>
                )}
                
                {auction.status === "active" && (
                  <Button 
                    variant="outline"
                    className="h-12 px-8 rounded-xl font-black uppercase tracking-wider border-yellow-500/20 text-yellow-500 hover:bg-yellow-500/10"
                    onClick={() => pauseMutation.mutate({ id: auctionId })}
                    disabled={pauseMutation.isPending}
                  >
                    <Pause className="w-4 h-4 mr-2 fill-current" /> Pause
                  </Button>
                )}
                
                {auction.status === "paused" && (
                  <Button 
                    className="h-12 px-8 rounded-xl font-black uppercase tracking-wider bg-yellow-500 text-black hover:bg-yellow-400"
                    onClick={() => resumeMutation.mutate({ id: auctionId })}
                    disabled={resumeMutation.isPending}
                  >
                    <Play className="w-4 h-4 mr-2 fill-current" /> Resume
                  </Button>
                )}
              </div>

              <div className="h-12 w-px bg-white/5 hidden md:block" />

              <Badge className="h-12 px-6 rounded-2xl border-white/10 bg-white/5 text-lg font-black uppercase text-white">
                 {auction.status}
              </Badge>
           </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 flex-1">
          
          {/* Main Control Panel */}
          <div className="xl:col-span-8 flex flex-col gap-8">
             <AnimatePresence mode="wait">
                {slot?.player ? (
                  <motion.div
                    key={slot.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex flex-col gap-6"
                  >
                    {/* Action Alert Banner */}
                    {timerExpired && slot.status === "active" && (
                      <div className="flex items-center justify-between px-8 py-6 rounded-[2rem] border-2 border-destructive bg-destructive/10 text-destructive animate-pulse">
                         <div className="flex items-center gap-4">
                            <Bell className="w-8 h-8" />
                            <div>
                               <div className="text-xl font-display font-black uppercase tracking-wider">Bidding Expired</div>
                               <div className="text-sm font-bold opacity-80 uppercase tracking-widest">Immediate action required below</div>
                            </div>
                         </div>
                         <div className="text-2xl font-display font-black">
                            {hasActiveBid ? "READY TO SELL" : "NO BIDS"}
                         </div>
                      </div>
                    )}

                    <div className={cn(
                      "glass-panel rounded-[3rem] p-10 border-2 transition-all duration-500",
                      timerExpired ? "border-destructive/40 shadow-[0_0_50px_rgba(var(--destructive),0.1)]" : "border-primary/20 shadow-[0_0_50px_rgba(var(--primary),0.1)]"
                    )}>
                       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12 pb-12 border-b border-white/5">
                          <div className="space-y-2">
                             <div className="text-[10px] font-black uppercase text-primary tracking-[0.2em]">Live Bidding Floor</div>
                             <h2 className="text-4xl md:text-5xl font-display font-black uppercase tracking-tight text-white">{slot.player.name}</h2>
                             <div className="text-muted-foreground uppercase font-bold tracking-widest text-sm">{slot.player.category} · {slot.player.country}</div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                             <div className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Live Timer</div>
                             {timerState && <CountdownTimer timer={timerState} size="lg" />}
                          </div>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
                          <div className="p-8 rounded-[2rem] bg-white/5 border border-white/5 flex flex-col justify-center">
                             <div className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-2">Base Price</div>
                             <div className="text-3xl font-display font-black text-white/50">{formatMoney(slot.basePrice)}</div>
                          </div>
                          <div className="p-8 rounded-[2rem] bg-primary/10 border-2 border-primary/20 flex flex-col justify-center relative overflow-hidden group">
                             <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Gavel className="w-24 h-24 text-primary" />
                             </div>
                             <div className="text-[10px] font-black uppercase text-primary tracking-widest mb-2">Current Bid</div>
                             <div className="text-5xl font-display font-black text-primary drop-shadow-[0_0_15px_rgba(var(--primary),0.5)]">
                                {formatMoney(slot.currentBid ?? slot.basePrice)}
                             </div>
                              {slot.highestBidTeam && (
                               <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-primary text-primary-foreground rounded-full text-[10px] font-black uppercase tracking-widest self-start">
                                  <Star className="w-3 h-3 fill-current" /> {slot.highestBidTeam.name}
                               </div>
                             )}
                          </div>
                       </div>

                       {auction.biddingMode === "auctioneer" && slot.status === "active" && !timerExpired && (
                         <div className="p-8 rounded-[2rem] bg-white/5 border border-white/10 mb-12 flex flex-col md:flex-row items-end gap-6">
                           <div className="flex-1 w-full space-y-2">
                             <div className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Select Team</div>
                             <select
                               className="w-full h-14 px-4 rounded-xl border border-white/10 bg-black/50 text-white font-bold appearance-none outline-none focus:border-primary focus:bg-white/5 transition-all"
                               value={selectedTeamId}
                               onChange={(e) => setSelectedTeamId(e.target.value)}
                             >
                               <option value="" disabled>Choose a franchise...</option>
                               {teams?.map(t => (
                                 <option key={t.id} value={t.id}>{t.name} (Max Bid: {formatMoney(t.remainingPurse)})</option>
                               ))}
                             </select>
                           </div>
                           <Button 
                             size="lg" 
                             className="h-14 px-8 rounded-xl font-black uppercase tracking-widest text-sm bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 shrink-0 w-full md:w-auto"
                             disabled={!selectedTeamId || placeBidMutation.isPending}
                             onClick={() => {
                               if (selectedTeamId) {
                                 placeBidMutation.mutate({
                                   id: auctionId,
                                   data: { slotId: slot.id, teamId: parseInt(selectedTeamId), amount: nextBidAmount }
                                 }, {
                                   onSuccess: () => {
                                     setSelectedTeamId("");
                                   }
                                 });
                               }
                             }}
                           >
                             Place Bid: {formatMoney(nextBidAmount)}
                           </Button>
                         </div>
                       )}

                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <Button 
                            size="lg" 
                            className={cn(
                              "h-20 rounded-2xl font-black uppercase tracking-[0.2em] text-lg shadow-2xl transition-all duration-300",
                              timerExpired && hasActiveBid ? "bg-green-500 hover:bg-green-400 scale-[1.02] shadow-green-500/20" : "bg-white text-black hover:bg-white/90"
                            )}
                            disabled={!slot.highestBidTeamId || markSoldMutation.isPending}
                            onClick={() => markSoldMutation.mutate({ id: slot.id })}
                          >
                            {timerExpired && hasActiveBid ? "Confirm Sale" : "Mark as Sold"}
                          </Button>
                          <Button 
                            size="lg" 
                            variant="outline"
                            className={cn(
                              "h-20 rounded-2xl font-black uppercase tracking-[0.2em] text-lg transition-all duration-300 border-white/10",
                              timerExpired && !hasActiveBid ? "bg-destructive text-white border-none shadow-2xl shadow-destructive/20" : "hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20"
                            )}
                            disabled={markUnsoldMutation.isPending}
                            onClick={() => markUnsoldMutation.mutate({ id: slot.id })}
                          >
                            {timerExpired && !hasActiveBid ? "Confirm Unsold" : "Mark Unsold"}
                          </Button>
                       </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="glass-panel rounded-[3rem] flex flex-col items-center justify-center text-center p-20 border-2 border-dashed border-white/5 flex-1 min-h-[500px]">
                     <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-8">
                        <UserPlus className="w-10 h-10 text-primary opacity-50" />
                     </div>
                     <h3 className="text-3xl font-display font-black uppercase tracking-tight text-white mb-4">Awaiting Selection</h3>
                     <p className="text-muted-foreground text-lg max-w-sm">The floor is clear. Select a player from the registry on the right to initiate the next bidding sequence.</p>
                     <div className="mt-8 flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/5">
                        <Info className="w-4 h-4 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground">Auction Status: {auction.status}</span>
                     </div>
                  </div>
                )}
             </AnimatePresence>
          </div>

          {/* Player Selection Sidebar */}
          <div className="xl:col-span-4 flex flex-col gap-6">
             <div className="glass-panel rounded-[2rem] flex-1 flex flex-col overflow-hidden">
                <div className="p-6 border-b border-white/5 bg-white/5">
                   <h3 className="font-display font-black uppercase tracking-tight text-sm mb-4">Player Registry</h3>
                   <div className="relative">
                      <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input 
                        placeholder="Filter by name, country, role..." 
                        className="h-12 pl-11 pr-4 rounded-xl font-bold bg-white/5 border-white/10 focus:border-primary transition-all text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                   </div>
                </div>
                <div className="flex-1 overflow-auto p-4 space-y-3">
                   {players?.map(playerItem => (
                     <motion.div 
                       key={playerItem.id} 
                       initial={{ opacity: 0 }} 
                       animate={{ opacity: 1 }}
                       className="group p-4 rounded-[1.5rem] bg-white/2 border border-white/5 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 flex justify-between items-center"
                     >
                        <div className="space-y-1">
                           <div className="text-sm font-black uppercase tracking-tight text-white">{playerItem.name}</div>
                           <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{playerItem.category} · {playerItem.country}</div>
                           <div className="text-xs font-display font-black text-primary/70">{formatMoney(playerItem.basePrice)}</div>
                        </div>
                        <Button 
                          size="sm" 
                          className="h-10 px-4 rounded-xl font-black uppercase text-[10px] tracking-widest opacity-0 group-hover:opacity-100 transition-all shadow-xl shadow-primary/20"
                          onClick={() => selectPlayerMutation.mutate({ id: auctionId, data: { playerId: playerItem.id } })}
                          disabled={selectPlayerMutation.isPending || !!slot?.player || auction.status !== 'active'}
                        >
                          Select
                        </Button>
                     </motion.div>
                   ))}
                   {(!players || players.length === 0) && (
                     <div className="py-12 text-center text-muted-foreground opacity-30 italic text-sm">
                        No available players found
                     </div>
                   )}
                </div>
                <div className="p-4 bg-white/5 border-t border-white/5 text-center">
                   <div className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Total Registry: {players?.length ?? 0} Players</div>
                </div>
             </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}
