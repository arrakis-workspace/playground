import { UserAccountButton } from "@/components/UserAccountButton";
import { CompanyFooter } from "@/components/CompanyFooter";
import type { ReactNode } from "react";

interface PageLayoutProps {
  children: ReactNode;
  footerVariant?: "blue" | "white";
  className?: string;
}

export function PageLayout({ children, footerVariant = "blue", className = "" }: PageLayoutProps) {
  return (
    <div className={`bg-[#2e99e6] w-full min-h-screen flex flex-col ${className}`}>
      <header className="flex flex-wrap items-center justify-end gap-2 px-4 py-3 sm:px-6">
        <UserAccountButton />
      </header>

      <main className="flex-1 flex flex-col items-center px-4 py-8 md:justify-center">
        {children}
      </main>

      <CompanyFooter variant={footerVariant} />
    </div>
  );
}
