import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import {
  useGetTeamSquad, getGetTeamSquadQueryKey,
  useGetTeam, getGetTeamQueryKey,
  useListPlayers, getListPlayersQueryKey,
  usePlaceBid, useGetAuction,
} from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2, Wallet, Users, Star, ShieldOff, ChevronRight,
  Crosshair, TrendingUp, Dumbbell, Wind, Zap, Trophy,
  Radio, Gavel, TrendingDown,
} from "lucide-react";
import { formatMoney } from "@/lib/utils";
import { useMyTeamSocket } from "@/hooks/useMyTeamSocket";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster } from "sonner";

// ── helpers ──────────────────────────────────────────────────────────────────

const CATEGORY_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  batsman:      { label: "Batsmen",       icon: Dumbbell,    color: "#3b82f6" },
  bowler:       { label: "Bowlers",       icon: Wind,        color: "#ef4444" },
  all_rounder:  { label: "All-Rounders",  icon: Zap,         color: "#f59e0b" },
  wicket_keeper:{ label: "Wicket-Keepers",icon: Trophy,       color: "#8b5cf6" },
};

// Heuristic targets based on max squad size
function getTargets(maxPlayers: number) {
  const scale = maxPlayers / 25;
  return {
    batsman:      Math.round(7 * scale),
    bowler:       Math.round(7 * scale),
    all_rounder:  Math.round(5 * scale),
    wicket_keeper:Math.round(2 * scale),
    overseas:     Math.min(8, Math.round(8 * scale)),
  };
}

