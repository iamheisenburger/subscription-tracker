/**
 * Cancel Assistant Playbooks
 * Step-by-step guides for canceling popular subscriptions
 */

export interface CancelStep {
  step: number;
  instruction: string;
  tip?: string;
  warning?: string;
}

export interface CancelPlaybook {
  service: string;
  provider: string;
  difficulty: "easy" | "medium" | "hard";
  estimatedTime: string; // e.g., "2 minutes"
  canCancelOnline: boolean;
  requiresCall: boolean;
  requiresEmail: boolean;
  steps: CancelStep[];
  additionalInfo?: string[];
  alternativeOptions?: string[];
  cancellationUrl?: string;
  supportPhone?: string;
  supportEmail?: string;
}

export const cancelPlaybooks: Record<string, CancelPlaybook> = {
  netflix: {
    service: "Netflix",
    provider: "Netflix",
    difficulty: "easy",
    estimatedTime: "2 minutes",
    canCancelOnline: true,
    requiresCall: false,
    requiresEmail: false,
    cancellationUrl: "https://www.netflix.com/cancelplan",
    steps: [
      {
        step: 1,
        instruction: "Go to netflix.com and sign in to your account",
      },
      {
        step: 2,
        instruction: "Click on your profile icon in the top right corner",
      },
      {
        step: 3,
        instruction: "Select 'Account' from the dropdown menu",
      },
      {
        step: 4,
        instruction: "Under 'Membership & Billing', click 'Cancel Membership'",
      },
      {
        step: 5,
        instruction: "Confirm cancellation when prompted",
        tip: "You'll have access until the end of your billing period",
      },
    ],
    additionalInfo: [
      "No cancellation fee",
      "You can rejoin anytime",
      "Your viewing history and preferences are saved for 10 months",
    ],
  },
  spotify: {
    service: "Spotify",
    provider: "Spotify",
    difficulty: "easy",
    estimatedTime: "3 minutes",
    canCancelOnline: true,
    requiresCall: false,
    requiresEmail: false,
    cancellationUrl: "https://www.spotify.com/account/subscription/",
    steps: [
      {
        step: 1,
        instruction: "Go to spotify.com/account and log in",
      },
      {
        step: 2,
        instruction: "Click on 'Manage Plan' or 'Change Plan'",
      },
      {
        step: 3,
        instruction: "Scroll down and click 'Cancel Premium'",
      },
      {
        step: 4,
        instruction: "Follow the prompts and confirm cancellation",
        tip: "Spotify may offer you a discount to stay",
      },
    ],
    additionalInfo: [
      "Premium access until end of billing period",
      "Your playlists and saved music remain on free tier",
      "No cancellation fee",
    ],
    alternativeOptions: [
      "Switch to Student plan ($5.99/mo)",
      "Try Duo plan for 2 people ($12.99/mo)",
      "Use free version with ads",
    ],
  },
  "disney-plus": {
    service: "Disney Plus",
    provider: "Disney",
    difficulty: "easy",
    estimatedTime: "2 minutes",
    canCancelOnline: true,
    requiresCall: false,
    requiresEmail: false,
    cancellationUrl: "https://www.disneyplus.com/",
    steps: [
      {
        step: 1,
        instruction: "Go to disneyplus.com and sign in",
      },
      {
        step: 2,
        instruction: "Click on your profile icon",
      },
      {
        step: 3,
        instruction: "Select 'Account'",
      },
      {
        step: 4,
        instruction: "Under 'Subscription', click 'Cancel Subscription'",
      },
      {
        step: 5,
        instruction: "Complete the cancellation survey and confirm",
      },
    ],
    additionalInfo: [
      "Access until end of billing period",
      "No cancellation fee",
      "Can resubscribe anytime",
    ],
  },
  hulu: {
    service: "Hulu",
    provider: "Hulu",
    difficulty: "easy",
    estimatedTime: "3 minutes",
    canCancelOnline: true,
    requiresCall: false,
    requiresEmail: false,
    cancellationUrl: "https://secure.hulu.com/account",
    steps: [
      {
        step: 1,
        instruction: "Go to hulu.com and log in",
      },
      {
        step: 2,
        instruction: "Hover over your name and click 'Account'",
      },
      {
        step: 3,
        instruction: "Click 'Cancel' under your subscription",
      },
      {
        step: 4,
        instruction: "Select a reason for canceling",
      },
      {
        step: 5,
        instruction: "Click 'Continue to Cancel' and confirm",
        tip: "Hulu may offer you a discounted rate to stay",
      },
    ],
    additionalInfo: [
      "Access until end of billing period",
      "Keep your watchlist and preferences",
      "No cancellation fee",
    ],
  },
  "amazon-prime": {
    service: "Amazon Prime",
    provider: "Amazon",
    difficulty: "medium",
    estimatedTime: "5 minutes",
    canCancelOnline: true,
    requiresCall: false,
    requiresEmail: false,
    cancellationUrl: "https://www.amazon.com/mc",
    steps: [
      {
        step: 1,
        instruction: "Go to amazon.com and sign in",
      },
      {
        step: 2,
        instruction: "Click 'Account & Lists' > 'Prime Membership'",
      },
      {
        step: 3,
        instruction: "Click 'Update, Cancel and More'",
      },
      {
        step: 4,
        instruction: "Select 'End Membership'",
        warning: "Amazon will try multiple times to retain you",
      },
      {
        step: 5,
        instruction: "Click through retention offers and confirm cancellation",
      },
    ],
    additionalInfo: [
      "Lose access immediately OR at period end (your choice)",
      "May get prorated refund if canceled early",
      "Affects Prime Video, Music, and shipping benefits",
    ],
    alternativeOptions: [
      "Prime Video only ($8.99/mo)",
      "Prime Student ($7.49/mo)",
      "Monthly membership ($14.99/mo) - easier to cancel",
    ],
  },
  "new-york-times": {
    service: "New York Times",
    provider: "NY Times",
    difficulty: "hard",
    estimatedTime: "10-15 minutes",
    canCancelOnline: false,
    requiresCall: true,
    requiresEmail: false,
    supportPhone: "1-800-698-4637",
    steps: [
      {
        step: 1,
        instruction: "Call 1-800-698-4637",
        warning: "Cannot cancel online - must call",
      },
      {
        step: 2,
        instruction: "Navigate phone menu to reach a representative",
        tip: "Best times: weekday mornings",
      },
      {
        step: 3,
        instruction: "Provide your account information",
      },
      {
        step: 4,
        instruction: "Firmly state you want to cancel",
        warning: "Expect retention attempts and discount offers",
      },
      {
        step: 5,
        instruction: "Decline all offers and confirm cancellation",
      },
      {
        step: 6,
        instruction: "Request cancellation confirmation email",
        tip: "Always get written confirmation",
      },
    ],
    additionalInfo: [
      "Prepare for 10-15 minute call",
      "Access until end of billing period",
      "Check your email for cancellation confirmation",
    ],
  },
  "adobe-creative-cloud": {
    service: "Adobe Creative Cloud",
    provider: "Adobe",
    difficulty: "hard",
    estimatedTime: "10 minutes",
    canCancelOnline: true,
    requiresCall: false,
    requiresEmail: false,
    cancellationUrl: "https://account.adobe.com/plans",
    steps: [
      {
        step: 1,
        instruction: "Go to account.adobe.com and sign in",
      },
      {
        step: 2,
        instruction: "Click on 'Plans' in the sidebar",
      },
      {
        step: 3,
        instruction: "Find your active plan and click 'Manage plan'",
      },
      {
        step: 4,
        instruction: "Select 'Cancel plan'",
        warning: "May incur early termination fee if on annual plan",
      },
      {
        step: 5,
        instruction: "Review cancellation fee (if applicable)",
        tip: "Annual plans paid monthly have 50% ETF",
      },
      {
        step: 6,
        instruction: "Confirm cancellation and pay any fees",
      },
    ],
    additionalInfo: [
      "Annual plan (paid monthly): 50% of remaining contract as ETF",
      "Annual plan (prepaid): No refund for remaining months",
      "Monthly plan: No cancellation fee",
      "Downloads stop working after cancellation",
    ],
    alternativeOptions: [
      "Switch to Photography plan ($9.99/mo)",
      "Single app subscription ($22.99/mo)",
      "Wait until annual contract ends to avoid ETF",
    ],
  },
  "la-fitness": {
    service: "LA Fitness",
    provider: "LA Fitness",
    difficulty: "hard",
    estimatedTime: "Visit in person or 10 days by mail",
    canCancelOnline: false,
    requiresCall: false,
    requiresEmail: true,
    supportEmail: "membercancellations@lafitness.com",
    steps: [
      {
        step: 1,
        instruction: "Option A: Visit your home gym in person",
        tip: "Fastest method - bring ID",
      },
      {
        step: 2,
        instruction: "Option B: Send certified mail to corporate",
        warning: "Must be received 10 days before next billing",
      },
      {
        step: 3,
        instruction: "If mailing: Include member ID, name, and signed cancellation request",
      },
      {
        step: 4,
        instruction: "Send to: LA Fitness, PO Box 54170, Irvine, CA 92619-4170",
      },
      {
        step: 5,
        instruction: "Keep copy of cancellation request and certified mail receipt",
        tip: "Track delivery to ensure it arrives on time",
      },
    ],
    additionalInfo: [
      "No online cancellation available",
      "Must cancel at least 10 days before next billing",
      "May have annual fee obligations",
      "Check contract for minimum commitment period",
    ],
  },
  "planet-fitness": {
    service: "Planet Fitness",
    provider: "Planet Fitness",
    difficulty: "medium",
    estimatedTime: "10 minutes in person or 5 days by mail",
    canCancelOnline: false,
    requiresCall: false,
    requiresEmail: true,
    supportEmail: "Check your home gym's email",
    steps: [
      {
        step: 1,
        instruction: "Option A: Visit your home gym in person",
        tip: "Bring your key tag or app for ID",
      },
      {
        step: 2,
        instruction: "Option B: Send cancellation letter to your home gym",
        warning: "Must be received 5 days before next billing",
      },
      {
        step: 3,
        instruction: "If mailing: Include member ID and signature",
      },
      {
        step: 4,
        instruction: "Send via certified mail for proof of delivery",
      },
      {
        step: 5,
        instruction: "Keep cancellation receipt or mail confirmation",
      },
    ],
    additionalInfo: [
      "Cannot cancel online",
      "Must cancel with home gym (where you signed up)",
      "May have annual commitment period",
      "Black Card membership has different rules",
    ],
  },
};

