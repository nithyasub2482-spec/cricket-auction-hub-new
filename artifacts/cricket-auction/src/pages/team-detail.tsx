import { useParams, Link } from "wouter";
import { Layout } from "@/components/layout";
import { useGetTeam, useGetTeamSquad } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Wallet, Users, Star } from "lucide-react";
import { formatMoney } from "@/lib/utils";

export default function TeamDetail() {
  const { id } = useParams();
  const teamId = parseInt(id || "0", 10);

  const { data: team, isLoading: teamLoading } = useGetTeam(teamId);
  const { data: squadData, isLoading: squadLoading } = useGetTeamSquad(teamId);

  if (teamLoading) {
    return (
      <Layout>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!team) {
    return (
      <Layout>
        <div className="text-center py-20 text-destructive font-bold text-2xl uppercase">Team not found</div>
      </Layout>
    );
  }

  const stats = squadData?.stats;
  const players = squadData?.players ?? [];
  const spent = stats?.spent ?? 0;
  const remaining = stats?.remaining ?? team.remainingPurse;
  const pctSpent = team.purse > 0 ? Math.round((spent / team.purse) * 100) : 0;

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/teams">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
              <ArrowLeft className="w-4 h-4" /> Teams
            </Button>
          </Link>
        </div>

        {/* Team Header */}
        <div
          className="rounded-xl p-8 border-2 flex items-center gap-8"
          style={{ borderColor: team.primaryColor + "40", background: `linear-gradient(135deg, ${team.primaryColor}10, transparent)` }}
        >
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center font-black text-3xl uppercase border-4 shrink-0"
            style={{ backgroundColor: team.primaryColor + "22", borderColor: team.primaryColor, color: team.primaryColor }}
          >
            {team.shortName}
          </div>
          <div className="flex-1">
            <h1 className="text-4xl font-black uppercase tracking-tight text-foreground">{team.name}</h1>
            {team.ownerName && <p className="text-lg text-muted-foreground mt-1">{team.ownerName}</p>}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Budget", value: formatMoney(team.purse), icon: <Wallet className="w-4 h-4" /> },
            { label: "Remaining", value: formatMoney(remaining), icon: <Wallet className="w-4 h-4" />, highlight: true },
            { label: "Spent %", value: `${pctSpent}%`, icon: <Star className="w-4 h-4" /> },
            { label: "Squad Size", value: `${players.length} / ${team.maxPlayers}`, icon: <Users className="w-4 h-4" /> },
          ].map((stat) => (
            <Card key={stat.label} className="p-4 border-border bg-card text-center">
              <div className="flex justify-center mb-2 text-muted-foreground">{stat.icon}</div>
              <div className={`text-2xl font-mono font-black ${stat.highlight ? "text-primary" : "text-foreground"}`}>
                {stat.value}
              </div>
              <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider mt-1">{stat.label}</div>
            </Card>
          ))}
        </div>

        {/* Position breakdown */}
        {stats && (
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Batsmen", value: stats.batsmen },
              { label: "Bowlers", value: stats.bowlers },
              { label: "All-rounders", value: stats.allRounders },
              { label: "WK", value: stats.wicketKeepers },
            ].map((s) => (
              <Card key={s.label} className="p-3 border-border bg-card text-center">
                <div className="text-xl font-black font-mono text-primary">{s.value}</div>
                <div className="text-xs text-muted-foreground uppercase font-bold mt-1">{s.label}</div>
              </Card>
            ))}
          </div>
        )}

        {/* Squad */}
        <div>
          <h2 className="text-xl font-bold uppercase tracking-tight text-foreground mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" /> Squad
          </h2>

          {squadLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-pulse">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-20 bg-card rounded border border-border" />
              ))}
            </div>
          ) : players.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-border rounded-xl text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-bold uppercase tracking-wider">No players yet</p>
              <p className="text-sm mt-1">Players will appear after they are sold at auction</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:border-primary/40 transition-colors"
                >
                  <div>
                    <div className="font-bold uppercase text-foreground">{player.name}</div>
                    <div className="text-sm text-muted-foreground font-mono">
                      {player.country} · {player.category?.replace("_", " ")}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-black text-primary text-sm">
                      {player.soldPrice ? formatMoney(player.soldPrice) : "—"}
                    </div>
                    <Badge variant="outline" className="text-xs font-bold uppercase border-border mt-1">
                      {player.category?.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
