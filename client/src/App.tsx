import { useEffect, useRef } from "react";
import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { useAuth } from "@/hooks/use-auth";

import { Login } from "@/pages/Login";
import { Home } from "@/pages/Home";
import { ProfileSetup } from "@/pages/ProfileSetup";
import { InvestorQuestion } from "@/pages/InvestorQuestion";
import { HandleSelection } from "@/pages/HandleSelection";
import { AddHoldings } from "@/pages/AddHoldings";
import { SnaptradeCallback } from "@/pages/SnaptradeCallback";
import { Social } from "@/pages/Social";
import { ChatPage } from "@/pages/Chat";
import { PrivacyPolicy } from "@/pages/PrivacyPolicy";
import { TermsOfService } from "@/pages/TermsOfService";
import { Company } from "@/pages/Company";
import EquityDetail from "@/pages/EquityDetail";

const PUBLIC_PATHS = ["/", "/login", "/privacy-policy", "/terms-of-service", "/company"];
const ONBOARDING_PATHS = ["/profile-setup", "/investor-question", "/handle-selection"];

function Router() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [location, setLocation] = useLocation();
  const hasRedirected = useRef(false);

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      }
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  const needsInitialRedirect = !isLoading && isAuthenticated && user?.profileCompleted && user?.handle
    && !hasRedirected.current
    && !PUBLIC_PATHS.includes(location) && !location.startsWith("/equity/")
    && location !== "/social" && !location.startsWith("/chat") && location !== "/snaptrade-callback";

  useEffect(() => {
    if (needsInitialRedirect) {
      hasRedirected.current = true;
      setLocation("/");
    }
  }, [needsInitialRedirect, setLocation]);

  if (isLoading || needsInitialRedirect) {
    return (
      <div className="bg-background w-full min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground text-sm font-medium" data-testid="text-loading">Loading...</div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms-of-service" component={TermsOfService} />
      <Route path="/company" component={Company} />
      <Route path="/equity/:symbol" component={EquityDetail} />

      <Route path="/login">
        {isAuthenticated ? <Redirect to="/" /> : <Login />}
      </Route>

      {!isAuthenticated && (
        <>
          <Route path="/" component={Home} />
          <Route><Redirect to="/login" /></Route>
        </>
      )}

      {isAuthenticated && (
        <>
          <Route path="/profile-setup" component={ProfileSetup} />
          <Route path="/investor-question" component={InvestorQuestion} />
          <Route path="/handle-selection" component={HandleSelection} />
          <Route path="/add-holdings" component={AddHoldings} />
          <Route path="/snaptrade-callback" component={SnaptradeCallback} />
          <Route path="/social" component={Social} />
          <Route path="/chat/:userId?" component={ChatPage} />
          <Route path="/" component={Home} />

          {!user?.profileCompleted ? (
            <Route><Redirect to="/profile-setup" /></Route>
          ) : !user?.handle ? (
            <Route><Redirect to="/handle-selection" /></Route>
          ) : (
            <Route><Redirect to="/" /></Route>
          )}
        </>
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
