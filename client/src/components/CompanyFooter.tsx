import { Link } from "wouter";
import { Building2 } from "lucide-react";

export function CompanyFooter({ variant = "blue" }: { variant?: "blue" | "white" }) {
  const colorClass = variant === "blue"
    ? "text-white/70"
    : "text-gray-500";

  return (
    <footer className="px-4 py-4 sm:px-6 flex justify-center">
      <Link href="/company" className={`${colorClass} text-sm flex items-center gap-1.5`} data-testid="link-company">
        <Building2 className="w-4 h-4" />
        Company
      </Link>
    </footer>
  );
}
