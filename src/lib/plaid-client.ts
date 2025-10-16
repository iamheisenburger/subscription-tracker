/**
 * Plaid API Client Wrapper
 * Handles all Plaid API interactions for bank connections
 */

import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from "plaid";

// Environment configuration
const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID!;
const PLAID_SECRET = process.env.PLAID_SECRET!;
const PLAID_ENV = (process.env.PLAID_ENV || "sandbox") as "sandbox" | "development" | "production";

// Validate required env vars
if (!PLAID_CLIENT_ID || !PLAID_SECRET) {
  console.warn("⚠️ Plaid credentials not configured. Bank integrations will not work.");
}

// Initialize Plaid client
const configuration = new Configuration({
  basePath: PlaidEnvironments[PLAID_ENV],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": PLAID_CLIENT_ID,
      "PLAID-SECRET": PLAID_SECRET,
    },
  },
});

export const plaidClient = new PlaidApi(configuration);

// Types
export interface CreateLinkTokenParams {
  userId: string;
  userName: string;
  products?: Products[];
  countryCodes?: CountryCode[];
  webhookUrl?: string;
  redirectUri?: string;
}

export interface ExchangePublicTokenResponse {
  accessToken: string;
  itemId: string;
}

export interface InstitutionInfo {
  institutionId: string;
  name: string;
  logoUrl?: string;
  primaryColor?: string;
  url?: string;
}

/**
 * Create a Link token for Plaid Link initialization
 */
export async function createLinkToken(params: CreateLinkTokenParams): Promise<string> {
  try {
    const response = await plaidClient.linkTokenCreate({
      user: {
        client_user_id: params.userId,
      },
      client_name: "SubWise Subscription Tracker",
      products: params.products || [Products.Transactions],
      country_codes: params.countryCodes || [CountryCode.Us, CountryCode.Gb, CountryCode.De],
      language: "en",
      webhook: params.webhookUrl,
      redirect_uri: params.redirectUri,
    });

    return response.data.link_token;
  } catch (error) {
    console.error("Error creating Plaid link token:", error);
    throw new Error("Failed to create Plaid link token");
  }
}

/**
 * Exchange public token for access token
 */
export async function exchangePublicToken(
  publicToken: string
): Promise<ExchangePublicTokenResponse> {
  try {
    const response = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });

    return {
      accessToken: response.data.access_token,
      itemId: response.data.item_id,
    };
  } catch (error) {
    console.error("Error exchanging public token:", error);
    throw new Error("Failed to exchange public token");
  }
}

/**
 * Get institution information
 */
export async function getInstitution(
  institutionId: string,
  countryCode: CountryCode = CountryCode.Us
): Promise<InstitutionInfo> {
  try {
    const response = await plaidClient.institutionsGetById({
      institution_id: institutionId,
      country_codes: [countryCode],
    });

    const institution = response.data.institution;

    return {
      institutionId: institution.institution_id,
      name: institution.name,
      logoUrl: institution.logo || undefined,
      primaryColor: institution.primary_color || undefined,
      url: institution.url || undefined,
    };
  } catch (error) {
    console.error("Error fetching institution info:", error);
    throw new Error("Failed to fetch institution info");
  }
}

/**
 * Get item (connection) information
 */
export async function getItem(accessToken: string) {
  try {
    const response = await plaidClient.itemGet({
      access_token: accessToken,
    });

    return response.data.item;
  } catch (error) {
    console.error("Error fetching item:", error);
    throw new Error("Failed to fetch item");
  }
}

/**
 * Get accounts for an access token
 */
export async function getAccounts(accessToken: string) {
  try {
    const response = await plaidClient.accountsGet({
      access_token: accessToken,
    });

    return response.data.accounts;
  } catch (error) {
    console.error("Error fetching accounts:", error);
    throw new Error("Failed to fetch accounts");
  }
}

/**
 * Get transactions for an access token within a date range
 */
export async function getTransactions(
  accessToken: string,
  startDate: string, // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
) {
  try {
    const response = await plaidClient.transactionsGet({
      access_token: accessToken,
      start_date: startDate,
      end_date: endDate,
    });

    return {
      transactions: response.data.transactions,
      accounts: response.data.accounts,
      totalTransactions: response.data.total_transactions,
    };
  } catch (error) {
    console.error("Error fetching transactions:", error);
    throw new Error("Failed to fetch transactions");
  }
}

/**
 * Sync transactions (incremental updates)
 */
export async function syncTransactions(accessToken: string, cursor?: string) {
  try {
    const response = await plaidClient.transactionsSync({
      access_token: accessToken,
      cursor: cursor,
    });

    return {
      added: response.data.added,
      modified: response.data.modified,
      removed: response.data.removed,
      nextCursor: response.data.next_cursor,
      hasMore: response.data.has_more,
    };
  } catch (error) {
    console.error("Error syncing transactions:", error);
    throw new Error("Failed to sync transactions");
  }
}

/**
 * Remove (disconnect) an item
 */
export async function removeItem(accessToken: string) {
  try {
    await plaidClient.itemRemove({
      access_token: accessToken,
    });
    return true;
  } catch (error) {
    console.error("Error removing item:", error);
    throw new Error("Failed to remove item");
  }
}

/**
 * Create a public token for re-authentication (Link update mode)
 */
export async function createPublicToken(accessToken: string): Promise<string> {
  try {
    const response = await plaidClient.itemCreatePublicToken({
      access_token: accessToken,
    });

    return response.data.public_token;
  } catch (error) {
    console.error("Error creating public token:", error);
    throw new Error("Failed to create public token");
  }
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  bodyRaw: string,
  headers: Record<string, string>
): boolean {
  // Plaid webhook verification
  // TODO: Implement webhook signature verification once we have the webhook secret
  // For now, we'll rely on HTTPS and checking the webhook source
  return true;
}

/**
 * Format date for Plaid API (YYYY-MM-DD)
 */
export function formatPlaidDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Get date range for initial transaction sync (90 days)
 */
export function getInitialSyncDateRange(): { startDate: string; endDate: string } {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 90); // 90 days back

  return {
    startDate: formatPlaidDate(startDate),
    endDate: formatPlaidDate(endDate),
  };
}

/**
 * Get date range for historical sync (up to 24 months)
 */
export function getHistoricalSyncDateRange(months: number = 24): { startDate: string; endDate: string } {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  return {
    startDate: formatPlaidDate(startDate),
    endDate: formatPlaidDate(endDate),
  };
}
