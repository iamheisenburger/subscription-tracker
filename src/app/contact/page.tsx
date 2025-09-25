/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState } from "react";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Mail, 
  MessageCircle, 
  Clock, 
  Crown, 
  CheckCircle, 
  Send,
  Sparkles,
  Shield,
  Zap
} from "lucide-react";
import { toast } from "sonner";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    category: "",
    planType: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate form submission - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success("Message sent successfully!", {
        description: "We'll get back to you within 24 hours."
      });

      // Reset form
      setFormData({
        name: "",
        email: "",
        subject: "",
        category: "",
        planType: "",
        message: "",
      });
    } catch (error) {
      toast.error("Failed to send message", {
        description: "Please try again or email us directly."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const supportTiers = [
    {
      type: "free",
      title: "Free Plan Support",
      icon: MessageCircle,
      responseTime: "Within 48 hours",
      description: "Email support for basic questions and technical issues",
      features: [
        "Email support during business hours",
        "General troubleshooting assistance",
        "Account and billing questions",
        "Basic feature guidance"
      ],
      badgeColor: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
    },
    {
      type: "premium",
      title: "Premium Plan Support",
      icon: Crown,
      responseTime: "Within 12 hours",
      description: "Priority support with faster response times and advanced assistance",
      features: [
        "Priority email support 7 days a week",
        "Advanced feature troubleshooting",
        "Data export and integration help",
        "Custom configuration assistance",
        "Beta feature access support"
      ],
      badgeColor: "bg-primary text-primary-foreground",
      premium: true
    }
  ];

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-6">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-3xl xs:text-4xl sm:text-5xl font-bold tracking-tight font-sans mb-4">
              Get in Touch
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-sans">
              Need help with SubWise? We&apos;re here to support you whether you&apos;re on our Free or Premium plan.
            </p>
          </div>

          {/* Support Tiers */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {supportTiers.map((tier) => (
              <Card key={tier.type} className={`relative ${tier.premium ? 'border-primary shadow-lg' : ''}`}>
                {tier.premium && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Premium Support
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-6">
                  <div className="mb-4 h-12 w-12 mx-auto flex items-center justify-center bg-primary/10 rounded-full">
                    <tier.icon className={`h-6 w-6 ${tier.premium ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <CardTitle className="text-xl font-sans">{tier.title}</CardTitle>
                  <CardDescription className="text-sm font-sans">{tier.description}</CardDescription>
                  
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{tier.responseTime}</span>
                  </div>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-3">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Contact Form */}
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 font-sans">
                <Mail className="h-5 w-5" />
                Send us a Message
              </CardTitle>
              <CardDescription className="font-sans">
                Fill out the form below and we&apos;ll get back to you based on your plan&apos;s support level.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name and Email Row */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="font-sans">Name *</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Your full name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="font-sans">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Plan Type and Category Row */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="planType" className="font-sans">Your Plan</Label>
                    <Select onValueChange={(value) => handleInputChange("planType", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your plan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free Plan</SelectItem>
                        <SelectItem value="premium">Premium Plan</SelectItem>
                        <SelectItem value="trial">Premium Trial</SelectItem>
                        <SelectItem value="not-sure">Not Sure</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category" className="font-sans">Category</Label>
                    <Select onValueChange={(value) => handleInputChange("category", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technical">Technical Support</SelectItem>
                        <SelectItem value="billing">Billing & Account</SelectItem>
                        <SelectItem value="feature">Feature Request</SelectItem>
                        <SelectItem value="bug">Bug Report</SelectItem>
                        <SelectItem value="data">Data Export/Import</SelectItem>
                        <SelectItem value="integration">Integrations</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Subject */}
                <div className="space-y-2">
                  <Label htmlFor="subject" className="font-sans">Subject *</Label>
                  <Input
                    id="subject"
                    type="text"
                    placeholder="Brief description of your inquiry"
                    value={formData.subject}
                    onChange={(e) => handleInputChange("subject", e.target.value)}
                    required
                  />
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <Label htmlFor="message" className="font-sans">Message *</Label>
                  <Textarea
                    id="message"
                    placeholder="Describe your question or issue in detail. The more information you provide, the better we can help you."
                    rows={6}
                    value={formData.message}
                    onChange={(e) => handleInputChange("message", e.target.value)}
                    required
                  />
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Additional Contact Information */}
          <div className="mt-12 grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="mb-4 h-12 w-12 mx-auto flex items-center justify-center bg-blue-100 dark:bg-blue-900/20 rounded-full">
                  <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold mb-2 font-sans">Email Support</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Direct email for all inquiries
                </p>
                <p className="text-sm font-mono">support@subwise.app</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="mb-4 h-12 w-12 mx-auto flex items-center justify-center bg-green-100 dark:bg-green-900/20 rounded-full">
                  <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold mb-2 font-sans">Privacy Inquiries</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Data protection and privacy
                </p>
                <p className="text-sm font-mono">privacy@subwise.app</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="mb-4 h-12 w-12 mx-auto flex items-center justify-center bg-purple-100 dark:bg-purple-900/20 rounded-full">
                  <Zap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-semibold mb-2 font-sans">Feature Requests</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Ideas and suggestions
                </p>
                <p className="text-sm font-mono">feedback@subwise.app</p>
              </CardContent>
            </Card>
          </div>

          {/* FAQ Section */}
          <div className="mt-16 text-center">
            <h2 className="text-2xl font-bold mb-4 font-sans">Frequently Asked Questions</h2>
            <p className="text-muted-foreground mb-8 font-sans">
              Check out our most common questions before reaching out
            </p>
            
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto text-left">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-sans">What's included in the Free plan?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Track up to 3 subscriptions, get basic spending overviews, receive email renewal reminders, and access manual subscription entry with standard email support.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-sans">How do Premium notifications work?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Premium users get advanced spending alerts, smart threshold notifications, price change alerts, and priority support with faster response times.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-sans">Can I export my subscription data?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Yes! Premium users can export their subscription data to CSV or PDF formats for personal record-keeping or analysis.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-sans">How accurate are the currency conversions?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    We use real-time exchange rates updated hourly from the European Central Bank for accurate currency conversions across USD, EUR, GBP, CAD, and AUD.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
