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
    <PageLayout>
      <div className="flex flex-col items-center w-full max-w-xs sm:max-w-sm md:max-w-md">
        <img className="w-[60px] h-[60px] md:w-[75px] md:h-[75px]" alt="Playground logo" src="/figmaAssets/frame.svg" data-testid="img-logo" />

        <h2 className="font-['Aclonica',sans-serif] text-[#34e916] text-xl md:text-2xl mt-6 text-center" data-testid="text-handle-title">
          Choose your handle
        </h2>
        <p className="text-white/80 font-['Roboto',Helvetica] text-sm mt-2 text-center" data-testid="text-handle-subtitle">
          This is how other investors will find you
        </p>

        <div className="w-full mt-8 relative">
          <div className="flex items-center bg-white rounded-md">
            <span className="pl-3 text-gray-500 font-['Roboto',Helvetica] text-sm">@</span>
            <Input
              value={handle}
              onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
              placeholder="your_handle"
              data-testid="input-handle"
              className="h-[50px] bg-transparent text-black border-none font-['Roboto',Helvetica] text-sm focus-visible:ring-0"
            />
            <div className="pr-3">
              {availability === "checking" && <Loader2 className="w-5 h-5 animate-spin text-gray-400" />}
              {availability === "available" && <Check className="w-5 h-5 text-green-600" />}
              {availability === "taken" && <X className="w-5 h-5 text-red-500" />}
            </div>
          </div>
          {availability === "taken" && (
            <p className="text-yellow-200 text-xs mt-1" data-testid="text-handle-taken">This handle is already taken</p>
          )}
          <p className="text-white/60 text-xs mt-2">Lowercase letters, numbers, and underscores only. 3-30 characters.</p>
        </div>

        <Button
          onClick={() => saveMutation.mutate()}
          disabled={!isValid || saveMutation.isPending}
          className="mt-6 h-[50px] bg-white hover:bg-white/90 text-black rounded-md font-['Aclonica',sans-serif] text-sm w-full"
          variant="secondary"
          data-testid="button-save-handle"
        >
          {saveMutation.isPending ? "Saving..." : "Continue"}
        </Button>

        <Button
          variant="ghost"
          onClick={() => setLocation("/link-institution")}
          className="mt-2 text-white/60 hover:text-white text-sm"
          data-testid="button-skip-handle"
        >
          Skip for now
        </Button>
      </div>
    </PageLayout>
  );
}
