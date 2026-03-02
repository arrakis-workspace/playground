import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

const SP500_TOP = [
  "AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "META", "BRK-B", "LLY", "AVGO", "JPM",
  "TSLA", "UNH", "XOM", "V", "PG", "MA", "JNJ", "COST", "HD", "ABBV",
  "MRK", "WMT", "NFLX", "CRM", "BAC", "CVX", "KO", "PEP", "AMD", "TMO",
];
const DOW_TOP = [
  "AAPL", "MSFT", "UNH", "GS", "HD", "AMGN", "MCD", "CAT", "V", "CRM",
  "TRV", "AXP", "JPM", "IBM", "BA", "HON", "JNJ", "WMT", "PG", "DIS",
  "MRK", "NKE", "CVX", "MMM", "CSCO", "KO", "DOW", "INTC", "VZ", "WBA",
];
const NASDAQ_TOP = [
  "AAPL", "MSFT", "NVDA", "AMZN", "META", "AVGO", "TSLA", "GOOGL", "COST", "NFLX",
  "AMD", "ADBE", "PEP", "CSCO", "TMUS", "INTC", "INTU", "QCOM", "TXN", "AMGN",
  "CMCSA", "AMAT", "ISRG", "LRCX", "MU", "BKNG", "REGN", "ADI", "MDLZ", "PANW",
];

export const INDEX_CONSTITUENTS: Record<string, string[]> = {
  sp500: SP500_TOP,
  dow: DOW_TOP,
  nasdaq: NASDAQ_TOP,
};

export const INDEX_SYMBOLS: Record<string, string> = {
  sp500: "^GSPC",
  dow: "^DJI",
  nasdaq: "^IXIC",
};

const INDEX_FUTURES: Record<string, string> = {
  "^GSPC": "ES=F",
  "^DJI": "YM=F",
  "^IXIC": "NQ=F",
};

interface QuoteResult {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap: number | null;
  currency: string;
}

interface IndexHistoryPoint {
  date: string;
  close: number;
  open: number | null;
  high: number | null;
  low: number | null;
  volume: number | null;
}

interface EquityDetail extends QuoteResult {
  revenue: number | null;
  profit: number | null;
}

interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
}

const quoteCache = new Map<string, { data: QuoteResult; timestamp: number }>();
const historyCache = new Map<string, { data: IndexHistoryResult; timestamp: number }>();
const fundamentalsCache = new Map<string, { data: { revenue: number | null; profit: number | null }; timestamp: number }>();
const equityDetailCache = new Map<string, { data: EquityDetailFull; timestamp: number }>();
const searchCache = new Map<string, { data: SearchResult[]; timestamp: number }>();

const QUOTE_TTL = 60 * 1000;
const HISTORY_TTL = 5 * 60 * 1000;
const FUNDAMENTALS_TTL = 60 * 60 * 1000;
const EQUITY_DETAIL_TTL = 2 * 60 * 1000;
const SEARCH_TTL = 5 * 60 * 1000;

function getRangeParams(range: string): { period1: Date; interval: "1d" | "1wk" | "1mo" | "5m" | "15m" | "1h" } {
  const now = new Date();
  switch (range) {
    case "1D": {
      const start = new Date(now);
      start.setDate(start.getDate() - 1);
      return { period1: start, interval: "5m" };
    }
    case "1W": {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      return { period1: start, interval: "15m" };
    }
    case "1M": {
      const start = new Date(now);
      start.setMonth(start.getMonth() - 1);
      return { period1: start, interval: "1d" };
    }
    case "1Y": {
      const start = new Date(now);
      start.setFullYear(start.getFullYear() - 1);
      return { period1: start, interval: "1d" };
    }
    case "5Y": {
      const start = new Date(now);
      start.setFullYear(start.getFullYear() - 5);
      return { period1: start, interval: "1wk" };
    }
    case "All": {
      const start = new Date("2000-01-01");
      return { period1: start, interval: "1mo" };
    }
    default: {
      const start = new Date(now);
      start.setDate(start.getDate() - 1);
      return { period1: start, interval: "5m" };
    }
  }
}

export interface IndexHistoryResult {
  points: IndexHistoryPoint[];
  isFutures: boolean;
}

async function fetchChartData(tickerSymbol: string, range: string): Promise<IndexHistoryPoint[]> {
  const { period1, interval } = getRangeParams(range);
  const result = await yahooFinance.chart(tickerSymbol, { period1, interval });
  return (result.quotes || [])
    .filter((q: any) => q.close != null)
    .map((q: any) => ({
      date: new Date(q.date).toISOString(),
      close: q.close,
      open: q.open ?? null,
      high: q.high ?? null,
      low: q.low ?? null,
      volume: q.volume ?? null,
    }));
}

