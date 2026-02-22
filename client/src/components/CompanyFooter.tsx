import { Link } from "wouter";
import { Building2 } from "lucide-react";

export function CompanyFooter() {
  return (
    <footer className="px-4 py-4 sm:px-6 flex flex-col items-center gap-1">
      <Link href="/company" className="text-muted-foreground text-sm flex items-center gap-1.5 hover:text-foreground transition-colors" data-testid="link-company">
        <Building2 className="w-4 h-4" />
        Company
      </Link>
      <div className="flex items-center gap-3">
        <Link href="/privacy-policy" className="text-muted-foreground/70 text-xs hover:text-muted-foreground transition-colors" data-testid="link-footer-privacy">
          Privacy Policy
        </Link>
        <Link href="/terms-of-service" className="text-muted-foreground/70 text-xs hover:text-muted-foreground transition-colors" data-testid="link-footer-terms">
          Terms of Service
        </Link>
      </div>
    </footer>
  );
}
