import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/PageLayout";
import { useLocation } from "wouter";

export const InvestorQuestion = (): JSX.Element => {
  const [, setLocation] = useLocation();

  const handleAnswer = () => {
    setLocation("/handle-selection");
  };

  return (
    <PageLayout showBottomNav={false}>
      <div className="w-full max-w-xs sm:max-w-sm md:max-w-md py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-border p-6">
          <div className="flex items-center gap-3 mb-6">
            <img
              className="w-9 h-9"
              alt="Playground logo"
              src="/figmaAssets/frame.svg"
              data-testid="img-logo"
            />
          </div>

          <p
            className="text-foreground text-xl md:text-2xl font-semibold leading-normal mb-8"
            data-testid="text-question"
          >
            Are you a new investor?
          </p>

          <div className="flex gap-4 justify-center">
            <Button
              onClick={handleAnswer}
              data-testid="button-yes"
              className="h-11 w-24 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-base"
            >
              Yes
            </Button>
            <Button
              variant="outline"
              onClick={handleAnswer}
              data-testid="button-no"
              className="h-11 w-24 rounded-xl border-border font-medium text-base"
            >
              No
            </Button>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};
