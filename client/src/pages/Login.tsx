import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/PageLayout";

export const Login = (): JSX.Element => {
  const handleAuth = () => {
    window.location.href = "/api/login";
  };

  return (
    <PageLayout showBottomNav={false}>
      <div className="flex flex-col items-center gap-8 w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg py-8 lg:py-16">
        <img
          className="w-[80px] h-[80px] md:w-[100px] md:h-[100px]"
          alt="Playground logo"
          src="/figmaAssets/frame.svg"
          data-testid="img-logo"
        />

        <div className="text-center">
          <h1 className="text-2xl font-semibold text-foreground tracking-tight" data-testid="text-welcome">Welcome to Playground</h1>
          <p className="text-muted-foreground text-sm mt-2">Sign in to manage your investments</p>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <Button
            variant="outline"
            onClick={handleAuth}
            data-testid="button-signup-google"
            className="h-12 rounded-xl flex items-center justify-center gap-3 text-sm font-medium bg-card border-border text-foreground"
          >
            <img className="w-5 h-5" alt="Google icon" src="/figmaAssets/logos-google-icon.svg" />
            <span>Sign up with Google</span>
          </Button>
          <Button
            variant="outline"
            onClick={handleAuth}
            data-testid="button-login-google"
            className="h-12 rounded-xl flex items-center justify-center gap-3 text-sm font-medium bg-card border-border text-foreground"
          >
            <img className="w-5 h-5" alt="Google icon" src="/figmaAssets/logos-google-icon.svg" />
            <span>Log in with Google</span>
          </Button>
        </div>
      </div>
    </PageLayout>
  );
};
