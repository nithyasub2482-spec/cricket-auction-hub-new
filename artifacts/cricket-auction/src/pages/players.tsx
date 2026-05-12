import { useState } from "react";
import { Layout } from "@/components/layout";
import { useListPlayers } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, Star, Trophy, Zap, Shield } from "lucide-react";
import { formatMoney } from "@/lib/utils";
import { clsx } from "clsx";

const CATEGORIES = ["all", "batsman", "bowler", "all_rounder", "wicket_keeper"] as const;
type Category = (typeof CATEGORIES)[number];

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  batsman: <Trophy className="w-4 h-4" />,
  bowler: <Zap className="w-4 h-4" />,
  all_rounder: <Star className="w-4 h-4" />,
  wicket_keeper: <Shield className="w-4 h-4" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  batsman: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  bowler: "bg-red-500/20 text-red-400 border-red-500/30",
  all_rounder: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  wicket_keeper: "bg-green-500/20 text-green-400 border-green-500/30",
};

export default function Players() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category>("all");
  const [country, setCountry] = useState("");

  const { data: players, isLoading } = useListPlayers({
    search: search || undefined,
    category: category === "all" ? undefined : category,
    country: country || undefined,
  });

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-tight text-foreground">Player Database</h1>
          <p className="text-muted-foreground mt-1">{players?.length ?? 0} players registered</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search players..."
              className="pl-9 bg-background font-mono"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Input
            placeholder="Country..."
            className="w-40 bg-background font-mono"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat}
              variant={category === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setCategory(cat)}
              className={clsx("uppercase font-bold text-xs tracking-wider", category !== cat && "border-border")}
            >
              {cat === "all" ? "All Players" : cat.replace("_", " ")}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 animate-pulse">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="h-52 bg-card rounded border border-border" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {players?.map((player) => (
              <Card
                key={player.id}
                className="p-5 border-border bg-card hover:border-primary/50 transition-colors flex flex-col gap-4"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-extrabold text-lg uppercase tracking-tight text-foreground truncate">
                      {player.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-muted-foreground text-sm font-mono">{player.country}</span>
                      {player.age && (
                        <span className="text-muted-foreground text-sm">· {player.age}y</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                    <Badge
                      variant="outline"
                      className={clsx("text-xs font-bold uppercase flex items-center gap-1", CATEGORY_COLORS[player.category] || "")}
                    >
                      {CATEGORY_ICONS[player.category]}
                      {player.category.replace("_", " ")}
                    </Badge>
                    {player.rating && (
                      <span className="text-xs font-mono text-amber-400 font-bold">★ {player.rating}</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  {player.runs != null && (
                    <div className="bg-secondary/50 rounded p-2">
                      <div className="text-xs text-muted-foreground uppercase font-bold tracking-wide">Runs</div>
                      <div className="text-base font-mono font-bold text-foreground">{player.runs.toLocaleString()}</div>
                    </div>
                  )}
                  {player.wickets != null && (
                    <div className="bg-secondary/50 rounded p-2">
                      <div className="text-xs text-muted-foreground uppercase font-bold tracking-wide">Wkts</div>
                      <div className="text-base font-mono font-bold text-foreground">{player.wickets}</div>
                    </div>
                  )}
                  {player.strikeRate != null && (
                    <div className="bg-secondary/50 rounded p-2">
                      <div className="text-xs text-muted-foreground uppercase font-bold tracking-wide">SR</div>
                      <div className="text-base font-mono font-bold text-foreground">{Number(player.strikeRate).toFixed(1)}</div>
                    </div>
                  )}
                  {player.economy != null && (
                    <div className="bg-secondary/50 rounded p-2">
                      <div className="text-xs text-muted-foreground uppercase font-bold tracking-wide">Eco</div>
                      <div className="text-base font-mono font-bold text-foreground">{Number(player.economy).toFixed(2)}</div>
                    </div>
                  )}
                  {player.average != null && (
                    <div className="bg-secondary/50 rounded p-2">
                      <div className="text-xs text-muted-foreground uppercase font-bold tracking-wide">Avg</div>
                      <div className="text-base font-mono font-bold text-foreground">{Number(player.average).toFixed(1)}</div>
                    </div>
                  )}
                  {player.matches != null && (
                    <div className="bg-secondary/50 rounded p-2">
                      <div className="text-xs text-muted-foreground uppercase font-bold tracking-wide">Mat</div>
                      <div className="text-base font-mono font-bold text-foreground">{player.matches}</div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/50">
                  <div>
                    <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Base Price</div>
                    <div className="text-lg font-mono font-black text-primary">{formatMoney(player.basePrice)}</div>
                  </div>
                  <Badge
                    variant="outline"
                    className={clsx(
                      "uppercase text-xs font-bold",
                      player.status === "available" ? "border-green-500/40 text-green-400" :
                      player.status === "sold" ? "border-amber-500/40 text-amber-400" :
                      "border-muted-foreground/30 text-muted-foreground"
                    )}
                  >
                    {player.status}
                  </Badge>
                </div>
              </Card>
            ))}

            {players?.length === 0 && (
              <div className="col-span-full py-20 text-center border-2 border-dashed border-border rounded-lg text-muted-foreground">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="font-bold text-lg uppercase tracking-wider">No players found</p>
                <p className="text-sm mt-1">Try adjusting your filters</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
