# Melon X Loyalty Checkout — Developer Handover Guide

A Shopify embedded app that integrates the **Melon Loyalty platform** directly into the Shopify checkout experience. It displays a loyalty widget on the checkout page and order confirmation page, lets customers redeem points as discounts, and applies those discounts via a Shopify Function.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture & File Structure](#2-architecture--file-structure)
3. [Prerequisites](#3-prerequisites)
4. [Shopify Account Setup (Start Here)](#4-shopify-account-setup-start-here)
5. [Environment & Configuration Setup](#5-environment--configuration-setup)
6. [Database Setup (Prisma + SQLite)](#6-database-setup-prisma--sqlite)
7. [Installing Dependencies](#7-installing-dependencies)
8. [Running the App](#8-running-the-app)
9. [Updating the Cloudflare Tunnel URL](#9-updating-the-cloudflare-tunnel-url)
10. [Shopify Admin Panel Configuration](#10-shopify-admin-panel-configuration)
11. [Connecting Melon Credentials](#11-connecting-melon-credentials)
12. [Extension Configuration Rules](#12-extension-configuration-rules)
13. [Understanding the Token Flow](#13-understanding-the-token-flow)
14. [Known Bug — Token Creation 500 Fix](#14-known-bug--token-creation-500-fix)
15. [Discount Function — How It Works](#15-discount-function--how-it-works)
16. [Verifying Discounts with GraphQL](#16-verifying-discounts-with-graphql)
17. [Checkout UI Extension — Component Map](#17-checkout-ui-extension--component-map)
18. [Shopify UI Component Rules (CRITICAL)](#18-shopify-ui-component-rules-critical)
19. [Bundle Size Limit (CRITICAL)](#19-bundle-size-limit-critical)
20. [Error Boundary](#20-error-boundary)
21. [Routing (React Router / Remix)](#21-routing-react-router--remix)
22. [Getting API Keys from Mubarak](#22-getting-api-keys-from-mubarak)
23. [Common Issues & Fixes](#23-common-issues--fixes)
24. [Shopify CLI Quick Reference](#24-shopify-cli-quick-reference)
25. [Summary Checklist for a New Developer](#25-summary-checklist-for-a-new-developer)

---

## 1. Project Overview

This project has **three main parts**:

| Part | Location | Purpose |
|---|---|---|
| **Shopify Embedded App** | `app/` | Admin panel for merchants to connect Melon credentials. Built with React Router (Remix-style). |
| **Checkout UI Extension** | `extensions/melon-x-checkout-ui/` | The loyalty widget rendered on the checkout page and thank-you page. Built with Shopify UI Extensions React. |
| **Discount Function** | `extensions/melonx-rewards-discount/` | A Shopify Function (WebAssembly) that applies the points-based discount at cart evaluation time. |

---

## 2. Architecture & File Structure

```
melon-x-loyalty-checkout-test/
├── app/
│   ├── routes/
│   │   ├── app._index.tsx              ← Merchant admin UI + auth entry point
│   │   ├── app.tsx                     ← Shopify App layout + auth wrapper
│   │   ├── api.melon-config.ts         ← Checkout calls this to get token + config
│   │   ├── api.refresh-melon-token.ts  ← Called when token expires mid-session
│   │   ├── auth.$.tsx                  ← Shopify OAuth callback handler
│   │   ├── auth.login/                 ← Login route
│   │   └── webhooks.app.*.tsx          ← Webhook handlers
│   ├── shopify.server.ts               ← Shopify app auth config
│   └── db.server.ts                    ← Prisma DB client
├── extensions/
│   ├── melon-x-checkout-ui/
│   │   ├── shopify.extension.toml      ← Extension config (uid, handle, targets)
│   │   └── src/
│   │       ├── Checkout.tsx            ← Main extension entry point
│   │       ├── components/             ← UI components per step/state
│   │       └── services/               ← API client, auth services, discount services
│   └── melonx-rewards-discount/
│       ├── shopify.extension.toml      ← Function config (uid, handle)
│       └── src/
│           ├── cart_lines_discounts_generate_run.ts      ← Discount logic
│           ├── cart_lines_discounts_generate_run.graphql ← Cart input query
│           └── cart_delivery_options_discounts_generate_run.ts
├── prisma/
│   └── schema.prisma                   ← SQLite DB schema
├── shopify.app.toml                    ← App-level Shopify config (client_id, scopes)
├── .env                                ← Local env vars (SHOPIFY_APP_URL, PORT)
└── package.json
```

---

## 3. Prerequisites

Before starting, make sure you have:

- **Node.js** `>=20.19 <22` or `>=22.12`
- **npm** (comes with Node)
- **Shopify CLI** installed globally:
  ```bash
  npm install -g @shopify/cli@latest
  ```
- A **Shopify Partner account**: https://partners.shopify.com
- A **Shopify Plus development store** (required for checkout extensibility)
- **Melon API credentials** — contact **Mubarak** to get:
  - `apiKeyID`
  - `apiKeySecret`
  - `merchantDomain` (e.g. `core.getmelon.co`)

---

## 4. Shopify Account Setup (Start Here)

### Step 1 — Create a Shopify Partner Account

1. Go to https://partners.shopify.com and sign up.
2. In the Partner Dashboard, go to **Apps** → **Create App** → **Create app manually**.
3. Name it (e.g. `melon-x-loyalty-checkout`).
4. Copy the **Client ID** — you will need it for `shopify.app.toml`.

### Step 2 — Create a Shopify Plus Development Store

1. In the Partner Dashboard, go to **Stores** → **Add store** → **Create development store**.
2. Select **"Create a store to test and build"**.
3. Under **Store purpose**, select **"I'm building an app for the Shopify App Store"**.
4. **CRITICAL**: Enable **Shopify Plus features** — checkout extensibility only works on Plus stores.

### Step 3 — Link the App to This Project

From the project root, run:

```bash
shopify app config link
```

When prompted, select the app you created in the Partner Dashboard. This will update `shopify.app.toml` with the correct `client_id`.

### Step 4 — Install the App on Your Development Store

```bash
shopify app dev
```

On first run, you will be prompted to select your development store. The CLI will generate a Cloudflare tunnel URL and install the app on the store automatically.

---

## 5. Environment & Configuration Setup

### `.env` file (project root)

```env
SHOPIFY_APP_URL=https://<your-cloudflare-tunnel>.trycloudflare.com
VITE_SHOPIFY_APP_URL=https://<your-cloudflare-tunnel>.trycloudflare.com
PORT=3456
```

> **IMPORTANT**: The `SHOPIFY_APP_URL` must be updated every time you restart `shopify app dev` because Cloudflare assigns a **new tunnel URL each session**. See [Section 9](#9-updating-the-cloudflare-tunnel-url).

### `shopify.app.toml` — Critical Fields

```toml
client_id = "<YOUR_APP_CLIENT_ID>"   ← Must match your Partner Dashboard app
name = "melon-x-loyalty-checkout-test"
application_url = "https://example.com"  ← Auto-updated by CLI on dev
embedded = true

[access_scopes]
scopes = "write_products,write_metaobjects,write_metaobject_definitions,write_discounts,write_payment_gateways,read_payment_gateways,write_payment_sessions,read_payment_sessions,read_customers,read_orders"
```

> The `application_url` is managed automatically by `automatically_update_urls_on_dev = true`. Do not manually edit it.

### `MELON_API_URL`

The Melon backend URL is read from the environment with a ngrok fallback in three files:

- `app/routes/app._index.tsx`
- `app/routes/api.melon-config.ts`
- `app/routes/api.refresh-melon-token.ts`

If the Melon backend URL changes, add it to `.env`:

```env
MELON_API_URL=https://<new-melon-backend-url>
```

---

## 6. Database Setup (Prisma + SQLite)

This app uses **SQLite** (local file `prisma/dev.sqlite`) as the database via Prisma ORM.

### Schema (`prisma/schema.prisma`)

```prisma
model Session {
  id            String    @id
  shop          String
  state         String
  isOnline      Boolean   @default(false)
  scope         String?
  expires       DateTime?
  accessToken   String
  userId        BigInt?
  ...
}

model ShopConnection {
  id               String   @id @default(cuid())
  shop             String   @unique
  merchantDomain   String
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  apiKeyID         String?
  apiKeySecret     String?
  apiToken         String?
  tokenType        String?
  tokenExpiresIn   Int?
  melonType        String?  @default("stack")
}
```

### Rules for Schema Changes

> **CRITICAL**: Any new field you want to store in the database MUST be defined in `prisma/schema.prisma` first. After any schema change, run both commands in order:

```bash
npx prisma generate      # Regenerates the Prisma client TypeScript types
npx prisma migrate dev   # Creates and applies a new SQL migration
```

For production deployment:

```bash
npx prisma migrate deploy
```

---

## 7. Installing Dependencies

### Root directory

```bash
npm install
```

### Checkout UI Extension

```bash
cd extensions/melon-x-checkout-ui
npm install
cd ../..
```

> **Bundle Size Rule**: Do NOT install any package that is not already present in `extensions/melon-x-checkout-ui/package.json`. Shopify enforces a **64 KB bundle size limit** for checkout extensions. Every byte counts. Only add lightweight, tree-shakeable packages if absolutely necessary. The discount function extension compiles to WebAssembly and has its own strict size constraints.

---

## 8. Running the App

```bash
shopify app dev
```

The CLI will:
1. Start the React Router server on the configured port.
2. Create a Cloudflare tunnel and print the tunnel URL in the terminal.
3. Start the checkout UI extension dev server.
4. Start the discount function extension watcher.

**After the server starts, use these keyboard shortcuts:**

| Key | Action |
|-----|--------|
| `p` | Open the app preview in the browser (your dev store) |
| `g` | Open GraphiQL — use this to run Admin API queries and verify discounts |
| `d` | View dev status |
| `a` | View app info |
| `s` | View store info |
| `q` | Quit |

---

## 9. Updating the Cloudflare Tunnel URL

Every time you run `shopify app dev`, a **new** Cloudflare tunnel URL is generated. You **must** update it in three places before the checkout widget can communicate with your backend:

### Place 1 — `.env` (project root)

```env
SHOPIFY_APP_URL=https://<NEW-TUNNEL-URL>.trycloudflare.com
VITE_SHOPIFY_APP_URL=https://<NEW-TUNNEL-URL>.trycloudflare.com
```

### Place 2 — `extensions/melon-x-checkout-ui/src/Checkout.tsx` (~line 172)

```tsx
const shopifyAppUrl = "https://<NEW-TUNNEL-URL>.trycloudflare.com"
```

This URL is used by the checkout extension to call `/api/melon-config` to fetch the Melon token and configuration. Without updating it, the checkout widget cannot reach the backend and will fail silently.

### Place 3 — Shopify Admin Extension Settings

1. Go to **Shopify Admin** → **Settings** → **Checkout** → **Customize**.
2. Click the Melon X block → **App settings**.
3. Update the `Shopify App URL` field with the new tunnel URL.
4. Save.

---

## 10. Shopify Admin Panel Configuration

### Enable Customer Account Access

1. Go to **Shopify Admin** → **Settings** → **Customer accounts**.
2. Enable **"New customer accounts"** — required for buyer identity in checkout extensions.

### Enable Network Access for the Extension

Network access is already declared in `extensions/melon-x-checkout-ui/shopify.extension.toml`:

```toml
[extensions.capabilities]
api_access = true
network_access = true
```

After running `shopify app dev` for the first time, Shopify will prompt you to approve these capabilities. You must accept or the extension cannot make any API calls.

### Add the Extension to the Checkout Page

1. Go to **Shopify Admin** → **Settings** → **Checkout** → **Customize**.
2. Click **Add block** → find **Melon X Checkout UI**.
3. Place it in the desired position on the checkout page.
4. In the block's settings panel, set `Shopify App URL` to your current Cloudflare tunnel URL.
5. Click **Save**.

---

## 11. Connecting Melon Credentials

1. Open the app (press `p` after `shopify app dev`, or navigate to the app inside your Shopify Admin).
2. You will see the **"Connect Melon"** page (`app/routes/app._index.tsx`).
3. Fill in:
   - **Melon Merchant Domain** — e.g. `core.getmelon.co` (get from Mubarak)
   - **API Key ID** — e.g. `apikey_01KTKMDNTX3G...` (get from Mubarak)
   - **API Key Secret** — get from Mubarak
4. Click **Connect Store**.

The app will:
1. Save credentials to the SQLite `ShopConnection` table.
2. Redirect to the Melon backend's OAuth install endpoint to register the store.
3. On the next page load, attempt to exchange the credentials for a Melon API token.
4. Store the token in the `ShopConnection` table for all future checkout requests.

---

## 12. Extension Configuration Rules

### `shopify.app.toml` vs `shopify.extension.toml` — They Must Match

The `uid`, `handle`, and `type` values in both extension `.toml` files must match **exactly** what is registered in your Shopify Partner Dashboard under your app's extensions.

**If you re-create the app from scratch:**

1. Run `shopify app dev` — the CLI registers the extensions and auto-generates new UIDs.
2. The CLI will automatically update the `uid` values in the `.toml` files.
3. Do NOT manually copy UIDs from another developer's account — they are account-specific.

### Checkout UI Extension TOML

```toml
[[extensions]]
name = "melon-x-checkout-ui"
handle = "melon-x-checkout-ui"                          ← Must match Partner Dashboard
type = "ui_extension"
uid = "1bdfef1e-e15d-a8b9-3b2c-0338e467164887e3e8ac"    ← Auto-generated, do not copy

[[extensions.targeting]]
module = "./src/Checkout.tsx"
target = "purchase.checkout.block.render"               ← Checkout page

[[extensions.targeting]]
module = "./src/Checkout.tsx"
target = "purchase.thank-you.block.render"              ← Order confirmation page

[extensions.capabilities]
api_access = true
network_access = true                                   ← MUST be true or no API calls work
```

### Discount Function TOML

```toml
[[extensions]]
handle = "melonx-rewards-discount"                      ← Must match Partner Dashboard
type = "function"
uid = "1598508d-0b1c-9d81-4bc8-fe7a3291f6a35c4ad3ef"   ← Auto-generated, do not copy
```

---

## 13. Understanding the Token Flow

The Melon API token is required for every checkout API call. Here is the complete flow:

```
1. Merchant opens the app (app._index.tsx loader)
   → If credentials exist but no token → calls POST /checkout/api/token/create
   → Saves the token to ShopConnection in the DB

2. Customer reaches checkout page (Checkout.tsx useEffect)
   → Calls GET /api/melon-config?shop=<storeDomain>
   → api.melon-config.ts returns the saved token from DB
   → If no token in DB → calls POST /checkout/api/token/create and saves it

3. Token expires during the customer's session
   → api.ts detects a 401 response from the Melon API
   → Automatically calls POST /api/refresh-melon-token
   → api.refresh-melon-token.ts calls POST /checkout/api/token/create
   → Updates DB and returns the fresh token to the extension
```

---

## 14. Known Bug — Token Creation 500 Fix

> **This bug is documented here so the next developer can apply the fix.**

**Problem**: The Melon backend's `/checkout/api/token/create` endpoint returns HTTP 500.

**Root cause**: The `merchantDomain` field is stored in the `ShopConnection` DB record but is **not being sent** in the POST request body when creating or refreshing the token. The Melon API requires it to identify the merchant.

**Files that need to be fixed** (the same change in all three files):

1. `app/routes/app._index.tsx` (~line 37)
2. `app/routes/api.melon-config.ts` (~line 66)
3. `app/routes/api.refresh-melon-token.ts` (~line 38)

**Change** — in each file, add `merchantDomain` to the POST body:

```ts
// BEFORE (broken)
body: JSON.stringify({
  apiKeyId: connection.apiKeyID,
  apiKeySecret: connection.apiKeySecret,
  storeDomain: shop,
}),

// AFTER (fixed)
body: JSON.stringify({
  apiKeyId: connection.apiKeyID,
  apiKeySecret: connection.apiKeySecret,
  storeDomain: shop,
  merchantDomain: connection.merchantDomain,  // ← ADD THIS
}),
```

---

## 15. Discount Function — How It Works

The discount function (`extensions/melonx-rewards-discount/`) is a Shopify Function compiled to WebAssembly. It runs server-side inside Shopify's infrastructure and **cannot make network calls**.

**Flow — how points become a discount:**

1. The checkout UI extension writes cart attributes via `useApplyAttributeChange`:
   - `melonx_points` — number of points the customer wants to redeem
   - `melonx_voucher_code` — the voucher code returned by the Melon backend
   - `melonx_discount_amount` — the monetary discount value in the cart currency

2. The GraphQL input query (`cart_lines_discounts_generate_run.graphql`) reads these cart attributes.

3. The function logic (`cart_lines_discounts_generate_run.ts`) reads the values and generates a `fixedAmount` order-level discount, capped at the cart subtotal.

4. Shopify applies the discount automatically at checkout.

**The discount function is activated by a Shopify Automatic Discount** linked to the function via the Admin API or Partner Dashboard. You must create this discount — see [Section 16](#16-verifying-discounts-with-graphql).

---

## 16. Verifying Discounts with GraphQL

After running `shopify app dev`, press `g` to open GraphiQL.

**Check if a discount linked to the function exists:**

```graphql
{
  discountNodes(first: 10) {
    edges {
      node {
        id
        discount {
          ... on DiscountAutomaticApp {
            title
            status
            appDiscountType {
              functionId
              title
            }
          }
        }
      }
    }
  }
}
```

**Create a discount linked to the function (if it does not exist):**

```graphql
mutation {
  discountAutomaticAppCreate(automaticAppDiscount: {
    title: "Melon X Rewards Discount"
    functionId: "gid://shopify/ShopifyFunction/<YOUR_FUNCTION_ID>"
    startsAt: "2024-01-01T00:00:00Z"
    combinesWith: {
      orderDiscounts: true
      productDiscounts: true
      shippingDiscounts: true
    }
  }) {
    automaticAppDiscount {
      discountId
    }
    userErrors {
      field
      message
    }
  }
}
```

Replace `<YOUR_FUNCTION_ID>` with the function's GID found from the first query above.

---

## 17. Checkout UI Extension — Component Map

```
Checkout.tsx
├── ExtensionErrorBoundary          ← Catches all React errors; logs to browser console
│
├── MelonXCheckout                  ← Main checkout widget (purchase.checkout.block.render)
│   ├── LoyaltyStep                 ← Phone number entry          (step = 'loyalty')
│   ├── OtpStep                     ← OTP verification            (step = 'otp')
│   ├── CreateCustomerStep          ← New customer registration   (step = 'create-customer')
│   ├── RewardsStep                 ← Points redemption UI        (step = 'rewards')
│   ├── Joined                      ← New customer just joined    (step = 'joined')
│   ├── ExistingUserWithZeroPoints  ← Existing user, 0 points
│   ├── MelonCoreExistingUser       ← Melon Core flow, existing user
│   ├── MelonCoreNewUser            ← Melon Core flow, new user
│   └── MelonCoreRedirect           ← Redirect component for Melon Core
│
└── MelonXThankYouRewards           ← Order confirmation page (purchase.thank-you.block.render)
```

**`melonType`** controls which UI branch is shown:
- `"stack"` → Melon Stack flow (standard loyalty programme)
- `"core"` → Melon Core flow (different branding and behaviour)

Both new and existing customers have distinct conditional rendering paths inside each step component.

---

## 18. Shopify UI Component Rules (CRITICAL)

Shopify Checkout Extensions run in a **restricted sandboxed environment**. Standard web technologies are NOT allowed inside extension code.

### NEVER use inside `extensions/melon-x-checkout-ui/`:
- HTML elements: `<div>`, `<span>`, `<p>`, `<h1>`, etc.
- Inline `style={{}}` CSS objects
- CSS files or CSS modules
- `axios` — use native `fetch` only
- `zod` — too heavy; write manual validation (see `services/auth/schema.ts`)
- `html`, standard DOM APIs

### ALWAYS use Shopify UI Extension components:

```tsx
import {
  BlockStack,
  InlineStack,
  View,
  Text,
  Banner,
  Button,
  Image,
  Link,
} from '@shopify/ui-extensions-react/checkout';
```

### Shopify custom style attributes (not CSS):

```tsx
<View padding="base" border="base" borderRadius="base" background="subdued">
  <Text size="large" emphasis="bold" appearance="success">Hello</Text>
  <BlockStack spacing="tight">
    <Text appearance="subdued">Secondary text</Text>
  </BlockStack>
</View>
```

### In admin routes only (`app/routes/app._index.tsx`):

Shopify Admin UI web components are allowed here:

```tsx
<s-page>
<s-section>
<s-text-field>
<s-button>
<s-paragraph>
```

---

## 19. Bundle Size Limit (CRITICAL)

Shopify enforces a **64 KB maximum bundle size** for checkout UI extensions.

Rules:
- Do NOT install any package not already in `extensions/melon-x-checkout-ui/package.json`.
- If you must add a dependency, verify it is lightweight and tree-shakeable.
- Run `shopify app build` and check the output bundle size before deploying.
- The discount function (WebAssembly) also has separate size constraints — keep the TypeScript logic minimal and avoid any imports that pull in large libraries.

If the bundle exceeds 64 KB, **the extension will not load in the checkout at all**.

---

## 20. Error Boundary

`ExtensionErrorBoundary` in `Checkout.tsx` wraps the entire checkout widget and catches any React render errors. On error, it displays a Shopify `Banner` with `status="critical"` and logs the full stack trace to the **browser console**.

**If the checkout widget appears blank or broken:**

1. Open browser DevTools → **Console** tab.
2. Look for `"Melon X checkout extension crashed:"` error messages.
3. The message will tell you exactly what failed (missing token, network error, etc.).

---

## 21. Routing (React Router / Remix)

This app uses **React Router v7** in Remix framework mode. Shopify uses Remix-style file-based routing.

| Route file | URL path | Purpose |
|---|---|---|
| `app/routes/_index/route.tsx` | `/` | Root redirect |
| `app/routes/app.tsx` | `/app` | Shopify auth wrapper layout |
| `app/routes/app._index.tsx` | `/app` (index) | Merchant dashboard — credential entry point |
| `app/routes/app.additional.tsx` | `/app/additional` | Secondary admin page |
| `app/routes/auth.$.tsx` | `/auth/*` | Shopify OAuth callback handler |
| `app/routes/auth.login/route.tsx` | `/auth/login` | Login page |
| `app/routes/api.melon-config.ts` | `/api/melon-config` | Checkout config endpoint (public, CORS-enabled) |
| `app/routes/api.refresh-melon-token.ts` | `/api/refresh-melon-token` | Token refresh endpoint (public, CORS-enabled) |
| `app/routes/webhooks.app.uninstalled.tsx` | `/webhooks/app/uninstalled` | App uninstall webhook handler |
| `app/routes/webhooks.app.scopes_update.tsx` | `/webhooks/app/scopes_update` | Scopes update webhook handler |

> `app/routes/app._index.tsx` is the **entry point** of the admin app. Authentication (`authenticate.admin(request)`) runs here via `shopify.server.ts`. On first visit from a new store, it automatically redirects through Shopify OAuth before rendering the page.

---

## 22. Getting API Keys from Mubarak

Contact **Mubarak** to obtain the following credentials for your environment:

| Credential | Description | Example |
|---|---|---|
| `merchantDomain` | Your Melon merchant domain | `core.getmelon.co` |
| `apiKeyID` | Melon API Key ID | `apikey_01KTKMDNTX3G...` |
| `apiKeySecret` | Melon API Key Secret | `DL28Yolkclal1SR_...` |

Enter these in the **Connect Melon** page inside the Shopify app after installation.

---

## 23. Common Issues & Fixes

### "LOADER TOKEN RESPONSE: 500 Internal server error"

The Melon backend `/checkout/api/token/create` is failing because `merchantDomain` is missing from the request body. Apply the fix in [Section 14](#14-known-bug--token-creation-500-fix).

### Checkout widget does not appear on the checkout page

1. Confirm the extension is added and enabled in **Shopify Admin → Checkout → Customize**.
2. Confirm `network_access = true` is set in `shopify.extension.toml`.
3. Confirm the `Shopify App URL` setting in the extension block matches the current tunnel URL.
4. Confirm the Cloudflare tunnel URL is updated in `.env` and `Checkout.tsx`.
5. Check the browser console for `ExtensionErrorBoundary` error messages.

### "Redirecting to install" loop

The Shopify session is not persisting or the OAuth callback is failing. Check:
- `shopify.app.toml` `client_id` matches your Partner Dashboard app exactly.
- The app is properly installed on the development store.
- Try running `shopify app dev` fresh and reinstalling via the prompted URL.

### Prisma client errors on startup

```bash
npx prisma generate
npx prisma migrate dev
```

### Extension not updating after a code change

The dev server watches for changes automatically. If it stops responding, restart `shopify app dev`.

### Token is missing after a fresh install

This is expected — the token is only created after the merchant enters credentials in the admin UI. After submitting the Connect Melon form, the app redirects to the Melon install endpoint. The token is then generated on the next page load.

### Extension shows "Melon not connected" banner

The `ShopConnection` record for the store either does not exist or is missing `apiKeyID`/`apiKeySecret`. Go back to the app admin page and re-enter the Melon credentials.

---

## 24. Shopify CLI Quick Reference

```bash
# Start development server — run this every session
shopify app dev

# Link this project to an existing Shopify app in the Partner Dashboard
shopify app config link

# Deploy extensions and the app config to production
shopify app deploy

# Generate a new extension (e.g. a new function or UI block)
shopify app generate extension

# Switch between configuration files if multiple exist
shopify app config use

# View or set environment variables
shopify app env

# Show app info (client ID, extensions, URLs)
shopify app info
```

---

## 25. Summary Checklist for a New Developer

Work through these steps in order:

- [ ] Create a Shopify Partner account at https://partners.shopify.com
- [ ] Create a new app in the Partner Dashboard and copy the Client ID
- [ ] Create a Shopify Plus development store (Plus plan required for checkout extensions)
- [ ] Clone this repository
- [ ] Run `npm install` in the project root
- [ ] Run `npm install` inside `extensions/melon-x-checkout-ui/`
- [ ] Run `npx prisma generate && npx prisma migrate dev` to set up the database
- [ ] Run `shopify app config link` to link the project to your Partner Dashboard app
- [ ] Run `shopify app dev` and select your development store
- [ ] Copy the Cloudflare tunnel URL from the terminal output
- [ ] Update `.env` with the new tunnel URL (`SHOPIFY_APP_URL` and `VITE_SHOPIFY_APP_URL`)
- [ ] Update `extensions/melon-x-checkout-ui/src/Checkout.tsx` line ~172 with the new tunnel URL
- [ ] Press `p` to open the app, then enter Melon credentials (from Mubarak) and click Connect Store
- [ ] In Shopify Admin → Checkout → Customize, add the Melon X block and set the App URL
- [ ] In Shopify Admin → Settings → Customer accounts, enable "New customer accounts"
- [ ] Apply the token creation bug fix described in [Section 14](#14-known-bug--token-creation-500-fix)
- [ ] Press `g` in the CLI terminal to open GraphiQL and verify the discount function is registered
- [ ] Create an automatic discount linked to the function if it does not already exist (see [Section 16](#16-verifying-discounts-with-graphql))
- [ ] Test the full flow: add an item to cart → reach checkout → enter phone number → verify OTP → redeem points → confirm discount is applied
