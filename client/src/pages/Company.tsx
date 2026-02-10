import { Link } from "wouter";
import { FileText, Shield, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function Company() {
  return (
    <div className="bg-[#2e99e7] w-full min-h-screen flex flex-col">
      <header className="flex flex-wrap items-center gap-2 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-white" data-testid="link-back-home">
          <ArrowLeft className="w-5 h-5" />
          <img src="/figmaAssets/frame.svg" alt="Playground logo" className="w-8 h-8" data-testid="img-logo" />
          <span className="font-['Aclonica',sans-serif] text-[#34e916] text-xl">Playground</span>
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-md space-y-6">
          <h1 className="text-white text-2xl font-bold text-center" data-testid="text-company-title">Company</h1>

          <div className="space-y-3">
            <Link href="/privacy-policy">
              <Card className="hover-elevate cursor-pointer">
                <CardContent className="flex items-center gap-3 p-4">
                  <Shield className="w-5 h-5 text-[#2e99e7] shrink-0" />
                  <div>
                    <p className="font-medium" data-testid="link-privacy-policy">Privacy Policy</p>
                    <p className="text-sm text-muted-foreground">How we collect and use your data</p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/terms-of-service">
              <Card className="hover-elevate cursor-pointer">
                <CardContent className="flex items-center gap-3 p-4">
                  <FileText className="w-5 h-5 text-[#2e99e7] shrink-0" />
                  <div>
                    <p className="font-medium" data-testid="link-terms-of-service">Terms of Service</p>
                    <p className="text-sm text-muted-foreground">Rules and guidelines for using Playground</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
