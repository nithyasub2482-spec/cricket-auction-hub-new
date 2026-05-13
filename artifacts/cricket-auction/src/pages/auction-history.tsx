import { useParams, Link } from "wouter";
import { Layout } from "@/components/layout";
import {
  useGetAuction, getGetAuctionQueryKey,
  useListAuctionSlots, getListAuctionSlotsQueryKey,
} from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronRight, Gavel, XCircle, Activity } from "lucide-react";
import { formatMoney } from "@/lib/utils";

export default function AuctionHistory() {
  const { id } = useParams();
  const auctionId = parseInt(id || "0", 10);

  const { data: auction, isLoading: aLoading } = useGetAuction(auctionId, {
    query: { enabled: !!auctionId, queryKey: getGetAuctionQueryKey(auctionId) },
  });

  const { data: slots, isLoading: sLoading } = useListAuctionSlots(auctionId, {
    query: { enabled: !!auctionId, queryKey: getListAuctionSlotsQueryKey(auctionId) },
  });

  const completedSlots = slots?.filter((s) => s.status === "sold" || s.status === "unsold") ?? [];

  if (aLoading || sLoading) {
    return (
      <Layout>
        <div className="flex h-[80vh] items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Link href={`/auction/${auctionId}`} className="hover:text-foreground transition-colors">
                {auction?.name}
              </Link>
              <ChevronRight className="w-3 h-3" />
              <span>Bid History</span>
            </div>
            <h1 className="text-3xl font-bold uppercase tracking-tight text-foreground flex items-center gap-3">
              <Activity className="w-8 h-8 text-primary" />
              Bid History Replay
            </h1>
            <p className="text-muted-foreground mt-1">
              {completedSlots.length} completed {completedSlots.length === 1 ? "lot" : "lots"} — click any to replay the bidding timeline
            </p>
          </div>
        </div>

        {completedSlots.length === 0 ? (
          <Card className="p-16 text-center border-dashed border-2 border-border bg-card/50">
            <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
            <h3 className="text-lg font-bold text-foreground">No Completed Lots Yet</h3>
            <p className="text-muted-foreground text-sm mt-1">Lots will appear here once players are sold or passed.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {completedSlots.map((slot, index) => (
              <Link key={slot.id} href={`/auction/${auctionId}/slots/${slot.id}`}>
                <Card className="p-5 border-border bg-card hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group">
                  <div className="flex items-center gap-5">
                    {/* Lot number */}
                    <div className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center shrink-0">
                      <span className="text-sm font-black text-muted-foreground">#{completedSlots.length - index}</span>
                    </div>

                    {/* Player info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-black text-lg uppercase tracking-tight text-foreground truncate">
                          {slot.player?.name ?? "Unknown Player"}
                        </span>
                        <Badge variant="outline" className="text-xs uppercase font-mono shrink-0">
                          {slot.player?.category?.replace("_", " ") ?? "—"}
                        </Badge>
                        <span className="text-muted-foreground text-xs shrink-0">{slot.player?.country}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="font-mono">Base: {formatMoney(slot.basePrice)}</span>
                        <span className="font-mono font-bold text-foreground">
                          {slot.status === "sold"
                            ? `Sold: ${formatMoney(slot.soldPrice ?? slot.currentBid ?? 0)}`
                            : "Passed — No Sale"}
                        </span>
                        <span>{slot.bidCount} bid{slot.bidCount !== 1 ? "s" : ""}</span>
                      </div>
                    </div>

                    {/* Outcome + team */}
                    <div className="flex items-center gap-4 shrink-0">
                      {slot.status === "sold" ? (
                        <div className="flex items-center gap-2">
                          {slot.soldToTeam && (
                            <div
                              className="w-4 h-4 rounded-full border border-border"
                              style={{ backgroundColor: slot.soldToTeam.primaryColor }}
                            />
                          )}
                          <span className="font-bold text-sm text-foreground uppercase tracking-wide">
                            {slot.soldToTeam?.shortName ?? "—"}
                          </span>
                          <Badge className="bg-green-700 text-white font-bold uppercase gap-1 text-xs">
                            <Gavel className="w-3 h-3" /> Sold
                          </Badge>
                        </div>
                      ) : (
                        <Badge variant="destructive" className="font-bold uppercase gap-1 text-xs">
                          <XCircle className="w-3 h-3" /> Unsold
                        </Badge>
                      )}
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
