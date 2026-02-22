import { UserAccountButton } from "@/components/UserAccountButton";
import { CompanyFooter } from "@/components/CompanyFooter";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { LayoutDashboard, Users, MessageCircle, UserCircle } from "lucide-react";
import type { ReactNode } from "react";

interface PageLayoutProps {
  children: ReactNode;
  showBottomNav?: boolean;
  className?: string;
}

export function PageLayout({ children, showBottomNav = true, className = "" }: PageLayoutProps) {
  const { isAuthenticated, user } = useAuth();
  const [location] = useLocation();
  const hasCompletedSetup = isAuthenticated && user?.profileCompleted && user?.handle;

  const navItems = [
    { path: "/", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/social", icon: Users, label: "Social" },
    { path: "/chat", icon: MessageCircle, label: "Chat" },
    { path: "/profile-setup", icon: UserCircle, label: "Profile" },
  ];

  return (
    <div className={`bg-background w-full min-h-screen flex flex-col ${className}`}>
      <header className="bg-card border-b border-border px-4 py-3 sm:px-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <img className="w-8 h-8" alt="Playground logo" src="/figmaAssets/frame.svg" data-testid="img-header-logo" />
            <span className="font-semibold text-foreground text-lg tracking-tight">Playground</span>
          </Link>
          <UserAccountButton />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center px-4 py-6 md:py-10">
        {children}
      </main>

      {hasCompletedSetup && showBottomNav ? (
        <nav className="bg-card border-t border-border px-2 py-1.5 sm:px-4 sticky bottom-0 z-[9999]">
          <div className="max-w-3xl mx-auto flex items-center justify-around">
            {navItems.map((item) => {
              const isActive = item.path === "/" ? location === "/" : location.startsWith(item.path);
              return (
                <Link key={item.path} href={item.path} className="flex flex-col items-center gap-0.5 py-1 px-3" data-testid={`nav-${item.label.toLowerCase()}`}>
                  <item.icon className={`w-5 h-5 transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`text-[10px] font-medium transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      ) : (
        <CompanyFooter />
      )}
    </div>
  );
}
