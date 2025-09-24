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
import { formatEmailCurrency, formatEmailCurrencyWithConversion } from '../lib/email-currency';

interface PriceChangeAlertEmailProps {
  userName: string;
  subscriptionName: string;
  oldPrice: number;
  newPrice: number;
  currency: string;
  displayCurrency?: string; // User's preferred currency for display
  billingCycle: 'monthly' | 'yearly' | 'weekly';
  priceIncrease: boolean;
  changeAmount: number;
  changePercentage: number;
}

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000';

export const PriceChangeAlertEmail = ({
  userName = 'there',
  subscriptionName = 'Netflix',
  oldPrice = 12.99,
  newPrice = 15.99,
  currency = 'USD',
  displayCurrency, // User's preferred currency
  billingCycle = 'monthly',
  priceIncrease = true,
  changeAmount = 3.00,
  changePercentage = 23,
}: PriceChangeAlertEmailProps) => {
  // Use display currency if provided, otherwise fall back to subscription currency
  const userCurrency = displayCurrency || currency;
  
  // Format prices using the new currency utilities
  const { displayAmount: oldDisplayAmount } = formatEmailCurrencyWithConversion(oldPrice, currency, userCurrency);
  const { displayAmount: newDisplayAmount } = formatEmailCurrencyWithConversion(newPrice, currency, userCurrency);
  const { displayAmount: changeDisplayAmount } = formatEmailCurrencyWithConversion(changeAmount, currency, userCurrency);
  
  const previewText = `${subscriptionName} price ${priceIncrease ? 'increased' : 'decreased'} by ${changePercentage}%`;

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
              We detected a price change for your <strong>{subscriptionName}</strong> subscription.
            </Text>

            {/* Alert Banner */}
            <Section style={priceIncrease ? alertBannerIncrease : alertBannerDecrease}>
              <Text style={alertText}>
                {priceIncrease ? '⚠️ Price Increase Alert' : '✅ Price Decrease Alert'}
              </Text>
            </Section>

            {/* Price Change Card */}
            <Section style={priceCard}>
              <div style={cardHeader}>
                <Text style={subscriptionNameStyle}>{subscriptionName}</Text>
              </div>
              
              <div style={priceComparison}>
                <div style={priceColumn}>
                  <Text style={priceLabel}>Previous Price</Text>
                  <Text style={oldPriceStyle}>
                    {oldDisplayAmount}
                    <span style={billingPeriodStyle}>/{billingCycle}</span>
                  </Text>
                </div>
                
                <div style={arrowContainer}>
                  <Text style={arrow}>{priceIncrease ? '→' : '→'}</Text>
                </div>
                
                <div style={priceColumn}>
                  <Text style={priceLabel}>New Price</Text>
                  <Text style={priceIncrease ? newPriceIncrease : newPriceDecrease}>
                    {newDisplayAmount}
                    <span style={billingPeriodStyle}>/{billingCycle}</span>
                  </Text>
                </div>
              </div>
              
              <div style={changeDetails}>
                <Text style={changeText}>
                  <strong>
                    {priceIncrease ? '+' : '-'}{changeDisplayAmount} 
                    ({priceIncrease ? '+' : '-'}{Math.abs(changePercentage)}%)
                  </strong>
                  {priceIncrease ? ' increase' : ' decrease'} per {billingCycle.replace('ly', '')}
                </Text>
              </div>
            </Section>

            <Text style={paragraph}>
              {priceIncrease 
                ? "This price increase will take effect on your next billing cycle. You might want to review your subscription or explore alternatives."
                : "Great news! This price decrease will take effect on your next billing cycle, saving you money."
              }
            </Text>

            {/* Action Buttons */}
            <Section style={buttonContainer}>
              <Button style={primaryButton} href={`${baseUrl}/dashboard/subscriptions`}>
                Manage Subscription
              </Button>
              {priceIncrease && (
                <Button style={secondaryButton} href={`${baseUrl}/dashboard/analytics`}>
                  View Spending Impact
                </Button>
              )}
            </Section>

            <Text style={footerText}>
              You're receiving this because you have price change alerts enabled. 
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

const alertBannerIncrease = {
  backgroundColor: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
  textAlign: 'center' as const,
};

const alertBannerDecrease = {
  backgroundColor: '#f0fdf4',
  border: '1px solid #bbf7d0',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
  textAlign: 'center' as const,
};

const alertText = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#1e293b',
  margin: '0',
};

const priceCard = {
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
  marginBottom: '24px',
};

const subscriptionNameStyle = {
  fontSize: '20px',
  fontWeight: '600',
  color: '#1e293b',
  margin: '0',
};

const priceComparison = {
  display: 'grid',
  gridTemplateColumns: '1fr auto 1fr',
  alignItems: 'center',
  gap: '16px',
  marginBottom: '24px',
};

const priceColumn = {
  textAlign: 'center' as const,
};

const priceLabel = {
  fontSize: '14px',
  color: '#64748b',
  margin: '0 0 8px 0',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
};

const oldPriceStyle = {
  fontSize: '24px',
  fontWeight: '600',
  color: '#64748b',
  margin: '0',
  textDecoration: 'line-through',
};

const newPriceIncrease = {
  fontSize: '24px',
  fontWeight: '700',
  color: '#dc2626',
  margin: '0',
};

const newPriceDecrease = {
  fontSize: '24px',
  fontWeight: '700',
  color: '#16a34a',
  margin: '0',
};

const billingPeriodStyle = {
  fontSize: '16px',
  fontWeight: '400',
};

const arrowContainer = {
  textAlign: 'center' as const,
};

const arrow = {
  fontSize: '24px',
  color: '#64748b',
  margin: '0',
};

const changeDetails = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '16px',
  textAlign: 'center' as const,
};

const changeText = {
  fontSize: '16px',
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

export default PriceChangeAlertEmail;
