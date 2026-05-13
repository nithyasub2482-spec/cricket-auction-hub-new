import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { useListAuctions, getListAuctionsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Tv, Settings2, ShieldAlert, History } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function Lobby() {
  const { data: auctions, isLoading } = useListAuctions();
  const { user } = useAuth();

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold uppercase tracking-tight text-foreground">Auction Lobby</h1>
            <p className="text-muted-foreground mt-1">Select an active event to continue.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-card rounded border border-border"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {auctions?.map((auction) => (
              <Card key={auction.id} className="flex flex-col border-border bg-card hover:border-primary transition-colors">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant={auction.status === "active" ? "default" : "secondary"} className="uppercase font-bold tracking-wider">
                      {auction.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl">{auction.name}</CardTitle>
                  <div className="text-sm text-muted-foreground">{auction.leagueName}</div>
                </CardHeader>
                <CardContent className="flex-1 text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Min Bid Increment</span>
                    <span className="font-mono font-medium">₹{auction.bidIncrementMin.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Timer</span>
                    <span className="font-mono font-medium">{auction.timerSeconds}s</span>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-2 pt-4 border-t border-border/50">
                  <Link href={`/auction/${auction.id}`} className="w-full">
                    <Button className="w-full font-bold tracking-wide uppercase gap-2">
                      <Play className="w-4 h-4" /> Enter Auction Room
                    </Button>
                  </Link>
                  
                  <div className="grid grid-cols-3 gap-2 w-full">
                    <Link href={`/auction/${auction.id}/display`} className="w-full">
                      <Button variant="outline" className="w-full text-xs gap-1">
                        <Tv className="w-3 h-3" /> Display
                      </Button>
                    </Link>

                    <Link href={`/auction/${auction.id}/history`} className="w-full">
                      <Button variant="outline" className="w-full text-xs gap-1">
                        <History className="w-3 h-3" /> History
                      </Button>
                    </Link>
                    
                    {(user?.role === "admin" || user?.role === "auctioneer") && (
                      <Link href={`/auction/${auction.id}/control`} className="w-full">
                        <Button variant="outline" className="w-full text-xs gap-1 border-primary/20 hover:bg-primary/10 hover:text-primary">
                          <Settings2 className="w-3 h-3" /> Control
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardFooter>
              </Card>
            ))}
            
            {auctions?.length === 0 && (
              <div className="col-span-full py-12 text-center border-2 border-dashed border-border rounded-lg bg-card/50">
                <ShieldAlert className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-bold text-foreground">No Auctions Found</h3>
                <p className="text-muted-foreground">Contact the commissioner to schedule an event.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}