import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { useListTeams } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Wallet, ChevronRight } from "lucide-react";
import { formatMoney } from "@/lib/utils";

function PurseBar({ remaining, total }: { remaining: number; total: number }) {
  const pct = total > 0 ? Math.max(0, Math.min(100, (remaining / total) * 100)) : 0;
  const color = pct > 60 ? "bg-green-500" : pct > 30 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="w-full bg-secondary rounded-full h-2 mt-2">
      <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function Teams() {
  const { data: teams, isLoading } = useListTeams();

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-tight text-foreground">Teams Dashboard</h1>
          <p className="text-muted-foreground mt-1">{teams?.length ?? 0} franchises competing</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-48 bg-card rounded border border-border" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {teams?.map((team) => (
              <Card
                key={team.id}
                className="p-6 border-border bg-card hover:border-primary/50 transition-colors"
                style={{ borderLeftColor: team.primaryColor, borderLeftWidth: 4 }}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center font-black text-xl uppercase border-2"
                      style={{
                        backgroundColor: team.primaryColor + "22",
                        borderColor: team.primaryColor,
                        color: team.primaryColor,
                      }}
                    >
                      {team.shortName}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-lg uppercase tracking-tight text-foreground">{team.name}</h3>
                      {team.ownerName && (
                        <p className="text-sm text-muted-foreground mt-0.5">{team.ownerName}</p>
                      )}
                    </div>
                  </div>
                  <Link href={`/teams/${team.id}`}>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-secondary/40 rounded p-3">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs font-bold uppercase tracking-wider mb-1">
                      <Wallet className="w-3 h-3" /> Remaining Purse
                    </div>
                    <div className="font-mono font-black text-xl text-foreground">
                      {formatMoney(team.remainingPurse)}
                    </div>
                    <PurseBar remaining={team.remainingPurse} total={team.purse} />
                  </div>
                  <div className="bg-secondary/40 rounded p-3">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs font-bold uppercase tracking-wider mb-1">
                      <Users className="w-3 h-3" /> Max Squad
                    </div>
                    <div className="font-mono font-black text-xl text-foreground">
                      {team.maxPlayers}
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">slots available</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border/50">
                  <div className="text-xs text-muted-foreground font-mono">
                    Total budget: {formatMoney(team.purse)}
                  </div>
                  <Badge variant="outline" className="text-xs font-bold uppercase border-border">
                    Max {team.maxOverseas} overseas
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
