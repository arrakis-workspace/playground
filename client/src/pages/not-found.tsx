import { PageLayout } from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <PageLayout showBottomNav={false}>
      <div className="flex flex-col items-center gap-4 text-center py-16">
        <h1
          className="text-foreground text-7xl md:text-8xl font-bold tracking-tight"
          data-testid="text-404"
        >
          404
        </h1>
        <p
          className="text-muted-foreground text-base md:text-lg max-w-sm"
          data-testid="text-not-found-message"
        >
          This page doesn't exist or has been moved.
        </p>
        <Button
          onClick={() => setLocation("/")}
          className="mt-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
          data-testid="button-go-home"
        >
          Go Home
        </Button>
      </div>
    </PageLayout>
  );
}
