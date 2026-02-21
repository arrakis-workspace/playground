import { PageLayout } from "@/components/PageLayout";
import { useAuth } from "@/hooks/use-auth";
import { PublicLanding } from "@/components/home/PublicLanding";
import { Dashboard } from "@/components/home/Dashboard";

export function Home() {
  const { isAuthenticated, user } = useAuth();
  const hasCompletedProfile = isAuthenticated && user?.profileCompleted;

  return (
    <PageLayout>
      {hasCompletedProfile ? <Dashboard user={user} /> : <PublicLanding />}
    </PageLayout>
  );
}
