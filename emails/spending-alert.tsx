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

interface SpendingAlertEmailProps {
  userName: string;
  currentSpending: number;
  threshold: number;
  currency: string;
  period: string;
  percentageOfThreshold: number;
  overspent: boolean;
}

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000';

export const SpendingAlertEmail = ({
  userName = 'there',
  currentSpending = 350.75,
  threshold = 300,
  currency = 'USD',
  period = 'month',
  percentageOfThreshold = 117,
  overspent = true,
}: SpendingAlertEmailProps) => {
  const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency;
  const previewText = overspent 
    ? `You've exceeded your ${period}ly budget by ${currencySymbol}${(currentSpending - threshold).toFixed(2)}`
    : `You're at ${percentageOfThreshold}% of your ${period}ly budget`;

  const overspentAmount = currentSpending - threshold;
  
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
              {overspent 
                ? `You've exceeded your ${period}ly subscription budget. Here's your spending summary:`
                : `You're approaching your ${period}ly subscription budget limit. Here's your current spending:`
              }
            </Text>

            {/* Alert Banner */}
            <Section style={overspent ? alertBannerOverspent : alertBannerWarning}>
              <Text style={alertText}>
                {overspent ? '🚨 Budget Exceeded' : '⚠️ Budget Warning'}
              </Text>
              <Text style={alertSubtext}>
                {overspent 
                  ? `You're ${currencySymbol}${overspentAmount.toFixed(2)} over budget this ${period}`
                  : `You're at ${percentageOfThreshold}% of your ${period}ly limit`
                }
              </Text>
            </Section>

            {/* Spending Summary Card */}
            <Section style={spendingCard}>
              <div style={cardHeader}>
                <Text style={cardTitle}>Spending Summary</Text>
                <Text style={periodText}>This {period}</Text>
              </div>
              
              {/* Progress Bar */}
              <div style={progressContainer}>
                <div style={progressBarBackground}>
                  <div 
                    style={{
                      ...progressBarFill,
                      width: `${Math.min(percentageOfThreshold, 100)}%`,
                      backgroundColor: overspent ? '#dc2626' : percentageOfThreshold >= 80 ? '#f59e0b' : '#10b981'
                    }}
                  />
                  {percentageOfThreshold > 100 && (
                    <div 
                      style={{
                        ...progressBarOverflow,
                        width: `${Math.min(percentageOfThreshold - 100, 50)}%`,
                      }}
                    />
                  )}
                </div>
                <Text style={progressText}>
                  {percentageOfThreshold}% of budget used
                </Text>
              </div>
              
              {/* Spending Details */}
              <div style={spendingDetails}>
                <div style={spendingRow}>
                  <Text style={spendingLabel}>Current Spending</Text>
                  <Text style={overspent ? currentSpendingOverspent : currentSpendingNormal}>
                    {currencySymbol}{currentSpending.toFixed(2)}
                  </Text>
                </div>
                
                <div style={spendingRow}>
                  <Text style={spendingLabel}>Budget Limit</Text>
                  <Text style={budgetLimit}>
                    {currencySymbol}{threshold.toFixed(2)}
                  </Text>
                </div>
                
                <div style={{...spendingRow, ...totalRow}}>
                  <Text style={totalLabel}>
                    {overspent ? 'Over Budget' : 'Remaining'}
                  </Text>
                  <Text style={overspent ? overBudgetAmount : remainingAmount}>
                    {overspent ? '+' : ''}{currencySymbol}{Math.abs(overspentAmount).toFixed(2)}
                  </Text>
                </div>
              </div>
            </Section>

            <Text style={paragraph}>
              {overspent 
                ? "Consider reviewing your active subscriptions and pausing or canceling services you're not using. You can also adjust your budget limit in settings."
                : "Keep an eye on your spending to stay within budget. Consider reviewing your subscriptions or adjusting your budget limit if needed."
              }
            </Text>

            {/* Action Buttons */}
            <Section style={buttonContainer}>
              <Button style={primaryButton} href={`${baseUrl}/dashboard/subscriptions`}>
                Review Subscriptions
              </Button>
              <Button style={secondaryButton} href={`${baseUrl}/dashboard/analytics`}>
                View Analytics
              </Button>
            </Section>

            <Text style={footerText}>
              You're receiving this because you have spending alerts enabled. 
              You can <Link href={`${baseUrl}/dashboard/settings`} style={link}>adjust your budget threshold</Link> or 
              disable these alerts anytime.
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

const alertBannerOverspent = {
  backgroundColor: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
  textAlign: 'center' as const,
};

const alertBannerWarning = {
  backgroundColor: '#fffbeb',
  border: '1px solid #fed7aa',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
  textAlign: 'center' as const,
};

const alertText = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#1e293b',
  margin: '0 0 8px 0',
};

const alertSubtext = {
  fontSize: '16px',
  color: '#475569',
  margin: '0',
};

const spendingCard = {
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  padding: '24px',
  margin: '32px 0',
  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
};

const cardHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: '1px solid #f1f5f9',
  paddingBottom: '16px',
  marginBottom: '24px',
};

const cardTitle = {
  fontSize: '20px',
  fontWeight: '600',
  color: '#1e293b',
  margin: '0',
};

const periodText = {
  fontSize: '14px',
  color: '#64748b',
  margin: '0',
  textTransform: 'capitalize' as const,
};

const progressContainer = {
  marginBottom: '24px',
};

const progressBarBackground = {
  width: '100%',
  height: '12px',
  backgroundColor: '#f1f5f9',
  borderRadius: '6px',
  overflow: 'hidden',
  position: 'relative' as const,
  marginBottom: '8px',
};

const progressBarFill = {
  height: '100%',
  borderRadius: '6px',
  transition: 'width 0.3s ease',
};

const progressBarOverflow = {
  position: 'absolute' as const,
  top: '0',
  left: '100%',
  height: '100%',
  backgroundColor: '#dc2626',
  borderRadius: '0 6px 6px 0',
};

const progressText = {
  fontSize: '14px',
  color: '#64748b',
  textAlign: 'center' as const,
  margin: '0',
};

const spendingDetails = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '12px',
};

const spendingRow = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const totalRow = {
  borderTop: '1px solid #f1f5f9',
  paddingTop: '12px',
  marginTop: '8px',
};

const spendingLabel = {
  fontSize: '16px',
  color: '#64748b',
  margin: '0',
};

const currentSpendingNormal = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#1e293b',
  margin: '0',
};

const currentSpendingOverspent = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#dc2626',
  margin: '0',
};

const budgetLimit = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#64748b',
  margin: '0',
};

const totalLabel = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#1e293b',
  margin: '0',
};

const remainingAmount = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#16a34a',
  margin: '0',
};

const overBudgetAmount = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#dc2626',
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

export default SpendingAlertEmail;