export async function getIndexHistory(symbol: string, range: string): Promise<IndexHistoryResult> {
  const cacheKey = `${symbol}:${range}`;
  const cached = historyCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < HISTORY_TTL) {
    return cached.data;
  }

  try {
    let points = await fetchChartData(symbol, range);
    let isFutures = false;

    if (points.length === 0 && INDEX_FUTURES[symbol]) {
      points = await fetchChartData(INDEX_FUTURES[symbol], range);
      isFutures = points.length > 0;
    }

    const result: IndexHistoryResult = { points, isFutures };
    historyCache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  } catch (err: any) {
    console.error(`Failed to fetch history for ${symbol}:`, err.message);
    return cached?.data || { points: [], isFutures: false };
  }
}

export async function getQuotes(symbols: string[]): Promise<QuoteResult[]> {
  const results: QuoteResult[] = [];
  const toFetch: string[] = [];

  for (const sym of symbols) {
    const cached = quoteCache.get(sym);
    if (cached && Date.now() - cached.timestamp < QUOTE_TTL) {
      results.push(cached.data);
    } else {
      toFetch.push(sym);
    }
  }

  if (toFetch.length > 0) {
    const batchSize = 10;
    for (let i = 0; i < toFetch.length; i += batchSize) {
      const batch = toFetch.slice(i, i + batchSize);
      const promises = batch.map(async (sym) => {
        try {
          const quote = await yahooFinance.quote(sym);
          const result: QuoteResult = {
            symbol: sym,
            name: quote.shortName || quote.longName || sym,
            price: quote.regularMarketPrice || 0,
            change: quote.regularMarketChange || 0,
            changePercent: quote.regularMarketChangePercent || 0,
            marketCap: quote.marketCap || null,
            currency: quote.currency || "USD",
          };
          quoteCache.set(sym, { data: result, timestamp: Date.now() });
          return result;
        } catch (err: any) {
          console.error(`Failed to fetch quote for ${sym}:`, err.message);
          return null;
        }
      });
      const batchResults = await Promise.all(promises);
      for (const r of batchResults) {
        if (r) results.push(r);
      }
    }
  }

  return results;
}

export async function getFundamentals(symbol: string): Promise<{ revenue: number | null; profit: number | null }> {
  const cached = fundamentalsCache.get(symbol);
  if (cached && Date.now() - cached.timestamp < FUNDAMENTALS_TTL) {
    return cached.data;
  }

  try {
    const summary = await yahooFinance.quoteSummary(symbol, { modules: ["financialData", "incomeStatementHistory"] });
    const revenue = summary.financialData?.totalRevenue || null;
    const profit = summary.financialData?.ebitda || null;
    const result = { revenue, profit };
    fundamentalsCache.set(symbol, { data: result, timestamp: Date.now() });
    return result;
  } catch (err: any) {
    console.error(`Failed to fetch fundamentals for ${symbol}:`, err.message);
    return { revenue: null, profit: null };
  }
}

export async function getTopEquities(
  index: string,
  sortBy: string = "marketCap",
  limit: number = 10
): Promise<EquityDetail[]> {
  let constituents: string[];
  if (index === "all") {
    const allSymbols = new Set<string>();
    for (const syms of Object.values(INDEX_CONSTITUENTS)) {
      for (const s of syms) allSymbols.add(s);
    }
    constituents = Array.from(allSymbols);
  } else {
    constituents = INDEX_CONSTITUENTS[index];
    if (!constituents) return [];
  }

  const quotes = await getQuotes(constituents);

  let enrichedQuotes: EquityDetail[] = quotes.map(q => ({
    ...q,
    revenue: null,
    profit: null,
  }));

  if (sortBy === "revenue" || sortBy === "profit") {
    const fundamentalPromises = enrichedQuotes.map(async (q) => {
      const f = await getFundamentals(q.symbol);
      return { ...q, revenue: f.revenue, profit: f.profit };
    });
    enrichedQuotes = await Promise.all(fundamentalPromises);
  }

  enrichedQuotes.sort((a, b) => {
    switch (sortBy) {
      case "marketCap":
        return (b.marketCap || 0) - (a.marketCap || 0);
      case "dayChange":
        return (b.changePercent || 0) - (a.changePercent || 0);
      case "revenue":
        return (b.revenue || 0) - (a.revenue || 0);
      case "profit":
        return (b.profit || 0) - (a.profit || 0);
      default:
        return (b.marketCap || 0) - (a.marketCap || 0);
    }
  });

  return enrichedQuotes.slice(0, limit);
}

export interface EquityDetailFull {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap: number | null;
  currency: string;
  pe: number | null;
  eps: number | null;
  high52w: number | null;
  low52w: number | null;
  dividendYield: number | null;
  volume: number | null;
  avgVolume: number | null;
  beta: number | null;
  sector: string | null;
  industry: string | null;
  description: string | null;
  revenue: number | null;
  profit: number | null;
  open: number | null;
  previousClose: number | null;
  dayHigh: number | null;
  dayLow: number | null;
}

