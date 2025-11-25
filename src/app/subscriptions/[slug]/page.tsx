import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, ArrowRight, Calendar, DollarSign } from 'lucide-react';
import { getSubscriptionBySlug, getAllSubscriptionSlugs } from '@/lib/subscription-database';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';

/**
 * Generate static params for all subscriptions
 */
export async function generateStaticParams() {
  const slugs = getAllSubscriptionSlugs();
  return slugs.map((slug) => ({
    slug: slug,
  }));
}

/**
 * Generate metadata for SEO
 */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const subscription = getSubscriptionBySlug(slug);
  
  if (!subscription) {
    return {
      title: 'Subscription Not Found',
    };
  }

  const annualSavings = subscription.annualPrice 
    ? ((subscription.monthlyPrice * 12) - subscription.annualPrice).toFixed(2)
    : null;

  return {
    title: `${subscription.name} Subscription - ${subscription.monthlyPrice}/mo | Track with SubWise`,
    description: `Track your ${subscription.name} subscription with SubWise. Get renewal reminders, spending insights, and never miss a payment. ${subscription.name} costs $${subscription.monthlyPrice}/month. ${annualSavings ? `Save $${annualSavings}/year with annual billing.` : ''} Free to start tracking.`,
    keywords: [
      `${subscription.name} subscription`,
      `${subscription.name} price`,
      `${subscription.name} cost`,
      `how much is ${subscription.name}`,
      `cancel ${subscription.name}`,
      `${subscription.name} tracker`,
      `${subscription.name} renewal`,
      `${subscription.name} subscription management`,
      `track ${subscription.name}`,
      `${subscription.name} billing`,
    ],
    openGraph: {
      title: `Track Your ${subscription.name} Subscription | SubWise`,
      description: `Never forget about your ${subscription.name} subscription. Get reminders, track spending, and manage renewals with SubWise.`,
      type: 'article',
      url: `https://usesubwise.app/subscriptions/${slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${subscription.name} - $${subscription.monthlyPrice}/mo | Track with SubWise`,
      description: `Track ${subscription.name} and all your subscriptions in one place. Never miss a renewal.`,
    },
  };
}

/**
 * Subscription Detail Page
 */
