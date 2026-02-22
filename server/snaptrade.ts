import { Snaptrade } from "snaptrade-typescript-sdk";

let snaptradeClient: Snaptrade | null = null;

export function getSnaptradeClient(): Snaptrade {
  if (!snaptradeClient) {
    const consumerKey = process.env.SNAPTRADE_CONSUMER_KEY;
    const clientId = process.env.SNAPTRADE_CLIENT_ID;
    if (!consumerKey || !clientId) {
      throw new Error("SNAPTRADE_CONSUMER_KEY and SNAPTRADE_CLIENT_ID must be set");
    }
    snaptradeClient = new Snaptrade({ consumerKey, clientId });
  }
  return snaptradeClient;
}

export async function registerSnaptradeUser(userId: string): Promise<string> {
  const client = getSnaptradeClient();
  const response = await client.authentication.registerSnapTradeUser({ userId });
  return response.data.userSecret!;
}

export async function getSnaptradeLoginUrl(userId: string, userSecret: string, redirectUri: string): Promise<string> {
  const client = getSnaptradeClient();
  const response = await client.authentication.loginSnapTradeUser({
    userId,
    userSecret,
    customRedirect: redirectUri,
  });
  return (response.data as any).redirectURI!;
}

export async function getUserHoldings(userId: string, userSecret: string) {
  const client = getSnaptradeClient();
  const response = await client.accountInformation.getAllUserHoldings({
    userId,
    userSecret,
  });
  return response.data;
}

export async function getUserAccounts(userId: string, userSecret: string) {
  const client = getSnaptradeClient();
  const response = await client.accountInformation.listUserAccounts({
    userId,
    userSecret,
  });
  return response.data;
}

export async function deleteSnaptradeUser(userId: string) {
  const client = getSnaptradeClient();
  await client.authentication.deleteSnapTradeUser({ userId });
}
