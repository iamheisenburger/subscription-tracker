/* eslint-disable react/no-unescaped-entities */
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";

export default function MobilePrivacyPolicyPage() {
return (
  <>
    <Navbar />
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="prose prose-gray max-w-none dark:prose-invert">
          <h1 className="text-3xl font-bold tracking-tight font-sans mb-8">Privacy Policy — SubWise iOS App</h1>

          <div className="text-sm text-muted-foreground mb-8">
            <p><strong>Last Updated:</strong> January 6, 2025</p>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 font-sans">Overview</h2>
            <p className="text-muted-foreground leading-relaxed">
              SubWise ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our mobile application.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 font-sans">Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed">
              <strong>Local Data:</strong> All your subscription data (names, costs, billing cycles, categories) is stored locally on your device. We do not have access to this information.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              <strong>Purchase Information:</strong> When you subscribe to SubWise Plus, payment processing is handled securely by Apple through the App Store. We receive confirmation of your subscription status but do not have access to your payment details.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 font-sans">How We Use Your Information</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-3">
              <li>To provide and maintain the app's functionality</li>
              <li>To process your Plus subscription through RevenueCat</li>
              <li>To send you renewal reminder notifications (with your permission)</li>
              <li>To improve our app based on anonymous usage patterns</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 font-sans">Data Storage &amp; Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your subscription data is stored exclusively on your device using secure local storage. We do not transmit, store, or have access to your personal subscription information on any external servers.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 font-sans">Third-Party Services</h2>
            <p className="text-muted-foreground leading-relaxed">
              <strong>RevenueCat:</strong> We use RevenueCat to manage subscriptions. RevenueCat processes purchase data in accordance with their privacy policy. They do not have access to your subscription tracking data.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              <strong>Apple App Store:</strong> Purchases are processed through Apple's secure payment system.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 font-sans">Your Rights</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-3">
              <li><strong>Access:</strong> Your data is stored locally and accessible only to you</li>
              <li><strong>Deletion:</strong> You can delete all data at any time through Settings → Clear All Data</li>
              <li><strong>Export:</strong> Plus users can export their data in CSV or JSON format</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 font-sans">Children's Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              SubWise is not intended for children under 13. We do not knowingly collect information from children under 13.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 font-sans">Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by updating the "Last Updated" date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 font-sans">Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about this Privacy Policy, please contact us at:
            </p>
            <div className="mt-4 p-4 border rounded-lg bg-muted/10">
              <p className="text-sm"><strong>Email:</strong> usesubwiseapp@gmail.com</p>
            </div>
          </section>
        </div>
      </div>
    </div>
    <Footer />
  </>
);
}
