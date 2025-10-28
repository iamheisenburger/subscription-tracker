import { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SUBSCRIPTION_DATABASE, getSubscriptionsByCategory, getTotalSearchVolume } from '@/lib/subscription-database';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Popular Subscriptions to Track | SubWise',
  description: 'Track popular subscriptions including Netflix, Spotify, Disney+, Adobe Creative Cloud, and more. Get renewal reminders and spending insights with SubWise.',
  keywords: [
    'subscription list',
    'popular subscriptions',
    'streaming subscriptions',
    'software subscriptions',
    'subscription tracker',
    'track subscriptions',
    'subscription management',
    'netflix spotify disney',
  ],
};

export default function SubscriptionsPage() {
  const categories = ['streaming', 'music', 'software', 'productivity', 'gaming', 'fitness', 'news', 'food', 'cloud'] as const;
  
  const categoryNames = {
    streaming: 'Streaming Services',
    music: 'Music Streaming',
    software: 'Creative Software',
    productivity: 'Productivity Tools',
    gaming: 'Gaming',
    fitness: 'Fitness & Health',
    news: 'News & Media',
    food: 'Food & Delivery',
    cloud: 'Cloud Storage'
  };

  return (
    <>
      <Navbar />
      
      <main className="min-h-screen bg-background py-24 px-4">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold font-sans">
              Track Any Subscription with SubWise
            </h1>
            <p className="text-xl text-muted-foreground font-sans max-w-2xl mx-auto">
              Never miss a renewal. Get spending insights. Manage all your subscriptions in one place.
            </p>
            <div className="flex justify-center gap-4 mt-6">
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
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl font-bold font-sans text-center">
                  {SUBSCRIPTION_DATABASE.length}+
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground font-sans">
                  Subscriptions tracked
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl font-bold font-sans text-center">
                  {getTotalSearchVolume().toLocaleString()}+
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground font-sans">
                  Monthly searches
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl font-bold font-sans text-center">
                  Free
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground font-sans">
                  To start tracking
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Subscription categories */}
          {categories.map((category) => {
            const subscriptions = getSubscriptionsByCategory(category);
            if (subscriptions.length === 0) return null;

            return (
              <div key={category} className="space-y-6">
                <h2 className="text-3xl font-bold font-sans">
                  {categoryNames[category]}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {subscriptions.map((subscription) => (
                    <Link 
                      key={subscription.slug} 
                      href={`/subscriptions/${subscription.slug}`}
                      className="block group"
                    >
                      <Card className="h-full transition-all hover:shadow-lg hover:border-primary">
                        <CardHeader>
                          <CardTitle className="text-xl font-sans group-hover:text-primary transition-colors">
                            {subscription.name}
                          </CardTitle>
                          <CardDescription className="font-sans">
                            ${subscription.monthlyPrice}/month
                            {subscription.annualPrice && (
                              <span className="text-green-600 ml-2">
                                • ${subscription.annualPrice}/year
                              </span>
                            )}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground font-sans line-clamp-2">
                            {subscription.description}
                          </p>
                          {subscription.freeTrial && (
                            <p className="text-sm text-green-600 font-sans mt-2">
                              ✓ {subscription.freeTrial} free trial
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}

          {/* CTA */}
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-12 text-center space-y-6">
              <h2 className="text-3xl font-bold font-sans">
                Ready to Take Control of Your Subscriptions?
              </h2>
              <p className="text-lg text-muted-foreground font-sans max-w-2xl mx-auto">
                Join thousands of users who are saving money and never missing renewals with SubWise.
              </p>
              <Button asChild size="lg" className="font-sans">
                <Link href="/sign-up">
                  Start Tracking Free <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </>
  );
}







