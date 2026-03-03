import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageLayout } from "@/components/PageLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Upload, Building2, PenLine, ArrowRight, Loader2,
  ShieldCheck, Lock, Globe, Plus, DollarSign, Trash2,
  FileText, CheckCircle2
} from "lucide-react";
import { CompanyLogo } from "@/components/home/EquityList";

export function AddHoldings() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: manualHoldings = [], refetch: refetchHoldings } = useQuery<any[]>({
    queryKey: ["/api/portfolio/manual-holdings"],
  });

  const { data: cashData } = useQuery<{ cashBalance: string }>({
    queryKey: ["/api/portfolio/cash"],
  });

  const cashBalance = parseFloat(cashData?.cashBalance || "0");

  return (
    <PageLayout showBottomNav={false}>
      <div className="flex flex-col items-center w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg py-6 lg:py-12">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold text-foreground tracking-tight" data-testid="text-add-holdings-title">
            Add Holdings
          </h2>
          <p className="text-muted-foreground text-sm mt-2" data-testid="text-add-holdings-subtitle">
            Choose how you'd like to add your investments
          </p>
        </div>

        {cashBalance > 0 && (
          <div className="w-full bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 mb-4 flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-emerald-500 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Cash Balance</p>
              <p className="text-sm font-semibold text-foreground" data-testid="text-cash-balance">
                ${cashBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        )}

        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="upload" className="text-xs" data-testid="tab-upload">
              <Upload className="w-3.5 h-3.5 mr-1.5" />Upload
            </TabsTrigger>
            <TabsTrigger value="link" className="text-xs" data-testid="tab-link">
              <Building2 className="w-3.5 h-3.5 mr-1.5" />Link
            </TabsTrigger>
            <TabsTrigger value="manual" className="text-xs" data-testid="tab-manual">
              <PenLine className="w-3.5 h-3.5 mr-1.5" />Manual
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <UploadStatementTab onImported={refetchHoldings} />
          </TabsContent>

          <TabsContent value="link">
            <LinkBrokerageTab />
          </TabsContent>

          <TabsContent value="manual">
            <ManualEntryTab
              holdings={manualHoldings}
              onChanged={refetchHoldings}
            />
          </TabsContent>
        </Tabs>

        <Button
          variant="ghost"
          onClick={() => setLocation("/")}
          className="mt-3 text-muted-foreground hover:text-primary text-sm"
          data-testid="button-skip-holdings"
        >
          Skip for now
        </Button>
      </div>
    </PageLayout>
  );
}