/**
 * Get playbook by service name (case-insensitive, fuzzy match)
 */
export function getPlaybook(serviceName: string): CancelPlaybook | null {
  const normalized = serviceName.toLowerCase().trim();

  // Direct match
  if (cancelPlaybooks[normalized]) {
    return cancelPlaybooks[normalized];
  }

  // Fuzzy match
  for (const [key, playbook] of Object.entries(cancelPlaybooks)) {
    if (
      playbook.service.toLowerCase().includes(normalized) ||
      normalized.includes(playbook.service.toLowerCase()) ||
      playbook.provider.toLowerCase().includes(normalized) ||
      normalized.includes(playbook.provider.toLowerCase())
    ) {
      return playbook;
    }
  }

  return null;
}

/**
 * Get generic cancellation tips for services without specific playbooks
 */
export function getGenericCancellationTips(): string[] {
  return [
    "Check your subscription settings in the service's website or app",
    "Look for 'Account', 'Billing', or 'Subscription' sections",
    "Take screenshots of cancellation confirmation",
    "Request cancellation confirmation email",
    "Note the cancellation effective date",
    "Check if you'll have access until the end of billing period",
    "Review for any cancellation fees or penalties",
    "If you can't cancel online, try contacting support",
    "For difficult cancellations, contact your credit card company",
  ];
}
