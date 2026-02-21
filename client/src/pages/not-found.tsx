import { PageLayout } from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <PageLayout>
      <div className="flex flex-col items-center gap-4 text-center">
        <h1
          className="font-['Aclonica',sans-serif] text-white text-6xl md:text-8xl"
          data-testid="text-404"
        >
          404
        </h1>
        <p
          className="text-white/80 font-['Roboto',Helvetica] text-lg md:text-xl max-w-sm"
          data-testid="text-not-found-message"
        >
          This page doesn't exist or has been moved.
        </p>
        <Button
          variant="secondary"
          onClick={() => setLocation("/")}
          className="mt-4 bg-white hover:bg-white/90 text-black font-['Aclonica',sans-serif]"
          data-testid="button-go-home"
        >
          Go Home
        </Button>
      </div>
    </PageLayout>
  );
}
