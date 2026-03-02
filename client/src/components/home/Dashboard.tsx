import type { User } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { useState, useMemo } from "react";
import { Building2, Plus, X, ArrowLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EquityList, type EquityItem } from "@/components/home/EquityList";
import { EquitySearch } from "@/components/home/EquitySearch";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";

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

const INDEX_TOGGLES = [
  { key: "^GSPC", label: "S&P 500", color: "hsl(142, 71%, 45%)" },
  { key: "^DJI", label: "DOW", color: "hsl(25, 95%, 53%)" },
  { key: "^IXIC", label: "NASDAQ", color: "hsl(188, 78%, 46%)" },
] as const;

const PORTFOLIO_COLOR_UP = "#10b981";
const PORTFOLIO_COLOR_DOWN = "#ef4444";

const TOP_EQUITIES_SORT_OPTIONS = [
  { label: "Market Cap", value: "marketCap" },
  { label: "1D Change", value: "dayChange" },
  { label: "Revenue", value: "revenue" },
  { label: "Profit", value: "profit" },
];

interface IndexHistoryPoint {
  date: string;
  close: number;
}

interface IndexHistoryResult {
  points: IndexHistoryPoint[];
  isFutures: boolean;
}

function normalizeToPercent(data: { date: string; value: number }[]): { date: string; value: number; raw: number }[] {
  if (data.length === 0) return [];
  const base = data[0].value;
  if (base === 0) return data.map(d => ({ ...d, value: 0, raw: d.value }));
  return data.map(d => ({ date: d.date, value: ((d.value / base) - 1) * 100, raw: d.value }));
}

