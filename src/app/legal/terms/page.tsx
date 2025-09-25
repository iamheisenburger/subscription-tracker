/* eslint-disable react/no-unescaped-entities */
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";

export default function TermsOfServicePage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-6">
          <div className="prose prose-gray max-w-none dark:prose-invert">
            <h1 className="text-3xl font-bold tracking-tight font-sans mb-8">Terms of Service</h1>
            
            <div className="text-sm text-muted-foreground mb-8">
              <p><strong>Effective Date:</strong> January 1, 2025</p>
              <p><strong>Last Updated:</strong> January 1, 2025</p>
            </div>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 font-sans">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                Welcome to SubWise ("we," "our," or "us"). These Terms of Service ("Terms") govern your use of our subscription tracking service (the "Service") operated by SubWise. By accessing or using our Service, you agree to be bound by these Terms.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                If you disagree with any part of these terms, then you may not access the Service. These Terms apply to all visitors, users, and others who access or use the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 font-sans">2. Description of Service</h2>
              <p className="text-muted-foreground leading-relaxed">
                SubWise is a subscription tracking and management service that helps users:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-3">
                <li>Track and organize recurring subscriptions</li>
                <li>Monitor spending patterns and analytics</li>
                <li>Receive renewal reminders and spending alerts</li>
                <li>Analyze subscription costs across multiple currencies</li>
                <li>Export subscription data for personal use</li>
                <li>Manage budget thresholds and notifications</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 font-sans">3. User Accounts</h2>
              
              <h3 className="text-xl font-semibold mb-3 font-sans">3.1 Account Registration</h3>
              <p className="text-muted-foreground leading-relaxed">
                To use certain features of our Service, you must register for an account. You agree to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-3">
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Maintain and promptly update your account information</li>
                <li>Maintain the security of your password and identification</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
                <li>Accept responsibility for all activities under your account</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-6 font-sans">3.2 Account Types</h3>
              <p className="text-muted-foreground leading-relaxed">
                SubWise offers two types of accounts:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-3">
                <li><strong>Free Account:</strong> Limited to 3 subscriptions with basic features</li>
                <li><strong>Premium Account:</strong> Unlimited subscriptions with advanced features</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 font-sans">4. Subscription Plans and Billing</h2>
              
              <h3 className="text-xl font-semibold mb-3 font-sans">4.1 Free Plan</h3>
              <p className="text-muted-foreground leading-relaxed">
                Our Free plan is available at no cost and includes basic subscription tracking features with limitations as specified in our pricing page.
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-6 font-sans">4.2 Premium Plan</h3>
              <p className="text-muted-foreground leading-relaxed">
                Premium subscriptions are billed in advance on a monthly or annual basis:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-3">
                <li><strong>Monthly:</strong> $9.00 per month</li>
                <li><strong>Annual:</strong> $90.00 per year ($7.50/month equivalent)</li>
                <li><strong>Free Trial:</strong> 7-day trial period for new Premium subscribers</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-6 font-sans">4.3 Billing and Payments</h3>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>All fees are exclusive of applicable taxes unless otherwise stated</li>
                <li>You authorize us to charge your payment method for all fees owed</li>
                <li>Payments are processed through secure third-party payment processors</li>
                <li>Failed payments may result in service suspension or termination</li>
                <li>You are responsible for providing current and valid payment information</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-6 font-sans">4.4 Refunds and Cancellation</h3>
              <p className="text-muted-foreground leading-relaxed">
                You may cancel your Premium subscription at any time. Upon cancellation:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-3">
                <li>You will retain Premium access until the end of your current billing period</li>
                <li>Your account will automatically downgrade to Free plan features</li>
                <li>No partial refunds are provided for unused portions of subscription periods</li>
                <li>Refunds may be provided at our sole discretion for exceptional circumstances</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 font-sans">5. User Content and Data</h2>
              
              <h3 className="text-xl font-semibold mb-3 font-sans">5.1 Your Data</h3>
              <p className="text-muted-foreground leading-relaxed">
                You retain ownership of all subscription data, personal information, and content you provide to SubWise. By using our Service, you grant us a limited license to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-3">
                <li>Store and process your data to provide the Service</li>
                <li>Use aggregated, anonymized data for service improvement</li>
                <li>Create backups for data protection and recovery</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-6 font-sans">5.2 Data Accuracy</h3>
              <p className="text-muted-foreground leading-relaxed">
                You are responsible for the accuracy of all information you provide to SubWise. We provide tools and features to help you manage your subscriptions, but you remain solely responsible for:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-3">
                <li>Verifying the accuracy of subscription information</li>
                <li>Monitoring your actual subscription charges and renewals</li>
                <li>Making informed financial decisions based on the data</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 font-sans">6. Acceptable Use Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                You agree not to use the Service to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-3">
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe upon the rights of others</li>
                <li>Transmit harmful, offensive, or inappropriate content</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Attempt to gain unauthorized access to any part of the Service</li>
                <li>Reverse engineer, decompile, or disassemble the Service</li>
                <li>Use the Service for any commercial purpose without our consent</li>
                <li>Create multiple accounts to circumvent service limitations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 font-sans">7. Intellectual Property Rights</h2>
              
              <h3 className="text-xl font-semibold mb-3 font-sans">7.1 Our Rights</h3>
              <p className="text-muted-foreground leading-relaxed">
                The Service and its original content, features, and functionality are owned by SubWise and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-6 font-sans">7.2 Limited License</h3>
              <p className="text-muted-foreground leading-relaxed">
                We grant you a limited, non-exclusive, non-transferable, revocable license to access and use the Service for your personal, non-commercial use in accordance with these Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 font-sans">8. Privacy and Data Protection</h2>
              <p className="text-muted-foreground leading-relaxed">
                Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect your information when you use our Service. By using our Service, you agree to the collection and use of information in accordance with our Privacy Policy.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Our Privacy Policy is incorporated into these Terms by reference. Please review our Privacy Policy, which also governs your use of the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 font-sans">9. Service Availability and Modifications</h2>
              
              <h3 className="text-xl font-semibold mb-3 font-sans">9.1 Service Availability</h3>
              <p className="text-muted-foreground leading-relaxed">
                We strive to provide continuous access to our Service, but we do not guarantee that the Service will be available at all times. We may experience outages, maintenance periods, or other disruptions.
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-6 font-sans">9.2 Service Modifications</h3>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify, suspend, or discontinue the Service (or any part thereof) at any time, with or without notice. We will not be liable to you or any third party for any modification, suspension, or discontinuation of the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 font-sans">10. Disclaimers</h2>
              <p className="text-muted-foreground leading-relaxed">
                THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS. SUBWISE EXPRESSLY DISCLAIMS ALL WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING BUT NOT LIMITED TO:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-3">
                <li>MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE</li>
                <li>NON-INFRINGEMENT OF THIRD-PARTY RIGHTS</li>
                <li>ACCURACY, COMPLETENESS, OR RELIABILITY OF CONTENT</li>
                <li>UNINTERRUPTED OR ERROR-FREE OPERATION</li>
                <li>SECURITY OR VIRUS-FREE ENVIRONMENT</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                SubWise is a tool to help you track subscriptions, but you remain solely responsible for managing your actual subscriptions and financial obligations.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 font-sans">11. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, SUBWISE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-3">
                <li>Loss of profits, data, use, goodwill, or other intangible losses</li>
                <li>Damages resulting from unauthorized access to your account</li>
                <li>Interruption or cessation of transmission to or from our Service</li>
                <li>Bugs, viruses, trojan horses, or similar harmful code</li>
                <li>Errors or omissions in content or loss of any content transmitted</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Our total liability for any claim arising out of or relating to these Terms or the Service shall not exceed the amount you paid to us for the Service in the 12 months preceding the claim.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 font-sans">12. Indemnification</h2>
              <p className="text-muted-foreground leading-relaxed">
                You agree to defend, indemnify, and hold harmless SubWise and its officers, directors, employees, agents, and affiliates from and against any and all claims, damages, obligations, losses, liabilities, costs, or debt, and expenses (including attorney's fees) resulting from:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-3">
                <li>Your use of and access to the Service</li>
                <li>Your violation of any term of these Terms</li>
                <li>Your violation of any third-party right</li>
                <li>Any content you post or transmit through the Service</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 font-sans">13. Termination</h2>
              
              <h3 className="text-xl font-semibold mb-3 font-sans">13.1 Termination by You</h3>
              <p className="text-muted-foreground leading-relaxed">
                You may terminate your account at any time by contacting us or using the account settings in your dashboard.
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-6 font-sans">13.2 Termination by Us</h3>
              <p className="text-muted-foreground leading-relaxed">
                We may terminate or suspend your account and access to the Service immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users of the Service, us, or third parties.
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-6 font-sans">13.3 Effect of Termination</h3>
              <p className="text-muted-foreground leading-relaxed">
                Upon termination, your right to use the Service will cease immediately. We will delete your account and data according to our Privacy Policy, unless we are required to retain it by law.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 font-sans">14. Governing Law and Disputes</h2>
              
              <h3 className="text-xl font-semibold mb-3 font-sans">14.1 Governing Law</h3>
              <p className="text-muted-foreground leading-relaxed">
                These Terms shall be interpreted and governed by the laws of the jurisdiction in which SubWise operates, without regard to conflict of law provisions.
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-6 font-sans">14.2 Dispute Resolution</h3>
              <p className="text-muted-foreground leading-relaxed">
                We encourage users to contact us first to resolve any disputes. If we cannot resolve a dispute through direct communication, both parties agree to attempt resolution through mediation before pursuing legal action.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 font-sans">15. Changes to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect. Material changes will be communicated through:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-3">
                <li>Email notification to registered users</li>
                <li>Prominent notice on our Service</li>
                <li>Updates to this page with revised effective dates</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Your continued use of the Service after any such changes constitutes your acceptance of the new Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 font-sans">16. Contact Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <div className="mt-4 p-4 border rounded-lg bg-muted/10">
                <p className="text-sm"><strong>Email:</strong> usesubwiseapp@gmail.com</p>
                <p className="text-sm"><strong>Support:</strong> usesubwiseapp@gmail.com</p>
                <p className="text-sm"><strong>Address:</strong> SubWise Legal Team</p>
                <p className="text-sm">123 Legal Street, Terms City, TC 12345</p>
              </div>
            </section>

            <section className="mb-8 p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Note:</strong> These Terms of Service are designed to be fair and transparent. We encourage all users to read and understand these terms before using our Service. If you have any questions or concerns, please don't hesitate to contact our support team.
              </p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