export async function getEquityDetail(symbol: string): Promise<EquityDetailFull | null> {
  const cached = equityDetailCache.get(symbol);
  if (cached && Date.now() - cached.timestamp < EQUITY_DETAIL_TTL) {
    return cached.data;
  }

  try {
    const [quoteResult, summaryResult] = await Promise.all([
      yahooFinance.quote(symbol),
      yahooFinance.quoteSummary(symbol, {
        modules: ["financialData", "summaryProfile", "defaultKeyStatistics", "summaryDetail"],
      }).catch(() => null),
    ]);

    const q = quoteResult as any;
    const fd = summaryResult?.financialData as any;
    const sp = summaryResult?.summaryProfile as any;
    const ks = summaryResult?.defaultKeyStatistics as any;
    const sd = summaryResult?.summaryDetail as any;

    const detail: EquityDetailFull = {
      symbol: q.symbol,
      name: q.shortName || q.longName || symbol,
      price: q.regularMarketPrice || 0,
      change: q.regularMarketChange || 0,
      changePercent: q.regularMarketChangePercent || 0,
      marketCap: q.marketCap || null,
      currency: q.currency || "USD",
      pe: sd?.trailingPE || ks?.trailingPE || null,
      eps: ks?.trailingEps || null,
      high52w: sd?.fiftyTwoWeekHigh || null,
      low52w: sd?.fiftyTwoWeekLow || null,
      dividendYield: sd?.dividendYield || null,
      volume: q.regularMarketVolume || null,
      avgVolume: q.averageDailyVolume3Month || null,
      beta: ks?.beta || null,
      sector: sp?.sector || null,
      industry: sp?.industry || null,
      description: sp?.longBusinessSummary || null,
      revenue: fd?.totalRevenue || null,
      profit: fd?.ebitda || null,
      open: q.regularMarketOpen || null,
      previousClose: q.regularMarketPreviousClose || null,
      dayHigh: q.regularMarketDayHigh || null,
      dayLow: q.regularMarketDayLow || null,
    };
    equityDetailCache.set(symbol, { data: detail, timestamp: Date.now() });
    return detail;
  } catch (err: any) {
    console.error(`Failed to fetch equity detail for ${symbol}:`, err.message);
    return cached?.data || null;
  }
}

export async function getEquityChart(symbol: string, range: string): Promise<IndexHistoryPoint[]> {
  const cacheKey = `equity:${symbol}:${range}`;
  const cached = historyCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < HISTORY_TTL) {
    return cached.data.points;
  }

  try {
    let points = await fetchChartData(symbol, range);

    if (points.length === 0 && range === "1D") {
      const now = new Date();
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      const result = await yahooFinance.chart(symbol, { period1: start, interval: "5m" });
      const allPoints = (result.quotes || [])
        .filter((q: any) => q.close != null)
        .map((q: any) => ({
          date: new Date(q.date).toISOString(),
          close: q.close,
          open: q.open ?? null,
          high: q.high ?? null,
          low: q.low ?? null,
          volume: q.volume ?? null,
        }));

      if (allPoints.length > 0) {
        const toET = (iso: string) => {
          const d = new Date(iso);
          return d.toLocaleDateString("en-US", { timeZone: "America/New_York" });
        };
        const lastTradingDay = toET(allPoints[allPoints.length - 1].date);
        points = allPoints.filter(p => toET(p.date) === lastTradingDay);
      }
    }

    historyCache.set(cacheKey, { data: { points, isFutures: false }, timestamp: Date.now() });
    return points;
  } catch (err: any) {
    console.error(`Failed to fetch chart for ${symbol}:`, err.message);
    return cached?.data.points || [];
  }
}

export async function searchEquities(query: string): Promise<SearchResult[]> {
  if (!query || query.length < 1) return [];

  const cacheKey = query.toLowerCase().trim();
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < SEARCH_TTL) {
    return cached.data;
  }

  try {
    const result = await yahooFinance.search(query, { quotesCount: 10, newsCount: 0 });
    const results = (result.quotes || [])
      .filter((q: any) => q.quoteType === "EQUITY" || q.quoteType === "ETF")
      .map((q: any) => ({
        symbol: q.symbol,
        name: q.shortname || q.longname || q.symbol,
        exchange: q.exchDisp || q.exchange || "",
        type: q.quoteType || "EQUITY",
      }));
    searchCache.set(cacheKey, { data: results, timestamp: Date.now() });
    return results;
  } catch (err: any) {
    console.error("Search error:", err.message);
    return cached?.data || [];
  }
}
