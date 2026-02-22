import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageLayout } from "@/components/PageLayout";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Check, X, Loader2 } from "lucide-react";

export function HandleSelection() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [handle, setHandle] = useState("");
  const [availability, setAvailability] = useState<"idle" | "checking" | "available" | "taken">("idle");

  const suggestedHandle = user ? `${(user.firstName || "user").toLowerCase()}${(user.lastName || "").toLowerCase()}`.replace(/[^a-z0-9_]/g, "") : "";

  useEffect(() => {
    if (suggestedHandle && !handle) {
      setHandle(suggestedHandle);
    }
  }, [suggestedHandle]);

  useEffect(() => {
    if (!handle || handle.length < 3) {
      setAvailability("idle");
      return;
    }
    const timer = setTimeout(async () => {
      setAvailability("checking");
      try {
        const res = await fetch(`/api/handle/check/${handle}`, { credentials: "include" });
        const data = await res.json();
        setAvailability(data.available ? "available" : "taken");
      } catch {
        setAvailability("idle");
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [handle]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/handle", { handle });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Handle saved!" });
      setLocation("/link-institution");
    },
    onError: (err: any) => {
      toast({ title: err.message || "Failed to save handle", variant: "destructive" });
    },
  });

  const isValid = handle.length >= 3 && /^[a-z0-9_]+$/.test(handle) && availability === "available";

  return (
    <PageLayout showBottomNav={false}>
      <div className="flex flex-col items-center w-full max-w-xs sm:max-w-sm md:max-w-md py-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-foreground tracking-tight" data-testid="text-handle-title">
            Choose your handle
          </h2>
          <p className="text-muted-foreground text-sm mt-2" data-testid="text-handle-subtitle">
            This is how other investors will find you
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-border p-6 w-full">
          <div className="relative">
            <div className="flex items-center bg-muted/50 rounded-xl border border-border focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary transition-all">
              <span className="pl-4 text-muted-foreground text-sm font-medium">@</span>
              <Input
                value={handle}
                onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                placeholder="your_handle"
                data-testid="input-handle"
                className="h-11 bg-transparent border-none text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <div className="pr-3">
                {availability === "checking" && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                {availability === "available" && <Check className="w-4 h-4 text-emerald-500" />}
                {availability === "taken" && <X className="w-4 h-4 text-destructive" />}
              </div>
            </div>
            {availability === "taken" && (
              <p className="text-destructive text-xs mt-1.5" data-testid="text-handle-taken">This handle is already taken</p>
            )}
            <p className="text-muted-foreground text-xs mt-2">Lowercase letters, numbers, and underscores only. 3-30 characters.</p>
          </div>

          <Button
            onClick={() => saveMutation.mutate()}
            disabled={!isValid || saveMutation.isPending}
            className="mt-5 h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium w-full"
            data-testid="button-save-handle"
          >
            {saveMutation.isPending ? "Saving..." : "Continue"}
          </Button>
        </div>

        <Button
          variant="ghost"
          onClick={() => setLocation("/link-institution")}
          className="mt-3 text-muted-foreground text-sm"
          data-testid="button-skip-handle"
        >
          Skip for now
        </Button>
      </div>
    </PageLayout>
  );
}