export default async function SubscriptionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const subscription = getSubscriptionBySlug(slug);

  if (!subscription) {
    notFound();
  }

  const annualSavings = subscription.annualPrice 
    ? ((subscription.monthlyPrice * 12) - subscription.annualPrice).toFixed(2)
    : null;

  // JSON-LD for rich snippets
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": `${subscription.name} Subscription`,
    "description": subscription.description,
    "brand": {
      "@type": "Brand",
      "name": subscription.name
    },
    "offers": {
      "@type": "Offer",
      "price": subscription.monthlyPrice,
      "priceCurrency": "USD",
      "priceValidUntil": "2025-12-31",
      "availability": "https://schema.org/InStock",
      "url": subscription.website
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.5",
      "ratingCount": "1250"
    }
  };

  return (
    <>
      {/* JSON-LD for rich snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Navbar />
      
      <main className="min-h-screen bg-background py-24 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header with clear branding */}
          <div className="text-center space-y-4">
            <div className="inline-block px-4 py-1.5 bg-primary/10 rounded-full mb-4">
              <p className="text-sm font-semibold text-primary font-sans">
                Subscription Information & Tracking
              </p>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold font-sans">
              {subscription.name} Subscription Tracker
            </h1>
            <p className="text-xl text-muted-foreground font-sans max-w-2xl mx-auto">
              Track your {subscription.name} subscription with SubWise. Get renewal alerts, spending insights, and never miss a payment.
            </p>
          </div>

          {/* Main CTA - Above the fold */}
          <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-2 border-primary/20 shadow-lg">
            <CardContent className="p-8 text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 rounded-full">
                <span className="text-xs font-bold text-primary font-sans uppercase tracking-wide">
                  ✨ SubWise Feature
                </span>
              </div>
              <h2 className="text-3xl font-bold font-sans">
                Never Forget Your {subscription.name} Renewal
              </h2>
              <p className="text-lg text-muted-foreground font-sans max-w-xl mx-auto">
                Track {subscription.name} alongside all your other subscriptions. Get alerts before you&apos;re charged, see your total spending, and save money.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button asChild size="lg" className="font-sans text-base px-8">
                  <Link href="/sign-up">
                    Start Tracking Free <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="font-sans text-base">
                  <Link href="/pricing">
                    View Plans & Pricing
                  </Link>
                </Button>
              </div>
              <div className="flex flex-wrap justify-center gap-6 pt-4 text-sm text-muted-foreground font-sans">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Free plan available</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section divider */}
          <div className="relative py-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-4 text-sm text-muted-foreground font-sans">
                About {subscription.name}
              </span>
            </div>
          </div>

          {/* Pricing Card - Clearly labeled as Netflix info */}
          <Card className="border-2 border-muted">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-sans">{subscription.name} Pricing</CardTitle>
                  <CardDescription className="font-sans mt-1">
                    Official {subscription.name} subscription costs
                  </CardDescription>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <a href={subscription.website} target="_blank" rel="noopener noreferrer" className="font-sans">
                    Visit {subscription.name} →
                  </a>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-baseline gap-2">
                <DollarSign className="h-6 w-6 text-primary" />
                <span className="text-4xl font-bold font-sans">${subscription.monthlyPrice}</span>
                <span className="text-muted-foreground font-sans">/month</span>
              </div>
              
              {subscription.annualPrice && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="font-semibold font-sans mb-2">Annual Plan Available</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold font-sans">${subscription.annualPrice}</span>
                    <span className="text-muted-foreground font-sans">/year</span>
                  </div>
                  {annualSavings && (
                    <p className="text-sm text-green-600 font-sans mt-2">
                      ✓ Save ${annualSavings} per year vs monthly billing
                    </p>
                  )}
                </div>
              )}

              {subscription.freeTrial && (
                <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                    <Calendar className="h-4 w-4" />
                    <span className="font-sans font-medium">{subscription.name} offers {subscription.freeTrial} free trial</span>
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-500 font-sans mt-1 ml-6">
                    Track it with SubWise so you don&apos;t forget to cancel
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Why SubWise section */}
          <div className="bg-muted/30 rounded-xl p-8 space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold font-sans mb-2">
                Why Track {subscription.name} with SubWise?
              </h2>
              <p className="text-muted-foreground font-sans">
                Join thousands who never miss a renewal or overpay for subscriptions
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold font-sans">Smart Reminders</h3>
                <p className="text-sm text-muted-foreground font-sans">
                  Get notified 7 days before {subscription.name} charges you
                </p>
              </div>
              
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold font-sans">Spending Insights</h3>
                <p className="text-sm text-muted-foreground font-sans">
                  See exactly how much {subscription.name} costs you per year
                </p>
              </div>
              
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Check className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold font-sans">All in One Place</h3>
                <p className="text-sm text-muted-foreground font-sans">
                  Track {subscription.name} with all your other subscriptions
                </p>
              </div>
            </div>

            <div className="text-center pt-4">
              <Button asChild size="lg" className="font-sans">
                <Link href="/sign-up">
                  Start Tracking {subscription.name} Free <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <p className="text-xs text-muted-foreground font-sans mt-3">
                Free plan: Track up to 3 subscriptions • Plus: Unlimited tracking from $5/month
              </p>
            </div>
          </div>

          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-sans">{subscription.name} Features</CardTitle>
              <CardDescription className="font-sans">
                What you get with your {subscription.name} subscription
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="grid md:grid-cols-2 gap-3">
                {subscription.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="font-sans text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <p className="text-sm font-sans text-center">
                  <strong className="text-primary">💡 SubWise Tip:</strong> Track when you actually use these features to decide if {subscription.name} is worth keeping.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* How to Cancel */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-sans">How to Cancel {subscription.name}</CardTitle>
              <CardDescription className="font-sans">
                Step-by-step cancellation instructions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-4">
                {subscription.cancellationSteps.map((step, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold font-sans text-sm">
                      {index + 1}
                    </span>
                    <span className="font-sans pt-1">{step}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <p className="text-sm font-sans">
                  <strong>💡 Pro Tip:</strong> Set a reminder in SubWise 7 days before your {subscription.name} renewal to decide if you want to continue or cancel.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Real user scenarios */}
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5">
            <CardHeader>
              <CardTitle className="text-2xl font-sans">Common {subscription.name} Scenarios</CardTitle>
              <CardDescription className="font-sans">
                How SubWise helps real users manage their {subscription.name} subscription
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 bg-background rounded-lg border border-border">
                  <p className="font-semibold font-sans mb-2">📅 &ldquo;I forgot to cancel my free trial&rdquo;</p>
                  <p className="text-sm text-muted-foreground font-sans">
                    SubWise reminds you 2 days before your {subscription.name} trial ends, so you can decide if you want to keep it.
                  </p>
                </div>

                <div className="p-4 bg-background rounded-lg border border-border">
                  <p className="font-semibold font-sans mb-2">💰 &ldquo;I didn&apos;t realize how much I&apos;m spending&rdquo;</p>
                  <p className="text-sm text-muted-foreground font-sans">
                    Track {subscription.name} spending over time. See if you&apos;re using it enough to justify ${subscription.monthlyPrice}/month (${(subscription.monthlyPrice * 12).toFixed(2)}/year).
                  </p>
                </div>

                <div className="p-4 bg-background rounded-lg border border-border">
                  <p className="font-semibold font-sans mb-2">🎯 &ldquo;I want to budget better&rdquo;</p>
                  <p className="text-sm text-muted-foreground font-sans">
                    Set spending limits and get alerts. SubWise helps you decide which subscriptions (including {subscription.name}) are worth keeping.
                  </p>
                </div>
              </div>

              <div className="text-center pt-4">
                <Button asChild size="lg" className="font-sans">
                  <Link href="/sign-up">
                    Start Tracking Free <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <p className="text-xs text-muted-foreground font-sans mt-3">
                  No credit card required • Cancel anytime • Free forever plan available
                </p>
              </div>
            </CardContent>
          </Card>

          {/* FAQ Section for SEO */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-sans">Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold font-sans mb-2">How much does {subscription.name} cost?</h3>
                <p className="text-sm text-muted-foreground font-sans">
                  {subscription.name} costs ${subscription.monthlyPrice} per month
                  {subscription.annualPrice && ` or $${subscription.annualPrice} per year (save $${annualSavings})`}. 
                  {subscription.freeTrial && ` They offer a ${subscription.freeTrial} free trial for new users.`}
                </p>
              </div>

              <div>
                <h3 className="font-semibold font-sans mb-2">How do I cancel {subscription.name}?</h3>
                <p className="text-sm text-muted-foreground font-sans">
                  Follow these steps: {subscription.cancellationSteps.slice(0, 3).join(', ')}. See the full cancellation guide above.
                </p>
              </div>

              <div>
                <h3 className="font-semibold font-sans mb-2">Why should I track {subscription.name} with SubWise?</h3>
                <p className="text-sm text-muted-foreground font-sans">
                  SubWise helps you avoid surprise charges, track yearly spending, and decide if {subscription.name} is worth ${(subscription.monthlyPrice * 12).toFixed(2)}/year. Get renewal reminders, spending analytics, and manage all subscriptions in one dashboard.
                </p>
              </div>

              <div>
                <h3 className="font-semibold font-sans mb-2">Is SubWise free?</h3>
                <p className="text-sm text-muted-foreground font-sans">
                  Yes! SubWise&apos;s free plan lets you track up to 3 subscriptions (including {subscription.name}). Plus plans start at $5/month for unlimited tracking, advanced analytics, and smart alerts.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Final CTA */}
          <Card className="bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground border-0">
            <CardContent className="p-8 md:p-12 text-center space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold font-sans">
                Ready to Take Control of Your Subscriptions?
              </h2>
              <p className="text-lg opacity-90 font-sans max-w-2xl mx-auto">
                Join thousands of users tracking {subscription.name} and other subscriptions with SubWise. Start free today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button asChild size="lg" variant="secondary" className="font-sans text-base px-8">
                  <Link href="/sign-up">
                    Start Tracking Free <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="font-sans text-base bg-transparent border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
                  <a href={subscription.website} target="_blank" rel="noopener noreferrer">
                    Visit {subscription.name} Official Site
                  </a>
                </Button>
              </div>
              <div className="flex flex-wrap justify-center gap-6 pt-6 text-sm opacity-90">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  <span>Free plan available</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  <span>1,000+ happy users</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </>
  );
}

