import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Activity, Users, Shield, Trophy, LayoutDashboard, LogOut } from "lucide-react";
import { clsx } from "clsx";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Lobby", icon: LayoutDashboard },
    { href: "/players", label: "Players", icon: Users },
    { href: "/teams", label: "Teams", icon: Trophy },
    { href: "/analytics", label: "Analytics", icon: Activity },
    ...(user?.role === "admin" || user?.role === "commissioner" ? [{ href: "/admin", label: "Admin", icon: Shield }] : []),
  ];

  if (!user) return <>{children}</>;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      <nav className="w-full md:w-64 border-b md:border-r border-border bg-card p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-8 text-primary">
            <Trophy className="w-8 h-8" />
            <span className="font-bold text-xl uppercase tracking-tighter">Auction Pro</span>
          </div>
          <div className="space-y-2">
            {navItems.map((item) => {
              const active = location === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "flex items-center gap-3 px-4 py-3 rounded text-sm font-medium transition-colors",
                    active ? "bg-primary text-primary-foreground" : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
        <div className="mt-8 border-t border-border pt-4">
          <div className="mb-4 px-4">
            <div className="text-sm font-bold text-foreground">{user.name}</div>
            <div className="text-xs text-muted-foreground uppercase">{user.role}</div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </nav>
      <main className="flex-1 overflow-auto bg-background p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}