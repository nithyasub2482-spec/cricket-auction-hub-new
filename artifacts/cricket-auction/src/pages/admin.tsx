import { useState } from "react";
import { Layout } from "@/components/layout";
import {
  useListAuctions,
  useCreateAuction,
  useListPlayers,
  useCreatePlayer,
  useListTeams,
  useCreateTeam,
  useListUsers,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { Plus, Trophy, Users, ShieldCheck, Gavel } from "lucide-react";
import { formatMoney } from "@/lib/utils";
import { clsx } from "clsx";
import { useToast } from "@/hooks/use-toast";

type Tab = "auctions" | "players" | "teams" | "users";

export default function Admin() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("auctions");
  const { toast } = useToast();

  const { data: auctions } = useListAuctions();
  const createAuction = useCreateAuction();
  const [auctionForm, setAuctionForm] = useState({ name: "", leagueName: "", timerSeconds: 30, bidIncrementMin: 100000 });

  const { data: players } = useListPlayers({});
  const createPlayer = useCreatePlayer();
  const [playerForm, setPlayerForm] = useState({
    name: "", country: "India", category: "batsman",
    basePrice: 100000, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm medium"
  });

  const { data: teams } = useListTeams();
  const createTeam = useCreateTeam();
  const [teamForm, setTeamForm] = useState({ name: "", shortName: "", purse: 9000000, primaryColor: "#0047AB" });

  const { data: users } = useListUsers();

  if (user?.role !== "admin") {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <ShieldCheck className="w-20 h-20 text-muted-foreground opacity-30" />
          <h2 className="text-2xl font-black uppercase text-muted-foreground">Access Denied</h2>
          <p className="text-muted-foreground">Only administrators can view this page.</p>
        </div>
      </Layout>
    );
  }

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "auctions", label: "Auctions", icon: <Gavel className="w-4 h-4" /> },
    { id: "players", label: "Players", icon: <Trophy className="w-4 h-4" /> },
    { id: "teams", label: "Teams", icon: <ShieldCheck className="w-4 h-4" /> },
    { id: "users", label: "Users", icon: <Users className="w-4 h-4" /> },
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-tight text-foreground">Admin Console</h1>
          <p className="text-muted-foreground mt-1">Manage platform entities and configurations</p>
        </div>

        <div className="flex gap-2 border-b border-border">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={clsx(
                "flex items-center gap-2 px-5 py-3 font-bold text-sm uppercase tracking-wider border-b-2 -mb-px transition-colors",
                tab === t.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Auctions Tab */}
        {tab === "auctions" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="p-6 border-border bg-card lg:col-span-1">
              <h3 className="font-bold uppercase tracking-wide mb-5 flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary" /> Create Auction
              </h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createAuction.mutate(
                    { data: { name: auctionForm.name, leagueName: auctionForm.leagueName, timerSeconds: auctionForm.timerSeconds, bidIncrementMin: auctionForm.bidIncrementMin } },
                    { onSuccess: () => { toast({ title: "Auction created" }); setAuctionForm({ name: "", leagueName: "", timerSeconds: 30, bidIncrementMin: 100000 }); } }
                  );
                }}
                className="space-y-4"
              >
                <div>
                  <Label className="text-xs uppercase font-bold tracking-wider">Auction Name</Label>
                  <Input className="mt-1 bg-background" value={auctionForm.name} onChange={(e) => setAuctionForm((p) => ({ ...p, name: e.target.value }))} required />
                </div>
                <div>
                  <Label className="text-xs uppercase font-bold tracking-wider">League Name</Label>
                  <Input className="mt-1 bg-background" value={auctionForm.leagueName} onChange={(e) => setAuctionForm((p) => ({ ...p, leagueName: e.target.value }))} required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs uppercase font-bold tracking-wider">Timer (s)</Label>
                    <Input className="mt-1 bg-background" type="number" min={10} value={auctionForm.timerSeconds} onChange={(e) => setAuctionForm((p) => ({ ...p, timerSeconds: parseInt(e.target.value) }))} />
                  </div>
                  <div>
                    <Label className="text-xs uppercase font-bold tracking-wider">Min Bid (₹)</Label>
                    <Input className="mt-1 bg-background" type="number" min={10000} value={auctionForm.bidIncrementMin} onChange={(e) => setAuctionForm((p) => ({ ...p, bidIncrementMin: parseInt(e.target.value) }))} />
                  </div>
                </div>
                <Button type="submit" className="w-full font-bold uppercase" disabled={createAuction.isPending}>
                  Create Auction
                </Button>
              </form>
            </Card>
            <div className="lg:col-span-2 space-y-3">
              {auctions?.map((a) => (
                <div key={a.id} className="p-4 bg-card border border-border rounded-lg flex items-center justify-between">
                  <div>
                    <div className="font-bold text-foreground uppercase">{a.name}</div>
                    <div className="text-sm text-muted-foreground">{a.leagueName}</div>
                  </div>
                  <Badge variant={a.status === "active" ? "default" : "secondary"} className="uppercase font-bold">{a.status}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Players Tab */}
        {tab === "players" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="p-6 border-border bg-card">
              <h3 className="font-bold uppercase tracking-wide mb-5 flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary" /> Add Player
              </h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createPlayer.mutate(
                    { data: {
                      name: playerForm.name,
                      country: playerForm.country,
                      category: playerForm.category as "batsman" | "bowler" | "all_rounder" | "wicket_keeper",
                      basePrice: playerForm.basePrice,
                      battingStyle: playerForm.battingStyle,
                      bowlingStyle: playerForm.bowlingStyle,
                    } },
                    { onSuccess: () => { toast({ title: "Player added" }); setPlayerForm({ name: "", country: "India", category: "batsman", basePrice: 100000, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm medium" }); } }
                  );
                }}
                className="space-y-4"
              >
                <div>
                  <Label className="text-xs uppercase font-bold tracking-wider">Player Name</Label>
                  <Input className="mt-1 bg-background" value={playerForm.name} onChange={(e) => setPlayerForm((p) => ({ ...p, name: e.target.value }))} required />
                </div>
                <div>
                  <Label className="text-xs uppercase font-bold tracking-wider">Country</Label>
                  <Input className="mt-1 bg-background" value={playerForm.country} onChange={(e) => setPlayerForm((p) => ({ ...p, country: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs uppercase font-bold tracking-wider">Category</Label>
                  <select
                    className="w-full mt-1 px-3 py-2 rounded border border-border bg-background text-foreground text-sm"
                    value={playerForm.category}
                    onChange={(e) => setPlayerForm((p) => ({ ...p, category: e.target.value }))}
                  >
                    <option value="batsman">Batsman</option>
                    <option value="bowler">Bowler</option>
                    <option value="all_rounder">All Rounder</option>
                    <option value="wicket_keeper">Wicket Keeper</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs uppercase font-bold tracking-wider">Batting Style</Label>
                  <Input className="mt-1 bg-background" value={playerForm.battingStyle} onChange={(e) => setPlayerForm((p) => ({ ...p, battingStyle: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs uppercase font-bold tracking-wider">Bowling Style</Label>
                  <Input className="mt-1 bg-background" value={playerForm.bowlingStyle} onChange={(e) => setPlayerForm((p) => ({ ...p, bowlingStyle: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs uppercase font-bold tracking-wider">Base Price (₹)</Label>
                  <Input className="mt-1 bg-background" type="number" value={playerForm.basePrice} onChange={(e) => setPlayerForm((p) => ({ ...p, basePrice: parseInt(e.target.value) }))} />
                </div>
                <Button type="submit" className="w-full font-bold uppercase" disabled={createPlayer.isPending}>Add Player</Button>
              </form>
            </Card>
            <div className="lg:col-span-2 space-y-2 max-h-[600px] overflow-auto">
              {players?.map((p) => (
                <div key={p.id} className="p-3 bg-card border border-border rounded-lg flex items-center justify-between">
                  <div>
                    <div className="font-bold text-sm uppercase text-foreground">{p.name}</div>
                    <div className="text-xs text-muted-foreground font-mono">{p.country} · {p.category}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-primary text-sm">{formatMoney(p.basePrice)}</div>
                    <Badge variant="outline" className="text-xs uppercase border-border">{p.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Teams Tab */}
        {tab === "teams" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="p-6 border-border bg-card">
              <h3 className="font-bold uppercase tracking-wide mb-5 flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary" /> Add Team
              </h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createTeam.mutate(
                    { data: { name: teamForm.name, shortName: teamForm.shortName, purse: teamForm.purse, primaryColor: teamForm.primaryColor, maxPlayers: 25, maxOverseas: 8 } },
                    { onSuccess: () => { toast({ title: "Team created" }); setTeamForm({ name: "", shortName: "", purse: 9000000, primaryColor: "#0047AB" }); } }
                  );
                }}
                className="space-y-4"
              >
                <div>
                  <Label className="text-xs uppercase font-bold tracking-wider">Team Name</Label>
                  <Input className="mt-1 bg-background" value={teamForm.name} onChange={(e) => setTeamForm((p) => ({ ...p, name: e.target.value }))} required />
                </div>
                <div>
                  <Label className="text-xs uppercase font-bold tracking-wider">Short Name (max 4)</Label>
                  <Input className="mt-1 bg-background" maxLength={4} value={teamForm.shortName} onChange={(e) => setTeamForm((p) => ({ ...p, shortName: e.target.value.toUpperCase() }))} required />
                </div>
                <div>
                  <Label className="text-xs uppercase font-bold tracking-wider">Primary Color</Label>
                  <div className="flex gap-2 mt-1">
                    <Input type="color" className="w-12 h-9 p-1 bg-background" value={teamForm.primaryColor} onChange={(e) => setTeamForm((p) => ({ ...p, primaryColor: e.target.value }))} />
                    <Input className="flex-1 bg-background font-mono" value={teamForm.primaryColor} onChange={(e) => setTeamForm((p) => ({ ...p, primaryColor: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <Label className="text-xs uppercase font-bold tracking-wider">Purse (₹)</Label>
                  <Input className="mt-1 bg-background" type="number" value={teamForm.purse} onChange={(e) => setTeamForm((p) => ({ ...p, purse: parseInt(e.target.value) }))} />
                </div>
                <Button type="submit" className="w-full font-bold uppercase" disabled={createTeam.isPending}>Create Team</Button>
              </form>
            </Card>
            <div className="lg:col-span-2 space-y-2">
              {teams?.map((t) => (
                <div key={t.id} className="p-3 bg-card border border-border rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black" style={{ backgroundColor: t.primaryColor + "33", color: t.primaryColor }}>
                      {t.shortName}
                    </div>
                    <div>
                      <div className="font-bold text-sm uppercase text-foreground">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.ownerName}</div>
                    </div>
                  </div>
                  <div className="font-mono font-bold text-primary text-sm">{formatMoney(t.remainingPurse)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {tab === "users" && (
          <div className="space-y-3">
            {users?.map((u) => (
              <div key={u.id} className="p-4 bg-card border border-border rounded-lg flex items-center justify-between">
                <div>
                  <div className="font-bold text-foreground">{u.name}</div>
                  <div className="text-sm text-muted-foreground font-mono">{u.email}</div>
                </div>
                <Badge
                  variant="outline"
                  className={clsx(
                    "uppercase font-bold text-xs",
                    u.role === "admin" ? "border-destructive/40 text-destructive" :
                    u.role === "auctioneer" ? "border-primary/40 text-primary" :
                    u.role === "team_owner" ? "border-green-500/40 text-green-400" :
                    "border-border text-muted-foreground"
                  )}
                >
                  {u.role}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
