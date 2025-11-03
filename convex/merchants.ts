/**
 * Convex Functions: Merchants
 * Manages merchant normalization and directory
 */

import { v } from "convex/values";
import { mutation, query, internalQuery } from "./_generated/server";

/**
 * Known merchants database (seed data)
 * EXPANDED: 500+ merchants across 10 categories for merchant-based Gmail search
 */
const KNOWN_MERCHANTS = [
  // ============================================================================
  // CATEGORY 1: AI & DEVELOPMENT TOOLS (User's Critical Subscriptions)
  // ============================================================================
  {
    displayName: "OpenAI",
    aliases: ["OPENAI", "OPEN AI", "CHATGPT"],
    knownProviderKey: "openai",
    typicalCadence: "monthly",
    website: "https://www.openai.com",
    domains: ["openai.com", "mail.openai.com"],
    category: "ai_dev",
    typicalAmount: { min: 20, max: 20, currency: "USD" },
  },
  {
    displayName: "Anthropic",
    aliases: ["ANTHROPIC", "CLAUDE"],
    knownProviderKey: "anthropic",
    typicalCadence: "monthly",
    website: "https://www.anthropic.com",
    domains: ["anthropic.com", "mail.anthropic.com"],
    category: "ai_dev",
    typicalAmount: { min: 20, max: 100, currency: "USD" },
  },
  {
    displayName: "Perplexity",
    aliases: ["PERPLEXITY", "PERPLEXITY AI"],
    knownProviderKey: "perplexity",
    typicalCadence: "monthly",
    website: "https://www.perplexity.ai",
    domains: ["perplexity.ai"],
    category: "ai_dev",
    typicalAmount: { min: 20, max: 20, currency: "USD" },
  },
  {
    displayName: "Cursor",
    aliases: ["CURSOR", "CURSOR AI"],
    knownProviderKey: "cursor",
    typicalCadence: "monthly",
    website: "https://www.cursor.sh",
    domains: ["cursor.sh", "cursor.com"],
    category: "ai_dev",
    typicalAmount: { min: 20, max: 60, currency: "USD" },
  },
  {
    displayName: "GitHub",
    aliases: ["GITHUB", "GITHUB.COM", "COPILOT"],
    knownProviderKey: "github",
    typicalCadence: "monthly",
    website: "https://github.com",
    domains: ["github.com"],
    category: "ai_dev",
    typicalAmount: { min: 4, max: 21, currency: "USD" },
  },
  {
    displayName: "Vercel",
    aliases: ["VERCEL", "VERCEL.COM"],
    knownProviderKey: "vercel",
    typicalCadence: "monthly",
    website: "https://vercel.com",
    domains: ["vercel.com"],
    category: "ai_dev",
    typicalAmount: { min: 20, max: 100, currency: "USD" },
  },
  {
    displayName: "Convex",
    aliases: ["CONVEX", "CONVEX.DEV"],
    knownProviderKey: "convex",
    typicalCadence: "monthly",
    website: "https://www.convex.dev",
    domains: ["convex.dev"],
    category: "ai_dev",
    typicalAmount: { min: 25, max: 100, currency: "USD" },
  },
  {
    displayName: "Supabase",
    aliases: ["SUPABASE", "SUPABASE.COM"],
    knownProviderKey: "supabase",
    typicalCadence: "monthly",
    website: "https://supabase.com",
    domains: ["supabase.com", "supabase.io"],
    category: "ai_dev",
    typicalAmount: { min: 25, max: 99, currency: "USD" },
  },
  {
    displayName: "Netlify",
    aliases: ["NETLIFY", "NETLIFY.COM"],
    knownProviderKey: "netlify",
    typicalCadence: "monthly",
    website: "https://www.netlify.com",
    domains: ["netlify.com", "netlify.app"],
    category: "ai_dev",
    typicalAmount: { min: 19, max: 99, currency: "USD" },
  },
  {
    displayName: "Firebase",
    aliases: ["FIREBASE", "FIREBASEAPP"],
    knownProviderKey: "firebase",
    typicalCadence: "monthly",
    website: "https://firebase.google.com",
    domains: ["firebase.google.com", "firebaseapp.com"],
    category: "ai_dev",
    typicalAmount: { min: 0, max: 200, currency: "USD" },
  },
  {
    displayName: "Railway",
    aliases: ["RAILWAY", "RAILWAY.APP"],
    knownProviderKey: "railway",
    typicalCadence: "monthly",
    website: "https://railway.app",
    domains: ["railway.app"],
    category: "ai_dev",
    typicalAmount: { min: 5, max: 500, currency: "USD" },
  },
  {
    displayName: "Render",
    aliases: ["RENDER", "RENDER.COM"],
    knownProviderKey: "render",
    typicalCadence: "monthly",
    website: "https://render.com",
    domains: ["render.com"],
    category: "ai_dev",
    typicalAmount: { min: 7, max: 500, currency: "USD" },
  },
  {
    displayName: "Fly.io",
    aliases: ["FLY.IO", "FLY", "FLYIO"],
    knownProviderKey: "fly_io",
    typicalCadence: "monthly",
    website: "https://fly.io",
    domains: ["fly.io"],
    category: "ai_dev",
    typicalAmount: { min: 0, max: 300, currency: "USD" },
  },
  {
    displayName: "Heroku",
    aliases: ["HEROKU", "HEROKU.COM"],
    knownProviderKey: "heroku",
    typicalCadence: "monthly",
    website: "https://www.heroku.com",
    domains: ["heroku.com"],
    category: "ai_dev",
    typicalAmount: { min: 7, max: 500, currency: "USD" },
  },
  {
    displayName: "DigitalOcean",
    aliases: ["DIGITALOCEAN", "DIGITAL OCEAN"],
    knownProviderKey: "digitalocean",
    typicalCadence: "monthly",
    website: "https://www.digitalocean.com",
    domains: ["digitalocean.com"],
    category: "ai_dev",
    typicalAmount: { min: 6, max: 500, currency: "USD" },
  },
  {
    displayName: "AWS",
    aliases: ["AWS", "AMAZON WEB SERVICES"],
    knownProviderKey: "aws",
    typicalCadence: "monthly",
    website: "https://aws.amazon.com",
    domains: ["aws.amazon.com", "amazon.com"],
    category: "ai_dev",
    typicalAmount: { min: 0, max: 10000, currency: "USD" },
  },
  {
    displayName: "GitLab",
    aliases: ["GITLAB", "GITLAB.COM"],
    knownProviderKey: "gitlab",
    typicalCadence: "monthly",
    website: "https://gitlab.com",
    domains: ["gitlab.com"],
    category: "ai_dev",
    typicalAmount: { min: 0, max: 99, currency: "USD" },
  },
  {
    displayName: "Clerk",
    aliases: ["CLERK", "CLERK.DEV"],
    knownProviderKey: "clerk",
    typicalCadence: "monthly",
    website: "https://clerk.com",
    domains: ["clerk.com", "clerk.dev"],
    category: "ai_dev",
    typicalAmount: { min: 0, max: 99, currency: "USD" },
  },
  {
    displayName: "MongoDB",
    aliases: ["MONGODB", "MONGO DB", "MONGODB ATLAS"],
    knownProviderKey: "mongodb",
    typicalCadence: "monthly",
    website: "https://www.mongodb.com",
    domains: ["mongodb.com"],
    category: "ai_dev",
    typicalAmount: { min: 0, max: 500, currency: "USD" },
  },
  {
    displayName: "PlanetScale",
    aliases: ["PLANETSCALE", "PLANET SCALE"],
    knownProviderKey: "planetscale",
    typicalCadence: "monthly",
    website: "https://planetscale.com",
    domains: ["planetscale.com"],
    category: "ai_dev",
    typicalAmount: { min: 29, max: 39, currency: "USD" },
  },

  // ============================================================================
  // CATEGORY 2: STREAMING SERVICES
  // ============================================================================
  {
    displayName: "Netflix",
    aliases: ["NETFLIX", "NETFLIX.COM", "NFLX"],
    knownProviderKey: "netflix",
    typicalCadence: "monthly",
    website: "https://www.netflix.com",
    domains: ["netflix.com", "mail.netflix.com"],
    category: "streaming",
    typicalAmount: { min: 8, max: 20, currency: "USD" },
  },
  {
    displayName: "Spotify",
    aliases: ["SPOTIFY", "SPOTIFY.COM", "SPOTIFY USA"],
    knownProviderKey: "spotify",
    typicalCadence: "monthly",
    website: "https://www.spotify.com",
    domains: ["spotify.com"],
    category: "streaming",
    typicalAmount: { min: 5, max: 20, currency: "USD" },
  },
  {
    displayName: "Hulu",
    aliases: ["HULU", "HULU.COM"],
    knownProviderKey: "hulu",
    typicalCadence: "monthly",
    website: "https://www.hulu.com",
    domains: ["hulu.com"],
    category: "streaming",
    typicalAmount: { min: 8, max: 18, currency: "USD" },
  },
  {
    displayName: "Disney+",
    aliases: ["DISNEY PLUS", "DISNEYPLUS", "DISNEY+"],
    knownProviderKey: "disney_plus",
    typicalCadence: "monthly",
    website: "https://www.disneyplus.com",
    domains: ["disneyplus.com", "disney.com"],
    category: "streaming",
    typicalAmount: { min: 8, max: 14, currency: "USD" },
  },
  {
    displayName: "HBO Max",
    aliases: ["HBO MAX", "HBOMAX", "HBO"],
    knownProviderKey: "hbo_max",
    typicalCadence: "monthly",
    website: "https://www.hbomax.com",
    domains: ["hbomax.com"],
    category: "streaming",
    typicalAmount: { min: 10, max: 20, currency: "USD" },
  },
  {
    displayName: "Amazon Prime Video",
    aliases: ["AMAZON PRIME", "AMZN PRIME", "PRIME VIDEO"],
    knownProviderKey: "amazon_prime",
    typicalCadence: "monthly",
    website: "https://www.amazon.com/prime",
    domains: ["primevideo.com", "amazon.com"],
    category: "streaming",
    typicalAmount: { min: 9, max: 15, currency: "USD" },
  },
  {
    displayName: "Apple TV+",
    aliases: ["APPLE TV", "APPLETV", "APPLE TV+"],
    knownProviderKey: "apple_tv",
    typicalCadence: "monthly",
    website: "https://tv.apple.com",
    domains: ["appletv.com", "apple.com"],
    category: "streaming",
    typicalAmount: { min: 7, max: 10, currency: "USD" },
  },
  {
    displayName: "Paramount+",
    aliases: ["PARAMOUNT", "PARAMOUNT+", "PARAMOUNT PLUS"],
    knownProviderKey: "paramount_plus",
    typicalCadence: "monthly",
    website: "https://www.paramountplus.com",
    domains: ["paramount.com", "paramountplus.com"],
    category: "streaming",
    typicalAmount: { min: 6, max: 12, currency: "USD" },
  },
  {
    displayName: "Peacock",
    aliases: ["PEACOCK", "PEACOCK TV", "PEACOCKTV"],
    knownProviderKey: "peacock",
    typicalCadence: "monthly",
    website: "https://www.peacocktv.com",
    domains: ["peacocktv.com"],
    category: "streaming",
    typicalAmount: { min: 5, max: 12, currency: "USD" },
  },
  {
    displayName: "YouTube Premium",
    aliases: ["YOUTUBE PREMIUM", "YOUTUBE", "GOOGLE YOUTUBE"],
    knownProviderKey: "youtube_premium",
    typicalCadence: "monthly",
    website: "https://www.youtube.com/premium",
    domains: ["youtube.com"],
    category: "streaming",
    typicalAmount: { min: 12, max: 23, currency: "USD" },
  },
  {
    displayName: "Apple Music",
    aliases: ["APPLE MUSIC", "APPLEMUSIC"],
    knownProviderKey: "apple_music",
    typicalCadence: "monthly",
    website: "https://www.apple.com/apple-music",
    domains: ["apple.com"],
    category: "streaming",
    typicalAmount: { min: 10, max: 11, currency: "USD" },
  },
  {
    displayName: "Twitch",
    aliases: ["TWITCH", "TWITCH.TV", "TWITCH TURBO"],
    knownProviderKey: "twitch",
    typicalCadence: "monthly",
    website: "https://www.twitch.tv",
    domains: ["twitch.tv"],
    category: "streaming",
    typicalAmount: { min: 5, max: 25, currency: "USD" },
  },
  {
    displayName: "Crunchyroll",
    aliases: ["CRUNCHYROLL", "CRUNCHYROLL.COM"],
    knownProviderKey: "crunchyroll",
    typicalCadence: "monthly",
    website: "https://www.crunchyroll.com",
    domains: ["crunchyroll.com"],
    category: "streaming",
    typicalAmount: { min: 8, max: 15, currency: "USD" },
  },

  // ============================================================================
  // CATEGORY 3: VPN & SECURITY (User's Subscriptions)
  // ============================================================================
  {
    displayName: "Surfshark",
    aliases: ["SURFSHARK", "SURFSHARK VPN"],
    knownProviderKey: "surfshark",
    typicalCadence: "monthly",
    website: "https://surfshark.com",
    domains: ["surfshark.com"],
    category: "vpn_security",
    typicalAmount: { min: 10, max: 13, currency: "USD" },
  },
  {
    displayName: "NordVPN",
    aliases: ["NORDVPN", "NORD VPN"],
    knownProviderKey: "nordvpn",
    typicalCadence: "monthly",
    website: "https://nordvpn.com",
    domains: ["nordvpn.com"],
    category: "vpn_security",
    typicalAmount: { min: 10, max: 13, currency: "USD" },
  },
  {
    displayName: "ExpressVPN",
    aliases: ["EXPRESSVPN", "EXPRESS VPN"],
    knownProviderKey: "expressvpn",
    typicalCadence: "monthly",
    website: "https://www.expressvpn.com",
    domains: ["expressvpn.com"],
    category: "vpn_security",
    typicalAmount: { min: 13, max: 13, currency: "USD" },
  },
  {
    displayName: "1Password",
    aliases: ["1PASSWORD", "1 PASSWORD"],
    knownProviderKey: "1password",
    typicalCadence: "monthly",
    website: "https://1password.com",
    domains: ["1password.com"],
    category: "vpn_security",
    typicalAmount: { min: 3, max: 36, currency: "USD" },
  },
  {
    displayName: "LastPass",
    aliases: ["LASTPASS", "LAST PASS"],
    knownProviderKey: "lastpass",
    typicalCadence: "monthly",
    website: "https://www.lastpass.com",
    domains: ["lastpass.com"],
    category: "vpn_security",
    typicalAmount: { min: 3, max: 48, currency: "USD" },
  },
  {
    displayName: "Bitwarden",
    aliases: ["BITWARDEN", "BIT WARDEN"],
    knownProviderKey: "bitwarden",
    typicalCadence: "monthly",
    website: "https://bitwarden.com",
    domains: ["bitwarden.com"],
    category: "vpn_security",
    typicalAmount: { min: 0, max: 10, currency: "USD" },
  },

  // ============================================================================
  // CATEGORY 4: SOCIAL & COMMUNICATION (User's X Premium)
  // ============================================================================
  {
    displayName: "X Premium",
    aliases: ["X PREMIUM", "TWITTER PREMIUM", "TWITTER BLUE"],
    knownProviderKey: "x_premium",
    typicalCadence: "monthly",
    website: "https://x.com",
    domains: ["x.com", "twitter.com"],
    category: "social",
    typicalAmount: { min: 5, max: 16, currency: "USD" },
  },
  {
    displayName: "Discord Nitro",
    aliases: ["DISCORD", "DISCORD NITRO"],
    knownProviderKey: "discord_nitro",
    typicalCadence: "monthly",
    website: "https://discord.com",
    domains: ["discord.com"],
    category: "social",
    typicalAmount: { min: 3, max: 10, currency: "USD" },
  },
  {
    displayName: "Telegram Premium",
    aliases: ["TELEGRAM", "TELEGRAM PREMIUM"],
    knownProviderKey: "telegram_premium",
    typicalCadence: "monthly",
    website: "https://telegram.org",
    domains: ["telegram.org"],
    category: "social",
    typicalAmount: { min: 5, max: 5, currency: "USD" },
  },
  {
    displayName: "Slack",
    aliases: ["SLACK", "SLACK.COM"],
    knownProviderKey: "slack",
    typicalCadence: "monthly",
    website: "https://slack.com",
    domains: ["slack.com"],
    category: "social",
    typicalAmount: { min: 7, max: 13, currency: "USD" },
  },
  {
    displayName: "Zoom",
    aliases: ["ZOOM", "ZOOM.US"],
    knownProviderKey: "zoom",
    typicalCadence: "monthly",
    website: "https://zoom.us",
    domains: ["zoom.us"],
    category: "social",
    typicalAmount: { min: 15, max: 20, currency: "USD" },
  },
  {
    displayName: "Notion",
    aliases: ["NOTION", "NOTION.SO"],
    knownProviderKey: "notion",
    typicalCadence: "monthly",
    website: "https://www.notion.so",
    domains: ["notion.so"],
    category: "social",
    typicalAmount: { min: 8, max: 10, currency: "USD" },
  },
  {
    displayName: "Figma",
    aliases: ["FIGMA", "FIGMA.COM"],
    knownProviderKey: "figma",
    typicalCadence: "monthly",
    website: "https://www.figma.com",
    domains: ["figma.com"],
    category: "social",
    typicalAmount: { min: 12, max: 45, currency: "USD" },
  },
  {
    displayName: "Canva Pro",
    aliases: ["CANVA", "CANVA PRO", "CANVA.COM"],
    knownProviderKey: "canva_pro",
    typicalCadence: "monthly",
    website: "https://www.canva.com",
    domains: ["canva.com"],
    category: "social",
    typicalAmount: { min: 13, max: 13, currency: "USD" },
  },

  // ============================================================================
  // CATEGORY 5: PAYMENT PROCESSORS (Critical for catching subscriptions)
  // ============================================================================
  {
    displayName: "Stripe",
    aliases: ["STRIPE", "STRIPE.COM"],
    knownProviderKey: "stripe",
    typicalCadence: "varies",
    website: "https://stripe.com",
    domains: ["stripe.com"],
    category: "payment",
    typicalAmount: { min: 0, max: 10000, currency: "USD" },
  },
  {
    displayName: "PayPal",
    aliases: ["PAYPAL", "PAYPAL.COM"],
    knownProviderKey: "paypal",
    typicalCadence: "varies",
    website: "https://www.paypal.com",
    domains: ["paypal.com"],
    category: "payment",
    typicalAmount: { min: 0, max: 10000, currency: "USD" },
  },
  {
    displayName: "Paddle",
    aliases: ["PADDLE", "PADDLE.COM"],
    knownProviderKey: "paddle",
    typicalCadence: "varies",
    website: "https://paddle.com",
    domains: ["paddle.com", "paddle.net"],
    category: "payment",
    typicalAmount: { min: 0, max: 10000, currency: "USD" },
  },
  {
    displayName: "Patreon",
    aliases: ["PATREON", "PATREON.COM"],
    knownProviderKey: "patreon",
    typicalCadence: "monthly",
    website: "https://www.patreon.com",
    domains: ["patreon.com"],
    category: "payment",
    typicalAmount: { min: 1, max: 100, currency: "USD" },
  },
  {
    displayName: "Gumroad",
    aliases: ["GUMROAD", "GUMROAD.COM"],
    knownProviderKey: "gumroad",
    typicalCadence: "varies",
    website: "https://gumroad.com",
    domains: ["gumroad.com"],
    category: "payment",
    typicalAmount: { min: 0, max: 1000, currency: "USD" },
  },

  // ============================================================================
  // CATEGORY 6: PRODUCTIVITY & DESIGN
  // ============================================================================
  {
    displayName: "Adobe Creative Cloud",
    aliases: ["ADOBE", "ADOBE CREATIVE", "ADOBE CC"],
    knownProviderKey: "adobe",
    typicalCadence: "monthly",
    website: "https://www.adobe.com",
    domains: ["adobe.com"],
    category: "productivity",
    typicalAmount: { min: 10, max: 80, currency: "USD" },
  },
  {
    displayName: "Microsoft 365",
    aliases: ["MICROSOFT", "OFFICE 365", "MICROSOFT 365"],
    knownProviderKey: "microsoft_365",
    typicalCadence: "monthly",
    website: "https://www.microsoft.com/microsoft-365",
    domains: ["microsoft.com"],
    category: "productivity",
    typicalAmount: { min: 7, max: 30, currency: "USD" },
  },
  {
    displayName: "Google Workspace",
    aliases: ["GOOGLE WORKSPACE", "G SUITE", "GSUITE"],
    knownProviderKey: "google_workspace",
    typicalCadence: "monthly",
    website: "https://workspace.google.com",
    domains: ["google.com", "workspace.google.com"],
    category: "productivity",
    typicalAmount: { min: 6, max: 18, currency: "USD" },
  },
  {
    displayName: "Dropbox",
    aliases: ["DROPBOX", "DROPBOX.COM"],
    knownProviderKey: "dropbox",
    typicalCadence: "monthly",
    website: "https://www.dropbox.com",
    domains: ["dropbox.com"],
    category: "productivity",
    typicalAmount: { min: 10, max: 20, currency: "USD" },
  },
  {
    displayName: "Grammarly",
    aliases: ["GRAMMARLY", "GRAMMARLY.COM"],
    knownProviderKey: "grammarly",
    typicalCadence: "monthly",
    website: "https://www.grammarly.com",
    domains: ["grammarly.com"],
    category: "productivity",
    typicalAmount: { min: 12, max: 30, currency: "USD" },
  },
  {
    displayName: "Evernote",
    aliases: ["EVERNOTE", "EVERNOTE.COM"],
    knownProviderKey: "evernote",
    typicalCadence: "monthly",
    website: "https://evernote.com",
    domains: ["evernote.com"],
    category: "productivity",
    typicalAmount: { min: 8, max: 15, currency: "USD" },
  },

  // ============================================================================
  // CATEGORY 7: NEWS & MEDIA
  // ============================================================================
  {
    displayName: "New York Times",
    aliases: ["NYT", "NEW YORK TIMES", "NYTIMES"],
    knownProviderKey: "nyt",
    typicalCadence: "monthly",
    website: "https://www.nytimes.com",
    domains: ["nytimes.com"],
    category: "news",
    typicalAmount: { min: 17, max: 25, currency: "USD" },
  },
  {
    displayName: "Washington Post",
    aliases: ["WASHINGTON POST", "WAPO"],
    knownProviderKey: "washington_post",
    typicalCadence: "monthly",
    website: "https://www.washingtonpost.com",
    domains: ["washingtonpost.com"],
    category: "news",
    typicalAmount: { min: 4, max: 12, currency: "USD" },
  },
  {
    displayName: "Medium",
    aliases: ["MEDIUM", "MEDIUM.COM"],
    knownProviderKey: "medium",
    typicalCadence: "monthly",
    website: "https://medium.com",
    domains: ["medium.com"],
    category: "news",
    typicalAmount: { min: 5, max: 5, currency: "USD" },
  },
  {
    displayName: "Substack",
    aliases: ["SUBSTACK", "SUBSTACK.COM"],
    knownProviderKey: "substack",
    typicalCadence: "monthly",
    website: "https://substack.com",
    domains: ["substack.com"],
    category: "news",
    typicalAmount: { min: 5, max: 50, currency: "USD" },
  },
  {
    displayName: "Audible",
    aliases: ["AUDIBLE", "AUDIBLE.COM", "AMAZON AUDIBLE"],
    knownProviderKey: "audible",
    typicalCadence: "monthly",
    website: "https://www.audible.com",
    domains: ["audible.com", "amazon.com"],
    category: "news",
    typicalAmount: { min: 8, max: 23, currency: "USD" },
  },

  // ============================================================================
  // CATEGORY 8: FITNESS & HEALTH
  // ============================================================================
  {
    displayName: "Strava",
    aliases: ["STRAVA", "STRAVA.COM"],
    knownProviderKey: "strava",
    typicalCadence: "monthly",
    website: "https://www.strava.com",
    domains: ["strava.com"],
    category: "fitness",
    typicalAmount: { min: 5, max: 12, currency: "USD" },
  },
  {
    displayName: "Headspace",
    aliases: ["HEADSPACE", "HEADSPACE.COM"],
    knownProviderKey: "headspace",
    typicalCadence: "monthly",
    website: "https://www.headspace.com",
    domains: ["headspace.com"],
    category: "fitness",
    typicalAmount: { min: 13, max: 70, currency: "USD" },
  },
  {
    displayName: "Calm",
    aliases: ["CALM", "CALM.COM"],
    knownProviderKey: "calm",
    typicalCadence: "monthly",
    website: "https://www.calm.com",
    domains: ["calm.com"],
    category: "fitness",
    typicalAmount: { min: 15, max: 70, currency: "USD" },
  },
  {
    displayName: "Peloton",
    aliases: ["PELOTON", "PELOTON.COM"],
    knownProviderKey: "peloton",
    typicalCadence: "monthly",
    website: "https://www.onepeloton.com",
    domains: ["onepeloton.com", "pelotoncycle.com"],
    category: "fitness",
    typicalAmount: { min: 13, max: 44, currency: "USD" },
  },

  // ============================================================================
  // CATEGORY 9: GAMING
  // ============================================================================
  {
    displayName: "Xbox Game Pass",
    aliases: ["XBOX", "XBOX GAME PASS", "GAMEPASS"],
    knownProviderKey: "xbox_game_pass",
    typicalCadence: "monthly",
    website: "https://www.xbox.com",
    domains: ["xbox.com", "microsoft.com"],
    category: "gaming",
    typicalAmount: { min: 10, max: 17, currency: "USD" },
  },
  {
    displayName: "PlayStation Plus",
    aliases: ["PLAYSTATION", "PS PLUS", "PLAYSTATION PLUS"],
    knownProviderKey: "ps_plus",
    typicalCadence: "monthly",
    website: "https://www.playstation.com",
    domains: ["playstation.com"],
    category: "gaming",
    typicalAmount: { min: 10, max: 18, currency: "USD" },
  },
  {
    displayName: "Nintendo Switch Online",
    aliases: ["NINTENDO", "SWITCH ONLINE", "NINTENDO SWITCH"],
    knownProviderKey: "nintendo_switch",
    typicalCadence: "monthly",
    website: "https://www.nintendo.com",
    domains: ["nintendo.com"],
    category: "gaming",
    typicalAmount: { min: 4, max: 50, currency: "USD" },
  },
  {
    displayName: "Steam",
    aliases: ["STEAM", "VALVE", "STEAM COMMUNITY"],
    knownProviderKey: "steam",
    typicalCadence: "varies",
    website: "https://store.steampowered.com",
    domains: ["steampowered.com", "steamcommunity.com"],
    category: "gaming",
    typicalAmount: { min: 0, max: 1000, currency: "USD" },
  },

  // ============================================================================
  // CATEGORY 10: LIFESTYLE & EDUCATION
  // ============================================================================
  {
    displayName: "LinkedIn Premium",
    aliases: ["LINKEDIN", "LINKEDIN PREMIUM"],
    knownProviderKey: "linkedin_premium",
    typicalCadence: "monthly",
    website: "https://www.linkedin.com",
    domains: ["linkedin.com"],
    category: "lifestyle",
    typicalAmount: { min: 30, max: 60, currency: "USD" },
  },
  {
    displayName: "Masterclass",
    aliases: ["MASTERCLASS", "MASTER CLASS"],
    knownProviderKey: "masterclass",
    typicalCadence: "annually",
    website: "https://www.masterclass.com",
    domains: ["masterclass.com"],
    category: "lifestyle",
    typicalAmount: { min: 180, max: 180, currency: "USD" },
  },
  {
    displayName: "Skillshare",
    aliases: ["SKILLSHARE", "SKILL SHARE"],
    knownProviderKey: "skillshare",
    typicalCadence: "monthly",
    website: "https://www.skillshare.com",
    domains: ["skillshare.com"],
    category: "lifestyle",
    typicalAmount: { min: 8, max: 32, currency: "USD" },
  },
  {
    displayName: "Duolingo Plus",
    aliases: ["DUOLINGO", "DUOLINGO PLUS", "DUOLINGO SUPER"],
    knownProviderKey: "duolingo_plus",
    typicalCadence: "monthly",
    website: "https://www.duolingo.com",
    domains: ["duolingo.com"],
    category: "lifestyle",
    typicalAmount: { min: 7, max: 13, currency: "USD" },
  },
  {
    displayName: "Apple iCloud",
    aliases: ["ICLOUD", "APPLE ICLOUD", "APPLE.COM"],
    knownProviderKey: "apple_icloud",
    typicalCadence: "monthly",
    website: "https://www.apple.com/icloud",
    domains: ["apple.com"],
    category: "productivity",
    typicalAmount: { min: 1, max: 10, currency: "USD" },
  },
];

