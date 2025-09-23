import { NextRequest, NextResponse } from 'next/server';
import { render } from '@react-email/render';
import { RenewalReminderEmail } from '../../../../../emails/renewal-reminder';
import { PriceChangeAlertEmail } from '../../../../../emails/price-change-alert';
import { SpendingAlertEmail } from '../../../../../emails/spending-alert';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  if (!type) {
    return NextResponse.json({ error: 'Missing type parameter' }, { status: 400 });
  }

  try {
    let emailHtml: string;

    // Mock data for previews
    const mockUser = {
      userName: 'Alex Johnson',
    };

    const mockSubscription = {
      subscriptionName: 'Netflix Premium',
      cost: 15.99,
      currency: 'USD',
      billingCycle: 'monthly' as const,
      nextBillingDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      category: 'Entertainment',
    };

    switch (type) {
      case 'renewal-reminder':
        emailHtml = await render(RenewalReminderEmail({
          ...mockUser,
          ...mockSubscription,
          daysUntil: 3,
        }));
        break;

      case 'price-change':
        emailHtml = await render(PriceChangeAlertEmail({
          ...mockUser,
          ...mockSubscription,
          oldPrice: 12.99,
          newPrice: 15.99,
          priceIncrease: true,
          changeAmount: 3.00,
          changePercentage: 23,
        }));
        break;

      case 'spending-alert':
        emailHtml = await render(SpendingAlertEmail({
          ...mockUser,
          currentSpending: 350.75,
          threshold: 300,
          currency: 'USD',
          period: 'month',
          percentageOfThreshold: 117,
          overspent: true,
        }));
        break;

      default:
        return NextResponse.json({ error: `Unknown email type: ${type}` }, { status: 400 });
    }

    return new NextResponse(emailHtml, {
      headers: {
        'Content-Type': 'text/html',
      },
    });

  } catch (error) {
    console.error('Email preview error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate email preview',
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// Also support POST for custom preview data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    if (!type) {
      return NextResponse.json({ error: 'Missing type parameter' }, { status: 400 });
    }

    let emailHtml: string;

    switch (type) {
      case 'renewal-reminder':
        emailHtml = await render(RenewalReminderEmail(data));
        break;

      case 'price-change':
        emailHtml = await render(PriceChangeAlertEmail(data));
        break;

      case 'spending-alert':
        emailHtml = await render(SpendingAlertEmail(data));
        break;

      default:
        return NextResponse.json({ error: `Unknown email type: ${type}` }, { status: 400 });
    }

    return new NextResponse(emailHtml, {
      headers: {
        'Content-Type': 'text/html',
      },
    });

  } catch (error) {
    console.error('Email preview error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate email preview',
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