function PurseBar({ remaining, total }: { remaining: number; total: number }) {
  const pct = total > 0 ? Math.max(0, Math.min(100, (remaining / total) * 100)) : 0;
  const color =
    pct > 60 ? "#22c55e" :
    pct > 30 ? "#f59e0b" : "#ef4444";
  return (
    <div className="w-full bg-secondary rounded-full h-3 mt-3 overflow-hidden">
      <div
        className="h-3 rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

function RoleBar({ label, icon: Icon, color, current, target }: {
  label: string; icon: React.ElementType; color: string;
  current: number; target: number;
}) {
  const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0;
  const short = current < target;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5" style={{ color }} />
          <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-black text-foreground font-mono">{current}</span>
          <span className="text-xs text-muted-foreground font-mono">/ {target}</span>
          {short && (
            <Badge variant="outline" className="text-[10px] font-bold px-1 py-0 ml-1" style={{ borderColor: color, color }}>
              Need {target - current}
            </Badge>
          )}
          {!short && (
            <Badge className="text-[10px] font-bold px-1 py-0 ml-1 bg-green-700 text-white">
              ✓ Full
            </Badge>
          )}
        </div>
      </div>
      <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
        <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export default function MyTeam() {
  const { user } = useAuth();

  const teamId = user?.teamId ?? null;

  // Real-time WebSocket updates
  const { connected, liveActivity } = useMyTeamSocket(teamId);

  const { data: team, isLoading: tLoading } = useGetTeam(teamId ?? 0, {
    query: { enabled: !!teamId, queryKey: getGetTeamQueryKey(teamId ?? 0) },
  });

  const { data: squadData, isLoading: sLoading } = useGetTeamSquad(teamId ?? 0, {
    query: { enabled: !!teamId, queryKey: getGetTeamSquadQueryKey(teamId ?? 0) },
  });

  const { data: availablePlayers, isLoading: pLoading } = useListPlayers(
    { status: "available" },
    {
      query: {
        enabled: !!teamId,
        queryKey: getListPlayersQueryKey({ status: "available" }),
      },
    }
  );

  const { data: auction } = useGetAuction(liveActivity?.auctionId ?? 0, {
    query: { 
      enabled: !!liveActivity?.auctionId,
      queryKey: ["getAuction", liveActivity?.auctionId] 
    },
  });

  const placeBidMutation = usePlaceBid();

  const isLoading = tLoading || sLoading || pLoading;

  // ── No team ───────────────────────────────────────────────────────────────
  if (!teamId) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[70vh] gap-6 text-center">
          <ShieldOff className="w-20 h-20 text-muted-foreground opacity-30" />
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-foreground">No Team Assigned</h2>
            <p className="text-muted-foreground mt-2 max-w-sm">
              Your account is not linked to any franchise yet. Contact an admin to get set up.
            </p>
          </div>
          <Link href="/">
            <Button variant="outline" className="gap-2">
              <ChevronRight className="w-4 h-4 rotate-180" /> Back to Lobby
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <Layout>
        <div className="flex h-[80vh] items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!team) {
    return (
      <Layout>
        <div className="text-center py-20 text-destructive font-bold text-2xl uppercase tracking-wider">
          Team Not Found
        </div>
      </Layout>
    );
  }

  // ── Data ──────────────────────────────────────────────────────────────────
  const stats = squadData?.stats;
  const players = squadData?.players ?? [];

  const remaining = stats?.remaining ?? team.remainingPurse;
  const spent = stats?.spent ?? (team.purse - team.remainingPurse);
  const pctRemaining = team.purse > 0 ? Math.round((remaining / team.purse) * 100) : 0;

  const nextBidAmount = liveActivity 
    ? (liveActivity.bidCount > 0 ? liveActivity.currentBid + (auction?.bidIncrementMin ?? 100000) : liveActivity.basePrice) 
    : 0;

  const currentCounts = {
    batsman:      stats?.batsmen ?? 0,
    bowler:       stats?.bowlers ?? 0,
    all_rounder:  stats?.allRounders ?? 0,
    wicket_keeper:stats?.wicketKeepers ?? 0,
    overseas:     stats?.overseas ?? 0,
  };

  const targets = getTargets(team.maxPlayers);
  const slotsRemaining = team.maxPlayers - players.length;
  const overseasRemaining = (team.maxOverseas ?? 8) - currentCounts.overseas;

  // Squad gaps — categories still short of target, ordered by deficit
  const gaps = (Object.keys(CATEGORY_META) as Array<keyof typeof CATEGORY_META>)
    .map((cat) => ({
      cat,
      deficit: Math.max(0, targets[cat as keyof typeof targets] - currentCounts[cat as keyof typeof currentCounts]),
    }))
    .filter((g) => g.deficit > 0)
    .sort((a, b) => b.deficit - a.deficit);

  // Recommendations: available players filtered to gap categories, sorted by rating desc
  const recommendations = (availablePlayers ?? [])
    .filter((p) => gaps.some((g) => g.cat === p.category))
    .filter((p) => p.basePrice <= remaining)         // only what we can afford
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, 12);

  const categoryColor = (cat: string) => CATEGORY_META[cat]?.color ?? "#6b7280";
  const categoryLabel = (cat: string) => CATEGORY_META[cat]?.label.replace(/s$/, "") ?? cat;

  return (
    <Layout>
      {/* Toast portal */}
      <Toaster position="top-right" richColors />

      <div className="max-w-6xl mx-auto space-y-6">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-5 h-5 rounded-full border border-border"
                style={{ backgroundColor: team.primaryColor }}
              />
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">My Franchise</span>
              {/* Live connection dot */}
              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${connected ? "border-green-700/50 bg-green-900/20 text-green-400" : "border-border bg-secondary text-muted-foreground"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-green-400 animate-pulse" : "bg-muted-foreground"}`} />
                {connected ? "Live" : "Connecting…"}
              </div>
            </div>
            <h1 className="text-4xl font-black uppercase tracking-tight text-foreground">{team.name}</h1>
            <p className="text-muted-foreground mt-1 font-mono text-sm">{team.shortName} · Owner: {team.ownerName ?? user?.name}</p>
          </div>
          <Link href={`/teams/${team.id}`}>
            <Button variant="outline" size="sm" className="gap-2 text-muted-foreground">
              Full Squad <ChevronRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>

        {/* ── Live Activity Banner ─────────────────────────────────────── */}
        <AnimatePresence>
          {liveActivity && (
            <motion.div
              key="live-activity"
              initial={{ opacity: 0, y: -16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.97 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <Card className={`border-2 overflow-hidden ${liveActivity.isMyTeamLeading ? "border-green-600/60 bg-green-900/10" : "border-amber-600/40 bg-amber-900/10"}`}>
                <div className="flex items-center gap-4 p-5">
                  {/* Pulsing live indicator */}
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-900/30 border border-red-700/40 shrink-0">
                    <Radio className="w-5 h-5 text-red-400 animate-pulse" />
                  </div>

                  {/* Player info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-red-400">Auction Live</span>
                      <Badge variant="outline" className="text-[10px] uppercase font-mono border-border">
                        {liveActivity.playerCategory.replace("_", " ")}
                      </Badge>
                    </div>
                    <div className="text-xl font-black uppercase tracking-tight text-foreground truncate">
                      {liveActivity.playerName}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-0.5">
                      <span className="font-mono">Base: {formatMoney(liveActivity.basePrice)}</span>
                      <span className="font-mono">{liveActivity.bidCount} bid{liveActivity.bidCount !== 1 ? "s" : ""}</span>
                    </div>
                  </div>

                  {/* Current bid */}
                  <div className="text-right shrink-0">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Current Bid</div>
                    <motion.div
                      key={liveActivity.currentBid}
                      initial={{ scale: 1.15, color: "#f59e0b" }}
                      animate={{ scale: 1, color: "#ffffff" }}
                      transition={{ duration: 0.4 }}
                      className="text-3xl font-black font-mono"
                    >
                      {formatMoney(liveActivity.currentBid)}
                    </motion.div>
                    {liveActivity.leadingTeamName && (
                      <div className="flex items-center gap-1.5 justify-end mt-1">
                        {liveActivity.leadingTeamColor && (
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: liveActivity.leadingTeamColor }} />
                        )}
                        <span className="text-xs font-bold text-muted-foreground">{liveActivity.leadingTeamName}</span>
                      </div>
                    )}
                  </div>

                  {/* Status badge */}
                  <div className="shrink-0 ml-2">
                    {liveActivity.isMyTeamLeading ? (
                      <div className="flex flex-col items-center gap-1 px-4 py-3 rounded-xl bg-green-900/40 border border-green-600/50">
                        <Gavel className="w-5 h-5 text-green-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-green-400 whitespace-nowrap">
                          You're Leading!
                        </span>
                      </div>
                    ) : liveActivity.bidCount > 0 ? (
                      <div className="flex flex-col items-center gap-1 px-4 py-3 rounded-xl bg-amber-900/30 border border-amber-600/40">
                        <TrendingDown className="w-5 h-5 text-amber-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 whitespace-nowrap">
                          Outbid
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1 px-4 py-3 rounded-xl bg-secondary border border-border">
                        <Gavel className="w-5 h-5 text-muted-foreground" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                          Bidding Open
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                {auction?.biddingMode === "team" && (
                  <div className="bg-black/20 border-t border-border p-4 flex justify-between items-center">
                    <div className="text-sm font-bold text-muted-foreground">
                      Next Bid: <span className="text-foreground">{formatMoney(nextBidAmount)}</span>
                    </div>
                    <Button
                      className="gap-2 uppercase font-black tracking-widest shadow-lg"
                      disabled={liveActivity.isMyTeamLeading || nextBidAmount > remaining || placeBidMutation.isPending}
                      onClick={() => {
                        placeBidMutation.mutate({
                          id: liveActivity.auctionId,
                          data: {
                            slotId: liveActivity.slotId,
                            teamId: team.id,
                            amount: nextBidAmount,
                          }
                        });
                      }}
                    >
                      Place Bid <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Top metrics row ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Players Signed", value: players.length, sub: `of ${team.maxPlayers} max`, icon: Users, color: "#3b82f6" },
            { label: "Slots Remaining", value: slotsRemaining, sub: "open roster spots", icon: Crosshair, color: slotsRemaining > 5 ? "#22c55e" : "#f59e0b" },
            { label: "Overseas Signed", value: currentCounts.overseas, sub: `of ${team.maxOverseas ?? 8} max`, icon: Star, color: "#8b5cf6" },
            { label: "Avg Spend / Player", value: players.length > 0 ? formatMoney(spent / players.length) : "—", sub: "per acquisition", icon: TrendingUp, color: "#f59e0b" },
          ].map(({ label, value, sub, icon: Icon, color }) => (
            <Card key={label} className="p-5 border-border bg-card">
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
                <Icon className="w-4 h-4 shrink-0" style={{ color }} />
              </div>
              <div className="text-3xl font-black font-mono text-foreground">{value}</div>
              <div className="text-xs text-muted-foreground mt-1">{sub}</div>
            </Card>
          ))}
        </div>

        {/* ── Purse + Composition row ──────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Purse card */}
          <Card className="p-6 border-border bg-card">
            <div className="flex items-center gap-2 mb-4">
              <Wallet className="w-5 h-5 text-primary" />
              <h2 className="font-bold uppercase tracking-wider text-foreground">Purse Overview</h2>
            </div>
            <div className="flex items-baseline gap-3 mb-1">
              <span className="text-4xl font-black font-mono text-primary">{formatMoney(remaining)}</span>
              <span className="text-muted-foreground text-sm font-mono">remaining</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
              <span className="font-mono">Total: {formatMoney(team.purse)}</span>
              <span className="font-mono">Spent: {formatMoney(spent)}</span>
              <span className="font-mono font-bold text-foreground">{pctRemaining}% left</span>
            </div>
            <PurseBar remaining={remaining} total={team.purse} />

            {/* Remaining per slot */}
            {slotsRemaining > 0 && (
              <div className="mt-4 p-3 rounded-lg bg-secondary/50 border border-border">
                <div className="text-xs text-muted-foreground uppercase font-bold tracking-wide">Budget per remaining slot</div>
                <div className="text-xl font-black font-mono text-foreground mt-0.5">
                  {formatMoney(remaining / slotsRemaining)}
                </div>
              </div>
            )}
          </Card>

          {/* Squad composition card */}
          <Card className="p-6 border-border bg-card">
            <div className="flex items-center gap-2 mb-5">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="font-bold uppercase tracking-wider text-foreground">Squad Composition</h2>
            </div>
            <div className="space-y-4">
              {(Object.entries(CATEGORY_META) as Array<[string, typeof CATEGORY_META[string]]>).map(([cat, meta]) => (
                <RoleBar
                  key={cat}
                  label={meta.label}
                  icon={meta.icon}
                  color={meta.color}
                  current={currentCounts[cat as keyof typeof currentCounts] ?? 0}
                  target={targets[cat as keyof typeof targets] ?? 0}
                />
              ))}
              <div className="pt-2 border-t border-border">
                <RoleBar
                  label="Overseas"
                  icon={Star}
                  color="#8b5cf6"
                  current={currentCounts.overseas}
                  target={team.maxOverseas ?? 8}
                />
              </div>
            </div>
          </Card>
        </div>

        {/* ── Acquired Players ──────────────────────────────────────────── */}
        <Card className="border-border bg-card overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              <h2 className="font-bold uppercase tracking-wider text-foreground">Acquired Players</h2>
            </div>
            <Badge variant="secondary" className="font-mono">{players.length} players</Badge>
          </div>

          {players.length === 0 ? (
            <div className="p-16 text-center">
              <Users className="w-10 h-10 text-muted-foreground opacity-30 mx-auto mb-3" />
              <p className="text-muted-foreground font-bold uppercase tracking-wider text-sm">No Players Yet</p>
              <p className="text-muted-foreground/60 text-xs mt-1">Head into an auction to start building your squad</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {[...players]
                .sort((a, b) => b.soldPrice - a.soldPrice)
                .map((p) => (
                <div key={p.id} className="flex items-center gap-4 px-5 py-3 hover:bg-secondary/20 transition-colors">
                  {/* Category dot */}
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: categoryColor(p.category) }}
                  />

                  {/* Name + category */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground truncate">{p.name}</span>
                      {p.country !== "India" && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0 shrink-0 border-purple-500/40 text-purple-400">
                          Overseas
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      <span style={{ color: categoryColor(p.category) }} className="font-bold uppercase">
                        {categoryLabel(p.category)}
                      </span>
                      <span>{p.country}</span>
                      {p.battingStyle && <span className="truncate">{p.battingStyle}</span>}
                    </div>
                  </div>

                  {/* Rating */}
                  {p.rating != null && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span className="text-xs font-bold text-foreground">{p.rating.toFixed(1)}</span>
                    </div>
                  )}

                  {/* Price */}
                  <div className="text-right shrink-0">
                    <div className="font-black font-mono text-primary">{formatMoney(p.soldPrice)}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">acquired</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* ── Recommended Targets ───────────────────────────────────────── */}
        <Card className="border-border bg-card overflow-hidden">
          <div className="p-5 border-b border-border">
            <div className="flex items-center gap-2 mb-1">
              <Crosshair className="w-5 h-5 text-primary" />
              <h2 className="font-bold uppercase tracking-wider text-foreground">Recommended Targets</h2>
              <Badge variant="secondary" className="font-mono ml-auto">{recommendations.length} available</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Available players in your weakest positions · sorted by rating · within your remaining purse
            </p>

            {/* Gap summary chips */}
            {gaps.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {gaps.map((g) => {
                  const meta = CATEGORY_META[g.cat];
                  if (!meta) return null;
                  return (
                    <div key={g.cat} className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-secondary border border-border text-xs">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.color }} />
                      <span className="font-bold">{meta.label}</span>
                      <span className="text-muted-foreground">needs {g.deficit}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {recommendations.length === 0 ? (
            <div className="p-12 text-center">
              <Crosshair className="w-10 h-10 text-muted-foreground opacity-30 mx-auto mb-3" />
              <p className="text-muted-foreground font-bold uppercase tracking-wider text-sm">
                {gaps.length === 0 ? "Squad Targets Met!" : "No Affordable Players Found"}
              </p>
              <p className="text-muted-foreground/60 text-xs mt-1">
                {gaps.length === 0
                  ? "Your squad composition looks solid across all categories."
                  : `Remaining purse (${formatMoney(remaining)}) is below the base price of available players in needed positions.`}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recommendations.map((p, i) => {
                const gapPriority = gaps.findIndex((g) => g.cat === p.category);
                const isTopPick = i < 3;
                return (
                  <div
                    key={p.id}
                    className={`flex items-center gap-4 px-5 py-3 hover:bg-secondary/20 transition-colors ${isTopPick ? "border-l-2" : ""}`}
                    style={isTopPick ? { borderLeftColor: categoryColor(p.category) } : {}}
                  >
                    {/* Rank */}
                    <div className="w-7 text-center shrink-0">
                      {isTopPick ? (
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-black" style={{ backgroundColor: categoryColor(p.category) }}>
                          {i + 1}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground font-mono">#{i + 1}</span>
                      )}
                    </div>

                    {/* Category indicator */}
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: categoryColor(p.category) }}
                    />

                    {/* Name + meta */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground truncate">{p.name}</span>
                        {p.country !== "India" && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0 shrink-0 border-purple-500/40 text-purple-400">
                            Overseas
                          </Badge>
                        )}
                        {gapPriority === 0 && (
                          <Badge className="text-[10px] px-1.5 py-0 shrink-0 bg-amber-700 text-white font-bold">
                            Top Need
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span style={{ color: categoryColor(p.category) }} className="font-bold uppercase">
                          {categoryLabel(p.category)}
                        </span>
                        <span>{p.country}</span>
                        {p.battingStyle && <span className="truncate">{p.battingStyle}</span>}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="hidden md:flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                      {p.runs != null && p.runs > 0 && (
                        <div className="text-center">
                          <div className="font-black text-foreground">{p.runs.toLocaleString()}</div>
                          <div>Runs</div>
                        </div>
                      )}
                      {p.wickets != null && p.wickets > 0 && (
                        <div className="text-center">
                          <div className="font-black text-foreground">{p.wickets}</div>
                          <div>Wkts</div>
                        </div>
                      )}
                    </div>

                    {/* Rating */}
                    {p.rating != null && (
                      <div className="flex items-center gap-1 shrink-0">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span className="text-sm font-black text-foreground">{p.rating.toFixed(1)}</span>
                      </div>
                    )}

                    {/* Base price */}
                    <div className="text-right shrink-0">
                      <div className="font-black font-mono text-foreground">{formatMoney(p.basePrice)}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">base price</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

      </div>
    </Layout>
  );
}
