import { useState } from "react";
import { TrendingUp, TrendingDown, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";

export function CompanyLogo({ symbol, className = "w-10 h-10 rounded-lg" }: { symbol: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  const logoUrl = `https://assets.parqet.com/logos/symbol/${encodeURIComponent(symbol)}`;

  if (failed) {
    return (
      <div className={`bg-primary/10 flex items-center justify-center ${className}`}>
        <span className="text-primary text-xs font-bold">{symbol.slice(0, 4)}</span>
      </div>
    );
  }

  return (
    <img
      src={logoUrl}
      alt={symbol}
      className={`object-contain bg-white ${className}`}
      onError={() => setFailed(true)}
      loading="lazy"
    />
  );
}

export interface EquityItem {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  marketCap?: number;
  revenue?: number;
  profit?: number;
}

interface EquityListProps {
  title: string;
  items: EquityItem[];
  isLoading?: boolean;
  visibleCount?: number;
  testIdPrefix: string;
  sortOptions?: { label: string; value: string }[];
  activeSort?: string;
  onSortChange?: (sort: string) => void;
  emptyMessage?: string;
  headerAction?: React.ReactNode;
  onTitleClick?: () => void;
}

export function EquityList({
  title,
  items,
  isLoading = false,
  visibleCount = 10,
  testIdPrefix,
  sortOptions,
  activeSort,
  onSortChange,
  emptyMessage = "No items to display",
  headerAction,
  onTitleClick,
}: EquityListProps) {
  const [, setLocation] = useLocation();

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border p-5 lg:p-8 mb-4" data-testid={`section-${testIdPrefix}`}>
      <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
        <div className="flex items-center gap-2">
          {title && (
            onTitleClick ? (
              <button
                onClick={onTitleClick}
                className="flex items-center gap-1 group"
                data-testid={`text-${testIdPrefix}-title`}
              >
                <h3 className="text-foreground font-semibold text-lg group-hover:text-primary transition-colors">
                  {title}
                </h3>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>
            ) : (
              <h3 className="text-foreground font-semibold text-lg" data-testid={`text-${testIdPrefix}-title`}>
                {title}
              </h3>
            )
          )}
          {headerAction}
        </div>
        {sortOptions && sortOptions.length > 0 && (
          <select
            value={activeSort}
            onChange={(e) => onSortChange?.(e.target.value)}
            className="bg-card text-foreground text-xs font-medium border border-border rounded-md px-2 py-1.5 outline-none focus:ring-1 focus:ring-primary"
            data-testid={`select-${testIdPrefix}-sort`}
          >
            {sortOptions.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: Math.min(visibleCount, 5) }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted animate-pulse" />
                <div>
                  <div className="w-16 h-4 bg-muted rounded animate-pulse mb-1" />
                  <div className="w-24 h-3 bg-muted rounded animate-pulse" />
                </div>
              </div>
              <div className="text-right">
                <div className="w-16 h-4 bg-muted rounded animate-pulse mb-1" />
                <div className="w-12 h-3 bg-muted rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground text-sm py-4 text-center" data-testid={`text-${testIdPrefix}-empty`}>
          {emptyMessage}
        </p>
      ) : (
        <div
          className="overflow-y-auto"
          style={{ maxHeight: items.length > visibleCount ? `${visibleCount * 60}px` : undefined }}
        >
          {items.map((item) => (
            <div
              key={item.symbol}
              className="flex items-center justify-between py-3 border-b border-border last:border-0 -mx-2 px-2 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
              data-testid={`equity-item-${testIdPrefix}-${item.symbol}`}
              onClick={() => setLocation(`/equity/${item.symbol}`)}
            >
              <div className="flex items-center gap-3">
                <CompanyLogo symbol={item.symbol} className="w-10 h-10 rounded-lg flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-foreground font-medium text-sm" data-testid={`text-symbol-${item.symbol}`}>{item.symbol}</p>
                  <p className="text-muted-foreground text-xs truncate max-w-[140px] sm:max-w-[200px]">{item.name}</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-foreground font-medium text-sm" data-testid={`text-price-${item.symbol}`}>
                  ${item.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <div className="flex items-center justify-end gap-1">
                  {item.changePercent >= 0 ? (
                    <TrendingUp className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-500" />
                  )}
                  <p
                    className={`text-xs font-medium ${item.changePercent >= 0 ? "text-emerald-600" : "text-red-500"}`}
                    data-testid={`text-change-${item.symbol}`}
                  >
                    {item.changePercent >= 0 ? "+" : ""}{item.changePercent.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
