import { Link } from "wouter";
import { Building2 } from "lucide-react";

export function CompanyFooter({ variant = "blue" }: { variant?: "blue" | "white" }) {
  const colorClass = variant === "blue"
    ? "text-white/70"
    : "text-gray-500";

  const subColorClass = variant === "blue"
    ? "text-white/50"
    : "text-gray-400";

  return (
    <footer className="px-4 py-4 sm:px-6 flex flex-col items-center gap-1">
      <Link href="/company" className={`${colorClass} text-sm flex items-center gap-1.5`} data-testid="link-company">
        <Building2 className="w-4 h-4" />
        Company
      </Link>
      <div className="flex items-center gap-3 pl-6">
        <Link href="/privacy-policy" className={`${subColorClass} text-xs`} data-testid="link-footer-privacy">
          Privacy Policy
        </Link>
        <Link href="/terms-of-service" className={`${subColorClass} text-xs`} data-testid="link-footer-terms">
          Terms of Service
        </Link>
      </div>
    </footer>
  );
}
