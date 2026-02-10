import { Link } from "wouter";
import { UserAccountButton } from "@/components/UserAccountButton";
import { CompanyFooter } from "@/components/CompanyFooter";

export function PrivacyPolicy() {
  return (
    <div className="bg-white min-h-screen flex flex-col">
      <header className="bg-[#2e99e7] px-4 py-3 sm:px-6">
        <div className="max-w-3xl mx-auto flex flex-wrap items-center gap-2 justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/figmaAssets/frame.svg" alt="Playground logo" className="w-8 h-8" data-testid="img-logo" />
            <span className="font-['Aclonica',sans-serif] text-[#34e916] text-xl">Playground</span>
          </Link>
          <UserAccountButton />
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto px-4 py-8 sm:px-6 w-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-6" data-testid="text-privacy-title">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: February 10, 2026</p>

        <div className="space-y-6 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">1. Information We Collect</h2>
            <p>When you use Playground, we collect information that you provide directly to us, including:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Your name, email address, and profile picture from your Google account when you sign in</li>
              <li>Contact information you provide during profile setup (phone number, country)</li>
              <li>Responses to our investor questionnaire</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">2. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Provide, maintain, and improve our services</li>
              <li>Create and manage your account</li>
              <li>Personalize your experience on the platform</li>
              <li>Communicate with you about our services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">3. Information Sharing</h2>
            <p>We do not sell, trade, or otherwise transfer your personal information to third parties. We may share your information only in the following circumstances:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>With your consent</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights and safety</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">4. Data Security</h2>
            <p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">5. Third-Party Services</h2>
            <p>We use Google OAuth for authentication. When you sign in with Google, Google's privacy policy also applies to the information they collect. We encourage you to review Google's privacy policy.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">6. Data Retention</h2>
            <p>We retain your personal information for as long as your account is active or as needed to provide you services. You may request deletion of your account and associated data at any time by contacting us.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">7. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your information</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">8. Changes to This Policy</h2>
            <p>We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">9. Contact Us</h2>
            <p>If you have any questions about this privacy policy, please contact us through the application.</p>
          </section>
        </div>
      </main>

      <CompanyFooter variant="white" />
    </div>
  );
}
