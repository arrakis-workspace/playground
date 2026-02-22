import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/PageLayout";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Building2, ArrowRight, Loader2, ShieldCheck, Lock, Globe } from "lucide-react";

export function LinkInstitution() {
  const [, setLocation] = useLocation();
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
    <PageLayout showBottomNav={false}>
      <div className="flex flex-col items-center w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg py-8 lg:py-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-foreground tracking-tight" data-testid="text-link-title">
            Link your brokerage
          </h2>
          <p className="text-muted-foreground text-sm mt-2" data-testid="text-link-subtitle">
            Connect your investment accounts to track your portfolio in real-time
          </p>
        </div>

        <div className="bg-card rounded-2xl shadow-sm border border-border p-6 w-full">
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

        <Button
          variant="ghost"
          onClick={() => setLocation("/")}
          className="mt-3 text-muted-foreground hover:text-primary text-sm"
          data-testid="button-skip-link"
        >
          Skip for now
        </Button>
      </div>
    </PageLayout>
  );
}
