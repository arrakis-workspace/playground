import type { User } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useState } from "react";
import { Building2 } from "lucide-react";
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
    <div className="flex flex-col w-full max-w-sm sm:max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight" data-testid="text-greeting">
          Hey {displayName}!
        </h1>
        {user.handle && (
          <p className="text-muted-foreground text-sm mt-0.5" data-testid="text-handle">@{user.handle}</p>
        )}
      </div>

      <div className="bg-card rounded-2xl shadow-sm border border-border p-5 lg:p-8 mb-4">
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-1" data-testid="text-portfolio-label">Total Portfolio Value</p>
        <div className="flex items-baseline gap-2">
          <p className="text-foreground text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight" data-testid="text-portfolio-value">
            ${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        {chartData.length > 1 && (
          <div className="mt-4 h-[180px] md:h-[240px] lg:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(239, 84%, 67%)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="hsl(239, 84%, 67%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: "hsl(215, 16%, 47%)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis hide domain={["dataMin", "dataMax"]} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#fff", border: "1px solid hsl(220, 13%, 89%)", borderRadius: "12px", fontSize: 13, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                  formatter={(value: number) => [`$${value.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, "Value"]}
                />
                <Area type="monotone" dataKey="value" stroke="hsl(239, 84%, 67%)" strokeWidth={2} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="flex gap-1.5 mt-4 flex-wrap">
          {TIME_RANGES.map(r => (
            <button
              key={r.label}
              onClick={() => setTimeRange(r.label)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                timeRange === r.label ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
              data-testid={`button-range-${r.label}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {holdingsData.length > 0 && (
        <div className="bg-card rounded-2xl shadow-sm border border-border p-5 lg:p-8 mb-4">
          <h3 className="text-foreground font-semibold mb-4 text-lg" data-testid="text-holdings-title">Holdings</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8">
            {holdingsData.map((h: any) => {
              const value = parseFloat(h.totalValue);
              return (
                <div key={h.id} className="flex items-center justify-between py-3 border-b border-border last:border-0" data-testid={`holding-${h.symbol}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="text-primary text-xs font-bold">{h.symbol?.slice(0, 3)}</span>
                    </div>
                    <div>
                      <p className="text-foreground font-medium text-sm">{h.symbol}</p>
                      <p className="text-muted-foreground text-xs">{h.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-foreground font-medium text-sm">
                      ${value.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-muted-foreground text-xs">{parseFloat(h.quantity).toFixed(2)} shares</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {holdingsData.length === 0 && (
        <div className="bg-card rounded-2xl shadow-sm border border-border p-8 lg:p-12 mb-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-foreground font-medium text-lg" data-testid="text-no-holdings">No linked accounts yet</p>
          <p className="text-muted-foreground text-sm mt-1">Connect a brokerage to see your portfolio</p>
          <Button
            onClick={() => setLocation("/link-institution")}
            className="mt-5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm px-6"
            data-testid="button-link-from-dashboard"
          >
            Link a Brokerage
          </Button>
        </div>
      )}
    </div>
  );
}
