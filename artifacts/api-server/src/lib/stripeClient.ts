// Stripe client wired to the Replit Stripe integration.
// Credentials are fetched fresh on every call from the Replit connectors API,
// so tokens never go stale. Do NOT cache the returned Stripe instance.
import Stripe from "stripe";

interface ConnectionSettings {
  publishable: string;
  secret: string;
}

async function getCredentials(): Promise<{ publishableKey: string; secretKey: string }> {
  const hostname = process.env["REPLIT_CONNECTORS_HOSTNAME"];
  const xReplitToken = process.env["REPL_IDENTITY"]
    ? "repl " + process.env["REPL_IDENTITY"]
    : process.env["WEB_REPL_RENEWAL"]
      ? "depl " + process.env["WEB_REPL_RENEWAL"]
      : null;

  if (!hostname || !xReplitToken) {
    throw new Error("Stripe connection not available: missing Replit connector envs");
  }

  const isProduction = process.env["REPLIT_DEPLOYMENT"] === "1";
  const targetEnvironment = isProduction ? "production" : "development";

  const url = new URL(`https://${hostname}/api/v2/connection`);
  url.searchParams.set("include_secrets", "true");
  url.searchParams.set("connector_names", "stripe");
  url.searchParams.set("environment", targetEnvironment);

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json", "X-Replit-Token": xReplitToken },
  });
  const data = (await response.json()) as { items?: Array<{ settings: ConnectionSettings }> };
  const item = data.items?.[0];
  if (!item || !item.settings.publishable || !item.settings.secret) {
    throw new Error(`Stripe ${targetEnvironment} connection not found`);
  }
  return { publishableKey: item.settings.publishable, secretKey: item.settings.secret };
}

export async function getUncachableStripeClient(): Promise<Stripe> {
  const { secretKey } = await getCredentials();
  return new Stripe(secretKey);
}

export async function getStripePublishableKey(): Promise<string> {
  const { publishableKey } = await getCredentials();
  return publishableKey;
}

export async function getStripeSecretKey(): Promise<string> {
  const { secretKey } = await getCredentials();
  return secretKey;
}

export async function isStripeAvailable(): Promise<boolean> {
  try {
    await getCredentials();
    return true;
  } catch {
    return false;
  }
}
