import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Search, Plus, X, Loader2, ListPlus } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CompanyLogo } from "./EquityList";

interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
}

interface Watchlist {
  id: string;
  userId: string;
  name: string;
  symbols: string[];
}

export function EquitySearch() {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeSymbol, setActiveSymbol] = useState<string | null>(null);
  const [showNewWatchlistInput, setShowNewWatchlistInput] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (debouncedQuery.length > 0) {
      setIsOpen(true);
    }
  }, [debouncedQuery]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setActiveSymbol(null);
        setShowNewWatchlistInput(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
        setActiveSymbol(null);
        setShowNewWatchlistInput(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const { data: searchResults = [], isLoading: isSearching } = useQuery<SearchResult[]>({
    queryKey: ["/api/market/search", debouncedQuery],
    queryFn: async () => {
      const res = await fetch(`/api/market/search?q=${encodeURIComponent(debouncedQuery)}`, { credentials: "include" });
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
    enabled: debouncedQuery.length > 0,
    staleTime: 1000 * 60 * 5,
  });

  const { data: watchlists = [] } = useQuery<Watchlist[]>({
    queryKey: ["/api/watchlists"],
  });

  const addToWatchlistMutation = useMutation({
    mutationFn: async ({ watchlistId, symbol }: { watchlistId: string; symbol: string }) => {
      const wl = watchlists.find(w => w.id === watchlistId);
      if (!wl) throw new Error("Watchlist not found");
      const updatedSymbols = Array.from(new Set([...wl.symbols, symbol]));
      await apiRequest("PUT", `/api/watchlists/${watchlistId}`, { name: wl.name, symbols: updatedSymbols });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watchlists"] });
      setActiveSymbol(null);
    },
  });

  const createWatchlistMutation = useMutation({
    mutationFn: async ({ name, symbol }: { name: string; symbol: string }) => {
      await apiRequest("POST", "/api/watchlists", { name, symbols: [symbol] });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watchlists"] });
      setActiveSymbol(null);
      setShowNewWatchlistInput(false);
      setNewWatchlistName("");
    },
  });

  const handleAddToWatchlist = useCallback((watchlistId: string, symbol: string) => {
    addToWatchlistMutation.mutate({ watchlistId, symbol });
  }, [addToWatchlistMutation]);

  const handleCreateWatchlist = useCallback((symbol: string) => {
    if (!newWatchlistName.trim()) return;
    createWatchlistMutation.mutate({ name: newWatchlistName.trim(), symbol });
  }, [createWatchlistMutation, newWatchlistName]);

  return (
    <div ref={containerRef} className="relative w-full mb-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search stocks, ETFs..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => { if (debouncedQuery.length > 0) setIsOpen(true); }}
          className="pl-9 pr-9 bg-card border-border text-foreground placeholder:text-muted-foreground"
          data-testid="input-equity-search"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setDebouncedQuery(""); setIsOpen(false); setActiveSymbol(null); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            data-testid="button-clear-search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && debouncedQuery.length > 0 && (
        <div className="absolute z-50 top-full mt-1 w-full bg-card border border-border rounded-md shadow-lg max-h-80 overflow-y-auto" data-testid="dropdown-search-results">
          {isSearching && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {!isSearching && searchResults.length === 0 && (
            <div className="py-6 text-center text-sm text-muted-foreground" data-testid="text-no-results">
              No results found for "{debouncedQuery}"
            </div>
          )}

          {!isSearching && searchResults.map((result) => (
            <div key={result.symbol} className="border-b border-border last:border-0">
              <div className="flex items-center justify-between px-3 py-2.5 hover:bg-muted/50 transition-colors" data-testid={`search-result-${result.symbol}`}>
                <div
                  className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                  onClick={() => setLocation(`/equity/${result.symbol}`)}
                >
                  <CompanyLogo symbol={result.symbol} className="w-8 h-8 rounded-md flex-shrink-0" />
                  <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-foreground font-semibold text-sm" data-testid={`text-symbol-${result.symbol}`}>{result.symbol}</span>
                    {result.exchange && (
                      <span className="text-muted-foreground text-xs">{result.exchange}</span>
                    )}
                  </div>
                  <p className="text-muted-foreground text-xs truncate mt-0.5" data-testid={`text-name-${result.symbol}`}>
                    {result.name || ""}
                  </p>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setActiveSymbol(activeSymbol === result.symbol ? null : result.symbol)}
                  data-testid={`button-add-${result.symbol}`}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {activeSymbol === result.symbol && (
                <div className="px-3 pb-2.5 flex flex-col gap-1" data-testid={`menu-watchlist-${result.symbol}`}>
                  <p className="text-xs text-muted-foreground font-medium mb-1">Add to watchlist:</p>
                  {watchlists.map(wl => {
                    const alreadyIn = wl.symbols.includes(result.symbol);
                    return (
                      <Button
                        key={wl.id}
                        variant="ghost"
                        size="sm"
                        disabled={alreadyIn || addToWatchlistMutation.isPending}
                        onClick={() => handleAddToWatchlist(wl.id, result.symbol)}
                        className="justify-start text-xs"
                        data-testid={`button-watchlist-${wl.id}-${result.symbol}`}
                      >
                        <ListPlus className="w-3.5 h-3.5 mr-1.5" />
                        {wl.name}
                        {alreadyIn && <span className="ml-auto text-muted-foreground">(added)</span>}
                      </Button>
                    );
                  })}

                  {!showNewWatchlistInput ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowNewWatchlistInput(true)}
                      className="justify-start text-xs text-primary"
                      data-testid={`button-new-watchlist-${result.symbol}`}
                    >
                      <Plus className="w-3.5 h-3.5 mr-1.5" />
                      New watchlist
                    </Button>
                  ) : (
                    <div className="flex items-center gap-1.5 mt-1">
                      <Input
                        placeholder="Watchlist name"
                        value={newWatchlistName}
                        onChange={e => setNewWatchlistName(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") handleCreateWatchlist(result.symbol); }}
                        className="text-xs h-8"
                        autoFocus
                        data-testid={`input-new-watchlist-name-${result.symbol}`}
                      />
                      <Button
                        size="sm"
                        disabled={!newWatchlistName.trim() || createWatchlistMutation.isPending}
                        onClick={() => handleCreateWatchlist(result.symbol)}
                        data-testid={`button-create-watchlist-${result.symbol}`}
                      >
                        {createWatchlistMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Add"}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
