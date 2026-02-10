import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { useAuth } from "@/hooks/use-auth";

import { GooglePixel } from "@/pages/GooglePixel";
import { Home } from "@/pages/Home";
import { ProfileSetup } from "@/pages/ProfileSetup";
import { InvestorQuestion } from "@/pages/InvestorQuestion";
import { PrivacyPolicy } from "@/pages/PrivacyPolicy";
import { TermsOfService } from "@/pages/TermsOfService";
import { Company } from "@/pages/Company";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="bg-[#2e99e6] w-full min-h-screen flex items-center justify-center">
        <div className="text-white text-lg font-['Roboto',Helvetica]" data-testid="text-loading">Loading...</div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={GooglePixel} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms-of-service" component={TermsOfService} />
      <Route path="/company" component={Company} />
      {isAuthenticated ? (
        <>
          <Route path="/profile-setup" component={ProfileSetup} />
          <Route path="/investor-question" component={InvestorQuestion} />
          <Route component={NotFound} />
        </>
      ) : (
        <Route><Redirect to="/login" /></Route>
      )}
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
