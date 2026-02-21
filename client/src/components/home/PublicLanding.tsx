export function PublicLanding() {
  return (
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
        className="text-white/90 text-lg md:text-xl text-center max-w-xs sm:max-w-sm px-2 font-['Aclonica',sans-serif]"
        data-testid="text-tagline"
      >
        Social investing made fun.<br />
        Private and secure way to consolidate and share your investment portfolio.
      </p>
    </div>
  );
}
