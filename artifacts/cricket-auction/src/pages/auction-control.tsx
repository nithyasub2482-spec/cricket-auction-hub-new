import { useParams } from "wouter";
import { Layout } from "@/components/layout";
import { 
  useGetAuction, getGetAuctionQueryKey, 
  useGetCurrentSlot, getGetCurrentSlotQueryKey,
  useSelectNextPlayer, useStartAuction, usePauseAuction, useResumeAuction,
  useMarkPlayerSold, useMarkPlayerUnsold, useListPlayers
} from "@workspace/api-client-react";
import { useAuctionSocket } from "@/hooks/useAuctionSocket";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Loader2, Play, Pause, Gavel, XCircle, Search } from "lucide-react";
import { formatMoney } from "@/lib/utils";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export default function AuctionControl() {
  const { id } = useParams();
  const auctionId = parseInt(id || "0", 10);
  
  useAuctionSocket(auctionId);
  
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: auction, isLoading: auctionLoading } = useGetAuction(auctionId, {
    query: { enabled: !!auctionId, queryKey: getGetAuctionQueryKey(auctionId) }
  });
  
  const { data: slot } = useGetCurrentSlot(auctionId, {
    query: { enabled: !!auctionId && (auction?.status === "active" || auction?.status === "paused"), queryKey: getGetCurrentSlotQueryKey(auctionId) }
  });
  
  const { data: players } = useListPlayers({ status: "available", search: searchTerm });
  
  const startMutation = useStartAuction();
  const pauseMutation = usePauseAuction();
  const resumeMutation = useResumeAuction();
  const selectPlayerMutation = useSelectNextPlayer();
  const markSoldMutation = useMarkPlayerSold();
  const markUnsoldMutation = useMarkPlayerUnsold();

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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-6rem)]">
        
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="p-6 border-2 border-border bg-card">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold uppercase tracking-tight text-foreground">Control Console</h1>
                <p className="text-muted-foreground">{auction.name}</p>
              </div>
              <Badge variant={auction.status === "active" ? "default" : "secondary"} className="uppercase text-lg py-1 px-4">
                {auction.status}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-4 p-4 bg-secondary rounded-lg border border-border">
              {auction.status === "draft" && (
                <Button 
                  size="lg"
                  className="font-bold uppercase tracking-wider"
                  onClick={() => startMutation.mutate({ id: auctionId })}
                  disabled={startMutation.isPending}
                >
                  <Play className="w-4 h-4 mr-2" /> Start Auction
                </Button>
              )}
              
              {auction.status === "active" && (
                <Button 
                  size="lg"
                  variant="outline"
                  className="font-bold uppercase tracking-wider border-yellow-500 text-yellow-500 hover:bg-yellow-500/10"
                  onClick={() => pauseMutation.mutate({ id: auctionId })}
                  disabled={pauseMutation.isPending}
                >
                  <Pause className="w-4 h-4 mr-2" /> Pause Auction
                </Button>
              )}
              
              {auction.status === "paused" && (
                <Button 
                  size="lg"
                  className="font-bold uppercase tracking-wider bg-yellow-500 text-black hover:bg-yellow-400"
                  onClick={() => resumeMutation.mutate({ id: auctionId })}
                  disabled={resumeMutation.isPending}
                >
                  <Play className="w-4 h-4 mr-2" /> Resume Auction
                </Button>
              )}
            </div>
            
            {slot?.player && (
              <div className="mt-8">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Current Slot Actions</h3>
                <div className="p-6 border-2 border-primary/30 rounded-lg bg-primary/5">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <div className="text-2xl font-bold uppercase text-foreground">{slot.player.name}</div>
                      <div className="text-muted-foreground font-mono">{formatMoney(slot.currentBid ?? slot.basePrice)}</div>
                    </div>
                    {slot.highestBidTeam && (
                      <Badge className="bg-primary text-primary-foreground font-bold text-lg">
                        {slot.highestBidTeam.name}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      size="lg" 
                      className="bg-green-600 hover:bg-green-500 text-white font-bold uppercase tracking-wider"
                      disabled={!slot.highestBidTeamId || markSoldMutation.isPending}
                      onClick={() => markSoldMutation.mutate({ id: slot.id })}
                    >
                      <Gavel className="w-5 h-5 mr-2" /> Mark Sold
                    </Button>
                    <Button 
                      size="lg" 
                      variant="destructive"
                      className="font-bold uppercase tracking-wider"
                      disabled={markUnsoldMutation.isPending}
                      onClick={() => markUnsoldMutation.mutate({ id: slot.id })}
                    >
                      <XCircle className="w-5 h-5 mr-2" /> Mark Unsold
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="flex-1 flex flex-col border-border bg-card overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="font-bold uppercase tracking-wider mb-4">Select Next Player</h3>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <Input 
                  placeholder="Search available players..." 
                  className="pl-9 font-mono bg-background"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex-1 overflow-auto p-2">
              <div className="space-y-2">
                {players?.map(player => (
                  <div key={player.id} className="p-3 border border-border rounded bg-background flex justify-between items-center group hover:border-primary transition-colors">
                    <div>
                      <div className="font-bold text-sm uppercase text-foreground">{player.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">{formatMoney(player.basePrice)}</div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="secondary"
                      className="opacity-0 group-hover:opacity-100 transition-opacity uppercase text-xs font-bold"
                      onClick={() => selectPlayerMutation.mutate({ id: auctionId, data: { playerId: player.id } })}
                      disabled={selectPlayerMutation.isPending || !!slot?.player || auction.status !== 'active'}
                    >
                      Select
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

      </div>
    </Layout>
  );
}
