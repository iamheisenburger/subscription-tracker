/**
 * Subscription Database for SEO Pages
 * Auto-generated pages targeting high-volume search queries
 */

export interface SubscriptionData {
  slug: string;
  name: string;
  category: 'streaming' | 'music' | 'gaming' | 'software' | 'fitness' | 'news' | 'food' | 'cloud' | 'productivity';
  monthlyPrice: number;
  annualPrice?: number;
  freeTrial?: string;
  description: string;
  features: string[];
  cancellationSteps: string[];
  website: string;
  logo?: string;
  searchVolume: number; // Monthly search volume for "{name} subscription"
}

export const SUBSCRIPTION_DATABASE: SubscriptionData[] = [
  // STREAMING - 150,000+ monthly searches
  {
    slug: 'netflix',
    name: 'Netflix',
    category: 'streaming',
    monthlyPrice: 15.49,
    annualPrice: 185.88,
    freeTrial: '30 days',
    description: 'Stream unlimited movies, TV shows, and original content on Netflix. Track your Netflix subscription with SubWise to never miss a renewal.',
    features: [
      'Unlimited streaming of movies and TV shows',
      'Ad-free viewing experience',
      'Download content for offline viewing',
      '4K Ultra HD available',
      'Multiple profiles',
      'Original Netflix content'
    ],
    cancellationSteps: [
      'Sign in to Netflix.com',
      'Go to Account settings',
      'Click "Cancel Membership"',
      'Confirm cancellation',
      'Keep access until billing period ends'
    ],
    website: 'https://www.netflix.com',
    searchVolume: 50000
  },
  {
    slug: 'spotify',
    name: 'Spotify',
    category: 'music',
    monthlyPrice: 10.99,
    annualPrice: 131.88,
    freeTrial: '30 days',
    description: 'Listen to millions of songs and podcasts on Spotify. Track your Spotify Premium subscription with SubWise.',
    features: [
      'Ad-free music streaming',
      'Offline downloads',
      '320kbps audio quality',
      'Unlimited skips',
      'Spotify Connect',
      'Access to 100M+ songs'
    ],
    cancellationSteps: [
      'Open Spotify app or website',
      'Go to Account',
      'Click "Manage Plan"',
      'Select "Cancel Premium"',
      'Confirm cancellation'
    ],
    website: 'https://www.spotify.com',
    searchVolume: 45000
  },
  {
    slug: 'disney-plus',
    name: 'Disney+',
    category: 'streaming',
    monthlyPrice: 7.99,
    annualPrice: 79.99,
    freeTrial: '7 days',
    description: 'Stream Disney, Pixar, Marvel, Star Wars, and National Geographic content. Track Disney+ with SubWise.',
    features: [
      'Unlimited Disney content',
      '4K UHD streaming',
      'Download for offline viewing',
      '4 concurrent streams',
      'Marvel and Star Wars exclusives',
      'Original Disney+ content'
    ],
    cancellationSteps: [
      'Log into DisneyPlus.com',
      'Click on your profile',
      'Select "Account"',
      'Click "Cancel Subscription"',
      'Follow prompts to confirm'
    ],
    website: 'https://www.disneyplus.com',
    searchVolume: 30000
  },
  {
    slug: 'hulu',
    name: 'Hulu',
    category: 'streaming',
    monthlyPrice: 7.99,
    annualPrice: 79.99,
    description: 'Stream current TV shows, movies, and Hulu Originals. Track your Hulu subscription with SubWise.',
    features: [
      'Next-day streaming of current TV',
      'Hulu Original series',
      'Live TV option available',
      '50+ live channels',
      'Premium network add-ons',
      'Kids profiles'
    ],
    cancellationSteps: [
      'Visit Hulu.com and log in',
      'Click on your name',
      'Select "Account"',
      'Click "Cancel" under subscription',
      'Confirm cancellation'
    ],
    website: 'https://www.hulu.com',
    searchVolume: 25000
  },
  {
    slug: 'amazon-prime',
    name: 'Amazon Prime',
    category: 'streaming',
    monthlyPrice: 14.99,
    annualPrice: 139,
    freeTrial: '30 days',
    description: 'Get free shipping, Prime Video, Prime Music, and more. Track Amazon Prime with SubWise.',
    features: [
      'Free 2-day shipping',
      'Prime Video streaming',
      'Prime Music access',
      'Prime Reading books',
      'Exclusive Prime Day deals',
      'Amazon Photos storage'
    ],
    cancellationSteps: [
      'Go to Amazon.com',
      'Open Account & Lists',
      'Click "Prime Membership"',
      'Select "End Membership"',
      'Confirm cancellation'
    ],
    website: 'https://www.amazon.com/prime',
    searchVolume: 40000
  },
  {
    slug: 'hbo-max',
    name: 'HBO Max',
    category: 'streaming',
    monthlyPrice: 15.99,
    annualPrice: 149.99,
    description: 'Stream HBO, Max Originals, Warner Bros. movies and more. Track HBO Max with SubWise.',
    features: [
      'All HBO content',
      'Max Original series',
      'Warner Bros. movies',
      '4K UHD streaming',
      'Download for offline viewing',
      'Ad-free plan available'
    ],
    cancellationSteps: [
      'Sign in to HBOMax.com',
      'Click on profile icon',
      'Go to "Subscription"',
      'Click "Manage Subscription"',
      'Select "Cancel Subscription"'
    ],
    website: 'https://www.hbomax.com',
    searchVolume: 20000
  },
  {
    slug: 'apple-tv-plus',
    name: 'Apple TV+',
    category: 'streaming',
    monthlyPrice: 6.99,
    annualPrice: 69,
    freeTrial: '7 days',
    description: 'Watch Apple Original shows and movies. Track Apple TV+ subscription with SubWise.',
    features: [
      'Award-winning Apple Originals',
      'Ad-free viewing',
      '4K HDR streaming',
      'Download for offline',
      'Family Sharing for 6 people',
      'New content monthly'
    ],
    cancellationSteps: [
      'Open Settings on iPhone/iPad',
      'Tap your name at top',
      'Select "Subscriptions"',
      'Choose Apple TV+',
      'Tap "Cancel Subscription"'
    ],
    website: 'https://tv.apple.com',
    searchVolume: 15000
  },
  {
    slug: 'paramount-plus',
    name: 'Paramount+',
    category: 'streaming',
    monthlyPrice: 5.99,
    annualPrice: 59.99,
    freeTrial: '7 days',
    description: 'Stream CBS, MTV, Nickelodeon, and Paramount content. Track Paramount+ with SubWise.',
    features: [
      'Live CBS programming',
      'Paramount movies',
      'MTV and Nickelodeon shows',
      'Sports including NFL',
      'Original series',
      'Kids content library'
    ],
    cancellationSteps: [
      'Log into ParamountPlus.com',
      'Click account icon',
      'Select "Account Settings"',
      'Click "Cancel Subscription"',
      'Confirm cancellation'
    ],
    website: 'https://www.paramountplus.com',
    searchVolume: 12000
  },
  {
    slug: 'peacock',
    name: 'Peacock',
    category: 'streaming',
    monthlyPrice: 5.99,
    annualPrice: 59.99,
    description: 'Stream NBCUniversal content, live sports, and originals. Track Peacock with SubWise.',
    features: [
      'NBCUniversal library',
      'Live sports and news',
      'Peacock Originals',
      'Next-day NBC shows',
      'Classic TV shows',
      'WWE Network content'
    ],
    cancellationSteps: [
      'Visit PeacockTV.com',
      'Click on your profile',
      'Go to "Account"',
      'Select "Manage Plans"',
      'Click "Cancel Subscription"'
    ],
    website: 'https://www.peacocktv.com',
    searchVolume: 10000
  },
  {
    slug: 'youtube-premium',
    name: 'YouTube Premium',
    category: 'streaming',
    monthlyPrice: 11.99,
    annualPrice: 119.99,
    freeTrial: '30 days',
    description: 'Watch YouTube ad-free with background play and downloads. Track YouTube Premium with SubWise.',
    features: [
      'Ad-free YouTube',
      'Background play',
      'Download videos',
      'YouTube Music Premium',
      'YouTube Originals',
      'Offline playback'
    ],
    cancellationSteps: [
      'Open YouTube app or website',
      'Click profile picture',
      'Go to "Purchases and memberships"',
      'Select YouTube Premium',
      'Click "Deactivate"'
    ],
    website: 'https://www.youtube.com/premium',
    searchVolume: 35000
  },

  // SOFTWARE & PRODUCTIVITY - 80,000+ monthly searches
  {
    slug: 'adobe-creative-cloud',
    name: 'Adobe Creative Cloud',
    category: 'software',
    monthlyPrice: 54.99,
    annualPrice: 599.88,
    freeTrial: '7 days',
    description: 'Access Photoshop, Illustrator, Premiere Pro and 20+ creative apps. Track Adobe CC with SubWise.',
    features: [
      'Photoshop, Illustrator, Premiere Pro',
      '20+ creative desktop apps',
      '100GB cloud storage',
      'Adobe Fonts library',
      'Portfolio website',
      'Creative Cloud Libraries sync'
    ],
    cancellationSteps: [
      'Sign in to Adobe.com',
      'Go to Account',
      'Click "Manage Plan"',
      'Select "Cancel Plan"',
      'Choose cancellation reason'
    ],
    website: 'https://www.adobe.com/creativecloud',
    searchVolume: 25000
  },
  {
    slug: 'microsoft-365',
    name: 'Microsoft 365',
    category: 'productivity',
    monthlyPrice: 6.99,
    annualPrice: 69.99,
    freeTrial: '30 days',
    description: 'Get Word, Excel, PowerPoint, Outlook, and 1TB OneDrive storage. Track Microsoft 365 with SubWise.',
    features: [
      'Word, Excel, PowerPoint',
      'Outlook email',
      '1TB OneDrive cloud storage',
      'Works on multiple devices',
      'Microsoft Teams',
      'Advanced security features'
    ],
    cancellationSteps: [
      'Go to Microsoft365.com',
      'Sign in to your account',
      'Go to "Services & subscriptions"',
      'Find Microsoft 365',
      'Select "Cancel subscription"'
    ],
    website: 'https://www.microsoft.com/microsoft-365',
    searchVolume: 30000
  },
  {
    slug: 'canva-pro',
    name: 'Canva Pro',
    category: 'software',
    monthlyPrice: 12.99,
    annualPrice: 119.99,
    freeTrial: '30 days',
    description: 'Design graphics with premium templates, images, and tools. Track Canva Pro with SubWise.',
    features: [
      '100M+ premium stock photos',
      '610K+ premium templates',
      'Brand Kit for consistency',
      'Background remover',
      'Resize designs instantly',
      '100GB cloud storage'
    ],
    cancellationSteps: [
      'Open Canva.com and log in',
      'Click on your profile',
      'Go to "Account settings"',
      'Select "Billing & plans"',
      'Click "Cancel subscription"'
    ],
    website: 'https://www.canva.com/pro',
    searchVolume: 18000
  },
  {
    slug: 'notion',
    name: 'Notion',
    category: 'productivity',
    monthlyPrice: 8,
    annualPrice: 96,
    description: 'All-in-one workspace for notes, docs, wikis, and projects. Track Notion with SubWise.',
    features: [
      'Unlimited pages and blocks',
      'Unlimited file uploads',
      'Collaboration tools',
      'Version history',
      'Priority support',
      'Advanced permissions'
    ],
    cancellationSteps: [
      'Open Notion.so',
      'Go to Settings & Members',
      'Click on "Billing"',
      'Select "Downgrade plan"',
      'Confirm downgrade'
    ],
    website: 'https://www.notion.so',
    searchVolume: 15000
  },
  {
    slug: 'grammarly-premium',
    name: 'Grammarly Premium',
    category: 'productivity',
    monthlyPrice: 12,
    annualPrice: 144,
    freeTrial: '7 days',
    description: 'Advanced grammar checker, style suggestions, and plagiarism detection. Track Grammarly with SubWise.',
    features: [
      'Advanced grammar checks',
      'Clarity suggestions',
      'Tone detector',
      'Plagiarism detection',
      'Word choice improvements',
      'Formatting help'
    ],
    cancellationSteps: [
      'Sign in to Grammarly.com',
      'Click on your profile',
      'Go to "Subscription"',
      'Click "Cancel subscription"',
      'Select cancellation reason'
    ],
    website: 'https://www.grammarly.com',
    searchVolume: 20000
  },
  {
    slug: 'dropbox',
    name: 'Dropbox',
    category: 'cloud',
    monthlyPrice: 11.99,
    annualPrice: 119.99,
    description: 'Cloud storage, file sync, and collaboration platform. Track Dropbox with SubWise.',
    features: [
      '2TB cloud storage',
      'Smart Sync',
      'Advanced sharing controls',
      'File recovery 180 days',
      'Priority email support',
      'Dropbox Paper'
    ],
    cancellationSteps: [
      'Log into Dropbox.com',
      'Click on your profile',
      'Select "Settings"',
      'Go to "Plan" tab',
      'Click "Cancel plan"'
    ],
    website: 'https://www.dropbox.com',
    searchVolume: 22000
  },
  {
    slug: 'linkedin-premium',
    name: 'LinkedIn Premium',
    category: 'productivity',
    monthlyPrice: 29.99,
    annualPrice: 239.99,
    freeTrial: '30 days',
    description: 'Advanced networking, InMail credits, and profile insights. Track LinkedIn Premium with SubWise.',
    features: [
      'See who viewed your profile',
      '5 InMail messages per month',
      'Job applicant insights',
      'LinkedIn Learning access',
      'Salary insights',
      'Competitive insights'
    ],
    cancellationSteps: [
      'Open LinkedIn.com',
      'Click "Me" icon',
      'Select "Settings & Privacy"',
      'Go to "Account preferences"',
      'Click "Cancel Premium"'
    ],
    website: 'https://www.linkedin.com/premium',
    searchVolume: 16000
  },

  // Add more subscriptions...
  // Total target: 100+ subscriptions across all categories
];

/**
 * Get subscription by slug
 */
export function getSubscriptionBySlug(slug: string): SubscriptionData | undefined {
  return SUBSCRIPTION_DATABASE.find(sub => sub.slug === slug);
}

/**
 * Get all subscription slugs for static generation
 */
export function getAllSubscriptionSlugs(): string[] {
  return SUBSCRIPTION_DATABASE.map(sub => sub.slug);
}

/**
 * Get subscriptions by category
 */
export function getSubscriptionsByCategory(category: SubscriptionData['category']): SubscriptionData[] {
  return SUBSCRIPTION_DATABASE.filter(sub => sub.category === category);
}

/**
 * Get top subscriptions by search volume
 */
export function getTopSubscriptions(limit: number = 10): SubscriptionData[] {
  return [...SUBSCRIPTION_DATABASE]
    .sort((a, b) => b.searchVolume - a.searchVolume)
    .slice(0, limit);
}

/**
 * Calculate total search volume
 */
export function getTotalSearchVolume(): number {
  return SUBSCRIPTION_DATABASE.reduce((total, sub) => total + sub.searchVolume, 0);
}

