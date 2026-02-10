import { Button } from "@/components/ui/button";

const statusIcons = [
  {
    src: "/figmaAssets/network-wifi.svg",
    alt: "Network wifi",
    className: "w-6 h-6",
  },
  {
    src: "/figmaAssets/network-cell.svg",
    alt: "Network cell",
    className: "w-6 h-6",
  },
  {
    src: "/figmaAssets/battery-std.svg",
    alt: "Battery std",
    className: "w-6 h-6",
  },
];

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

export const GooglePixel = (): JSX.Element => {
  const handleAuth = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="bg-[#2e99e6] w-full min-w-[411px] min-h-[731px] flex flex-col">
      <header className="flex justify-end items-center gap-2 p-2">
        {statusIcons.map((icon, index) => (
          <img
            key={`status-icon-${index}`}
            className={icon.className}
            alt={icon.alt}
            src={icon.src}
          />
        ))}
      </header>

      <main className="flex-1 flex flex-col items-center justify-center gap-8 px-4">
        <img
          className="w-[125px] h-[125px]"
          alt="Frame"
          src="/figmaAssets/frame.svg"
        />

        <div className="flex flex-col gap-4 w-full max-w-[258px]">
          {authButtons.map((button, index) => (
            <Button
              key={`auth-button-${index}`}
              variant="secondary"
              onClick={handleAuth}
              data-testid={button.testId}
              className="h-[50px] bg-white hover:bg-white/90 text-black rounded-md flex items-center justify-center gap-3 [font-family:'Roboto',Helvetica] font-normal text-[13px]"
            >
              <img
                className="w-[38px] h-[38px]"
                alt="Google icon"
                src={button.icon}
              />
              <span>{button.text}</span>
            </Button>
          ))}
        </div>
      </main>
    </div>
  );
};
