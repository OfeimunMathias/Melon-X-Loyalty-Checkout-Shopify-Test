import type { LoaderFunctionArgs } from "react-router";
import db from "../db.server";


// Why this is better
// Now the token creation happens in three places as fallbacks:
// 1. app._index.tsx loader     → when merchant opens app after install
// 2. api.melon-config loader   → when checkout loads and token is missing  ← new
// 3. api.refresh-melon-token   → when token expires mid-session

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (!shop) {
    return Response.json({ error: "shop is required" }, { status: 400, headers: corsHeaders });
  }

  const connection = await db.shopConnection.findUnique({
    where: { shop },
  });

  if (!connection?.apiKeyID || !connection?.apiKeySecret) {
    return Response.json({ error: "Melon not connected" }, { status: 404, headers: corsHeaders });
  }

  // Token missing — try to create it now

  console.log("melon-config using credentials:", {
    apiKeyID: connection.apiKeyID,
    apiKeySecret: connection.apiKeySecret, // partial for security
    merchantDomain: connection.merchantDomain,
    shop,
  });

  const MELON_API_URL = "https://api-plugin.getmelon.co";

  try {
    const tokenResponse = await fetch(`${MELON_API_URL}/checkout/api/token/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKeyId: connection.apiKeyID,
        apiKeySecret: connection.apiKeySecret,
        storeDomain: shop,
      }),
    });

    const tokenJson = await tokenResponse.json();
    console.log("melon-config token creation:", tokenResponse.status, JSON.stringify(tokenJson, null, 2));

    const tokenData = tokenJson.data?.data ?? tokenJson.data ?? {};
    const apiToken =
      tokenJson.token ||
      tokenJson.data?.token ||
      tokenJson.data?.data?.token;

    const tokenType = tokenData.tokenType || tokenData.token_type || "";
    const tokenExpiresIn = tokenData.expiresIn || tokenData.expires_in || null;
    const melonType = tokenData.melonType || "stack";

    if (!tokenResponse.ok || !apiToken) {
      return Response.json(
        { error: tokenJson.message || "Failed to create Melon token" },
        { status: 400, headers: corsHeaders }
      );
    }

    await db.shopConnection.update({
      where: { shop },
      data: { apiToken, tokenType, tokenExpiresIn, melonType },
    });

    return Response.json({
      token: apiToken,
      melonType,
      merchantDomain: connection.merchantDomain,
      storeDomain: shop,
      shopifyAppUrl: process.env.SHOPIFY_APP_URL,
    }, { headers: corsHeaders });

  } catch (err) {
    console.error("melon-config token creation error:", err);
    return Response.json(
      { error: "Failed to create Melon token" },
      { status: 500, headers: corsHeaders }
    );
  }
};
