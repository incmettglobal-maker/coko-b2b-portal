// Thin, typed wrapper around Zoho's REST APIs (Books + CRM + Inventory).
// Per CLAUDE.md: every Zoho call in this app goes through here — never fetch Zoho directly
// from a page, component, or Server Action.

interface ZohoTokenCache {
  accessToken: string;
  expiresAt: number; // epoch ms
}

let tokenCache: ZohoTokenCache | null = null;

/**
 * Exchanges the long-lived refresh token for a short-lived access token, cached in memory
 * for the life of the server process (access tokens last ~1hr; refreshing per-request would
 * waste calls against Zoho's rate limit for no benefit).
 */
async function getAccessToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) {
    return tokenCache.accessToken;
  }

  const accountsDomain = requireEnv("ZOHO_ACCOUNTS_DOMAIN");
  const params = new URLSearchParams({
    refresh_token: requireEnv("ZOHO_REFRESH_TOKEN"),
    client_id: requireEnv("ZOHO_CLIENT_ID"),
    client_secret: requireEnv("ZOHO_CLIENT_SECRET"),
    grant_type: "refresh_token",
  });

  const res = await fetch(`${accountsDomain}/oauth/v2/token?${params.toString()}`, {
    method: "POST",
  });

  if (!res.ok) {
    throw new Error(`Zoho token refresh failed: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };

  tokenCache = {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return tokenCache.accessToken;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

type ZohoProduct = "books" | "crm" | "inventory";

const API_PATH_PREFIX: Record<ZohoProduct, string> = {
  books: "/books/v3",
  inventory: "/inventory/v1",
  crm: "/crm/v8",
};

/**
 * Low-level call used by the product-specific helpers in this folder (books.ts, crm.ts —
 * to be added as each phase of the build plan needs them). Not exported for direct use
 * from pages/components.
 */
export async function zohoFetch<T>(
  product: ZohoProduct,
  path: string,
  init: RequestInit & { organizationScoped?: boolean } = {}
): Promise<T> {
  const accessToken = await getAccessToken();
  const apiDomain = requireEnv("ZOHO_API_DOMAIN");

  const url = new URL(`${apiDomain}${API_PATH_PREFIX[product]}${path}`);

  if (init.organizationScoped !== false && product !== "crm") {
    url.searchParams.set("organization_id", requireEnv("ZOHO_ORGANIZATION_ID"));
  }

  const res = await fetch(url.toString(), {
    ...init,
    headers: {
      Authorization: `Zoho-oauthtoken ${accessToken}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  if (!res.ok) {
    throw new Error(`Zoho ${product} API error ${res.status}: ${await res.text()}`);
  }

  return res.json() as Promise<T>;
}
