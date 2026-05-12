import { useState } from "react";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Trophy, Loader2 } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login: authenticate } = useAuth();
  
  const loginMutation = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(
      { data: { email, password } },
      {
        onSuccess: (data) => {
          authenticate(data.token);
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-background to-background"></div>
      
      <div className="z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-6">
            <Trophy className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold uppercase tracking-tight text-foreground">Auction Pro</h1>
          <p className="text-muted-foreground mt-2">Cricket League Management System</p>
        </div>

        <div className="bg-card border border-border p-8 rounded shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {loginMutation.isError && (
              <div className="bg-destructive/10 text-destructive px-4 py-3 border border-destructive/20 rounded text-sm font-medium">
                Invalid credentials
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background border-border text-foreground font-mono"
                placeholder="admin@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-background border-border text-foreground font-mono"
              />
            </div>
            <Button
              type="submit"
              className="w-full font-bold uppercase tracking-wider"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Access Terminal"}
            </Button>
          </form>
        </div>
        
        <div className="mt-8 text-center text-xs text-muted-foreground font-mono space-y-1">
          <p className="font-bold text-muted-foreground uppercase tracking-wider mb-2">Demo Accounts</p>
          <p>admin@cricket.com / admin123</p>
          <p>auctioneer@cricket.com / auction123</p>
          <p>mumbai@cricket.com / team123</p>
        </div>
      </div>
    </div>
  );
}