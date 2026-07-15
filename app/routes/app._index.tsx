
import { Form, useLoaderData, redirect } from "react-router";


import type {
  LoaderFunctionArgs,
  ActionFunctionArgs,
  HeadersFunction,
} from "react-router";

import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";

const MELON_API_URL = process.env.MELON_API_URL || "https://api-plugin.getmelon.co"; 

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const originalQueryString = new URL(request.url).search.slice(1);

  const statusRes = await fetch(
    `${MELON_API_URL}/shopify/auth/status?shop=${encodeURIComponent(shop)}`
  );
  const status = await statusRes.json();
  console.log("Melon status for", shop, JSON.stringify(status));

  // credentials submitted, token not captured yet → silent OAuth hop
  if (!status.connected && status.pendingInstall) {
    throw redirect(
      `${MELON_API_URL}/shopify/auth/entry${originalQueryString ? `?${originalQueryString}` : ""}`
    );
  }

  return {
    shop,
    melonApiUrl: MELON_API_URL,
    connected: !!status.connected,
    merchantDomain: status.merchantDomain ?? "",
    apiKeyID: status.apiKeyID ?? "",
  };
}; 

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();

  const params = new URLSearchParams({
    shop: session.shop,
    merchantDomain: formData.get("merchantDomain")?.toString().trim() || "",
    apiKeyID: formData.get("apiKeyID")?.toString().trim() || "",
    apiKeySecret: formData.get("apiKeySecret")?.toString().trim() || "",
  });

  return redirect(`${MELON_API_URL}/shopify/auth/install?${params}`);
};



export default function Index() {
  const { shop, melonApiUrl, connected, merchantDomain, apiKeyID } =
    useLoaderData<typeof loader>();

    if (connected && merchantDomain) {
      return (
      <s-page heading="Connect Melon">
        <s-section>
          <s-paragraph>Store connected</s-paragraph>
          <s-paragraph>Shopify store: {shop}</s-paragraph>
          {merchantDomain && (
            <s-paragraph>Melon domain: {merchantDomain}</s-paragraph>
          )}
        </s-section>
      </s-page>
    );
  }

  return (
    <s-page heading="Connect Melon">
      <s-section>
        <s-paragraph>Shopify store: {shop}</s-paragraph>

        <Form method="post" target="_top" reloadDocument>

          <input type="hidden" name="shop" value={shop} />

          <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "400px" }}>
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
              Your Melon Loyalty account domain and API keys can be found in your Melon dashboard.
            </s-paragraph>
            <s-button type="submit">Connect Store</s-button>
          </div>
          </Form> 
      </s-section>
    </s-page>
  );    
}   

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};



