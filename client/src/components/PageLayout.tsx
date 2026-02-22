import { UserAccountButton } from "@/components/UserAccountButton";
import { CompanyFooter } from "@/components/CompanyFooter";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { LayoutDashboard, Users, MessageCircle, UserCircle } from "lucide-react";
import type { ReactNode } from "react";

interface PageLayoutProps {
  children: ReactNode;
  showBottomNav?: boolean;
  className?: string;
}

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/social", icon: Users, label: "Social" },
  { path: "/chat", icon: MessageCircle, label: "Chat" },
  { path: "/profile-setup", icon: UserCircle, label: "Profile" },
];

export function PageLayout({ children, showBottomNav = true, className = "" }: PageLayoutProps) {
  const { isAuthenticated, user } = useAuth();
  const [location] = useLocation();
  const hasCompletedSetup = isAuthenticated && user?.profileCompleted && user?.handle;

  const { data: unseenData } = useQuery<{ count: number }>({
    queryKey: ["/api/connections/unseen-count"],
    enabled: !!hasCompletedSetup,
    refetchInterval: 30000,
  });

  const unseenCount = unseenData?.count ?? 0;

  return (
    <div className={`bg-background w-full min-h-screen flex flex-col ${className}`}>
      <header className="bg-card border-b border-border px-4 py-3 sm:px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5">
              <img className="w-8 h-8" alt="Playground logo" src="/figmaAssets/frame.svg" data-testid="img-header-logo" />
              <span className="font-semibold text-foreground text-lg tracking-tight">Playground</span>
            </Link>

            {hasCompletedSetup && (
              <nav className="hidden lg:flex items-center gap-1" data-testid="nav-desktop">
                {navItems.map((item) => {
                  const isActive = item.path === "/" ? location === "/" : location.startsWith(item.path);
                  const showBadge = item.path === "/social" && unseenCount > 0;
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                      data-testid={`nav-desktop-${item.label.toLowerCase()}`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                      {showBadge && (
                        <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1" data-testid="badge-unseen-desktop">
                          {unseenCount > 99 ? "99+" : unseenCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>
          <UserAccountButton />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center px-4 py-6 md:py-10 lg:px-8">
        {children}
      </main>

      {hasCompletedSetup && showBottomNav ? (
        <nav className="bg-card border-t border-border px-2 py-1.5 sm:px-4 sticky bottom-0 z-[9999] lg:hidden">
          <div className="max-w-3xl mx-auto flex items-center justify-around">
            {navItems.map((item) => {
              const isActive = item.path === "/" ? location === "/" : location.startsWith(item.path);
              const showBadge = item.path === "/social" && unseenCount > 0;
              return (
                <Link key={item.path} href={item.path} className="relative flex flex-col items-center gap-0.5 py-1 px-3" data-testid={`nav-${item.label.toLowerCase()}`}>
                  <item.icon className={`w-5 h-5 transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`text-[10px] font-medium transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`}>{item.label}</span>
                  {showBadge && (
                    <span className="absolute -top-0.5 right-0 bg-destructive text-destructive-foreground text-[9px] font-bold min-w-[16px] h-[16px] rounded-full flex items-center justify-center px-0.5" data-testid="badge-unseen-mobile">
                      {unseenCount > 99 ? "99+" : unseenCount}
                    </span>
                  )}
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
