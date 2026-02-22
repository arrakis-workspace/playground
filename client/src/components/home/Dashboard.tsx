import type { User } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useState } from "react";
import { TrendingUp, Users, MessageCircle, Building2, Settings, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardProps {
  user: User;
}

const TIME_RANGES = [
  { label: "1D", days: 1 },
  { label: "1W", days: 7 },
  { label: "1M", days: 30 },
  { label: "1Y", days: 365 },
  { label: "5Y", days: 1825 },
  { label: "All", days: 0 },
];

export function Dashboard({ user }: DashboardProps) {
  const [, setLocation] = useLocation();
  const [timeRange, setTimeRange] = useState("1M");
  const displayName = user.firstName || "there";

  const { data: holdingsData = [] } = useQuery<any[]>({
    queryKey: ["/api/portfolio/holdings"],
  });

  const selectedRange = TIME_RANGES.find(r => r.label === timeRange);
  const sinceParam = selectedRange && selectedRange.days > 0
    ? `?since=${new Date(Date.now() - selectedRange.days * 86400000).toISOString()}`
    : "";

  const { data: historyData = [] } = useQuery<any[]>({
    queryKey: ["/api/portfolio/history", timeRange],
    queryFn: async () => {
      const res = await fetch(`/api/portfolio/history${sinceParam}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const totalValue = holdingsData.reduce((sum: number, h: any) => sum + parseFloat(h.totalValue || "0"), 0);

  const chartData = historyData.map((d: any) => ({
    date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    value: parseFloat(d.totalValue),
  }));

  if (chartData.length === 0 && totalValue > 0) {
    chartData.push({ date: "Today", value: totalValue });
  }

  return (
    <div className="flex flex-col items-center w-full max-w-xs sm:max-w-sm md:max-w-lg lg:max-w-2xl">
      <div className="flex items-center gap-3 mb-2 self-start w-full">
        <img className="w-10 h-10" alt="Playground logo" src="/figmaAssets/frame.svg" data-testid="img-dashboard-logo" />
        <h1 className="font-['Aclonica',sans-serif] text-[#34e916] text-2xl md:text-3xl flex-1" data-testid="text-greeting">
          Hey {displayName}!
        </h1>
      </div>

      {user.handle && (
        <p className="text-white/50 text-sm self-start mb-4 font-['Roboto',Helvetica]" data-testid="text-handle">@{user.handle}</p>
      )}

      <div className="bg-white/10 rounded-xl p-5 w-full mb-4">
        <p className="text-white/60 text-xs font-['Roboto',Helvetica] uppercase tracking-wider mb-1" data-testid="text-portfolio-label">Total Portfolio Value</p>
        <p className="text-white font-['Roboto',Helvetica] text-3xl md:text-4xl font-bold" data-testid="text-portfolio-value">
          ${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>

        {chartData.length > 1 && (
          <div className="mt-4 h-[180px] md:h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34e916" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#34e916" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis hide domain={["dataMin", "dataMax"]} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1c6399", border: "none", borderRadius: "8px", color: "#fff", fontSize: 13 }}
                  formatter={(value: number) => [`$${value.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, "Value"]}
                />
                <Area type="monotone" dataKey="value" stroke="#34e916" strokeWidth={2} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="flex gap-1 mt-3 flex-wrap">
          {TIME_RANGES.map(r => (
            <button
              key={r.label}
              onClick={() => setTimeRange(r.label)}
              className={`px-3 py-1 rounded-full text-xs font-['Roboto',Helvetica] transition-colors ${
                timeRange === r.label ? "bg-[#34e916] text-black font-medium" : "bg-white/10 text-white/70 hover:bg-white/20"
              }`}
              data-testid={`button-range-${r.label}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {holdingsData.length > 0 && (
        <div className="bg-white/10 rounded-xl p-5 w-full mb-4">
          <h3 className="text-white font-['Roboto',Helvetica] font-medium mb-3" data-testid="text-holdings-title">Holdings</h3>
          <div className="space-y-3">
            {holdingsData.map((h: any) => (
              <div key={h.id} className="flex items-center justify-between" data-testid={`holding-${h.symbol}`}>
                <div>
                  <p className="text-white font-['Roboto',Helvetica] font-medium text-sm">{h.symbol}</p>
                  <p className="text-white/50 text-xs">{h.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-white font-['Roboto',Helvetica] font-medium text-sm">
                    ${parseFloat(h.totalValue).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-white/50 text-xs">{parseFloat(h.quantity).toFixed(2)} shares</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {holdingsData.length === 0 && (
        <div className="bg-white/10 rounded-xl p-6 w-full mb-4 text-center">
          <Building2 className="w-10 h-10 text-white/30 mx-auto mb-3" />
          <p className="text-white/70 font-['Roboto',Helvetica] text-sm" data-testid="text-no-holdings">No linked accounts yet</p>
          <Button
            onClick={() => setLocation("/link-institution")}
            variant="secondary"
            className="mt-3 bg-white hover:bg-white/90 text-black text-sm"
            data-testid="button-link-from-dashboard"
          >
            Link a Brokerage
          </Button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 w-full">
        <button
          onClick={() => setLocation("/social")}
          className="bg-white/10 rounded-xl p-4 flex flex-col items-center gap-2 hover:bg-white/20 transition-colors"
          data-testid="button-nav-social"
        >
          <Users className="w-6 h-6 text-[#34e916]" />
          <span className="text-white text-xs font-['Roboto',Helvetica]">Social</span>
        </button>
        <button
          onClick={() => setLocation("/chat")}
          className="bg-white/10 rounded-xl p-4 flex flex-col items-center gap-2 hover:bg-white/20 transition-colors"
          data-testid="button-nav-chat"
        >
          <MessageCircle className="w-6 h-6 text-[#34e916]" />
          <span className="text-white text-xs font-['Roboto',Helvetica]">Chat</span>
        </button>
        <button
          onClick={() => setLocation("/profile-setup")}
          className="bg-white/10 rounded-xl p-4 flex flex-col items-center gap-2 hover:bg-white/20 transition-colors"
          data-testid="button-nav-settings"
        >
          <Settings className="w-6 h-6 text-[#34e916]" />
          <span className="text-white text-xs font-['Roboto',Helvetica]">Settings</span>
        </button>
      </div>
    </div>
  );
}
