import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/PageLayout";

const authButtons = [
  {
    text: "Signup with Google",
    icon: "/figmaAssets/logos-google-icon.svg",
    testId: "button-signup-google",
  },
  {
    text: "Login with Google",
    icon: "/figmaAssets/logos-google-icon.svg",
    testId: "button-login-google",
  },
];

export const Login = (): JSX.Element => {
  const handleAuth = () => {
    window.location.href = "/api/login";
  };

  return (
    <PageLayout>
      <div className="flex flex-col items-center gap-8 w-full max-w-xs sm:max-w-sm md:max-w-md">
        <img
          className="w-[100px] h-[100px] md:w-[125px] md:h-[125px]"
          alt="Playground logo"
          src="/figmaAssets/frame.svg"
          data-testid="img-logo"
        />

        <div className="flex flex-col gap-4 w-full">
          {authButtons.map((button, index) => (
            <Button
              key={`auth-button-${index}`}
              variant="secondary"
              onClick={handleAuth}
              data-testid={button.testId}
              className="h-[50px] bg-white hover:bg-white/90 text-black rounded-md flex items-center justify-center gap-3 [font-family:'Roboto',Helvetica] font-normal text-sm"
            >
              <img
                className="w-8 h-8"
                alt="Google icon"
                src={button.icon}
              />
              <span>{button.text}</span>
            </Button>
          ))}
        </div>
      </div>
    </PageLayout>
  );
};
