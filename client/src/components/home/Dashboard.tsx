import type { User } from "@shared/schema";
import { DashboardCard } from "@/components/home/DashboardCard";
import { TrendingUp, PieChart, Settings, HelpCircle } from "lucide-react";
import { useLocation } from "wouter";

interface DashboardProps {
  user: User;
}

export function Dashboard({ user }: DashboardProps) {
  const [, setLocation] = useLocation();
  const displayName = user.firstName || "there";

  return (
    <div className="flex flex-col items-center w-full max-w-xs sm:max-w-sm md:max-w-lg lg:max-w-2xl">
      <div className="flex items-center gap-3 mb-6 self-start">
        <img
          className="w-10 h-10"
          alt="Playground logo"
          src="/figmaAssets/frame.svg"
          data-testid="img-dashboard-logo"
        />
        <h1
          className="font-['Aclonica',sans-serif] text-[#34e916] text-2xl md:text-3xl"
          data-testid="text-greeting"
        >
          Hey {displayName}!
        </h1>
      </div>

      <p
        className="text-white/80 font-['Roboto',Helvetica] text-sm md:text-base mb-8 self-start"
        data-testid="text-dashboard-subtitle"
      >
        Welcome back to your investment playground.
      </p>

      <div className="grid grid-cols-2 gap-4 w-full">
        <DashboardCard
          icon={<TrendingUp className="w-7 h-7 text-[#34e916]" />}
          title="Portfolio"
          description="Track your investments"
          testId="card-portfolio"
          onClick={() => {}}
        />
        <DashboardCard
          icon={<PieChart className="w-7 h-7 text-[#34e916]" />}
          title="Analytics"
          description="View your performance"
          testId="card-analytics"
          onClick={() => {}}
        />
        <DashboardCard
          icon={<Settings className="w-7 h-7 text-[#34e916]" />}
          title="Settings"
          description="Manage your account"
          testId="card-settings"
          onClick={() => setLocation("/profile-setup")}
        />
        <DashboardCard
          icon={<HelpCircle className="w-7 h-7 text-[#34e916]" />}
          title="Help"
          description="Get support"
          testId="card-help"
          onClick={() => {}}
        />
      </div>
    </div>
  );
}
