/* eslint-disable react/no-unescaped-entities */
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";

export default function PrivacyPolicyPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-6">
          <div className="prose prose-gray max-w-none dark:prose-invert">
            <h1 className="text-3xl font-bold tracking-tight font-sans mb-8">Privacy Policy</h1>
            
            <div className="text-sm text-muted-foreground mb-8">
              <p><strong>Effective Date:</strong> January 1, 2025</p>
              <p><strong>Last Updated:</strong> November 27, 2025</p>
            </div>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 font-sans">1. Introduction</h2>
              <p className="text-muted-foreground leading-relaxed">
                Welcome to SubWise ("we," "our," or "us"). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our subscription tracking service (the "Service").
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                By using SubWise, you agree to the collection and use of information in accordance with this Privacy Policy. If you do not agree with our policies and practices, please do not use our Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 font-sans">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold mb-3 font-sans">2.1 Personal Information</h3>
              <p className="text-muted-foreground leading-relaxed">
                We collect personal information that you voluntarily provide to us when you:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-3">
                <li>Create an account with SubWise</li>
                <li>Add subscription information to your account</li>
                <li>Contact our customer support</li>
                <li>Subscribe to our newsletter or marketing communications</li>
                <li>Participate in surveys or feedback forms</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-6 font-sans">2.2 Subscription Data</h3>
              <p className="text-muted-foreground leading-relaxed">
                To provide our core service, we collect and process:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-3">
                <li>Subscription service names and categories</li>
                <li>Subscription costs and billing cycles</li>
                <li>Renewal dates and payment schedules</li>
                <li>Currency preferences</li>
                <li>Custom categories and tags you create</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-6 font-sans">2.3 Usage Information</h3>
              <p className="text-muted-foreground leading-relaxed">
                We automatically collect certain information when you use our Service:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-3">
                <li>Device information (device type, operating system, browser type)</li>
                <li>IP address and approximate location</li>
                <li>Usage patterns and feature interactions</li>
                <li>Log data (access times, pages viewed, errors encountered)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 font-sans">3. How We Use Your Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use the collected information for the following purposes:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-3">
                <li><strong>Service Provision:</strong> To provide, maintain, and improve our subscription tracking services</li>
                <li><strong>Account Management:</strong> To create and manage your account, authenticate users, and provide customer support</li>
                <li><strong>Notifications:</strong> To send renewal reminders, spending alerts, and important service updates</li>
                <li><strong>Analytics:</strong> To analyze usage patterns and improve our service features</li>
                <li><strong>Communication:</strong> To respond to your inquiries and provide customer support</li>
                <li><strong>Legal Compliance:</strong> To comply with legal obligations and protect our rights</li>
                <li><strong>Marketing:</strong> To send promotional communications (with your consent)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 font-sans">4. Email Integrations (Gmail)</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you choose to connect your Gmail account, SubWise uses Google’s OAuth 2.0 flow to request
                read-only access to specific subscription-related emails, such as receipts, invoices, and
                billing notifications. We do not read or store the content of your personal emails.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                From these subscription-related emails we extract structured data such as merchant name,
                service name, transaction amount, billing currency, billing cadence, and relevant dates
                (for example, renewal dates). We store this structured data in order to power features like
                automatic subscription detection, price change tracking, and renewal reminders.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                You can disconnect Gmail at any time from within your account settings. Disconnecting stops
                all future scans. You may also delete your SubWise account, in which case the structured data
                derived from your Gmail messages will be deleted or anonymized in line with our data retention
                policy described above.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                SubWise does not use Gmail data for advertising, does not sell your Gmail data to third
                parties, and does not allow any human access to Gmail message content except where required
                for security, support, or legal compliance. Our use and transfer of information received from
                Google APIs to any other app will adhere to the{" "}
                <a
                  href="https://developers.google.com/terms/api-services-user-data-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Google API Services User Data Policy
                </a>
                , including the Limited Use requirements.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 font-sans">4. Information Sharing and Disclosure</h2>
              
              <h3 className="text-xl font-semibold mb-3 font-sans">4.1 Third-Party Service Providers</h3>
              <p className="text-muted-foreground leading-relaxed">
                We may share your information with trusted third-party service providers who assist us in:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-3">
                <li><strong>Payment Processing:</strong> Stripe and Clerk (secure payment processing and subscription management)</li>
                <li><strong>Authentication:</strong> Clerk (user authentication and management)</li>
                <li><strong>Database:</strong> Convex (data storage and processing)</li>
                <li><strong>Email Services:</strong> Resend (notification delivery)</li>
                <li><strong>Analytics:</strong> Service providers for usage analytics and performance monitoring</li>
                <li><strong>Hosting:</strong> Vercel (application hosting and deployment)</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                <strong>Important:</strong> We do not store your full credit card information. Payment data is handled directly by Stripe in compliance with PCI-DSS standards.
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-6 font-sans">4.2 Legal Requirements</h3>
              <p className="text-muted-foreground leading-relaxed">
                We may disclose your information if required by law or in good faith belief that such action is necessary to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-3">
                <li>Comply with legal obligations or court orders</li>
                <li>Protect and defend our rights or property</li>
                <li>Prevent fraud or security threats</li>
                <li>Protect the safety of our users or the public</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-6 font-sans">4.3 Business Transfers</h3>
              <p className="text-muted-foreground leading-relaxed">
                In the event of a merger, acquisition, or sale of assets, your personal information may be transferred as part of that transaction. We will provide notice of any such change in ownership or control.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 font-sans">5. Data Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                We implement industry-standard security measures to protect your personal information:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-3">
                <li><strong>Encryption:</strong> All data transmission is encrypted using TLS/SSL protocols</li>
                <li><strong>Access Controls:</strong> Strict access controls and authentication measures</li>
                <li><strong>Data Minimization:</strong> We collect only the information necessary to provide our services</li>
                <li><strong>Regular Security Audits:</strong> Ongoing monitoring and security assessments</li>
                <li><strong>Secure Infrastructure:</strong> Use of reputable cloud providers with security certifications</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 font-sans">6. Your Privacy Rights</h2>
              <p className="text-muted-foreground leading-relaxed">
                You have the following rights regarding your personal information:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-3">
                <li><strong>Access:</strong> Request access to your personal information</li>
                <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal information (subject to legal requirements)</li>
                <li><strong>Portability:</strong> Request a copy of your data in a structured, machine-readable format</li>
                <li><strong>Opt-out:</strong> Unsubscribe from marketing communications at any time</li>
                <li><strong>Withdrawal of Consent:</strong> Withdraw consent for data processing where applicable</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                To exercise these rights, please contact us using the information provided in the "Contact Us" section below.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 font-sans">7. Cookies and Tracking Technologies</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use cookies and similar tracking technologies to enhance your experience:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-3">
                <li><strong>Essential Cookies:</strong> Required for basic functionality and security</li>
                <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
                <li><strong>Analytics Cookies:</strong> Help us understand how users interact with our service</li>
                <li><strong>Authentication Cookies:</strong> Maintain your logged-in session</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                You can control cookie settings through your browser preferences. Note that disabling certain cookies may affect the functionality of our Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 font-sans">8. Data Retention</h2>
              <p className="text-muted-foreground leading-relaxed">
                We retain your personal information only as long as necessary to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-3">
                <li>Provide our services to you</li>
                <li>Comply with legal obligations</li>
                <li>Resolve disputes and enforce agreements</li>
                <li>Maintain security and prevent fraud</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                When you delete your account, we will delete or anonymize your personal information within 30 days, except where longer retention is required by law.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 font-sans">9. International Data Transfers</h2>
              <p className="text-muted-foreground leading-relaxed">
                Your information may be transferred to and processed in countries other than your country of residence. These countries may have different data protection laws. When we transfer your information internationally, we ensure appropriate safeguards are in place to protect your data.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 font-sans">10. Children's Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                SubWise is not intended for use by children under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected personal information from a child under 13, we will take steps to delete such information promptly.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 font-sans">11. Changes to This Privacy Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any changes by:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-3">
                <li>Posting the new Privacy Policy on this page</li>
                <li>Updating the "Last Updated" date</li>
                <li>Sending you an email notification for material changes</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Your continued use of SubWise after any changes indicates your acceptance of the updated Privacy Policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 font-sans">12. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about this Privacy Policy or our privacy practices, please contact us:
              </p>
              <div className="mt-4 p-4 border rounded-lg bg-muted/10">
                <p className="text-sm"><strong>Email:</strong> usesubwiseapp@gmail.com</p>
                <p className="text-sm"><strong>Support:</strong> usesubwiseapp@gmail.com</p>
                <p className="text-sm"><strong>Phone:</strong> +49 1520 9530880</p>
                <p className="text-sm"><strong>Address:</strong> SubWise Privacy Team</p>
                <p className="text-sm">Kerpener Straße 6, 50170 Kerpen, Germany</p>
              </div>
              <p className="text-muted-foreground leading-relaxed mt-4 text-sm">
                For data protection inquiries specifically, please include "Privacy Request" in your email subject line to ensure prompt handling.
              </p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
