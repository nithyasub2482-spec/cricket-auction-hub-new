import React from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { useListAuctions } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Tv, Settings2, ShieldAlert, History, Clock, Gavel, Users } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function Lobby() {
  const { data: auctions, isLoading } = useListAuctions();
  const { user: currentUser } = useAuth();

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.2em] text-xs">
               <div className="w-8 h-[2px] bg-primary" />
               Live Events
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-black uppercase tracking-tight text-foreground">Auction Lobby</h1>
            <p className="text-muted-foreground text-lg max-w-2xl">Select an elite event to join the bidding floor or manage proceedings.</p>
          </div>
          
          <div className="flex gap-4 p-1 rounded-xl bg-white/5 border border-white/5">
             <div className="px-6 py-2 rounded-lg bg-primary/10 border border-primary/20 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-neon" />
                <span className="text-xs font-black uppercase tracking-widest text-primary">Live Now</span>
             </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-80 bg-white/5 rounded-3xl border border-white/5 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {auctions?.map((auction, index) => (
              <motion.div
                key={auction.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group relative"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-purple-600 rounded-[2rem] opacity-0 group-hover:opacity-20 blur transition duration-500"></div>
                <div className="relative glass-panel rounded-[2rem] p-8 h-full flex flex-col overflow-hidden">
                  {/* Card Background Decoration */}
                  <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
                  
                  <div className="flex justify-between items-start mb-6">
                    <Badge className={cn(
                      "uppercase font-black tracking-[0.1em] text-[10px] px-3 py-1 rounded-full",
                      auction.status === "active" ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-white/5 text-muted-foreground border-white/10"
                    )}>
                      {auction.status}
                    </Badge>
                    <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                       <Gavel className="w-5 h-5 text-primary/70" />
                    </div>
                  </div>

                  <div className="mb-8">
                    <h2 className="text-2xl font-display font-black uppercase tracking-tight mb-2 group-hover:text-primary transition-colors line-clamp-1">{auction.name}</h2>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground uppercase font-bold tracking-widest">
                       <span className="w-4 h-px bg-muted-foreground/30" />
                       {auction.leagueName}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-8 pt-6 border-t border-white/5">
                    <div className="space-y-1">
                      <div className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Timer
                      </div>
                      <div className="text-lg font-display font-black text-foreground">{auction.timerSeconds}s</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1">
                        <Users className="w-3 h-3" /> Min Bid
                      </div>
                      <div className="text-lg font-display font-black text-foreground">₹{(auction.bidIncrementMin / 100000).toFixed(1)}L</div>
                    </div>
                  </div>

                  <div className="mt-auto space-y-3">
                    <Link href={`/auction/${auction.id}`} className="block">
                      <Button className="w-full h-12 rounded-xl font-black uppercase tracking-wider gap-3 shadow-xl shadow-primary/20">
                        <Play className="w-4 h-4 fill-current" /> Enter Arena
                      </Button>
                    </Link>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <Link href={`/auction/${auction.id}/display`}>
                        <Button variant="outline" className="w-full h-10 border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest hover:bg-white/10">
                          <Tv className="w-3.5 h-3.5" />
                        </Button>
                      </Link>

                      <Link href={`/auction/${auction.id}/history`}>
                        <Button variant="outline" className="w-full h-10 border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest hover:bg-white/10">
                          <History className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                      
                      {(currentUser?.role === "admin" || currentUser?.role === "auctioneer") && (
                        <Link href={`/auction/${auction.id}/control`}>
                          <Button variant="outline" className="w-full h-10 border-primary/20 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary/10">
                            <Settings2 className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            
            {auctions?.length === 0 && (
              <div className="col-span-full py-24 text-center glass-panel rounded-[3rem] border-2 border-dashed border-white/5">
                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                   <ShieldAlert className="w-12 h-12 text-primary opacity-50" />
                </div>
                <h3 className="text-3xl font-display font-black uppercase tracking-tight text-foreground mb-3">No Active Auctions</h3>
                <p className="text-muted-foreground text-lg max-w-md mx-auto">The stadium is empty. Contact the commissioner or visit the admin console to launch a new event.</p>
                <Link href="/admin" className="inline-block mt-8">
                   <Button variant="outline" className="px-8 h-12 rounded-xl border-primary/20 text-primary font-black uppercase tracking-widest">Launch Admin Console</Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}