import { useParams, Link } from "wouter";
import { Layout } from "@/components/layout";
import {
  useGetAuction, getGetAuctionQueryKey,
  useGetSlotBids, getGetSlotBidsQueryKey,
  useListAuctionSlots, getListAuctionSlotsQueryKey,
} from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Loader2, ChevronRight, Gavel, XCircle, TrendingUp, Clock, Users } from "lucide-react";
import { formatMoney } from "@/lib/utils";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";

function formatTime(isoString: string, baseIso: string): string {
  const ms = new Date(isoString).getTime() - new Date(baseIso).getTime();
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

function formatTimestamp(isoString: string): string {
  return new Date(isoString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function SlotReplay() {
  const { id, slotId } = useParams<{ id: string; slotId: string }>();
  const auctionId = parseInt(id || "0", 10);
  const slotIdNum = parseInt(slotId || "0", 10);

  const { data: auction } = useGetAuction(auctionId, {
    query: { enabled: !!auctionId, queryKey: getGetAuctionQueryKey(auctionId) },
  });

  const { data: slots, isLoading: slotsLoading } = useListAuctionSlots(auctionId, {
    query: { enabled: !!auctionId, queryKey: getListAuctionSlotsQueryKey(auctionId) },
  });
  const slot = slots?.find((s) => s.id === slotIdNum);

  const { data: bids, isLoading: bidsLoading } = useGetSlotBids(auctionId, slotIdNum, {
    query: { enabled: !!auctionId && !!slotIdNum, queryKey: getGetSlotBidsQueryKey(auctionId, slotIdNum) },
  });

  const isLoading = slotsLoading || bidsLoading;

  if (isLoading) {
    return (
      <Layout>
        <div className="flex h-[80vh] items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!slot) {
    return (
      <Layout>
        <div className="text-center py-20 text-destructive font-bold text-2xl uppercase tracking-wider">
          Slot Not Found
        </div>
      </Layout>
    );
  }

  const player = slot.player;
  const baseTime = slot.createdAt;

  // Build step chart data — start at base price, then each bid
  const chartData = [
    {
      time: "Start",
      timeMs: 0,
      amount: slot.basePrice,
      team: "Base Price",
      teamColor: "#6b7280",
      label: formatMoney(slot.basePrice),
    },
    ...(bids ?? []).map((bid, i) => ({
      time: formatTime(bid.createdAt, baseTime),
      timeMs: new Date(bid.createdAt).getTime() - new Date(baseTime).getTime(),
      amount: bid.amount,
      team: bid.team?.shortName ?? "Unknown",
      teamColor: bid.team?.primaryColor ?? "#f59e0b",
      label: formatMoney(bid.amount),
      bidIndex: i + 1,
    })),
  ];

  const uniqueTeams = Array.from(
    new Map((bids ?? []).map((b) => [b.teamId, b.team])).values()
  ).filter(Boolean);

  const winningBid = bids && bids.length > 0 ? bids[0] : null;
  const maxBid = slot.soldPrice ?? slot.currentBid ?? slot.basePrice;
  const premium = slot.basePrice > 0
    ? Math.round(((maxBid - slot.basePrice) / slot.basePrice) * 100)
    : 0;

  // Custom tooltip for chart
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: typeof chartData[0] }> }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-xl min-w-[140px]">
        <div className="text-xs text-muted-foreground uppercase font-bold mb-1">{d.time}</div>
        <div className="text-xl font-black font-mono text-primary">{formatMoney(d.amount)}</div>
        <div className="flex items-center gap-2 mt-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.teamColor }} />
          <span className="text-sm font-bold text-foreground">{d.team}</span>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Link href={`/auction/${auctionId}`} className="hover:text-foreground transition-colors">
            {auction?.name}
          </Link>
          <ChevronRight className="w-3 h-3" />
          <Link href={`/auction/${auctionId}/history`} className="hover:text-foreground transition-colors">
            Bid History
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground font-medium">{player?.name ?? `Slot #${slotIdNum}`}</span>
        </div>

        {/* Player header */}
        <Card className="p-8 border-2 border-border bg-card overflow-hidden relative">
          <div className="absolute top-0 right-0 opacity-5 pointer-events-none p-8">
            <Gavel className="w-48 h-48" />
          </div>
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center relative z-10">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Badge variant="outline" className="uppercase font-mono bg-background text-primary border-primary/30 text-sm">
                  {player?.category?.replace("_", " ") ?? "—"}
                </Badge>
                <span className="text-muted-foreground font-mono">{player?.country}</span>
              </div>
              <h1 className="text-5xl font-black uppercase tracking-tight text-foreground mb-4">
                {player?.name ?? "Unknown Player"}
              </h1>
              <div className="flex flex-wrap gap-6">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Base Price</div>
                  <div className="text-2xl font-black font-mono text-foreground">{formatMoney(slot.basePrice)}</div>
                </div>
                {slot.status === "sold" && (
                  <>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Final Price</div>
                      <div className="text-2xl font-black font-mono text-primary">{formatMoney(maxBid)}</div>
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Premium</div>
                      <div className="text-2xl font-black font-mono text-green-400">+{premium}%</div>
                    </div>
                  </>
                )}
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Bids</div>
                  <div className="text-2xl font-black font-mono text-foreground">{slot.bidCount}</div>
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Teams Bidding</div>
                  <div className="text-2xl font-black font-mono text-foreground">{uniqueTeams.length}</div>
                </div>
              </div>
            </div>

            {/* Outcome badge */}
            <div className="shrink-0">
              {slot.status === "sold" ? (
                <div className="text-center p-6 bg-green-900/20 rounded-2xl border-2 border-green-700/50">
                  <Gavel className="w-10 h-10 text-green-400 mx-auto mb-2" />
                  <div className="text-xs font-bold uppercase tracking-widest text-green-400 mb-1">SOLD TO</div>
                  <div className="flex items-center gap-2 justify-center">
                    {slot.soldToTeam && (
                      <div className="w-5 h-5 rounded-full border border-border" style={{ backgroundColor: slot.soldToTeam.primaryColor }} />
                    )}
                    <div className="text-xl font-black text-white">{slot.soldToTeam?.name ?? "—"}</div>
                  </div>
                  <div className="text-3xl font-black font-mono text-green-300 mt-2">{formatMoney(maxBid)}</div>
                </div>
              ) : (
                <div className="text-center p-6 bg-destructive/10 rounded-2xl border-2 border-destructive/30">
                  <XCircle className="w-10 h-10 text-destructive mx-auto mb-2" />
                  <div className="text-xl font-black text-destructive uppercase tracking-widest">UNSOLD</div>
                  <div className="text-sm text-muted-foreground mt-1">No bids met the reserve</div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Bid chart */}
        {chartData.length > 1 ? (
          <Card className="p-6 border-border bg-card">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="font-bold uppercase tracking-wider text-foreground">Bid Escalation Chart</h2>
              <span className="text-xs text-muted-foreground ml-auto">Time from lot opening → final hammer</span>
            </div>

            {/* Team legend */}
            {uniqueTeams.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-6">
                {uniqueTeams.map((team) => (
                  <div key={team!.id} className="flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-border text-sm">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: team!.primaryColor }} />
                    <span className="font-bold">{team!.shortName}</span>
                  </div>
                ))}
              </div>
            )}

            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                <defs>
                  <linearGradient id="bidGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="time"
                  tick={{ fill: "#6b7280", fontSize: 11, fontFamily: "monospace" }}
                  axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => `₹${(v / 1e5).toFixed(0)}L`}
                  tick={{ fill: "#6b7280", fontSize: 11, fontFamily: "monospace" }}
                  axisLine={false}
                  tickLine={false}
                  width={60}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine
                  y={slot.basePrice}
                  stroke="#6b7280"
                  strokeDasharray="4 4"
                  label={{ value: "Base", fill: "#6b7280", fontSize: 11 }}
                />
                <Area
                  type="stepAfter"
                  dataKey="amount"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  fill="url(#bidGradient)"
                  dot={(props) => {
                    const { cx, cy, payload } = props as { cx: number; cy: number; payload: typeof chartData[0] };
                    if (payload.timeMs === 0) return <circle key={`dot-base-${cx}`} cx={cx} cy={cy} r={4} fill="#6b7280" />;
                    return (
                      <circle
                        key={`dot-${payload.timeMs}`}
                        cx={cx}
                        cy={cy}
                        r={5}
                        fill={payload.teamColor}
                        stroke="#0a0a0a"
                        strokeWidth={2}
                      />
                    );
                  }}
                  activeDot={{ r: 7, fill: "#f59e0b", stroke: "#0a0a0a", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        ) : (
          <Card className="p-10 text-center border-dashed border-2 border-border bg-card/50">
            <TrendingUp className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-muted-foreground font-bold uppercase tracking-wider">No Bids Were Placed</p>
          </Card>
        )}

        {/* Bid timeline */}
        {bids && bids.length > 0 && (
          <Card className="border-border bg-card overflow-hidden">
            <div className="p-5 border-b border-border flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <h2 className="font-bold uppercase tracking-wider text-foreground">Full Bid Timeline</h2>
              <Badge variant="secondary" className="ml-auto font-mono">{bids.length} bids</Badge>
            </div>
            <div className="divide-y divide-border">
              {[...bids].reverse().map((bid, reverseIndex) => {
                const isFirst = reverseIndex === bids.length - 1;
                const isLast = reverseIndex === 0;
                const prev = reverseIndex < bids.length - 1 ? [...bids].reverse()[reverseIndex + 1] : null;
                const jump = prev ? bid.amount - prev.amount : bid.amount - slot.basePrice;
                return (
                  <div
                    key={bid.id}
                    className={`flex items-center gap-4 px-5 py-4 transition-colors ${isLast ? "bg-primary/5 border-l-4 border-l-primary" : "hover:bg-secondary/30"}`}
                  >
                    {/* Rank */}
                    <div className="w-8 text-center">
                      <span className="text-xs font-black text-muted-foreground font-mono">#{reverseIndex + 1}</span>
                    </div>

                    {/* Team dot */}
                    <div
                      className="w-4 h-4 rounded-full shrink-0 ring-2 ring-offset-2 ring-offset-background"
                      style={{
                        backgroundColor: bid.team?.primaryColor ?? "#6b7280",
                        outlineColor: bid.team?.primaryColor ?? "#6b7280",
                      }}
                    />

                    {/* Team name */}
                    <div className="w-28 shrink-0">
                      <div className="font-bold text-sm uppercase text-foreground truncate">
                        {bid.team?.shortName ?? "Unknown"}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{bid.team?.name}</div>
                    </div>

                    {/* Amount */}
                    <div className={`flex-1 font-black font-mono text-xl ${isLast ? "text-primary" : "text-foreground"}`}>
                      {formatMoney(bid.amount)}
                    </div>

                    {/* Jump */}
                    <div className="text-right shrink-0">
                      {!isFirst && (
                        <div className="text-xs font-bold text-green-400 font-mono">+{formatMoney(jump)}</div>
                      )}
                      <div className="text-xs text-muted-foreground font-mono">{formatTime(bid.createdAt, baseTime)}</div>
                      <div className="text-[10px] text-muted-foreground/60">{formatTimestamp(bid.createdAt)}</div>
                    </div>

                    {/* Winner crown */}
                    {isLast && slot.status === "sold" && (
                      <div className="shrink-0">
                        <Gavel className="w-5 h-5 text-primary" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Team breakdown */}
        {uniqueTeams.length > 0 && (
          <Card className="border-border bg-card overflow-hidden">
            <div className="p-5 border-b border-border flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="font-bold uppercase tracking-wider text-foreground">Team Participation</h2>
            </div>
            <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
              {uniqueTeams.map((team) => {
                if (!team) return null;
                const teamBids = (bids ?? []).filter((b) => b.teamId === team.id);
                const topBid = Math.max(...teamBids.map((b) => b.amount));
                const won = slot.soldToTeamId === team.id;
                return (
                  <div
                    key={team.id}
                    className={`p-4 rounded-lg border ${won ? "border-primary/50 bg-primary/5" : "border-border bg-secondary/30"}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: team.primaryColor }} />
                      <span className="font-bold text-sm uppercase text-foreground truncate">{team.shortName}</span>
                      {won && <Gavel className="w-3 h-3 text-primary ml-auto shrink-0" />}
                    </div>
                    <div className="text-lg font-black font-mono text-foreground">{formatMoney(topBid)}</div>
                    <div className="text-xs text-muted-foreground mt-1">{teamBids.length} bid{teamBids.length !== 1 ? "s" : ""}</div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

      </div>
    </Layout>
  );
}
