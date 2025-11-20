import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { api } from '../../../../../convex/_generated/api';
import { fetchQuery } from 'convex/nextjs';

export const runtime = 'nodejs';

function toCsvRow(fields: (string | number | boolean | null | undefined)[]): string {
  return fields
    .map((v) => {
      if (v === null || v === undefined) return '';
      const s = String(v);
      const needsQuotes = s.includes(',') || s.includes('"') || s.includes('\n');
      const escaped = s.replace(/"/g, '""');
      return needsQuotes ? `"${escaped}"` : escaped;
    })
    .join(',');
}

function hasExportAccess(tier?: string) {
  if (!tier) return false;
  if (tier === 'premium_user' || tier === 'premium') return true;
  if (tier === 'automate' || tier === 'automate_1') return true;
  return tier === 'plus';
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // Gate by tier
  try {
    const user = await fetchQuery(api.users.getUserByClerkId, { clerkId: userId });
    if (!user || !hasExportAccess(user.tier)) {
      return new NextResponse('Forbidden: Plus plan required', { status: 403 });
    }

    const subs = await fetchQuery(api.subscriptions.getUserSubscriptions, { clerkId: userId });

    const header = [
      'Name',
      'Cost',
      'Currency',
      'Billing Cycle',
      'Next Billing Date',
      'Category',
      'Active',
      'Created At',
      'Updated At'
    ];

    const rows = subs.map((s) =>
      toCsvRow([
        s.name,
        s.cost,
        s.currency,
        s.billingCycle,
        s.nextBillingDate ? new Date(s.nextBillingDate).toISOString() : '',
        s.category || '',
        s.isActive,
        s.createdAt ? new Date(s.createdAt).toISOString() : '',
        s.updatedAt ? new Date(s.updatedAt).toISOString() : ''
      ])
    );

    const csv = [toCsvRow(header), ...rows].join('\n');
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="subwise-subscriptions.csv"'
      }
    });
  } catch {
    return new NextResponse('Server error', { status: 500 });
  }
}


