import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/PageLayout";
import { useLocation } from "wouter";

export const InvestorQuestion = (): JSX.Element => {
  const [, setLocation] = useLocation();

  const handleAnswer = () => {
    setLocation("/");
  };

  return (
    <PageLayout>
      <div className="w-full max-w-xs sm:max-w-sm md:max-w-md">
        <div className="flex items-center gap-3 mb-8">
          <img
            className="w-9 h-9"
            alt="Playground logo"
            src="/figmaAssets/frame.svg"
            data-testid="img-logo"
          />
        </div>

        <div className="bg-[#1c6399] rounded-[9px] px-4 py-3 mb-6">
          <p
            className="font-['Ubuntu',sans-serif] text-white text-xl md:text-2xl leading-normal"
            data-testid="text-question"
          >
            Are you new investor?
          </p>
        </div>

        <div className="flex gap-6 justify-center">
          <Button
            variant="secondary"
            onClick={handleAnswer}
            data-testid="button-yes"
            className="h-[42px] w-[90px] bg-white hover:bg-white/90 text-black rounded-md font-['Ubuntu',sans-serif] text-xl md:text-2xl"
          >
            Yes
          </Button>
          <Button
            variant="secondary"
            onClick={handleAnswer}
            data-testid="button-no"
            className="h-[42px] w-[90px] bg-white hover:bg-white/90 text-black rounded-md font-['Ubuntu',sans-serif] text-xl md:text-2xl"
          >
            No
          </Button>
        </div>
      </div>
    </PageLayout>
  );
};
