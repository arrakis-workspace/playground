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

export const InvestorQuestion = (): JSX.Element => {
  return (
    <div className="bg-[#2e99e7] w-full min-w-[411px] min-h-screen flex flex-col">
      <header className="flex justify-between items-center p-2">
        <img
          className="w-[36px] h-[36px]"
          alt="Playground logo"
          src="/figmaAssets/frame.svg"
        />
        <div className="flex items-center gap-2">
          {statusIcons.map((icon, index) => (
            <img
              key={`status-icon-${index}`}
              className={icon.className}
              alt={icon.alt}
              src={icon.src}
            />
          ))}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-5">
        <div className="w-full max-w-[371px]">
          <div className="bg-[#1c6399] border border-[#1c6399] rounded-[9px] px-4 py-2 mb-4">
            <p className="font-['Ubuntu',sans-serif] text-white text-[24px] leading-normal">
              Are you new investor?
            </p>
          </div>

          <div className="flex gap-8 justify-center">
            <Button
              variant="secondary"
              className="h-[39px] w-[79px] bg-white hover:bg-white/90 text-black rounded-md font-['Ubuntu',sans-serif] text-[24px]"
            >
              Yes
            </Button>
            <Button
              variant="secondary"
              className="h-[39px] w-[79px] bg-white hover:bg-white/90 text-black rounded-md font-['Ubuntu',sans-serif] text-[24px]"
            >
              No
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};
