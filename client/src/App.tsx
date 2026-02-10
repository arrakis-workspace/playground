import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { GooglePixel } from "@/pages/GooglePixel";
import { ProfileSetup } from "@/pages/ProfileSetup";
import { InvestorQuestion } from "@/pages/InvestorQuestion";

function Router() {
  return (
    <Switch>
      <Route path="/" component={GooglePixel} />
      <Route path="/profile-setup" component={ProfileSetup} />
      <Route path="/investor-question" component={InvestorQuestion} />
      <Route component={NotFound} />
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
