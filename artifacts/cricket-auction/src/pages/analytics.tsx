import { Layout } from "@/components/layout";
import {
  useGetLeagueSummary,
  useGetTeamStats,
  useGetBidActivity,
  useGetPlayerPool,
} from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { formatMoney } from "@/lib/utils";
import { BarChart2, TrendingUp, Users, Wallet, Zap } from "lucide-react";

function StatCard({ label, value, icon, sub }: { label: string; value: string | number; icon: React.ReactNode; sub?: string }) {
  return (
    <Card className="p-5 border-border bg-card flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className="text-muted-foreground">{icon}</span>
      </div>
      <div className="text-3xl font-black font-mono text-foreground">{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </Card>
  );
}

export default function Analytics() {
  const { data: summary, isLoading: summaryLoading } = useGetLeagueSummary();
  const { data: teamStats, isLoading: teamStatsLoading } = useGetTeamStats();
  const { data: bidActivity, isLoading: bidActivityLoading } = useGetBidActivity();
  const { data: playerPool, isLoading: poolLoading } = useGetPlayerPool();

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-tight text-foreground">League Analytics</h1>
          <p className="text-muted-foreground mt-1">Real-time auction metrics and team intelligence</p>
        </div>

        {summaryLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 bg-card rounded border border-border" />)}
          </div>
        ) : summary ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Players" value={summary.totalPlayers ?? 0} icon={<Users className="w-4 h-4" />} />
            <StatCard label="Players Sold" value={summary.soldPlayers ?? 0} icon={<Zap className="w-4 h-4" />} />
            <StatCard label="Total Spent" value={formatMoney(summary.totalSpent ?? 0)} icon={<Wallet className="w-4 h-4" />} />
            <StatCard label="Total Bids" value={summary.totalBids ?? 0} icon={<BarChart2 className="w-4 h-4" />} />
          </div>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Team Spend Leaderboard */}
          <div>
            <h2 className="text-lg font-bold uppercase tracking-tight text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" /> Team Spend Leaderboard
            </h2>
            {teamStatsLoading ? (
              <div className="space-y-3 animate-pulse">
                {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-card rounded border border-border" />)}
              </div>
            ) : teamStats && teamStats.length > 0 ? (
              <div className="space-y-3">
                {[...teamStats]
                  .sort((a, b) => (b.spent ?? 0) - (a.spent ?? 0))
                  .map((ts, idx) => {
                    const maxSpent = Math.max(...teamStats.map((t) => t.spent ?? 0), 1);
                    const pct = ((ts.spent ?? 0) / maxSpent) * 100;
                    return (
                      <div key={ts.team.id} className="p-4 bg-card border border-border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="text-muted-foreground font-mono text-sm w-5">#{idx + 1}</span>
                            <div
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: ts.team.primaryColor }}
                            />
                            <span className="font-bold uppercase text-foreground">{ts.team.name}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-mono font-black text-primary">{formatMoney(ts.spent ?? 0)}</div>
                            <div className="text-xs text-muted-foreground">{ts.playerCount ?? 0} players</div>
                          </div>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-1.5">
                          <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground border-2 border-dashed border-border rounded-lg">
                <BarChart2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="font-bold uppercase">No data yet</p>
              </div>
            )}
          </div>

          {/* Player Pool Breakdown */}
          <div>
            <h2 className="text-lg font-bold uppercase tracking-tight text-foreground mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Player Pool Breakdown
            </h2>
            {poolLoading ? (
              <div className="space-y-3 animate-pulse">
                {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 bg-card rounded border border-border" />)}
              </div>
            ) : playerPool ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3 mb-2">
                  {[
                    { label: "Total", value: playerPool.total },
                    { label: "Available", value: playerPool.available, cls: "text-green-400" },
                    { label: "Sold", value: playerPool.sold, cls: "text-amber-400" },
                  ].map((s) => (
                    <Card key={s.label} className="p-3 border-border bg-card text-center">
                      <div className={`text-2xl font-mono font-black ${s.cls ?? "text-foreground"}`}>{s.value}</div>
                      <div className="text-xs text-muted-foreground uppercase font-bold mt-1">{s.label}</div>
                    </Card>
                  ))}
                </div>
                {playerPool.byCategory.map((cat) => {
                  const total = (cat.available ?? 0) + (cat.sold ?? 0);
                  const soldPct = total > 0 ? Math.round(((cat.sold ?? 0) / total) * 100) : 0;
                  return (
                    <div key={cat.category} className="p-4 bg-card border border-border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold uppercase text-foreground">{cat.category?.replace("_", " ")}</span>
                        <div className="flex gap-3 text-xs font-mono">
                          <span className="text-green-400">{cat.available ?? 0} avail</span>
                          <span className="text-amber-400">{cat.sold ?? 0} sold</span>
                        </div>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-1.5 flex overflow-hidden">
                        <div className="bg-amber-500 h-1.5 transition-all" style={{ width: `${soldPct}%` }} />
                        <div className="bg-secondary h-1.5 flex-1" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground border-2 border-dashed border-border rounded-lg">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="font-bold uppercase">No data yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Bid Activity Feed */}
        <div>
          <h2 className="text-lg font-bold uppercase tracking-tight text-foreground mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" /> Recent Bid Activity
          </h2>
          {bidActivityLoading ? (
            <div className="space-y-2 animate-pulse">
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 bg-card rounded border border-border" />)}
            </div>
          ) : bidActivity && bidActivity.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground uppercase text-xs font-bold tracking-wider">
                    <th className="text-left py-3 px-4">Player</th>
                    <th className="text-left py-3 px-4">Team</th>
                    <th className="text-right py-3 px-4">Amount</th>
                    <th className="text-right py-3 px-4">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {bidActivity.map((bid) => (
                    <tr key={bid.id} className="border-b border-border/40 hover:bg-secondary/30 transition-colors">
                      <td className="py-3 px-4 font-medium text-foreground">{bid.playerName ?? "—"}</td>
                      <td className="py-3 px-4 text-muted-foreground">{bid.teamName ?? "—"}</td>
                      <td className="py-3 px-4 font-mono font-bold text-primary text-right">{formatMoney(bid.amount)}</td>
                      <td className="py-3 px-4 text-muted-foreground text-right font-mono text-xs">
                        {bid.createdAt ? new Date(bid.createdAt).toLocaleTimeString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground border-2 border-dashed border-border rounded-lg">
              <Zap className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="font-bold uppercase">No bids recorded yet</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
