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

interface AdvancedSpendingAlertEmailProps {
  userName?: string;
  alertType?: string;
  thresholdPercentage?: number;
  monthlySpending?: number;
  threshold?: number;
  overage?: number;
  category?: string;
  spent?: number;
  clusteredRenewals?: number;
  currency?: string;
}

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000';

export const AdvancedSpendingAlertEmail = ({
  userName = 'there',
  alertType = 'approaching_threshold',
  thresholdPercentage = 85,
  monthlySpending = 0,
  threshold = 1000,
  overage = 0,
  category = '',
  spent = 0,
  clusteredRenewals = 0,
  currency = 'USD',
}: AdvancedSpendingAlertEmailProps) => {
  
  const formatCurrency = (amount: number) => `${currency} ${amount.toFixed(2)}`;

  const getAlertContent = () => {
    switch (alertType) {
      case 'approaching_threshold':
        return {
          icon: '💡',
          title: 'Spending Alert: Approaching Budget',
          description: `You're currently at ${Math.round(thresholdPercentage)}% of your monthly spending budget.`,
          details: `Current spending: ${formatCurrency(monthlySpending)} of ${formatCurrency(threshold)}`,
          urgency: 'medium',
          recommendations: [
            'Review your recent subscriptions',
            'Consider pausing non-essential services',
            'Set up category-specific budgets'
          ]
        };
      
      case 'exceeded_threshold':
        return {
          icon: '🚨',
          title: 'Budget Alert: Spending Limit Exceeded',
          description: `You've exceeded your monthly budget by ${formatCurrency(overage)}.`,
          details: `Current spending: ${formatCurrency(monthlySpending)} (Budget: ${formatCurrency(threshold)})`,
          urgency: 'high',
          recommendations: [
            'Review and pause non-critical subscriptions',
            'Consider upgrading to annual plans for discounts',
            'Set stricter category limits'
          ]
        };
      
      case 'category_overspend':
        return {
          icon: '📊',
          title: `Category Alert: ${category} Over Budget`,
          description: `Your ${category} spending has exceeded its allocated budget.`,
          details: `${category} spending: ${formatCurrency(spent)}`,
          urgency: 'medium',
          recommendations: [
            `Review your ${category} subscriptions`,
            'Consider consolidating similar services',
            'Adjust category budgets if needed'
          ]
        };
      
      case 'renewal_cluster':
        return {
          icon: '📅',
          title: 'Renewal Cluster Alert',
          description: `You have ${clusteredRenewals} subscriptions renewing in the same period.`,
          details: `This could create a spending spike in your budget.`,
          urgency: 'low',
          recommendations: [
            'Consider spreading renewal dates',
            'Switch some subscriptions to different billing cycles',
            'Prepare for the temporary spending increase'
          ]
        };
      
      default:
        return {
          icon: '💰',
          title: 'Spending Alert',
          description: 'Your spending patterns need attention.',
          details: '',
          urgency: 'medium',
          recommendations: ['Review your subscription spending']
        };
    }
  };

  const alertContent = getAlertContent();
  const previewText = `${alertContent.title} - ${alertContent.description}`;

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
            <Text style={premiumBadge}>PREMIUM ALERT</Text>
          </Section>

          {/* Alert Content */}
          <Section style={content}>
            <div style={alertIcon}>{alertContent.icon}</div>
            
            <Text style={greeting}>Hi {userName},</Text>
            
            <Text style={alertTitle}>{alertContent.title}</Text>
            <Text style={alertDescription}>{alertContent.description}</Text>
            
            {alertContent.details && (
              <Section style={detailsCard}>
                <Text style={detailsText}>{alertContent.details}</Text>
              </Section>
            )}

            {/* Recommendations */}
            {alertContent.recommendations.length > 0 && (
              <Section style={recommendationsSection}>
                <Text style={recommendationsTitle}>💡 Smart Recommendations</Text>
                {alertContent.recommendations.map((rec, index) => (
                  <Text key={index} style={recommendationItem}>• {rec}</Text>
                ))}
              </Section>
            )}

            {/* Action Buttons */}
            <Section style={buttonContainer}>
              <Button style={primaryButton} href={`${baseUrl}/dashboard/analytics`}>
                View Spending Analytics
              </Button>
              <Button style={secondaryButton} href={`${baseUrl}/dashboard/settings`}>
                Adjust Budgets
              </Button>
              <Button style={secondaryButton} href={`${baseUrl}/dashboard/subscriptions`}>
                Manage Subscriptions
              </Button>
            </Section>

            <Text style={footerText}>
              This is a premium smart alert. You can customize these alerts in your 
              <Link href={`${baseUrl}/dashboard/settings`} style={link}> notification preferences</Link>.
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerCopy}>
              © 2025 SubWise Premium. Smart financial insights for your subscriptions.
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
  margin: '16px 0 8px 0',
};

const premiumBadge = {
  fontSize: '12px',
  fontWeight: '600',
  color: '#ffffff',
  backgroundColor: '#3b82f6',
  padding: '4px 12px',
  borderRadius: '12px',
  display: 'inline-block',
  margin: '0',
};

const content = {
  padding: '0 32px',
};

const alertIcon = {
  fontSize: '48px',
  textAlign: 'center' as const,
  margin: '0 0 24px 0',
};

const greeting = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#1e293b',
  margin: '0 0 24px 0',
};

const alertTitle = {
  fontSize: '24px',
  fontWeight: '700',
  color: '#dc2626',
  margin: '0 0 16px 0',
  textAlign: 'center' as const,
};

const alertDescription = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#475569',
  margin: '0 0 24px 0',
  textAlign: 'center' as const,
};

const detailsCard = {
  backgroundColor: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
  textAlign: 'center' as const,
};

const detailsText = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#dc2626',
  margin: '0',
};

const recommendationsSection = {
  backgroundColor: '#f0f9ff',
  border: '1px solid #0ea5e9',
  borderRadius: '12px',
  padding: '20px',
  margin: '24px 0',
};

const recommendationsTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#0369a1',
  margin: '0 0 12px 0',
};

const recommendationItem = {
  fontSize: '14px',
  color: '#0c4a6e',
  margin: '4px 0',
  lineHeight: '1.5',
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
  margin: '0 8px 12px 8px',
};

const secondaryButton = {
  backgroundColor: 'transparent',
  border: '1px solid #d1d5db',
  borderRadius: '8px',
  color: '#374151',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '10px 20px',
  margin: '0 4px 12px 4px',
};

const footerText = {
  fontSize: '14px',
  color: '#64748b',
  lineHeight: '1.5',
  margin: '32px 0 0 0',
  textAlign: 'center' as const,
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
  margin: '0',
};

export default AdvancedSpendingAlertEmail;
