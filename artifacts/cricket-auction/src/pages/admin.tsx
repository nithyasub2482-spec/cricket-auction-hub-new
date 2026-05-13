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
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { Plus, Trophy, Users, ShieldCheck, Gavel, LayoutGrid, UserPlus, Shield, ChevronRight } from "lucide-react";
import { formatMoney } from "@/lib/utils";
import { clsx } from "clsx";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

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
  const [teamForm, setTeamForm] = useState({ name: "", shortName: "", purse: 900000000, primaryColor: "#0047AB" });

  const { data: users } = useListUsers();

  if (user?.role !== "admin") {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[70vh] gap-6 text-center">
          <div className="w-24 h-24 bg-destructive/10 rounded-full flex items-center justify-center">
             <Shield className="w-12 h-12 text-destructive opacity-40" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-display font-black uppercase tracking-tight text-white">Access Denied</h2>
            <p className="text-muted-foreground max-w-sm">This terminal is restricted to authorized administrators only. Security clearance not detected.</p>
          </div>
          <Button variant="outline" className="mt-4 border-white/10" onClick={() => window.history.back()}>Return to Safety</Button>
        </div>
      </Layout>
    );
  }

  const TABS: { id: Tab; label: string; icon: any }[] = [
    { id: "auctions", label: "Auctions", icon: Gavel },
    { id: "players", label: "Registry", icon: Trophy },
    { id: "teams", label: "Franchises", icon: ShieldCheck },
    { id: "users", label: "Personnel", icon: Users },
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
           <div className="space-y-1">
              <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.2em] text-[10px]">
                 <ShieldCheck className="w-3 h-3 fill-current" /> Admin Console
              </div>
              <h1 className="text-4xl font-display font-black uppercase tracking-tight text-white">Management Deck</h1>
              <p className="text-muted-foreground font-bold tracking-widest text-xs uppercase">Platform Infrastructure & Data Control</p>
           </div>
           
           <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar max-w-full">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={clsx(
                    "flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 whitespace-nowrap",
                    tab === t.id
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  )}
                >
                  <t.icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              ))}
           </div>
        </div>

        <AnimatePresence mode="wait">
           <motion.div
              key={tab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
           >
              {/* Auctions Tab */}
              {tab === "auctions" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-4">
                    <div className="glass-panel rounded-[2rem] p-8 space-y-6">
                      <div className="flex items-center gap-2 mb-2">
                         <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Plus className="w-5 h-5 text-primary" />
                         </div>
                         <h3 className="font-display font-black uppercase tracking-tight text-sm">Create Auction</h3>
                      </div>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          createAuction.mutate(
                            { data: { name: auctionForm.name, leagueName: auctionForm.leagueName, timerSeconds: auctionForm.timerSeconds, bidIncrementMin: auctionForm.bidIncrementMin } },
                            { onSuccess: () => { toast({ title: "Auction created" }); setAuctionForm({ name: "", leagueName: "", timerSeconds: 30, bidIncrementMin: 100000 }); } }
                          );
                        }}
                        className="space-y-5"
                      >
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground">Auction Title</Label>
                          <Input className="h-12 bg-white/5 border-white/5 rounded-xl font-bold" value={auctionForm.name} onChange={(e) => setAuctionForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. IPL 2024 Mega Auction" required />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground">League/Division</Label>
                          <Input className="h-12 bg-white/5 border-white/5 rounded-xl font-bold" value={auctionForm.leagueName} onChange={(e) => setAuctionForm((p) => ({ ...p, leagueName: e.target.value }))} placeholder="e.g. Indian Premier League" required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground">Timer (s)</Label>
                            <Input className="h-12 bg-white/5 border-white/5 rounded-xl font-bold" type="number" min={10} value={auctionForm.timerSeconds} onChange={(e) => setAuctionForm((p) => ({ ...p, timerSeconds: parseInt(e.target.value) }))} />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground">Min Bid (₹)</Label>
                            <Input className="h-12 bg-white/5 border-white/5 rounded-xl font-bold" type="number" min={10000} value={auctionForm.bidIncrementMin} onChange={(e) => setAuctionForm((p) => ({ ...p, bidIncrementMin: parseInt(e.target.value) }))} />
                          </div>
                        </div>
                        <Button type="submit" className="w-full h-14 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20" disabled={createAuction.isPending}>
                          Deploy Auction
                        </Button>
                      </form>
                    </div>
                  </div>
                  <div className="lg:col-span-8 space-y-4">
                    {auctions?.map((a) => (
                      <div key={a.id} className="group p-6 glass-panel rounded-[2rem] flex items-center justify-between hover:border-primary/20 transition-all">
                        <div className="flex items-center gap-6">
                           <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-primary/40 group-hover:text-primary transition-colors">
                              <Gavel className="w-6 h-6" />
                           </div>
                           <div>
                              <div className="font-display font-black text-xl uppercase tracking-tight text-white">{a.name}</div>
                              <div className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em]">{a.leagueName}</div>
                           </div>
                        </div>
                        <div className="flex items-center gap-6">
                           <div className="hidden md:block text-right">
                              <div className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Configuration</div>
                              <div className="text-xs font-bold text-white/60">{a.timerSeconds}s · ₹{(a.bidIncrementMin/1000).toFixed(0)}k Incr</div>
                           </div>
                           <Badge className={clsx(
                             "uppercase font-black tracking-widest px-4 py-2 rounded-full text-[10px]",
                             a.status === "active" ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-white/5 text-muted-foreground border-white/10"
                           )}>
                             {a.status}
                           </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Players Tab */}
              {tab === "players" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-4">
                    <div className="glass-panel rounded-[2rem] p-8 space-y-6">
                       <div className="flex items-center gap-2 mb-2">
                         <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <UserPlus className="w-5 h-5 text-primary" />
                         </div>
                         <h3 className="font-display font-black uppercase tracking-tight text-sm">Add New Player</h3>
                      </div>
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
                        <div className="space-y-2">
                           <Label className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground">Full Name</Label>
                           <Input className="h-12 bg-white/5 border-white/5 rounded-xl font-bold" value={playerForm.name} onChange={(e) => setPlayerForm((p) => ({ ...p, name: e.target.value }))} required />
                        </div>
                        <div className="space-y-2">
                           <Label className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground">Nationality</Label>
                           <Input className="h-12 bg-white/5 border-white/5 rounded-xl font-bold" value={playerForm.country} onChange={(e) => setPlayerForm((p) => ({ ...p, country: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground">Role/Category</Label>
                          <select
                            className="w-full h-12 px-4 rounded-xl border border-white/5 bg-white/5 text-white text-sm font-bold appearance-none outline-none focus:border-primary"
                            value={playerForm.category}
                            onChange={(e) => setPlayerForm((p) => ({ ...p, category: e.target.value }))}
                          >
                            <option value="batsman">Batsman</option>
                            <option value="bowler">Bowler</option>
                            <option value="all_rounder">All Rounder</option>
                            <option value="wicket_keeper">Wicket Keeper</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-2">
                              <Label className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground">Base Price (₹)</Label>
                              <Input className="h-12 bg-white/5 border-white/5 rounded-xl font-bold" type="number" value={playerForm.basePrice} onChange={(e) => setPlayerForm((p) => ({ ...p, basePrice: parseInt(e.target.value) }))} />
                           </div>
                           <div className="flex items-end">
                              <Button type="submit" className="w-full h-12 rounded-xl font-black uppercase text-[10px] tracking-widest" disabled={createPlayer.isPending}>
                                 Register
                              </Button>
                           </div>
                        </div>
                      </form>
                    </div>
                  </div>
                  <div className="lg:col-span-8 flex flex-col gap-3">
                    <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between px-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                       <span>Player Profile</span>
                       <span>Valuation & Status</span>
                    </div>
                    <div className="space-y-3 max-h-[600px] overflow-auto pr-2 no-scrollbar">
                      {players?.map((p) => (
                        <div key={p.id} className="p-4 glass-panel rounded-2xl flex items-center justify-between hover:border-primary/20 transition-all">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black uppercase text-[10px]">
                               {p.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-sm uppercase text-white">{p.name}</div>
                              <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{p.country} · {p.category}</div>
                            </div>
                          </div>
                          <div className="text-right flex items-center gap-6">
                            <div>
                              <div className="font-display font-black text-primary text-sm">{formatMoney(p.basePrice)}</div>
                              <Badge variant="outline" className="text-[9px] uppercase border-white/10 font-black tracking-widest text-muted-foreground">{p.status}</Badge>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground opacity-20" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Teams Tab */}
              {tab === "teams" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-4">
                    <div className="glass-panel rounded-[2rem] p-8 space-y-6">
                      <div className="flex items-center gap-2 mb-2">
                         <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <ShieldCheck className="w-5 h-5 text-primary" />
                         </div>
                         <h3 className="font-display font-black uppercase tracking-tight text-sm">Create Franchise</h3>
                      </div>
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
                        <div className="space-y-2">
                           <Label className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground">Franchise Name</Label>
                           <Input className="h-12 bg-white/5 border-white/5 rounded-xl font-bold" value={teamForm.name} onChange={(e) => setTeamForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Mumbai Indians" required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-2">
                              <Label className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground">Tag (Max 4)</Label>
                              <Input className="h-12 bg-white/5 border-white/5 rounded-xl font-bold uppercase" maxLength={4} value={teamForm.shortName} onChange={(e) => setTeamForm((p) => ({ ...p, shortName: e.target.value.toUpperCase() }))} placeholder="MI" required />
                           </div>
                           <div className="space-y-2">
                              <Label className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground">Signature Color</Label>
                              <div className="flex gap-2">
                                <Input type="color" className="w-12 h-12 p-1 bg-white/5 border-white/5 rounded-xl" value={teamForm.primaryColor} onChange={(e) => setTeamForm((p) => ({ ...p, primaryColor: e.target.value }))} />
                                <Input className="h-12 bg-white/5 border-white/5 rounded-xl font-mono text-[10px] font-black" value={teamForm.primaryColor} onChange={(e) => setTeamForm((p) => ({ ...p, primaryColor: e.target.value }))} />
                              </div>
                           </div>
                        </div>
                        <div className="space-y-2">
                           <Label className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground">Initial Purse (₹)</Label>
                           <Input className="h-12 bg-white/5 border-white/5 rounded-xl font-bold" type="number" value={teamForm.purse} onChange={(e) => setTeamForm((p) => ({ ...p, purse: parseInt(e.target.value) }))} />
                        </div>
                        <Button type="submit" className="w-full h-14 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20" disabled={createTeam.isPending}>Establish Franchise</Button>
                      </form>
                    </div>
                  </div>
                  <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4 content-start">
                    {teams?.map((t) => (
                      <div key={t.id} className="p-6 glass-panel rounded-3xl flex items-center justify-between border-l-4" style={{ borderLeftColor: t.primaryColor }}>
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xs font-black shadow-inner shadow-white/10" style={{ backgroundColor: t.primaryColor + "22", color: t.primaryColor }}>
                            {t.shortName}
                          </div>
                          <div>
                            <div className="font-display font-black text-sm uppercase text-white tracking-tight">{t.name}</div>
                            <div className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.1em]">{t.ownerName || "Unassigned Owner"}</div>
                          </div>
                        </div>
                        <div className="text-right">
                           <div className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-0.5">Budget</div>
                           <div className="font-display font-black text-primary text-sm">{formatMoney(t.remainingPurse)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Users Tab */}
              {tab === "users" && (
                <div className="glass-panel rounded-[3rem] overflow-hidden">
                   <div className="p-8 border-b border-white/5 bg-white/2 flex justify-between items-center">
                      <h3 className="font-display font-black uppercase tracking-tight text-xl">Platform Personnel</h3>
                      <div className="text-xs font-black uppercase text-primary tracking-widest">{users?.length ?? 0} Accounts Active</div>
                   </div>
                   <div className="divide-y divide-white/5">
                    {users?.map((u) => (
                      <div key={u.id} className="p-6 flex items-center justify-between hover:bg-white/2 transition-colors px-10">
                        <div className="flex items-center gap-6">
                           <div className="w-12 h-12 rounded-full bg-white/5 border border-white/5 flex items-center justify-center">
                              <Users className="w-6 h-6 text-muted-foreground opacity-40" />
                           </div>
                           <div>
                             <div className="font-bold text-white uppercase tracking-tight">{u.name}</div>
                             <div className="text-xs text-muted-foreground font-mono">{u.email}</div>
                           </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={clsx(
                            "uppercase font-black text-[10px] tracking-widest px-4 py-1.5 rounded-full",
                            u.role === "admin" ? "bg-destructive/10 text-destructive border-destructive/20" :
                            u.role === "auctioneer" ? "bg-primary/10 text-primary border-primary/20" :
                            u.role === "team_owner" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                            "bg-white/5 text-muted-foreground border-white/10"
                          )}
                        >
                          {u.role}
                        </Badge>
                      </div>
                    ))}
                   </div>
                </div>
              )}
           </motion.div>
        </AnimatePresence>
      </div>
    </Layout>
  );
}
