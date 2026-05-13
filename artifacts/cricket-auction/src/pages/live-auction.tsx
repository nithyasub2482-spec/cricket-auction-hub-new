import { useParams } from "wouter";
import { Layout } from "@/components/layout";
import { useGetAuction, useGetCurrentSlot, useListAuctionBids, getGetAuctionQueryKey, getGetCurrentSlotQueryKey, getGetAuctionBidsQueryKey } from "@workspace/api-client-react";
import { useAuctionSocket } from "@/hooks/useAuctionSocket";
import { useBidSounds } from "@/hooks/useBidSounds";
import { CountdownTimer } from "@/components/countdown-timer";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Loader2, Gavel, Users, Trophy, TrendingUp, History, Star } from "lucide-react";
import { formatMoney } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function LiveAuction() {
  const { id } = useParams();
  const auctionId = parseInt(id || "0", 10);
  
  const { timerState, lastEvent } = useAuctionSocket(auctionId);
  useBidSounds(lastEvent, timerState);
  
  const { data: auction, isLoading: auctionLoading } = useGetAuction(auctionId, {
    query: { enabled: !!auctionId, queryKey: getGetAuctionQueryKey(auctionId) }
  });
  
  const { data: slot, isLoading: slotLoading } = useGetCurrentSlot(auctionId, {
    query: { enabled: !!auctionId, queryKey: getGetCurrentSlotQueryKey(auctionId) }
  });

  const { data: bids } = useListAuctionBids(auctionId, {
    query: { enabled: !!auctionId, queryKey: getGetAuctionBidsQueryKey(auctionId) }
  });

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
      <div className="max-w-[1600px] mx-auto h-full flex flex-col gap-8 pb-10">
        
        {/* Top Branding Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-8">
           <div className="space-y-1">
              <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.2em] text-[10px]">
                 <Star className="w-3 h-3 fill-current" /> Live Broadcast
              </div>
              <h1 className="text-3xl font-display font-black uppercase tracking-tight text-white">{auction.name}</h1>
              <div className="text-sm text-muted-foreground uppercase font-bold tracking-widest">{auction.leagueName}</div>
           </div>
           
           <div className="flex items-center gap-6">
              <div className="hidden lg:flex items-center gap-4 px-6 py-3 bg-white/5 border border-white/5 rounded-2xl">
                 <div className="text-right">
                    <div className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Active Bidders</div>
                    <div className="text-lg font-display font-black text-white">24 Teams</div>
                 </div>
                 <Users className="w-8 h-8 text-primary/40" />
              </div>
              
              <div className="flex items-center gap-4">
                 {timerState && slot?.status === "active" && (
                   <div className="relative group">
                      <div className="absolute -inset-2 bg-primary/20 blur-xl rounded-full group-hover:bg-primary/40 transition-colors" />
                      <CountdownTimer timer={timerState} size="lg" />
                   </div>
                 )}
                 <Badge variant="outline" className="h-12 px-6 rounded-2xl border-white/10 bg-white/5 text-lg font-black uppercase text-white">
                   {auction.status}
                 </Badge>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 flex-1">
          
          {/* Left Column: Bid History (War Room) */}
          <div className="xl:col-span-3 flex flex-col gap-6 order-2 xl:order-1">
             <div className="glass-panel rounded-[2rem] flex-1 flex flex-col overflow-hidden">
                <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
                   <h3 className="font-display font-black uppercase tracking-tight text-sm flex items-center gap-2">
                      <History className="w-4 h-4 text-primary" /> Live Feed
                   </h3>
                   <Badge className="bg-primary/10 text-primary border-primary/20 uppercase text-[10px] font-black">Realtime</Badge>
                </div>
                <div className="flex-1 overflow-auto p-4 space-y-3 font-mono">
                   <AnimatePresence initial={false}>
                      {bids?.slice(0, 20).map((bid, i) => (
                        <motion.div
                          key={bid.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`p-3 rounded-xl border border-white/5 flex flex-col gap-1 transition-colors ${i === 0 ? "bg-primary/10 border-primary/20" : "bg-white/5"}`}
                        >
                          <div className="flex justify-between items-center">
                             <span className="text-xs font-black uppercase tracking-tight text-white line-clamp-1">{bid.team.name}</span>
                             <span className="text-[10px] opacity-40">{new Date(bid.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                          </div>
                          <div className={`text-lg font-black ${i === 0 ? "text-primary" : "text-white"}`}>
                             {formatMoney(bid.amount)}
                          </div>
                        </motion.div>
                      ))}
                      {(!bids || bids.length === 0) && (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-30 gap-3 py-20">
                           <TrendingUp className="w-12 h-12" />
                           <span className="text-xs uppercase font-black tracking-widest">Waiting for Bids</span>
                        </div>
                      )}
                   </AnimatePresence>
                </div>
             </div>
          </div>

          {/* Center Column: The Arena (Player Card) */}
          <div className="xl:col-span-6 order-1 xl:order-2">
             <AnimatePresence mode="wait">
                {slot?.player ? (
                  <motion.div
                    key={slot.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    className="h-full flex flex-col gap-6"
                  >
                    <div className="relative group flex-1">
                       <div className="absolute -inset-4 bg-gradient-to-b from-primary/10 to-transparent blur-3xl opacity-50" />
                       <div className="relative glass-panel rounded-[3rem] p-10 h-full flex flex-col items-center text-center overflow-hidden border-2 border-white/10 group-hover:border-primary/30 transition-colors">
                          
                          {/* Player Photo Placeholder / Mascot Area */}
                          <div className="w-48 h-48 md:w-64 md:h-64 rounded-full bg-gradient-to-tr from-primary/20 via-white/5 to-purple-600/20 p-2 mb-8 relative">
                             <div className="w-full h-full rounded-full bg-card flex items-center justify-center border border-white/10 overflow-hidden">
                                <Trophy className="w-24 h-24 text-primary/20 animate-pulse" />
                             </div>
                             <div className="absolute -bottom-2 right-4 bg-primary text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-xl">
                                {slot.player.category}
                             </div>
                          </div>

                          <h2 className="text-4xl md:text-6xl font-display font-black uppercase tracking-tighter text-white mb-2">{slot.player.name}</h2>
                          <div className="flex items-center gap-3 text-muted-foreground uppercase font-bold tracking-[0.3em] text-sm mb-12">
                             <span>{slot.player.country}</span>
                             <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                             <span>{slot.player.battingStyle}</span>
                          </div>

                          <div className="grid grid-cols-2 gap-10 w-full max-w-lg mb-10">
                             <div className="space-y-1">
                                <div className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Base Price</div>
                                <div className="text-2xl md:text-3xl font-display font-black text-white/60">{formatMoney(slot.basePrice)}</div>
                             </div>
                             <div className="space-y-1">
                                <div className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center justify-center gap-1">
                                   <TrendingUp className="w-3 h-3" /> Current Bid
                                </div>
                                <div className="text-4xl md:text-5xl font-display font-black text-primary drop-shadow-[0_0_15px_rgba(var(--primary),0.5)]">
                                   {formatMoney(slot.currentBid ?? slot.basePrice)}
                                </div>
                             </div>
                          </div>

                          <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-10" />

                          <div className="flex flex-col items-center gap-4">
                             {slot.highestBidTeam ? (
                               <div className="space-y-2">
                                  <div className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Highest Bidder</div>
                                  <div className="px-10 py-4 bg-primary/10 border border-primary/20 rounded-[2rem] text-2xl font-display font-black uppercase text-primary animate-neon">
                                     {slot.highestBidTeam.name}
                                  </div>
                               </div>
                             ) : (
                               <div className="text-sm font-bold text-muted-foreground italic opacity-50 uppercase tracking-widest">
                                  Opening Bids Invited...
                               </div>
                             )}
                          </div>
                       </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="h-full glass-panel rounded-[3rem] flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-white/5 bg-white/2">
                    <div className="w-32 h-32 rounded-full bg-white/5 flex items-center justify-center mb-8">
                       <Gavel className="w-16 h-16 text-muted-foreground opacity-20" />
                    </div>
                    <h3 className="text-3xl font-display font-black uppercase tracking-tight text-white mb-4">Arena Standby</h3>
                    <p className="text-muted-foreground text-lg max-w-sm">The bidding floor is currently clear. The auctioneer will select the next star player shortly.</p>
                  </div>
                )}
             </AnimatePresence>
          </div>

          {/* Right Column: Player Stats / Insights */}
          <div className="xl:col-span-3 flex flex-col gap-6 order-3">
             <div className="glass-panel rounded-[2rem] p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                   <h3 className="font-display font-black uppercase tracking-tight text-sm">Player Profile</h3>
                   <div className="p-1.5 rounded-lg bg-primary/10">
                      <TrendingUp className="w-4 h-4 text-primary" />
                   </div>
                </div>
                
                {slot?.player ? (
                  <div className="space-y-8">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1 p-3 rounded-2xl bg-white/5 border border-white/5">
                           <div className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Strike Rate</div>
                           <div className="text-lg font-display font-black text-white">142.5</div>
                        </div>
                        <div className="space-y-1 p-3 rounded-2xl bg-white/5 border border-white/5">
                           <div className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Avg</div>
                           <div className="text-lg font-display font-black text-white">38.2</div>
                        </div>
                        <div className="space-y-1 p-3 rounded-2xl bg-white/5 border border-white/5">
                           <div className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">100s/50s</div>
                           <div className="text-lg font-display font-black text-white">4 / 18</div>
                        </div>
                        <div className="space-y-1 p-3 rounded-2xl bg-white/5 border border-white/5">
                           <div className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Matches</div>
                           <div className="text-lg font-display font-black text-white">114</div>
                        </div>
                     </div>
                     
                     <div className="space-y-4">
                        <div className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-2">Performance Radar</div>
                        <div className="h-32 w-full rounded-2xl bg-gradient-to-t from-primary/10 to-transparent border border-white/5 flex items-end p-4 gap-2">
                           {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                             <motion.div 
                                key={i}
                                initial={{ height: 0 }}
                                animate={{ height: `${h}%` }}
                                className="flex-1 bg-primary/40 rounded-t-sm"
                             />
                           ))}
                        </div>
                     </div>
                  </div>
                ) : (
                  <div className="py-20 text-center space-y-4 opacity-20">
                     <Trophy className="w-12 h-12 mx-auto" />
                     <div className="text-[10px] font-black uppercase tracking-widest">No Active Player</div>
                  </div>
                )}
             </div>

             <div className="glass-panel rounded-[2rem] p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                   <h3 className="font-display font-black uppercase tracking-tight text-sm">League News</h3>
                </div>
                <div className="space-y-4">
                   <div className="flex gap-3 items-start opacity-60 hover:opacity-100 transition-opacity cursor-default">
                      <div className="w-2 h-2 mt-1.5 rounded-full bg-primary" />
                      <p className="text-xs font-bold leading-relaxed line-clamp-2">MI purse status: Only ₹15Cr remaining after huge bid.</p>
                   </div>
                   <div className="flex gap-3 items-start opacity-60 hover:opacity-100 transition-opacity cursor-default">
                      <div className="w-2 h-2 mt-1.5 rounded-full bg-primary" />
                      <p className="text-xs font-bold leading-relaxed line-clamp-2">Next up in marquee list: Legendary wicket keepers.</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
