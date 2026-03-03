import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompanyLogo } from "@/components/home/EquityList";

const TIME_RANGES = [
  { label: "1D" },
  { label: "5D" },
  { label: "1M" },
  { label: "6M" },
  { label: "YTD" },
  { label: "1Y" },
  { label: "5Y" },
  { label: "All" },
];

interface ChartPoint {
  date: string;
  close: number;
}

interface ChartResponse {
  points: ChartPoint[];
  previousClose: number | null;
  currentPrice: number | null;
}

function formatDateLabel(dateStr: string, range: string): string {
  const d = new Date(dateStr);
  if (range === "1D") {
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  if (range === "5D" || range === "1M") {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  if (range === "6M" || range === "YTD") {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  if (range === "1Y") {
    return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
  }
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

function formatLargeNumber(n: number | null): string {
  if (n == null) return "—";
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
}

function formatNumber(n: number | null, decimals = 2): string {
  if (n == null) return "—";
  return n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function formatPercent(n: number | null): string {
  if (n == null) return "—";
  return `${(n * 100).toFixed(2)}%`;
}

export default function EquityDetail() {
  const [, params] = useRoute("/equity/:symbol");
  const [, setLocation] = useLocation();
  const symbol = params?.symbol?.toUpperCase() || "";
  const [timeRange, setTimeRange] = useState("1D");

  const { data: equity, isLoading, isError } = useQuery<any>({
    queryKey: ["/api/market/equity", symbol],
    queryFn: async () => {
      const res = await fetch(`/api/market/equity/${symbol}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!symbol,
    retry: 1,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data: chartResponse, isLoading: chartLoading, isError: chartError } = useQuery<ChartResponse>({
    queryKey: ["/api/market/equity", symbol, "chart", timeRange],
    queryFn: async () => {
      const res = await fetch(`/api/market/equity/${symbol}/chart?range=${timeRange}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch chart");
      return res.json();
    },
    enabled: !!symbol,
    retry: 1,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const chartData = useMemo(() => {
    return (chartResponse?.points || [])
      .filter((p) => p.close != null)
      .map((p) => ({
        dateLabel: formatDateLabel(p.date, timeRange),
        rawDate: p.date,
        close: p.close,
      }));
  }, [chartResponse, timeRange]);

  const chartPreviousClose = chartResponse?.previousClose ?? null;

  const priceColor = equity?.changePercent >= 0 ? "text-emerald-600" : "text-red-500";
  const chartRefPrice = chartPreviousClose ?? chartData[0]?.close;
  const chartUp = chartData.length >= 2
    ? chartData[chartData.length - 1].close >= (chartRefPrice ?? chartData[0]?.close)
    : equity?.changePercent >= 0;
  const lineColor = chartUp ? "#10b981" : "#ef4444";

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-32 bg-muted rounded" />
          <div className="h-12 w-48 bg-muted rounded" />
          <div className="h-[200px] bg-muted rounded-2xl" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError || (!isLoading && !equity)) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 text-center">
        <p className="text-foreground font-medium text-lg" data-testid="text-equity-not-found">
          {isError ? "Failed to load equity data" : "Equity not found"}
        </p>
        <p className="text-muted-foreground text-sm mt-1">Please try again or go back to the dashboard.</p>
        <Button variant="ghost" onClick={() => setLocation("/")} className="mt-4" data-testid="button-back-home">
          Go Back
        </Button>
      </div>
    );
  }

  if (!equity) return null;

  const stats = [
    { label: "Open", value: `$${formatNumber(equity.open)}` },
    { label: "Prev Close", value: `$${formatNumber(equity.previousClose)}` },
    { label: "Day High", value: `$${formatNumber(equity.dayHigh)}` },
    { label: "Day Low", value: `$${formatNumber(equity.dayLow)}` },
    { label: "Market Cap", value: formatLargeNumber(equity.marketCap) },
    { label: "P/E Ratio", value: equity.pe != null ? formatNumber(equity.pe) : "—" },
    { label: "EPS", value: equity.eps != null ? `$${formatNumber(equity.eps)}` : "—" },
    { label: "52W High", value: `$${formatNumber(equity.high52w)}` },
    { label: "52W Low", value: `$${formatNumber(equity.low52w)}` },
    { label: "Volume", value: equity.volume != null ? equity.volume.toLocaleString() : "—" },
    { label: "Avg Volume", value: equity.avgVolume != null ? equity.avgVolume.toLocaleString() : "—" },
    { label: "Beta", value: equity.beta != null ? formatNumber(equity.beta) : "—" },
    { label: "Dividend Yield", value: formatPercent(equity.dividendYield) },
    { label: "Revenue", value: formatLargeNumber(equity.revenue) },
    { label: "EBITDA", value: formatLargeNumber(equity.profit) },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-28">
      <button
        onClick={() => setLocation("/")}
        className="flex items-center gap-1 text-muted-foreground text-sm mb-4 hover:text-foreground transition-colors"
        data-testid="button-back"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="bg-card rounded-2xl shadow-sm border border-border p-5 lg:p-8 mb-4">
        <div className="flex items-start justify-between mb-1">
          <div className="flex items-center gap-3">
            <CompanyLogo symbol={equity.symbol} className="w-12 h-12 rounded-xl flex-shrink-0" />
            <div>
              <h1 className="text-foreground text-2xl font-bold" data-testid="text-equity-symbol">{equity.symbol}</h1>
              <p className="text-muted-foreground text-sm" data-testid="text-equity-name">{equity.name}</p>
            </div>
          </div>
          {equity.sector && (
            <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-lg font-medium" data-testid="text-equity-sector">
              {equity.sector}
            </span>
          )}
        </div>

        <div className="flex items-baseline gap-3 mt-3">
          <p className="text-foreground text-3xl font-bold" data-testid="text-equity-price">
            ${formatNumber(equity.price)}
          </p>
          <div className={`flex items-center gap-1 ${priceColor}`}>
            {equity.changePercent >= 0 ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span className="text-sm font-medium" data-testid="text-equity-change">
              {equity.change >= 0 ? "+" : ""}{formatNumber(equity.change)} ({equity.changePercent >= 0 ? "+" : ""}{formatNumber(equity.changePercent)}%)
            </span>
          </div>
        </div>

        {chartData.length > 1 ? (
          <div className="mt-4 h-[200px] md:h-[260px]" data-testid="chart-equity">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis
                  dataKey="dateLabel"
                  tick={{ fill: "hsl(215, 16%, 47%)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                  minTickGap={40}
                />
                <YAxis
                  orientation="right"
                  tick={{ fill: "hsl(215, 16%, 47%)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={55}
                  tickFormatter={(v: number) => `$${v.toFixed(v >= 1000 ? 0 : 2)}`}
                  domain={[(dataMin: number) => {
                    const ref = chartRefPrice ?? chartData[0]?.close ?? dataMin;
                    const low = Math.min(dataMin, ref);
                    const pad = (Math.max(dataMin, ref) - low) * 0.05 || 1;
                    return low - pad;
                  }, (dataMax: number) => {
                    const ref = chartRefPrice ?? chartData[0]?.close ?? dataMax;
                    const high = Math.max(dataMax, ref);
                    const pad = (high - Math.min(dataMax, ref)) * 0.05 || 1;
                    return high + pad;
                  }]}
                />
                <ReferenceLine
                  y={chartRefPrice ?? chartData[0]?.close}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="4 4"
                  strokeOpacity={0.5}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    fontSize: 13,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    color: "hsl(var(--foreground))",
                  }}
                  formatter={(value: number) => {
                    const startPrice = chartRefPrice ?? chartData[0]?.close;
                    const pctChange = startPrice ? ((value / startPrice - 1) * 100) : 0;
                    const sign = pctChange >= 0 ? "+" : "";
                    return [`$${formatNumber(value)} (${sign}${pctChange.toFixed(2)}%)`, equity.symbol];
                  }}
                  labelFormatter={(_label, payload) => {
                    if (payload?.[0]?.payload?.rawDate) {
                      const d = new Date(payload[0].payload.rawDate);
                      const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                      if (timeRange === "1D") {
                        return dateStr + ", " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
                      }
                      return dateStr;
                    }
                    return _label;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="close"
                  stroke={lineColor}
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : chartLoading ? (
          <div className="mt-4 h-[200px] flex items-center justify-center">
            <p className="text-muted-foreground text-sm">Loading chart...</p>
          </div>
        ) : chartError ? (
          <div className="mt-4 h-[100px] flex items-center justify-center">
            <p className="text-muted-foreground text-sm" data-testid="text-chart-error">Unable to load chart data</p>
          </div>
        ) : null}

        <div className="flex gap-1.5 mt-4 flex-wrap">
          {TIME_RANGES.map(r => (
            <button
              key={r.label}
              onClick={() => setTimeRange(r.label)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                timeRange === r.label ? "bg-primary text-primary-foreground shadow-sm" : "bg-card text-muted-foreground border border-border"
              }`}
              data-testid={`button-equity-range-${r.label}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-2xl shadow-sm border border-border p-5 lg:p-8 mb-4">
        <h2 className="text-foreground font-semibold text-lg mb-4" data-testid="text-key-stats-title">Key Statistics</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
          {stats.map(s => (
            <div key={s.label} className="py-2" data-testid={`stat-${s.label.toLowerCase().replace(/\s+/g, "-")}`}>
              <p className="text-muted-foreground text-xs">{s.label}</p>
              <p className="text-foreground font-medium text-sm">{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {equity.industry && (
        <div className="bg-card rounded-2xl shadow-sm border border-border p-5 lg:p-8 mb-4">
          <h2 className="text-foreground font-semibold text-lg mb-2" data-testid="text-about-title">About</h2>
          <p className="text-muted-foreground text-xs mb-3" data-testid="text-equity-industry">{equity.industry}</p>
          {equity.description && (
            <p className="text-foreground text-sm leading-relaxed line-clamp-6" data-testid="text-equity-description">
              {equity.description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
