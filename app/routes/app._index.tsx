

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

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  const connected = await db.shopConnection.findUnique({
    where: { shop: session.shop },
  });

  return {
    shop: session.shop,
    merchantDomain: connected?.merchantDomain ?? "",
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const formData = await request.formData();
  const merchantDomain = formData.get("merchantDomain")?.toString().trim() || "";

  if (!merchantDomain) {
    return {
      error: "Merchant domain is required",
    };
  }

  await db.shopConnection.upsert({
    where: { shop },
    update: { merchantDomain },
    create: { shop, merchantDomain },
  });

  const oauthUrl = `https://leon-trigraphic-overelegantly.ngrok-free.dev/shopify/auth/install?shop=${encodeURIComponent(
    shop,
  )}&merchantDomain=${encodeURIComponent(merchantDomain)}`;

  return redirect(oauthUrl);
};

export default function Index() {
  const { shop, merchantDomain } = useLoaderData<typeof loader>();
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
           <s-paragraph>Your Melon Loyalty account domain. Find this in your Melon dashboard under Settings → Store.</s-paragraph>
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


