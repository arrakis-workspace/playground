import { useEffect, useState } from "react";
import { PageLayout } from "@/components/PageLayout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SnaptradeCallback() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<"syncing" | "success" | "error">("syncing");
  const [accountCount, setAccountCount] = useState(0);

  useEffect(() => {
    async function syncData() {
      try {
        const res = await apiRequest("POST", "/api/snaptrade/sync");
        const data = await res.json();
        setAccountCount(data.accountsLinked || 0);
        setStatus("success");
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
      } catch {
        setStatus("error");
      }
    }
    syncData();
  }, []);

  return (
    <PageLayout>
      <div className="flex flex-col items-center w-full max-w-xs sm:max-w-sm md:max-w-md text-center">
        {status === "syncing" && (
          <>
            <Loader2 className="w-16 h-16 text-white animate-spin mb-4" />
            <h2 className="text-white font-['Aclonica',sans-serif] text-xl" data-testid="text-syncing">Syncing your accounts...</h2>
            <p className="text-white/70 mt-2 text-sm">This may take a moment</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle2 className="w-16 h-16 text-[#34e916] mb-4" />
            <h2 className="text-white font-['Aclonica',sans-serif] text-xl" data-testid="text-success">Accounts linked!</h2>
            <p className="text-white/70 mt-2 text-sm">{accountCount} account{accountCount !== 1 ? "s" : ""} connected successfully</p>
            <Button
              onClick={() => setLocation("/")}
              className="mt-6 h-[50px] bg-white hover:bg-white/90 text-black rounded-md font-['Aclonica',sans-serif] text-sm w-full max-w-[200px]"
              variant="secondary"
              data-testid="button-go-dashboard"
            >
              Go to Dashboard
            </Button>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="w-16 h-16 text-red-400 mb-4" />
            <h2 className="text-white font-['Aclonica',sans-serif] text-xl" data-testid="text-error">Something went wrong</h2>
            <p className="text-white/70 mt-2 text-sm">We couldn't sync your accounts. Please try again.</p>
            <div className="flex gap-3 mt-6">
              <Button onClick={() => setLocation("/link-institution")} className="bg-white hover:bg-white/90 text-black" variant="secondary" data-testid="button-try-again">
                Try Again
              </Button>
              <Button onClick={() => setLocation("/")} variant="ghost" className="text-white" data-testid="button-skip">
                Skip
              </Button>
            </div>
          </>
        )}
      </div>
    </PageLayout>
  );
}
