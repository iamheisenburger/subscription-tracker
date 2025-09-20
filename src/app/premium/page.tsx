import { auth } from '@clerk/nextjs/server'
import { Protect } from '@clerk/nextjs'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, FileText, Bell, Tags, Zap, HeadphonesIcon } from 'lucide-react'

export default async function PremiumPage() {
  const { has } = await auth()
  
  const hasPremiumPlan = has({ plan: 'premium_user' })
  
  if (!hasPremiumPlan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Premium Features</CardTitle>
            <CardDescription>
              Upgrade to Premium to unlock advanced subscription tracking features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                <span>Advanced Spending Analytics</span>
              </div>
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-green-500" />
                <span>Export to CSV/PDF</span>
              </div>
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-orange-500" />
                <span>Smart Alerts & Notifications</span>
              </div>
              <div className="flex items-center gap-3">
                <Tags className="h-5 w-5 text-purple-500" />
                <span>Custom Categories</span>
              </div>
            </div>
            
            <div className="pt-4">
              <Link href="/pricing">
                <Button className="w-full">
                  Upgrade to Premium
                </Button>
              </Link>
            </div>
            
            <div className="text-center">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Premium Features</h1>
              <p className="text-gray-600 mt-2">Advanced tools for power users</p>
            </div>
            <Badge variant="secondary" className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              Premium User
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Protect feature="spending_trends" fallback={<FeatureCard icon={TrendingUp} title="Spending Trends" description="Advanced analytics coming soon" locked />}>
            <FeatureCard 
              icon={TrendingUp} 
              title="Spending Trends" 
              description="View detailed analytics and spending patterns over time"
              href="/premium/analytics"
            />
          </Protect>

          <Protect feature="export_csv_pdf" fallback={<FeatureCard icon={FileText} title="Export Data" description="Export functionality coming soon" locked />}>
            <FeatureCard 
              icon={FileText} 
              title="Export Data" 
              description="Export your subscription data to CSV or PDF formats"
              href="/premium/export"
            />
          </Protect>

          <Protect feature="smart_alerts" fallback={<FeatureCard icon={Bell} title="Smart Alerts" description="Smart notifications coming soon" locked />}>
            <FeatureCard 
              icon={Bell} 
              title="Smart Alerts" 
              description="Get intelligent notifications about your subscriptions"
              href="/premium/alerts"
            />
          </Protect>

          <Protect feature="custom_categories" fallback={<FeatureCard icon={Tags} title="Custom Categories" description="Custom categorization coming soon" locked />}>
            <FeatureCard 
              icon={Tags} 
              title="Custom Categories" 
              description="Create and manage custom subscription categories"
              href="/premium/categories"
            />
          </Protect>

          <Protect feature="advanced_notifications" fallback={<FeatureCard icon={Zap} title="Advanced Notifications" description="Advanced notifications coming soon" locked />}>
            <FeatureCard 
              icon={Zap} 
              title="Advanced Notifications" 
              description="Customize notification settings and delivery methods"
              href="/premium/notifications"
            />
          </Protect>

          <Protect feature="priority_support" fallback={<FeatureCard icon={HeadphonesIcon} title="Priority Support" description="Priority support coming soon" locked />}>
            <FeatureCard 
              icon={HeadphonesIcon} 
              title="Priority Support" 
              description="Get priority customer support with faster response times"
              href="/premium/support"
            />
          </Protect>
        </div>

        <div className="mt-8 text-center">
          <Link href="/dashboard">
            <Button variant="outline">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

interface FeatureCardProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  href?: string
  locked?: boolean
}

function FeatureCard({ icon: Icon, title, description, href, locked }: FeatureCardProps) {
  const content = (
    <Card className={`h-full transition-all hover:shadow-md ${locked ? 'opacity-60' : 'hover:shadow-lg cursor-pointer'}`}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${locked ? 'bg-gray-100' : 'bg-blue-50'}`}>
            <Icon className={`h-6 w-6 ${locked ? 'text-gray-400' : 'text-blue-600'}`} />
          </div>
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            {locked && <Badge variant="outline" className="text-xs mt-1">Coming Soon</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-sm">
          {description}
        </CardDescription>
      </CardContent>
    </Card>
  )

  if (href && !locked) {
    return <Link href={href}>{content}</Link>
  }

  return content
}
