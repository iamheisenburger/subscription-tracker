import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface RenewalReminderEmailProps {
  userName?: string;
  subscriptionName?: string;
  cost?: number;
  currency?: string;
  billingCycle?: 'monthly' | 'yearly' | 'weekly';
  daysUntil?: number;
  category?: string;
}

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000';

export const RenewalReminderEmail = ({
  userName = 'there',
  subscriptionName = 'Netflix',
  cost = 15.99,
  currency = 'USD',
  billingCycle = 'monthly',
  daysUntil = 3,
  category,
}: RenewalReminderEmailProps) => {
  const previewText = `${subscriptionName} renews ${daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`} - $${cost}/${billingCycle}`;
  
  const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency;
  
  // Calculate next billing date based on daysUntil
  const nextBillingDate = new Date();
  nextBillingDate.setDate(nextBillingDate.getDate() + daysUntil);
  
  const formattedDate = nextBillingDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Img
              src={`${baseUrl}/icons/icon-192x192.png`}
              width="48"
              height="48"
              alt="SubWise"
              style={logo}
            />
            <Text style={headerTitle}>SubWise</Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Text style={greeting}>Hi {userName},</Text>
            
            <Text style={paragraph}>
              This is a friendly reminder that your <strong>{subscriptionName}</strong> subscription 
              {daysUntil === 1 ? ' renews tomorrow' : ` renews in ${daysUntil} days`}.
            </Text>

            {/* Subscription Details Card */}
            <Section style={subscriptionCard}>
              <div style={cardHeader}>
                <Text style={subscriptionNameStyle}>
                  {subscriptionName}
                  {category && <span style={categoryBadge}>{category}</span>}
                </Text>
              </div>
              
              <div style={cardContent}>
                <div style={priceSection}>
                  <Text style={price}>{currencySymbol}{cost.toFixed(2)}</Text>
                  <Text style={billingPeriod}>/{billingCycle}</Text>
                </div>
                
                <div style={dateSection}>
                  <Text style={dateLabel}>Next billing date:</Text>
                  <Text style={dateValue}>{formattedDate}</Text>
                </div>
              </div>
            </Section>

            <Text style={paragraph}>
              {daysUntil === 1 
                ? "Your subscription will automatically renew tomorrow. If you'd like to make any changes, you can manage your subscription in your SubWise dashboard."
                : `You have ${daysUntil} days to make any changes if needed. You can manage your subscription in your SubWise dashboard.`
              }
            </Text>

            {/* Action Buttons */}
            <Section style={buttonContainer}>
              <Button style={primaryButton} href={`${baseUrl}/dashboard/subscriptions`}>
                Manage Subscription
              </Button>
              <Button style={secondaryButton} href={`${baseUrl}/dashboard`}>
                View Dashboard
              </Button>
            </Section>

            <Text style={footerText}>
              You're receiving this because you have renewal reminders enabled in your notification preferences. 
              You can <Link href={`${baseUrl}/dashboard/settings`} style={link}>update your preferences</Link> anytime.
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerCopy}>
              © 2025 SubWise. All rights reserved.
            </Text>
            <Text style={footerLinks}>
              <Link href={`${baseUrl}/dashboard/settings`} style={footerLink}>Notification Settings</Link>
              {' • '}
              <Link href={`${baseUrl}/pricing`} style={footerLink}>Upgrade to Premium</Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Styles
const main = {
  backgroundColor: '#f8fafc',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '600px',
};

const header = {
  textAlign: 'center' as const,
  padding: '32px 0',
  borderBottom: '1px solid #e2e8f0',
  marginBottom: '32px',
};

const logo = {
  margin: '0 auto',
  borderRadius: '8px',
};

const headerTitle = {
  fontSize: '24px',
  fontWeight: '600',
  color: '#1e293b',
  margin: '16px 0 0 0',
};

const content = {
  padding: '0 32px',
};

const greeting = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#1e293b',
  margin: '0 0 24px 0',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#475569',
  margin: '0 0 24px 0',
};

const subscriptionCard = {
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  padding: '24px',
  margin: '32px 0',
  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
};

const cardHeader = {
  borderBottom: '1px solid #f1f5f9',
  paddingBottom: '16px',
  marginBottom: '16px',
};

const subscriptionNameStyle = {
  fontSize: '20px',
  fontWeight: '600',
  color: '#1e293b',
  margin: '0',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const categoryBadge = {
  backgroundColor: '#3b82f6',
  color: '#ffffff',
  fontSize: '12px',
  fontWeight: '500',
  padding: '4px 8px',
  borderRadius: '6px',
  textTransform: 'capitalize' as const,
};

const cardContent = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '16px',
};

const priceSection = {
  display: 'flex',
  alignItems: 'baseline',
  gap: '4px',
};

const price = {
  fontSize: '28px',
  fontWeight: '700',
  color: '#1e293b',
  margin: '0',
};

const billingPeriod = {
  fontSize: '16px',
  color: '#64748b',
  margin: '0',
};

const dateSection = {
  textAlign: 'right' as const,
};

const dateLabel = {
  fontSize: '14px',
  color: '#64748b',
  margin: '0 0 4px 0',
};

const dateValue = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#1e293b',
  margin: '0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const primaryButton = {
  backgroundColor: '#3b82f6',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
  margin: '0 8px 16px 8px',
};

const secondaryButton = {
  backgroundColor: 'transparent',
  border: '1px solid #d1d5db',
  borderRadius: '8px',
  color: '#374151',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
  margin: '0 8px 16px 8px',
};

const footerText = {
  fontSize: '14px',
  color: '#64748b',
  lineHeight: '1.5',
  margin: '32px 0 0 0',
};

const link = {
  color: '#3b82f6',
  textDecoration: 'underline',
};

const footer = {
  textAlign: 'center' as const,
  padding: '32px 0 0 0',
  borderTop: '1px solid #e2e8f0',
  margin: '48px 32px 0 32px',
};

const footerCopy = {
  fontSize: '14px',
  color: '#64748b',
  margin: '0 0 16px 0',
};

const footerLinks = {
  fontSize: '14px',
  color: '#64748b',
  margin: '0',
};

const footerLink = {
  color: '#3b82f6',
  textDecoration: 'none',
};

export default RenewalReminderEmail;