function formatDateLabel(dateStr: string, range: string): string {
  const d = new Date(dateStr);
  if (range === "1D") {
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  if (range === "1W" || range === "1M") {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  if (range === "1Y") {
    return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
  }
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

export function Dashboard({ user }: DashboardProps) {
  const [, setLocation] = useLocation();
  const [timeRange, setTimeRange] = useState("1D");
  const [activeIndexes, setActiveIndexes] = useState<Set<string>>(new Set());
  const [topEquitiesSort, setTopEquitiesSort] = useState("marketCap");
  const [showAddWatchlist, setShowAddWatchlist] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState("");
  const [showFullHoldings, setShowFullHoldings] = useState(false);
  const displayName = user.firstName || "there";

  const { data: holdingsData = [] } = useQuery<any[]>({
    queryKey: ["/api/portfolio/holdings"],
  });

  const { data: cashData } = useQuery<{ cashBalance: string }>({
    queryKey: ["/api/portfolio/cash"],
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

  const activeIndexSymbols = Array.from(activeIndexes).join(",");

  const { data: indexData = {}, isLoading: indexLoading } = useQuery<Record<string, IndexHistoryResult>>({
    queryKey: ["/api/market/indexes", activeIndexSymbols, timeRange],
    queryFn: async () => {
      if (activeIndexes.size === 0) return {};
      const symbols = Array.from(activeIndexes).join(",");
      const res = await fetch(`/api/market/indexes?symbols=${encodeURIComponent(symbols)}&range=${timeRange}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch indexes");
      return res.json();
    },
    enabled: activeIndexes.size > 0,
  });

  const { data: topEquities = [], isLoading: topEquitiesLoading } = useQuery<any[]>({
    queryKey: ["/api/market/top-equities", topEquitiesSort],
    queryFn: async () => {
      const res = await fetch(`/api/market/top-equities?index=all&sort=${topEquitiesSort}&limit=30`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const { data: watchlists = [] } = useQuery<any[]>({
    queryKey: ["/api/watchlists"],
  });

  const createWatchlistMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("POST", "/api/watchlists", { name, symbols: [] });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watchlists"] });
      setNewWatchlistName("");
      setShowAddWatchlist(false);
    },
  });

  const deleteWatchlistMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/watchlists/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watchlists"] });
    },
  });

  const holdingsValue = holdingsData.reduce((sum: number, h: any) => sum + parseFloat(h.totalValue || "0"), 0);
  const cashBalance = parseFloat(cashData?.cashBalance || "0");
  const totalValue = holdingsValue + cashBalance;

  const portfolioSeries = useMemo(() => {
    const raw = historyData.map((d: any) => ({
      date: d.date,
      value: parseFloat(d.totalValue),
    }));
    return normalizeToPercent(raw);
  }, [historyData]);

  const indexSeries = useMemo(() => {
    const result: Record<string, { date: string; value: number }[]> = {};
    for (const sym of Array.from(activeIndexes)) {
      const historyResult = indexData[sym];
      const points = historyResult?.points || [];
      const raw = points.map((p: IndexHistoryPoint) => ({
        date: p.date,
        value: p.close,
      }));
      result[sym] = normalizeToPercent(raw);
    }
    return result;
  }, [indexData, activeIndexes]);

  const showingFutures = useMemo(() => {
    return Object.values(indexData).some(r => r?.isFutures);
  }, [indexData]);

  const hasPortfolioData = portfolioSeries.length > 1;
  const portfolioColor = hasPortfolioData && portfolioSeries[portfolioSeries.length - 1].value >= 0
    ? PORTFOLIO_COLOR_UP : PORTFOLIO_COLOR_DOWN;
  const hasAnyIndexData = Object.values(indexSeries).some(s => s.length > 0);
  const showChart = hasPortfolioData || hasAnyIndexData;

  const chartData = useMemo(() => {
    const allDates = new Set<string>();
    const portfolioMap = new Map<string, { value: number; raw: number }>();
    const indexMaps: Record<string, Map<string, { value: number; raw: number }>> = {};

    if (hasPortfolioData) {
      for (const p of portfolioSeries) {
        allDates.add(p.date);
        portfolioMap.set(p.date, { value: p.value, raw: p.raw });
      }
    }
    for (const sym of Object.keys(indexSeries)) {
      indexMaps[sym] = new Map();
      for (const p of indexSeries[sym]) {
        allDates.add(p.date);
        indexMaps[sym].set(p.date, { value: p.value, raw: p.raw });
      }
    }

    const sortedDates = Array.from(allDates).sort();

    return sortedDates.map(date => {
      const point: Record<string, any> = { date, dateLabel: formatDateLabel(date, timeRange) };

      if (hasPortfolioData && portfolioMap.has(date)) {
        const entry = portfolioMap.get(date)!;
        point.portfolio = entry.value;
        point._raw_portfolio = entry.raw;
      }

      for (const sym of Object.keys(indexMaps)) {
        if (indexMaps[sym].has(date)) {
          const entry = indexMaps[sym].get(date)!;
          point[sym] = entry.value;
          point[`_raw_${sym}`] = entry.raw;
        }
      }

      return point;
    });
  }, [portfolioSeries, indexSeries, hasPortfolioData, timeRange]);

  const toggleIndex = (symbol: string) => {
    setActiveIndexes(prev => {
      const next = new Set(prev);
      if (next.has(symbol)) {
        next.delete(symbol);
      } else {
        next.add(symbol);
      }
      return next;
    });
  };

  const holdingsEquityItems: EquityItem[] = holdingsData.map((h: any) => ({
    symbol: h.symbol || "???",
    name: h.name || h.symbol || "Unknown",
    price: parseFloat(h.totalValue || "0"),
    changePercent: 0,
  }));

  const topEquityItems: EquityItem[] = (topEquities || []).map((eq: any) => ({
    symbol: eq.symbol || "",
    name: eq.name || eq.shortName || "",
    price: eq.price || eq.regularMarketPrice || 0,
    changePercent: eq.changePercent || eq.regularMarketChangePercent || 0,
    marketCap: eq.marketCap,
    revenue: eq.revenue,
    profit: eq.profit,
  }));

  if (showFullHoldings) {
    return (
      <div className="flex flex-col w-full max-w-sm sm:max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-5xl">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setShowFullHoldings(false)}
            className="p-2 rounded-xl hover:bg-muted transition-colors"
            data-testid="button-back-from-holdings"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-xl md:text-2xl font-semibold text-foreground" data-testid="text-full-holdings-title">
            Your Holdings
          </h1>
        </div>
        <EquityList
          title=""
          items={holdingsEquityItems}
          testIdPrefix="full-holdings"
          emptyMessage="No holdings yet"
          visibleCount={999}
        />
      </div>
    );
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
        {cashBalance > 0 && (
          <p className="text-muted-foreground text-xs mt-1" data-testid="text-cash-balance-dashboard">
            Includes ${cashBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })} cash
          </p>
        )}

        <div className="flex gap-1.5 mt-3 flex-wrap items-center">
          {hasPortfolioData && (
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-card border border-border"
              data-testid="chip-portfolio"
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: portfolioColor }} />
              <span className="text-foreground">Portfolio</span>
            </span>
          )}
          {INDEX_TOGGLES.map(idx => {
            const isActive = activeIndexes.has(idx.key);
            return (
              <button
                key={idx.key}
                onClick={() => toggleIndex(idx.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? "shadow-sm border-2"
                    : "bg-card text-muted-foreground border border-border"
                }`}
                style={isActive ? { borderColor: idx.color, backgroundColor: `${idx.color}10` } : undefined}
                data-testid={`chip-index-${idx.label.replace(/\s+/g, "-").toLowerCase()}`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: isActive ? idx.color : "hsl(var(--muted-foreground))" }}
                />
                <span className={isActive ? "text-foreground" : ""}>{idx.label}</span>
              </button>
            );
          })}
        </div>

        {showChart && (
          <div className="relative mt-4 h-[180px] md:h-[240px] lg:h-[300px]" data-testid="chart-container">
            {showingFutures && (
              <span className="absolute top-1 right-2 z-10 text-[10px] text-muted-foreground font-medium tracking-wide" data-testid="text-futures-label">
                Futures
              </span>
            )}
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
                  hide
                  domain={[(dataMin: number) => Math.min(dataMin - 1, -1), (dataMax: number) => Math.max(dataMax + 1, 1)]}
                />
                <ReferenceLine
                  y={0}
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
                  formatter={(value: number, name: string, props: any) => {
                    const label = name === "portfolio" ? "Portfolio"
                      : INDEX_TOGGLES.find(i => i.key === name)?.label || name;
                    const rawValue = props.payload?.[`_raw_${name}`];
                    const sign = value >= 0 ? "+" : "";
                    const pctStr = `${sign}${value.toFixed(2)}%`;
                    const rawStr = rawValue != null
                      ? (name === "portfolio"
                          ? `$${rawValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : rawValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
                      : "";
                    return [`${pctStr}  ${rawStr}`, label];
                  }}
                  labelFormatter={(_label, payload) => {
                    const rawDate = payload?.[0]?.payload?.date;
                    if (rawDate) {
                      const d = new Date(rawDate);
                      const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                      if (timeRange === "1D") {
                        return dateStr + ", " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
                      }
                      return dateStr;
                    }
                    return _label;
                  }}
                />

                {hasPortfolioData && (
                  <Line
                    type="monotone"
                    dataKey="portfolio"
                    stroke={portfolioColor}
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                    name="portfolio"
                  />
                )}

                {INDEX_TOGGLES.filter(idx => activeIndexes.has(idx.key)).map(idx => (
                  <Line
                    key={idx.key}
                    type="monotone"
                    dataKey={idx.key}
                    stroke={idx.color}
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                    name={idx.key}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {!showChart && activeIndexes.size > 0 && indexLoading && (
          <div className="mt-4 h-[180px] md:h-[240px] lg:h-[300px] flex items-center justify-center" data-testid="chart-loading">
            <p className="text-muted-foreground text-sm">Loading chart data...</p>
          </div>
        )}

        <div className="flex gap-1.5 mt-4 flex-wrap">
          {TIME_RANGES.map(r => (
            <button
              key={r.label}
              onClick={() => setTimeRange(r.label)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                timeRange === r.label ? "bg-primary text-primary-foreground shadow-sm" : "bg-card text-muted-foreground border border-border"
              }`}
              data-testid={`button-range-${r.label}`}
            >
              {r.label}
            </button>
          ))}
        </div>

      </div>

      <EquitySearch />

      {holdingsData.length > 0 ? (
        <EquityList
          title="Your Holdings"
          items={holdingsEquityItems}
          testIdPrefix="holdings"
          emptyMessage="No holdings yet"
          visibleCount={4}
          onTitleClick={() => setShowFullHoldings(true)}
        />
      ) : (
        <div className="bg-card rounded-2xl shadow-sm border border-border p-8 lg:p-12 mb-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-foreground font-medium text-lg" data-testid="text-no-holdings">No holdings yet</p>
          <p className="text-muted-foreground text-sm mt-1">Add your investments to track your portfolio</p>
          <Button
            onClick={() => setLocation("/add-holdings")}
            className="mt-5 rounded-xl"
            data-testid="button-add-holdings-from-dashboard"
          >
            Add Holdings
          </Button>
        </div>
      )}

      <EquityList
        title="Top Equities"
        items={topEquityItems}
        isLoading={topEquitiesLoading}
        testIdPrefix="top-equities"
        visibleCount={10}
        sortOptions={TOP_EQUITIES_SORT_OPTIONS}
        activeSort={topEquitiesSort}
        onSortChange={setTopEquitiesSort}
        emptyMessage="Unable to load market data"
      />

      {watchlists.map((wl: any) => (
        <WatchlistEquityList
          key={wl.id}
          watchlist={wl}
          onDelete={() => deleteWatchlistMutation.mutate(wl.id)}
        />
      ))}

      {showAddWatchlist ? (
        <div className="bg-card rounded-2xl shadow-sm border border-border p-5 lg:p-8 mb-4">
          <h3 className="text-foreground font-semibold text-lg mb-3" data-testid="text-add-watchlist-title">New Watchlist</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (newWatchlistName.trim()) {
                createWatchlistMutation.mutate(newWatchlistName.trim());
              }
            }}
            className="flex gap-2"
          >
            <Input
              value={newWatchlistName}
              onChange={(e) => setNewWatchlistName(e.target.value)}
              placeholder="Watchlist name..."
              className="flex-1"
              data-testid="input-watchlist-name"
              autoFocus
            />
            <Button
              type="submit"
              disabled={!newWatchlistName.trim() || createWatchlistMutation.isPending}
              data-testid="button-save-watchlist"
            >
              {createWatchlistMutation.isPending ? "Saving..." : "Create"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => { setShowAddWatchlist(false); setNewWatchlistName(""); }}
              data-testid="button-cancel-watchlist"
            >
              <X className="w-4 h-4" />
            </Button>
          </form>
        </div>
      ) : (
        <Button
          variant="outline"
          onClick={() => setShowAddWatchlist(true)}
          className="mb-4 self-start"
          data-testid="button-add-watchlist"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Watchlist
        </Button>
      )}
    </div>
  );
}

function WatchlistEquityList({ watchlist, onDelete }: { watchlist: any; onDelete: () => void }) {
  const symbols: string[] = watchlist.symbols || [];

  const { data: quotes = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/market/quotes", watchlist.id, symbols.join(",")],
    queryFn: async () => {
      if (symbols.length === 0) return [];
      const res = await fetch(`/api/market/quotes?symbols=${symbols.join(",")}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: symbols.length > 0,
  });

  const items: EquityItem[] = (quotes || []).map((q: any) => ({
    symbol: q.symbol || "",
    name: q.name || q.shortName || "",
    price: q.price || q.regularMarketPrice || 0,
    changePercent: q.changePercent || q.regularMarketChangePercent || 0,
  }));

  return (
    <EquityList
      title={watchlist.name}
      items={items}
      isLoading={isLoading && symbols.length > 0}
      testIdPrefix={`watchlist-${watchlist.id}`}
      visibleCount={4}
      emptyMessage="No symbols in this watchlist. Use search to add stocks."
      headerAction={
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          data-testid={`button-delete-watchlist-${watchlist.id}`}
        >
          <X className="w-4 h-4" />
        </Button>
      }
    />
  );
}