function UploadStatementTab({ onImported }: { onImported: () => void }) {
  const { toast } = useToast();
  const [parsedResult, setParsedResult] = useState<{ brokerage: string; holdings: any[] } | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("statement", file);
      const res = await fetch("/api/portfolio/upload-statement", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to parse statement");
      return res.json();
    },
    onSuccess: (data) => {
      setParsedResult(data);
      if (data.holdings.length === 0) {
        toast({ title: "No holdings found in the statement. Try a different file.", variant: "destructive" });
      }
    },
    onError: () => {
      toast({ title: "Failed to parse statement", variant: "destructive" });
    },
  });

  const importMutation = useMutation({
    mutationFn: async (holdings: any[]) => {
      const res = await apiRequest("POST", "/api/portfolio/import-holdings", { holdings });
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: `Imported ${data.imported} holdings` });
      setParsedResult(null);
      onImported();
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio/holdings"] });
      queryClient.removeQueries({ queryKey: ["/api/portfolio/history"] });
    },
    onError: () => {
      toast({ title: "Failed to import holdings", variant: "destructive" });
    },
  });

  const handleFile = useCallback((file: File) => {
    if (file.type !== "application/pdf") {
      toast({ title: "Please upload a PDF file", variant: "destructive" });
      return;
    }
    uploadMutation.mutate(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border p-5 mt-3">
      <h3 className="text-foreground font-semibold mb-1" data-testid="text-upload-title">Upload Statement</h3>
      <p className="text-muted-foreground text-xs mb-4">
        Supports Fidelity, Vanguard, Schwab, Merrill, Robinhood, E*Trade, Morgan Stanley
      </p>

      {!parsedResult ? (
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
            dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = ".pdf";
            input.onchange = (e: any) => {
              if (e.target.files?.[0]) handleFile(e.target.files[0]);
            };
            input.click();
          }}
          data-testid="dropzone-statement"
        >
          {uploadMutation.isPending ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Parsing statement...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <FileText className="w-8 h-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Drop your PDF statement here or <span className="text-primary font-medium">browse</span>
              </p>
              <p className="text-xs text-muted-foreground/60">PDF files up to 10MB</p>
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-sm text-foreground font-medium">
              {parsedResult.brokerage !== "unknown" ? parsedResult.brokerage.charAt(0).toUpperCase() + parsedResult.brokerage.slice(1) : "Statement"} — {parsedResult.holdings.length} holdings found
            </span>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2 mb-4">
            {parsedResult.holdings.map((h, i) => (
              <div key={i} className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <CompanyLogo symbol={h.symbol} className="w-8 h-8 rounded-lg" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{h.symbol}</p>
                    <p className="text-xs text-muted-foreground">{h.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{h.quantity} shares</p>
                  <p className="text-xs text-muted-foreground">${parseFloat(h.purchasePrice).toFixed(2)}/share</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setParsedResult(null)}
              className="flex-1 h-10 rounded-xl text-sm"
              data-testid="button-cancel-import"
            >
              Cancel
            </Button>
            <Button
              onClick={() => importMutation.mutate(parsedResult.holdings)}
              disabled={importMutation.isPending || parsedResult.holdings.length === 0}
              className="flex-1 h-10 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm"
              data-testid="button-import-all"
            >
              {importMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Import All"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function LinkBrokerageTab() {
  const { toast } = useToast();

  const registerMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/snaptrade/register");
      const res = await apiRequest("GET", "/api/snaptrade/login-url");
      return res.json();
    },
    onSuccess: (data: any) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (err: any) => {
      toast({ title: err.message || "Failed to connect brokerage", variant: "destructive" });
    },
  });

  const features = [
    { icon: ShieldCheck, text: "Read-only access to your portfolio" },
    { icon: Lock, text: "Bank-level security encryption" },
    { icon: Globe, text: "Supports major US and Canadian brokerages" },
  ];

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border p-5 mt-3">
      <div className="flex items-center gap-4 mb-5">
        <div className="bg-primary/10 rounded-xl p-3">
          <Building2 className="w-7 h-7 text-primary" />
        </div>
        <div>
          <h3 className="text-foreground font-semibold" data-testid="text-snaptrade-title">SnapTrade Connect</h3>
          <p className="text-muted-foreground text-xs">Securely link 300+ brokerages</p>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        {features.map((f, i) => (
          <div key={i} className="flex items-center gap-3">
            <f.icon className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="text-sm text-muted-foreground">{f.text}</span>
          </div>
        ))}
      </div>

      <Button
        onClick={() => registerMutation.mutate()}
        disabled={registerMutation.isPending}
        className="h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium w-full"
        data-testid="button-link-brokerage"
      >
        {registerMutation.isPending ? (
          <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Connecting...</span>
        ) : (
          <span className="flex items-center gap-2">Connect Brokerage <ArrowRight className="w-4 h-4" /></span>
        )}
      </Button>
    </div>
  );
}

function ManualEntryTab({ holdings, onChanged }: { holdings: any[]; onChanged: () => void }) {
  const { toast } = useToast();
  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [sellDialog, setSellDialog] = useState<{ holdingId: string; symbol: string; maxShares: number } | null>(null);
  const [tickerQuery, setTickerQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<{ symbol: string; name: string }[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tickerQuery.length < 1) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/market/search?q=${encodeURIComponent(tickerQuery)}`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.slice(0, 8));
        }
      } catch {}
      setSearchLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [tickerQuery]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const qty = parseFloat(quantity) || 0;
  const price = parseFloat(purchasePrice) || 0;
  const totalValue = qty * price;

  const addMutation = useMutation({
    mutationFn: async () => {
      const body: any = {
        symbol: symbol.toUpperCase(),
        name: name || symbol.toUpperCase(),
        quantity,
        purchasePrice,
      };
      if (purchaseDate) body.purchaseDate = purchaseDate;
      const res = await apiRequest("POST", "/api/portfolio/manual-holdings", body);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Holding added" });
      setSymbol("");
      setName("");
      setQuantity("");
      setPurchasePrice("");
      setPurchaseDate("");
      onChanged();
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio/holdings"] });
      queryClient.removeQueries({ queryKey: ["/api/portfolio/history"] });
    },
    onError: () => {
      toast({ title: "Failed to add holding", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/portfolio/manual-holdings/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Holding removed" });
      onChanged();
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio/holdings"] });
      queryClient.removeQueries({ queryKey: ["/api/portfolio/history"] });
    },
  });

  const isValid = symbol.trim().length > 0 && qty > 0 && price > 0;

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border p-5 mt-3">
      <h3 className="text-foreground font-semibold mb-4" data-testid="text-manual-title">Add Manually</h3>

      <div className="space-y-3">
        <div className="relative" ref={suggestionsRef}>
          <Label htmlFor="symbol" className="text-xs text-muted-foreground">Ticker Symbol</Label>
          <Input
            id="symbol"
            value={symbol}
            onChange={(e) => {
              const val = e.target.value.toUpperCase();
              setSymbol(val);
              setTickerQuery(val);
              setShowSuggestions(true);
            }}
            onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
            placeholder="e.g. AAPL"
            className="h-10 mt-1 rounded-xl"
            data-testid="input-symbol"
            autoComplete="off"
          />
          {showSuggestions && symbol.length > 0 && (suggestions.length > 0 || searchLoading) && (
            <div className="absolute z-20 left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg max-h-[240px] overflow-y-auto">
              {searchLoading && suggestions.length === 0 ? (
                <div className="px-3 py-2 text-xs text-muted-foreground">Searching...</div>
              ) : (
                suggestions.map((s) => (
                  <button
                    key={s.symbol}
                    type="button"
                    className="w-full text-left px-3 py-2.5 hover:bg-muted/50 transition-colors flex items-center justify-between gap-2 border-b border-border last:border-0"
                    data-testid={`suggestion-${s.symbol}`}
                    onClick={() => {
                      setSymbol(s.symbol);
                      setName(s.name);
                      setShowSuggestions(false);
                      setSuggestions([]);
                    }}
                  >
                    <div className="min-w-0">
                      <span className="text-foreground font-medium text-sm">{s.symbol}</span>
                      <span className="text-muted-foreground text-xs ml-2 truncate">{s.name}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="name" className="text-xs text-muted-foreground">Company Name (optional)</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Apple Inc."
            className="h-10 mt-1 rounded-xl"
            data-testid="input-name"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="quantity" className="text-xs text-muted-foreground">Number of Shares</Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
              className="h-10 mt-1 rounded-xl"
              data-testid="input-quantity"
              min="0"
              step="any"
            />
          </div>
          <div>
            <Label htmlFor="price" className="text-xs text-muted-foreground">Purchase Price ($)</Label>
            <Input
              id="price"
              type="number"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
              placeholder="0.00"
              className="h-10 mt-1 rounded-xl"
              data-testid="input-purchase-price"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="purchaseDate" className="text-xs text-muted-foreground">Purchase Date (optional)</Label>
          <Input
            id="purchaseDate"
            type="date"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
            className="h-10 mt-1 rounded-xl"
            data-testid="input-purchase-date"
            max={new Date().toISOString().split("T")[0]}
          />
        </div>

        {totalValue > 0 && (
          <div className="bg-muted/50 rounded-xl p-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Total Value</span>
            <span className="text-sm font-semibold text-foreground" data-testid="text-total-value">
              ${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        )}

        <Button
          onClick={() => addMutation.mutate()}
          disabled={!isValid || addMutation.isPending}
          className="h-10 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium w-full"
          data-testid="button-add-holding"
        >
          {addMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <span className="flex items-center gap-2"><Plus className="w-4 h-4" /> Add Holding</span>
          )}
        </Button>
      </div>

      {holdings.length > 0 && (
        <div className="mt-5 pt-5 border-t border-border">
          <h4 className="text-sm font-medium text-foreground mb-3">Your Manual Holdings</h4>
          <div className="space-y-2">
            {holdings.map((h: any) => (
              <div key={h.id} className="flex items-center justify-between bg-muted/50 rounded-xl p-3">
                <div className="flex items-center gap-3">
                  <CompanyLogo symbol={h.symbol} className="w-8 h-8 rounded-lg" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{h.symbol}</p>
                    <p className="text-xs text-muted-foreground">{parseFloat(h.quantity)} shares @ ${parseFloat(h.purchasePrice).toFixed(2)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground mr-2" data-testid={`text-holding-value-${h.id}`}>
                    ${parseFloat(h.totalValue).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSellDialog({ holdingId: h.id, symbol: h.symbol, maxShares: parseFloat(h.quantity) })}
                    className="h-7 px-2 text-xs rounded-lg"
                    data-testid={`button-sell-${h.id}`}
                  >
                    Sold
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMutation.mutate(h.id)}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    data-testid={`button-delete-${h.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {sellDialog && (
        <SellDialog
          holdingId={sellDialog.holdingId}
          symbol={sellDialog.symbol}
          maxShares={sellDialog.maxShares}
          onClose={() => setSellDialog(null)}
          onSold={() => {
            setSellDialog(null);
            onChanged();
            queryClient.invalidateQueries({ queryKey: ["/api/portfolio/holdings"] });
            queryClient.invalidateQueries({ queryKey: ["/api/portfolio/cash"] });
            queryClient.removeQueries({ queryKey: ["/api/portfolio/history"] });
          }}
        />
      )}
    </div>
  );
}

function SellDialog({
  holdingId,
  symbol,
  maxShares,
  onClose,
  onSold,
}: {
  holdingId: string;
  symbol: string;
  maxShares: number;
  onClose: () => void;
  onSold: () => void;
}) {
  const { toast } = useToast();
  const [sellPrice, setSellPrice] = useState("");
  const [sharesSold, setSharesSold] = useState(String(maxShares));

  const shares = parseFloat(sharesSold) || 0;
  const price = parseFloat(sellPrice) || 0;
  const sellValue = shares * price;

  const sellMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/portfolio/manual-holdings/${holdingId}/sell`, {
        sharesSold: shares,
        sellPrice: price,
      });
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: `Sold ${shares} shares of ${symbol} for $${sellValue.toFixed(2)}` });
      onSold();
    },
    onError: (err: any) => {
      toast({ title: err.message || "Failed to sell holding", variant: "destructive" });
    },
  });

  const isValid = shares > 0 && shares <= maxShares && price > 0;

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle data-testid="text-sell-title">Sell {symbol}</DialogTitle>
          <DialogDescription>Record the sale of your {symbol} shares</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div>
            <Label htmlFor="sell-shares" className="text-xs text-muted-foreground">Number of Shares</Label>
            <Input
              id="sell-shares"
              type="number"
              value={sharesSold}
              onChange={(e) => setSharesSold(e.target.value)}
              max={maxShares}
              min="0"
              step="any"
              className="h-10 mt-1 rounded-xl"
              data-testid="input-sell-shares"
            />
            <p className="text-xs text-muted-foreground mt-1">Max: {maxShares}</p>
          </div>

          <div>
            <Label htmlFor="sell-price" className="text-xs text-muted-foreground">Sell Price ($)</Label>
            <Input
              id="sell-price"
              type="number"
              value={sellPrice}
              onChange={(e) => setSellPrice(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="h-10 mt-1 rounded-xl"
              data-testid="input-sell-price"
            />
          </div>

          {sellValue > 0 && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Sale Value</span>
              <span className="text-sm font-semibold text-emerald-600" data-testid="text-sell-value">
                ${sellValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-xl" data-testid="button-cancel-sell">
            Cancel
          </Button>
          <Button
            onClick={() => sellMutation.mutate()}
            disabled={!isValid || sellMutation.isPending}
            className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground"
            data-testid="button-confirm-sell"
          >
            {sellMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Sale"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
