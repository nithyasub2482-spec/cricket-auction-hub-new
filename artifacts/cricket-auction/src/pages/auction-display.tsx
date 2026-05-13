import { useParams } from "wouter";
import { useGetAuction, getGetAuctionQueryKey, useGetCurrentSlot, getGetCurrentSlotQueryKey } from "@workspace/api-client-react";
import { useAuctionSocket } from "@/hooks/useAuctionSocket";
import { useBidSounds } from "@/hooks/useBidSounds";
import { CountdownTimer } from "@/components/countdown-timer";
import { Loader2 } from "lucide-react";
import { formatMoney } from "@/lib/utils";

export default function AuctionDisplay() {
  const { id } = useParams();
  const auctionId = parseInt(id || "0", 10);
  
  const { timerState, lastEvent } = useAuctionSocket(auctionId);
  useBidSounds(lastEvent, timerState);
  
  const { data: auction, isLoading: auctionLoading } = useGetAuction(auctionId, {
    query: { enabled: !!auctionId, queryKey: getGetAuctionQueryKey(auctionId) }
  });
  
  const { data: slot } = useGetCurrentSlot(auctionId, {
    query: { enabled: !!auctionId && auction?.status === "active", queryKey: getGetCurrentSlotQueryKey(auctionId) }
  });

  if (auctionLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-24 h-24 animate-spin text-white opacity-20" />
      </div>
    );
  }

  if (!auction) return null;

  const timerExpired = timerState?.expired ?? false;

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden flex flex-col select-none">
      
      {/* Header */}
      <header className="h-24 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-12">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
            <span className="font-black text-3xl text-black">A</span>
          </div>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-widest text-white">{auction.name}</h1>
            <p className="text-zinc-400 font-mono text-xl tracking-widest uppercase">{auction.leagueName}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-8">
          {/* Large timer in header */}
          {timerState && slot?.status === "active" && (
            <CountdownTimer timer={timerState} size="lg" className="opacity-90" />
          )}
          <div className="flex items-center gap-4">
            <div className={`w-4 h-4 rounded-full ${auction.status === 'active' ? 'bg-red-600 animate-pulse' : 'bg-zinc-600'}`} />
            <span className="text-2xl font-black uppercase tracking-widest text-zinc-400">
              {auction.status === 'active' ? 'LIVE' : auction.status}
            </span>
          </div>
        </div>
      </header>

      {/* Timer expired full-width bar */}
      {timerExpired && slot?.status === "active" && (
        <div className="bg-red-900/80 border-b border-red-700 px-12 py-3 flex items-center justify-center gap-4 animate-pulse">
          <span className="font-black uppercase tracking-[0.4em] text-red-200 text-xl">
            ⏱ Bidding Time Expired — Awaiting Auctioneer Decision
          </span>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 relative flex items-center justify-center p-12">
        
        {!slot || !slot.player ? (
          <div className="text-center opacity-30">
            <h2 className="text-6xl font-black uppercase tracking-[0.2em] mb-4">Awaiting Player</h2>
            <p className="font-mono text-2xl">Stand by for next lot</p>
          </div>
        ) : (
          <div className="w-full max-w-7xl flex gap-16 items-center justify-center">
            
            {/* Player Info */}
            <div className="flex-1 text-right border-r border-zinc-800 pr-16 py-12">
              <div className="text-primary font-mono text-2xl uppercase tracking-widest mb-4">
                {slot.player.category.replace('_', ' ')} • {slot.player.country}
              </div>
              <h2 className="text-[6rem] leading-none font-black uppercase tracking-tighter mb-8 text-white">
                {slot.player.name}
              </h2>
              <div className="inline-block bg-zinc-900 px-8 py-4 rounded-xl border border-zinc-800">
                <div className="text-zinc-500 font-bold uppercase tracking-widest mb-1">Base Price</div>
                <div className="text-4xl font-mono font-bold text-white">{formatMoney(slot.player.basePrice)}</div>
              </div>
            </div>

            {/* Current Bid + Timer */}
            <div className="flex-1 pl-8 flex flex-col gap-8">
              <div>
                <div className="text-zinc-500 font-black uppercase tracking-[0.3em] text-2xl mb-4">Current Bid</div>
                <div className={`text-[8rem] leading-none font-black font-mono tracking-tighter mb-8 drop-shadow-[0_0_30px_rgba(255,165,0,0.3)] transition-colors ${timerExpired ? "text-red-400" : "text-primary"}`}>
                  {formatMoney(slot.currentBid || slot.basePrice)}
                </div>
                
                {slot.highestBidTeam ? (
                  <div className="inline-flex items-center gap-6 px-10 py-6 bg-zinc-900 rounded-2xl border border-zinc-700">
                    <div 
                      className="w-12 h-12 rounded-full" 
                      style={{ backgroundColor: slot.highestBidTeam.primaryColor }}
                    />
                    <span className="font-black text-5xl uppercase tracking-wider text-white">
                      {slot.highestBidTeam.name}
                    </span>
                  </div>
                ) : (
                  <div className="inline-block px-10 py-6 bg-zinc-900/50 rounded-2xl border border-zinc-800 border-dashed">
                    <span className="font-black text-3xl uppercase tracking-widest text-zinc-600">
                      Awaiting First Bid
                    </span>
                  </div>
                )}
              </div>

              {/* Standalone big timer block on display screen */}
              {timerState && (
                <div className={`flex items-center gap-8 px-8 py-6 rounded-2xl border ${timerExpired ? "border-red-800 bg-red-900/20" : "border-zinc-800 bg-zinc-900/60"}`}>
                  <CountdownTimer timer={timerState} size="lg" />
                  <div>
                    <div className="text-zinc-500 font-bold uppercase tracking-widest text-lg mb-1">Time Remaining</div>
                    <div className={`font-black text-4xl uppercase tracking-wider ${timerExpired ? "text-red-400" : "text-white"}`}>
                      {timerExpired ? "BIDDING CLOSED" : timerState.paused ? "PAUSED" : `${timerState.remaining}s left`}
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

      </main>

    </div>
  );
}