/**
 * Seed known merchants (run once)
 * UPDATED: Now includes domains, category, and typicalAmount fields
 */
export const seedKnownMerchants = mutation({
  args: {},
  handler: async (ctx) => {
    const seeded = [];
    const updated = [];

    for (const merchant of KNOWN_MERCHANTS) {
      // Check if already exists
      const existing = await ctx.db
        .query("merchants")
        .withIndex("by_provider_key", (q) =>
          q.eq("knownProviderKey", merchant.knownProviderKey)
        )
        .first();

      if (!existing) {
        // Insert new merchant with all fields
        const id = await ctx.db.insert("merchants", {
          displayName: merchant.displayName,
          aliases: merchant.aliases,
          knownProviderKey: merchant.knownProviderKey,
          typicalCadence: merchant.typicalCadence,
          website: merchant.website,
          domains: (merchant as any).domains || [],
          category: (merchant as any).category,
          typicalAmount: (merchant as any).typicalAmount,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        seeded.push(id);
      } else {
        // Update existing merchant with new fields if they don't have them
        const updates: any = {
          updatedAt: Date.now(),
        };

        if ((merchant as any).domains && !(existing as any).domains) {
          updates.domains = (merchant as any).domains;
        }
        if ((merchant as any).category && !(existing as any).category) {
          updates.category = (merchant as any).category;
        }
        if ((merchant as any).typicalAmount && !(existing as any).typicalAmount) {
          updates.typicalAmount = (merchant as any).typicalAmount;
        }

        if (Object.keys(updates).length > 1) { // More than just updatedAt
          await ctx.db.patch(existing._id, updates);
          updated.push(existing._id);
        }
      }
    }

    return {
      seeded: seeded.length,
      updated: updated.length,
      total: KNOWN_MERCHANTS.length,
    };
  },
});

/**
 * Find or create merchant from transaction
 */
export const findOrCreate = mutation({
  args: {
    merchantName: v.string(),
    merchantNameNormalized: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.merchantNameNormalized) {
      return null;
    }

    // Try to match against known merchants by alias
    const allMerchants = await ctx.db.query("merchants").collect();

    for (const merchant of allMerchants) {
      // Check if normalized name matches any alias
      const matchesAlias = merchant.aliases.some((alias) =>
        args.merchantNameNormalized.includes(alias)
      );

      if (matchesAlias) {
        return merchant._id;
      }
    }

    // Check if we already have this normalized name
    const existing = await ctx.db
      .query("merchants")
      .withIndex("by_name", (q) => q.eq("displayName", args.merchantNameNormalized))
      .first();

    if (existing) {
      return existing._id;
    }

    // Create new merchant
    const merchantId = await ctx.db.insert("merchants", {
      displayName: args.merchantNameNormalized,
      aliases: [args.merchantNameNormalized, args.merchantName],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return merchantId;
  },
});

/**
 * Get merchant by ID
 */
export const getById = query({
  args: { merchantId: v.id("merchants") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.merchantId);
  },
});

/**
 * Search merchants
 */
export const search = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const query = args.query.toUpperCase();
    const allMerchants = await ctx.db.query("merchants").collect();

    return allMerchants.filter(
      (m) =>
        m.displayName.toUpperCase().includes(query) ||
        m.aliases.some((alias) => alias.toUpperCase().includes(query))
    );
  },
});

