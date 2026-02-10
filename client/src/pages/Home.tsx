import { UserAccountButton } from "@/components/UserAccountButton";
import { CompanyFooter } from "@/components/CompanyFooter";

export function Home() {
  return (
    <div className="bg-[#2e99e7] w-full min-h-screen flex flex-col">
      <header className="flex flex-wrap items-center justify-end gap-2 px-4 py-3 sm:px-6">
        <UserAccountButton />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-16">
        <div className="flex flex-col items-center gap-4">
          <img
            className="w-[100px] h-[100px] md:w-[125px] md:h-[125px]"
            alt="Playground logo"
            src="/figmaAssets/frame.svg"
            data-testid="img-logo"
          />
          <h1
            className="font-['Aclonica',sans-serif] text-[#34e916] text-4xl md:text-5xl"
            data-testid="text-app-name"
          >
            Playground
          </h1>
          <p
            className="text-white/90 text-base md:text-lg text-center max-w-xs sm:max-w-sm px-2 font-['Roboto',Helvetica]"
            data-testid="text-tagline"
          >
            Social investing made fun. Private and secure way to consolidate and share your investment portfolio.
          </p>
        </div>
      </main>

      <CompanyFooter variant="blue" />
    </div>
  );
}
