import { Link } from "wouter";
import { FileText, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { UserAccountButton } from "@/components/UserAccountButton";
import { CompanyFooter } from "@/components/CompanyFooter";

export function Company() {
  return (
    <div className="bg-background w-full min-h-screen flex flex-col">
      <header className="bg-card border-b border-border px-4 py-3 sm:px-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5" data-testid="link-back-home">
            <img src="/figmaAssets/frame.svg" alt="Playground logo" className="w-8 h-8" data-testid="img-logo" />
            <span className="font-semibold text-foreground text-lg tracking-tight">Playground</span>
          </Link>
          <UserAccountButton />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-md space-y-6">
          <h1 className="text-foreground text-2xl font-semibold text-center tracking-tight" data-testid="text-company-title">Company</h1>

          <div className="space-y-3">
            <Link href="/privacy-policy">
              <Card className="bg-white border border-border rounded-2xl shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="bg-primary/10 rounded-xl p-2.5">
                    <Shield className="w-5 h-5 text-primary shrink-0" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground" data-testid="link-privacy-policy">Privacy Policy</p>
                    <p className="text-sm text-muted-foreground">How we collect and use your data</p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/terms-of-service">
              <Card className="bg-white border border-border rounded-2xl shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="bg-primary/10 rounded-xl p-2.5">
                    <FileText className="w-5 h-5 text-primary shrink-0" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground" data-testid="link-terms-of-service">Terms of Service</p>
                    <p className="text-sm text-muted-foreground">Rules and guidelines for using Playground</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </main>

      <CompanyFooter />
    </div>
  );
}