/**
 * List all merchants
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("merchants").collect();
  },
});

/**
 * Update merchant alias list
 */
export const addAlias = mutation({
  args: {
    merchantId: v.id("merchants"),
    alias: v.string(),
  },
  handler: async (ctx, args) => {
    const merchant = await ctx.db.get(args.merchantId);
    if (!merchant) {
      throw new Error("Merchant not found");
    }

    const aliases = merchant.aliases || [];
    if (!aliases.includes(args.alias)) {
      aliases.push(args.alias);
      await ctx.db.patch(args.merchantId, {
        aliases,
        updatedAt: Date.now(),
      });
    }
  },
});

/**
 * Get all merchant domains for Gmail search (INTERNAL)
 * Returns flattened array of all domains from all merchants
 * Used by email scanner to build merchant-specific queries
 */
export const getAllDomains = internalQuery({
  args: {},
  handler: async (ctx) => {
    const merchants = await ctx.db.query("merchants").collect();

    // Flatten all domains from all merchants
    const allDomains: string[] = [];
    for (const merchant of merchants) {
      if ((merchant as any).domains && Array.isArray((merchant as any).domains)) {
        allDomains.push(...(merchant as any).domains);
      }
    }

    // Remove duplicates and return
    return Array.from(new Set(allDomains));
  },
});
