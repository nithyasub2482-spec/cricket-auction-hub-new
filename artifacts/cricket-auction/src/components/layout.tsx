import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Activity, Users, Shield, Trophy, LayoutDashboard, LogOut, Star, Menu, X } from "lucide-react";
import { clsx } from "clsx";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Lobby", icon: LayoutDashboard },
    { href: "/players", label: "Players", icon: Users },
    { href: "/teams", label: "Teams", icon: Trophy },
    { href: "/analytics", label: "Analytics", icon: Activity },
    ...(user?.role === "team_owner" && user?.teamId ? [{ href: "/my-team", label: "My Team", icon: Star }] : []),
    ...(user?.role === "admin" || user?.role === "commissioner" ? [{ href: "/admin", label: "Admin Console", icon: Shield }] : []),
  ];

  if (!user) return <>{children}</>;

  const NavLink = ({ item, onClick }: { item: typeof navItems[0], onClick?: () => void }) => {
    const active = location === item.href;
    return (
      <Link
        href={item.href}
        onClick={onClick}
        className={clsx(
          "group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-300",
          active 
            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
            : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
        )}
      >
        <item.icon className={clsx("w-5 h-5 transition-transform group-hover:scale-110", active ? "text-white" : "text-primary/70")} />
        {item.label}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 glass-panel border-b border-white/5 z-50">
        <div className="flex items-center gap-2 text-primary">
          <Trophy className="w-6 h-6 animate-neon" />
          <span className="font-display font-black text-lg uppercase tracking-tighter">Auction Pro</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-primary">
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-72 flex-col glass-panel border-r border-white/5 p-6 relative z-40">
        <div className="mb-12">
          <div className="flex items-center gap-3 text-primary mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Trophy className="w-8 h-8 animate-neon" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-black text-2xl uppercase tracking-tighter leading-none">Auction Pro</span>
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground opacity-60">Elite Management</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>

        <div className="mt-8 pt-6 border-t border-white/5">
          <div className="mb-6 p-4 rounded-2xl bg-white/5 border border-white/5 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <Shield className="w-12 h-12 text-primary" />
             </div>
            <div className="relative z-10">
              <div className="text-sm font-black text-foreground uppercase tracking-tight">{user.name}</div>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <div className="text-[10px] text-primary font-black uppercase tracking-widest">{user.role}</div>
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-destructive hover:bg-destructive/10 transition-all border border-transparent hover:border-destructive/20"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="fixed inset-0 bg-background/95 backdrop-blur-xl z-[45] md:hidden p-6 pt-24"
          >
            <div className="space-y-4">
              {navItems.map((item) => (
                <NavLink key={item.href} item={item} onClick={() => setIsMobileMenuOpen(false)} />
              ))}
              <div className="h-px bg-white/5 my-6" />
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-black uppercase text-destructive bg-destructive/10"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative p-4 md:p-8 lg:p-10 stadium-border">
         <div className="max-w-7xl mx-auto pb-20">
            {children}
         </div>
      </main>
    </div>
  );
}