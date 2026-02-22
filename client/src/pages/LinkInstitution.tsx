import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/PageLayout";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Building2, ArrowRight, Loader2 } from "lucide-react";

export function LinkInstitution() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
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

  return (
    <PageLayout>
      <div className="flex flex-col items-center w-full max-w-xs sm:max-w-sm md:max-w-md">
        <img className="w-[60px] h-[60px] md:w-[75px] md:h-[75px]" alt="Playground logo" src="/figmaAssets/frame.svg" data-testid="img-logo" />

        <h2 className="font-['Aclonica',sans-serif] text-[#34e916] text-xl md:text-2xl mt-6 text-center" data-testid="text-link-title">
          Link your brokerage
        </h2>
        <p className="text-white/80 font-['Roboto',Helvetica] text-sm mt-2 text-center" data-testid="text-link-subtitle">
          Connect your investment accounts to track your portfolio in real-time
        </p>

        <div className="bg-white/10 rounded-xl p-6 mt-8 w-full">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-white/20 rounded-full p-3">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-white font-['Roboto',Helvetica] font-medium" data-testid="text-snaptrade-title">SnapTrade Connect</h3>
              <p className="text-white/60 text-xs">Securely link 300+ brokerages</p>
            </div>
          </div>

          <ul className="text-white/80 text-sm space-y-2 mb-6 font-['Roboto',Helvetica]">
            <li className="flex items-center gap-2">
              <span className="text-[#34e916]">✓</span> Read-only access to your portfolio
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#34e916]">✓</span> Bank-level security encryption
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#34e916]">✓</span> Supports major US and Canadian brokerages
            </li>
          </ul>

          <Button
            onClick={() => registerMutation.mutate()}
            disabled={registerMutation.isPending}
            className="h-[50px] bg-white hover:bg-white/90 text-black rounded-md font-['Aclonica',sans-serif] text-sm w-full"
            variant="secondary"
            data-testid="button-link-brokerage"
          >
            {registerMutation.isPending ? (
              <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Connecting...</span>
            ) : (
              <span className="flex items-center gap-2">Connect Brokerage <ArrowRight className="w-4 h-4" /></span>
            )}
          </Button>
        </div>

        <Button
          variant="ghost"
          onClick={() => setLocation("/")}
          className="mt-4 text-white/60 hover:text-white text-sm"
          data-testid="button-skip-link"
        >
          Skip for now
        </Button>
      </div>
    </PageLayout>
  );
}
