import { Switch, Route, Redirect } from "wouter";
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
import { LinkInstitution } from "@/pages/LinkInstitution";
import { SnaptradeCallback } from "@/pages/SnaptradeCallback";
import { Social } from "@/pages/Social";
import { ChatPage } from "@/pages/Chat";
import { PrivacyPolicy } from "@/pages/PrivacyPolicy";
import { TermsOfService } from "@/pages/TermsOfService";
import { Company } from "@/pages/Company";

function Router() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="bg-[#2e99e6] w-full min-h-screen flex items-center justify-center">
        <div className="text-white text-lg font-['Roboto',Helvetica]" data-testid="text-loading">Loading...</div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms-of-service" component={TermsOfService} />
      <Route path="/company" component={Company} />

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
          <Route path="/link-institution" component={LinkInstitution} />
          <Route path="/snaptrade-callback" component={SnaptradeCallback} />
          <Route path="/social" component={Social} />
          <Route path="/chat/:userId?" component={ChatPage} />
          <Route path="/" component={Home} />

          {!user?.profileCompleted ? (
            <Route><Redirect to="/profile-setup" /></Route>
          ) : !user?.handle ? (
            <Route><Redirect to="/handle-selection" /></Route>
          ) : null}

          <Route component={NotFound} />
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
