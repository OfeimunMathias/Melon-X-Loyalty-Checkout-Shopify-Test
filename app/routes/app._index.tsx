
import {
  Form,
  useActionData,
  useLoaderData,
  redirect,
} from "react-router";

import type {
  LoaderFunctionArgs,
  ActionFunctionArgs,
  HeadersFunction,
} from "react-router";

import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import db from "../db.server";

const MELON_API_URL = "https://api-plugin.getmelon.co";

export function extractTokenData(tokenJson: any) {
  const data = tokenJson?.data ?? {};
const inner = tokenJson?.data?.data ?? {};

  return {
    apiToken:
    tokenJson.token ||
    data.token ||
    inner.token,

    tokenType:
      data.tokenType || data.token_type || "",

    expiresIn:
      data.expiresIn || data.expires_in || null,

    melonType:
      data.melonType ?? data?.data?.melonType ?? "stack",
  };
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const connected = await db.shopConnection.findUnique({ where: { shop } });
  return {
    shop,
    merchantDomain: connected?.merchantDomain ?? "",
    apiKeyID: connected?.apiKeyID ?? "",
    connected: !!connected?.apiKeyID,
    tokenReady: false,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const formData = await request.formData();
  const merchantDomain = formData.get("merchantDomain")?.toString().trim() || "";
  const apiKeyID = formData.get("apiKeyID")?.toString().trim() || "";
  const apiKeySecret = formData.get("apiKeySecret")?.toString().trim() || "";

  if (!merchantDomain) return { error: "Merchant domain is required" };
  if (!apiKeyID) return { error: "API Key ID is required" };
  if (!apiKeySecret) return { error: "API Key Secret is required" };

  // Save credentials first (no token yet)
  await db.shopConnection.upsert({
    where: { shop },
    update: {
      merchantDomain,
      apiKeyID,
      apiKeySecret,
      apiToken: null,      // ✅ force token recreation
      melonType: null,     // ✅ force melonType refresh
      tokenType: null,
      tokenExpiresIn: null,
    },
    create: { shop, merchantDomain, apiKeyID, apiKeySecret },
  });

  // Redirect to install — backend will install app, then callback
  const params = new URLSearchParams({ shop, merchantDomain, apiKeyID, apiKeySecret });
  const oauthUrl = `${MELON_API_URL}/shopify/auth/install?${params.toString()}`;

  console.log("Redirecting to install:", oauthUrl);
  return redirect(oauthUrl);
};


export default function Index() {
  const { shop, merchantDomain, apiKeyID } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <s-page heading="Connect Melon">
      <s-section>
        <s-paragraph>Shopify store: {shop}</s-paragraph>

        {merchantDomain && (
          <s-paragraph>Current Melon domain: {merchantDomain}</s-paragraph>
        )}

        <Form method="post" target="_top" reloadDocument>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              maxWidth: "400px",
            }}
          >
            <s-text-field
              name="merchantDomain"
              label="Melon Merchant Domain"
              placeholder="ocean-loyalty.melonstack.app"
              defaultValue={merchantDomain}
            />

            <s-text-field
              name="apiKeyID"
              label="API Key ID"
              placeholder="Enter API Key ID"
              defaultValue={apiKeyID}
            />

            <s-text-field
              name="apiKeySecret"
              label="API Key Secret"
              placeholder="Enter API Key Secret"
              type="password"
            />

            <s-paragraph>
              Your Melon Loyalty account domain and API keys can be found in your
              Melon dashboard.
            </s-paragraph>

            <s-button type="submit">Connect Store</s-button>

            {actionData?.error && (
              <p style={{ color: "red" }}>{actionData.error}</p>
            )}
          </div>
        </Form>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};



