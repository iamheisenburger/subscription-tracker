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
import { 
  Mail, 
  Clock, 
  Crown, 
  Send
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
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
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
      } else {
        throw new Error("Failed to send message");
      }
    } catch {
      toast.error("Failed to send message", {
        description: "Please try again or email us directly at usesubwiseapp@gmail.com"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-6">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-3xl xs:text-4xl sm:text-5xl font-bold tracking-tight font-sans mb-4">
              Get In Touch
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-sans">
              Need help with SubWise? We&apos;re here to support you.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  <strong>Free Plan:</strong> Response within 48 hours
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">
                  <strong className="text-primary">Premium:</strong> Priority response within 12 hours
                </span>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <Card className="max-w-3xl mx-auto shadow-lg">
            <CardHeader className="text-center border-b pb-6">
              <CardTitle className="flex items-center justify-center gap-2 font-sans text-2xl">
                <Mail className="h-6 w-6 text-primary" />
                Send Us A Message
              </CardTitle>
              <CardDescription className="font-sans text-base mt-2">
                Fill out the form below and we&apos;ll get back to you based on your plan&apos;s support level.
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-8">
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
                  className="w-full mt-2" 
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

          {/* Direct Contact Information */}
          <div className="mt-16 text-center max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold mb-4 font-sans">Prefer Email?</h3>
            <p className="text-muted-foreground mb-4">
              You can reach us directly at:
            </p>
            <a 
              href="mailto:usesubwiseapp@gmail.com"
              className="inline-flex items-center gap-2 text-lg font-mono text-primary hover:underline"
            >
              <Mail className="h-5 w-5" />
              usesubwiseapp@gmail.com
            </a>
          </div>

          {/* Removed the 3 card panels section */}
          <div className="hidden md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          </div>

          {/* FAQ Section */}
          <div className="mt-20 text-center">
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
