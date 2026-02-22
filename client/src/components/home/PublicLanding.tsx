export function PublicLanding() {
  return (
    <div className="flex flex-col items-center gap-6 py-12">
      <img
        className="w-[80px] h-[80px] md:w-[100px] md:h-[100px]"
        alt="Playground logo"
        src="/figmaAssets/frame.svg"
        data-testid="img-logo"
      />
      <h1
        className="font-semibold text-foreground text-4xl md:text-5xl tracking-tight"
        data-testid="text-app-name"
      >
        Playground
      </h1>
      <p
        className="text-muted-foreground text-base md:text-lg text-center max-w-sm px-4 leading-relaxed"
        data-testid="text-tagline"
      >
        Social investing made fun.<br />
        A private and secure way to consolidate and share your investment portfolio.
      </p>
    </div>
  );
}
