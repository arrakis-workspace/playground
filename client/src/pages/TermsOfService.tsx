import { Link } from "wouter";
import { UserAccountButton } from "@/components/UserAccountButton";
import { CompanyFooter } from "@/components/CompanyFooter";

export function TermsOfService() {
  return (
    <div className="bg-background min-h-screen flex flex-col">
      <header className="bg-card border-b border-border px-4 py-3 sm:px-6">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center gap-2 justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/figmaAssets/frame.svg" alt="Playground logo" className="w-8 h-8" data-testid="img-logo" />
            <span className="font-semibold text-foreground text-lg tracking-tight">Playground</span>
          </Link>
          <UserAccountButton />
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8 w-full">
        <h1 className="text-3xl font-bold text-foreground mb-6" data-testid="text-terms-title">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: February 10, 2026</p>

        <div className="bg-card rounded-2xl shadow-sm border border-border p-6 md:p-8 space-y-6 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">1. Acceptance of Terms</h2>
            <p>By accessing and using Playground, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the application.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">2. Description of Service</h2>
            <p>Playground is an investment onboarding platform that provides users with tools and resources for managing their investment profile and preferences.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">3. User Accounts</h2>
            <p>To use Playground, you must:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Sign in using a valid Google account</li>
              <li>Provide accurate and complete information during profile setup</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">4. User Responsibilities</h2>
            <p>You agree to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Use the service only for lawful purposes</li>
              <li>Not attempt to gain unauthorized access to any part of the service</li>
              <li>Not interfere with the proper functioning of the service</li>
              <li>Provide truthful and accurate information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">5. Intellectual Property</h2>
            <p>All content, features, and functionality of Playground are owned by us and are protected by international copyright, trademark, and other intellectual property laws.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">6. Disclaimer of Warranties</h2>
            <p>Playground is provided "as is" and "as available" without warranties of any kind, either express or implied. We do not guarantee that the service will be uninterrupted, secure, or error-free.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">7. Limitation of Liability</h2>
            <p>To the fullest extent permitted by law, Playground shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or relating to your use of the service.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">8. Investment Disclaimer</h2>
            <p>Playground does not provide investment advice. Any information provided through the platform is for informational purposes only and should not be construed as financial, investment, or legal advice. Always consult with qualified professionals before making investment decisions.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">9. Termination</h2>
            <p>We reserve the right to suspend or terminate your access to Playground at any time, without notice, for any reason, including if we believe you have violated these Terms of Service.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">10. Changes to Terms</h2>
            <p>We may modify these terms at any time. Continued use of the service after changes are posted constitutes acceptance of the modified terms.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">11. Contact</h2>
            <p>If you have any questions about these Terms of Service, please contact us through the application.</p>
          </section>
        </div>
      </main>

      <CompanyFooter />
    </div>
  );
}
