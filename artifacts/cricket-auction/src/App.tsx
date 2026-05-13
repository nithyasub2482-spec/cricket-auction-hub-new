import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider } from "@/components/theme-provider";

import Login from "@/pages/login";
import Lobby from "@/pages/lobby";
import Players from "@/pages/players";
import Teams from "@/pages/teams";
import TeamDetail from "@/pages/team-detail";
import Analytics from "@/pages/analytics";
import Admin from "@/pages/admin";
import LiveAuction from "@/pages/live-auction";
import AuctionControl from "@/pages/auction-control";
import AuctionDisplay from "@/pages/auction-display";
import AuctionHistory from "@/pages/auction-history";
import SlotReplay from "@/pages/slot-replay";
import MyTeam from "@/pages/my-team";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={Lobby} />
      <Route path="/players" component={Players} />
      <Route path="/teams" component={Teams} />
      <Route path="/teams/:id" component={TeamDetail} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/admin" component={Admin} />
      <Route path="/auction/:id" component={LiveAuction} />
      <Route path="/auction/:id/control" component={AuctionControl} />
      <Route path="/auction/:id/display" component={AuctionDisplay} />
      <Route path="/auction/:id/history" component={AuctionHistory} />
      <Route path="/auction/:id/slots/:slotId" component={SlotReplay} />
      <Route path="/my-team" component={MyTeam} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AuthProvider>
              <Router />
            </AuthProvider>
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;