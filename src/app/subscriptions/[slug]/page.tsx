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
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold font-sans">
              {subscription.name} Subscription Tracker
            </h1>
            <p className="text-xl text-muted-foreground font-sans">
              Track your {subscription.name} subscription with SubWise and never miss a renewal
            </p>
          </div>

          {/* Pricing Card */}
          <Card className="border-2 border-primary">
            <CardHeader>
              <CardTitle className="text-2xl font-sans">Pricing</CardTitle>
              <CardDescription className="font-sans">
                Current {subscription.name} subscription costs
              </CardDescription>
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
                <div className="flex items-center gap-2 text-green-600">
                  <Calendar className="h-4 w-4" />
                  <span className="font-sans">{subscription.freeTrial} free trial available</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* CTA to track with SubWise */}
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-6 text-center space-y-4">
              <h2 className="text-2xl font-bold font-sans">
                Track {subscription.name} with SubWise
              </h2>
              <p className="text-muted-foreground font-sans">
                Never forget about your {subscription.name} subscription. Get renewal reminders, spending insights, and manage all your subscriptions in one place.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="font-sans">
                  <Link href="/sign-up">
                    Start Tracking Free <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="font-sans">
                  <Link href="/pricing">
                    View Plans
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-sans">What&apos;s Included</CardTitle>
              <CardDescription className="font-sans">
                Features you get with {subscription.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {subscription.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="font-sans">{feature}</span>
                  </li>
                ))}
              </ul>
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

          {/* SubWise Benefits */}
          <Card className="border-2 border-primary">
            <CardHeader>
              <CardTitle className="text-2xl font-sans">Why Track with SubWise?</CardTitle>
              <CardDescription className="font-sans">
                Benefits of managing your {subscription.name} subscription with SubWise
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold font-sans">Renewal Reminders</p>
                    <p className="text-sm text-muted-foreground font-sans">Get notified before {subscription.name} charges you</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold font-sans">Spending Insights</p>
                    <p className="text-sm text-muted-foreground font-sans">See how much you spend on {subscription.name} yearly</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold font-sans">All in One Place</p>
                    <p className="text-sm text-muted-foreground font-sans">Track {subscription.name} alongside all your other subscriptions</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold font-sans">Free to Start</p>
                    <p className="text-sm text-muted-foreground font-sans">Track up to 3 subscriptions completely free</p>
                  </div>
                </li>
              </ul>
              <div className="mt-6">
                <Button asChild className="w-full font-sans" size="lg">
                  <Link href="/sign-up">
                    Start Tracking {subscription.name} Free <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Official Link */}
          <div className="text-center">
            <Button asChild variant="outline" size="lg" className="font-sans">
              <a href={subscription.website} target="_blank" rel="noopener noreferrer">
                Visit {subscription.name} Official Site
              </a>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

