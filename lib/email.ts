import { Resend } from 'resend';
import { render } from '@react-email/render';
import { RenewalReminderEmail } from '../emails/renewal-reminder';
import { PriceChangeAlertEmail } from '../emails/price-change-alert';
import { SpendingAlertEmail } from '../emails/spending-alert';

// Initialize Resend (only when API key is available)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export interface EmailTemplate {
  to: string;
  subject: string;
  template: "renewal-reminder" | "price-change" | "spending-alert";
  data: Record<string, unknown>;
}

export interface SubscriptionData {
  name: string;
  cost: number;
  currency: string;
  billingCycle: "monthly" | "yearly" | "weekly";
  category?: string;
}

export interface UserData {
  email: string;
  firstName?: string;
  clerkId: string;
}

class EmailService {
  private fromEmail: string;

  constructor() {
    this.fromEmail = process.env.RESEND_FROM_EMAIL || 'SubWise <onboarding@resend.dev>';
  }

  /**
   * Send renewal reminder email
   */
  async sendRenewalReminder(
    user: UserData, 
    subscription: SubscriptionData, 
    daysUntil: number
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!resend) {
      return { success: false, error: 'Email service not configured (missing RESEND_API_KEY)' };
    }
    
    try {
      const emailHtml = await render(RenewalReminderEmail({
        userName: user.firstName || 'there',
        subscriptionName: subscription.name,
        cost: subscription.cost,
        currency: subscription.currency,
        billingCycle: subscription.billingCycle,
        daysUntil,
        category: subscription.category,
      }));

      const subject = daysUntil === 1 
        ? `${subscription.name} renews tomorrow - $${subscription.cost}/${subscription.billingCycle}`
        : `${subscription.name} renews in ${daysUntil} days - $${subscription.cost}/${subscription.billingCycle}`;

      const { data, error } = await resend.emails.send({
        from: this.fromEmail,
        to: [user.email],
        subject,
        html: emailHtml,
        tags: [
          { name: 'category', value: 'renewal-reminder' },
          { name: 'days-until', value: daysUntil.toString() },
        ],
      });

      if (error) {
        console.error('Resend error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }

      return { success: true, messageId: data?.id };
    } catch (error) {
      console.error('Email service error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Send price change alert email
   */
  async sendPriceChangeAlert(
    user: UserData,
    subscription: SubscriptionData,
    oldPrice: number,
    newPrice: number
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!resend) {
      return { success: false, error: 'Email service not configured (missing RESEND_API_KEY)' };
    }
    
    try {
      const emailHtml = await render(PriceChangeAlertEmail({
        userName: user.firstName || 'there',
        subscriptionName: subscription.name,
        oldPrice,
        newPrice,
        currency: subscription.currency,
        billingCycle: subscription.billingCycle,
        priceIncrease: newPrice > oldPrice,
        changeAmount: Math.abs(newPrice - oldPrice),
        changePercentage: Math.round(((newPrice - oldPrice) / oldPrice) * 100),
      }));

      const priceDirection = newPrice > oldPrice ? 'increased' : 'decreased';
      const subject = `Price Alert: ${subscription.name} ${priceDirection} to $${newPrice}/${subscription.billingCycle}`;

      const { data, error } = await resend.emails.send({
        from: this.fromEmail,
        to: [user.email],
        subject,
        html: emailHtml,
        tags: [
          { name: 'category', value: 'price-change' },
          { name: 'price-direction', value: priceDirection },
        ],
      });

      if (error) {
        console.error('Resend error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }

      return { success: true, messageId: data?.id };
    } catch (error) {
      console.error('Email service error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Send spending threshold alert email
   */
  async sendSpendingAlert(
    user: UserData,
    currentSpending: number,
    threshold: number,
    currency: string = 'USD',
    period: string = 'month'
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!resend) {
      return { success: false, error: 'Email service not configured (missing RESEND_API_KEY)' };
    }
    
    try {
      const emailHtml = await render(SpendingAlertEmail({
        userName: user.firstName || 'there',
        currentSpending,
        threshold,
        currency,
        period,
        percentageOfThreshold: Math.round((currentSpending / threshold) * 100),
        overspent: currentSpending > threshold,
      }));

      const subject = currentSpending > threshold
        ? `Spending Alert: You've exceeded your ${period}ly budget by $${(currentSpending - threshold).toFixed(2)}`
        : `Spending Alert: You're at ${Math.round((currentSpending / threshold) * 100)}% of your ${period}ly budget`;

      const { data, error } = await resend.emails.send({
        from: this.fromEmail,
        to: [user.email],
        subject,
        html: emailHtml,
        tags: [
          { name: 'category', value: 'spending-alert' },
          { name: 'threshold-exceeded', value: (currentSpending > threshold).toString() },
        ],
      });

      if (error) {
        console.error('Resend error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }

      return { success: true, messageId: data?.id };
    } catch (error) {
      console.error('Email service error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Test email service connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    if (!resend) {
      return { success: false, error: 'Email service not configured (missing RESEND_API_KEY)' };
    }
    
    try {
      // Test with a simple email to verify API key and connection
      const { error } = await resend.emails.send({
        from: this.fromEmail,
        to: ['test@resend.dev'], // Resend's test email
        subject: 'SubWise Email Service Test',
        html: '<p>This is a test email from SubWise notification system.</p>',
      });

      if (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export const emailService = new EmailService();
