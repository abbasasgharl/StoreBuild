# Velora Commerce — Complete Application Blueprint & Technical Documentation
**Version:** 2.0.0 | **Architecture:** Multi-Tenant D2C Platform & Governance Engine | **Date:** October 2026

---

## 1. Executive Summary & Core Platform Thesis

**Velora Commerce** is an enterprise-grade, multi-tenant Direct-to-Consumer (D2C) e-commerce infrastructure built specifically for independent entrepreneurs, craft ateliers, boutique fashion houses, and lifestyle creators.

### Core Value Proposition
1. **Subdomain/Slug Storefronts:** Instant branded shops hosted at `platform.com/{storeSlug}` with zero technical friction.
2. **Contextual WhatsApp-First Ordering:** Frictionless purchase initiation where customers click "Order on WhatsApp", creating an automatic database customer record, dedicated order reference (`ORD-*`), contextual enquiry ID (`WA-ENQ-*`), and a server-verified checkout link (`/checkout/ORD-*`).
3. **Transparent 10% Commercial Model:** Clear, server-authoritative 10% platform fee calculation (`CustomerPrice = Math.round(SellerPrice / 0.90)`), ensuring sellers keep 100% of their intended listing price while buyers pay standard retail value with transparent breakdowns.
4. **Automated Weekly Settlements with Return Hold Protection:** Weekly payout cycles (T+7 / T+0) with automated reserves for active returns, shielding the platform and merchants from settlement shortfalls.
5. **Fail-Closed Security & Governance:** Cryptographic scrypt password hashing, session tokens (`sb_sess_*`), TOTP 2FA admin authentication portal, and a bounded Co-Worker Agent with human-in-the-loop approval queues and an emergency kill switch.

---

## 2. System Architecture & Tech Stack

```
+-----------------------------------------------------------------------------------+
|                                  CLIENT LAYER                                     |
|  +-----------------------+  +------------------------+  +----------------------+  |
|  |  Public Storefronts   |  |   Seller Workspace     |  |    Admin Governance  |  |
|  |  (React 18 / Tailwind)|  |   (/app/dashboard, etc)|  |    (/admin Console)  |  |
|  +-----------+-----------+  +-----------+------------+  +-----------+----------+  |
+--------------|--------------------------|---------------------------|-------------+
               |                          |                           |
               | (HTTPS / REST)           | (Bearer Token)            | (Admin 2FA)
               v                          v                           v
+-----------------------------------------------------------------------------------+
|                                  SERVER LAYER                                     |
|  Express.js (ESM with CommonJS-safe types) + Vite Dev Server Integration         |
|  +-----------------------------------------------------------------------------+  |
|  | Middlewares:                                                                |  |
|  |  - JSON body parser (6MB limit for high-res catalog assets)                 |  |
|  |  - In-memory read cache (TTL 15s, invalidated on non-GET mutations)         |  |
|  |  - authGuard (Bearer token -> SHA256 -> session store lookup)               |  |
|  |  - adminGuard (fail-closed role === 'admin' verification)                   |  |
|  +-----------------------------------------------------------------------------+  |
|  | Core Controllers:                                                           |  |
|  |  - Public Catalog & WhatsApp Order Dispatcher                               |  |
|  |  - Gateway Webhook Ingestion & Idempotency Engine                           |  |
|  |  - Seller Tenant Workspace & Product Management                             |  |
|  |  - Financial Ledger & Weekly Payout Automation                              |  |
|  |  - Customer Returns / Exchange Dispute Engine                               |  |
|  |  - Platform SEO, Robots.txt, Sitemap.xml & Ads.txt Generator                |  |
|  |  - Bounded Operations Co-Worker Agent (Safe Tools + Approval Queue)         |  |
|  +-----------------------------------------------------------------------------+  |
+---------------------------------------+-------------------------------------------+
                                        |
                                        v
+-----------------------------------------------------------------------------------+
|                               PERSISTENCE LAYER                                   |
|  PostgreSQL Database via Drizzle ORM (Strict relational integrity)                |
|  - Users & Sessions (Salted scrypt, SHA-256 tokens)                              |
|  - Stores & Seller Profiles (GST, Bank details, WhatsApp configs)                |
|  - Products, Variants & Image Crop Positioning                                    |
|  - Customers, Orders, Order Items & Webhook Payments                              |
|  - Wallets, Financial Ledgers & Weekly Payouts                                    |
|  - Returns, Exchanges & Wallet Hold Management                                    |
|  - Multi-Tenant Payment Gateways (Razorpay, Cashfree, UPI Direct, Stripe)         |
|  - Support Tickets (Buyer-to-Seller & Seller-to-Admin)                            |
|  - Agent Actions, Audit Logs & System Notifications                               |
+-----------------------------------------------------------------------------------+
```

### Technology Highlights
- **Runtime & Language:** Node.js, TypeScript (Strict mode enabled, zero `any` leaks in core paths).
- **Backend Framework:** Express.js (`import type express from 'express'` pattern eliminating CommonJS/ESM named export collisions).
- **Database & ORM:** PostgreSQL managed through Drizzle ORM schemas.
- **Frontend Framework:** React 18 SPA with React Router DOM v6, Tailwind CSS, and Lucide React icons.
- **Authentication:** Dual-mode auth engine supporting internal high-entropy cryptographic sessions (`sb_sess_*`) stored as SHA-256 digests in PostgreSQL alongside Firebase Admin ID token verification.

---

## 3. Database Schema Blueprint

### 3.1. Authentication & Security Tables
- **`users`**
  - `id` (serial primary key)
  - `uid` (varchar 64 unique, e.g., `seller-velora-uid`, `admin-console-root`)
  - `username` (varchar 64 unique)
  - `email` (varchar 128 unique)
  - `passwordHash` (varchar 256, salted scrypt)
  - `passwordSalt` (varchar 64)
  - `fullName`, `mobile`, `role` (`seller` | `admin` | `buyer` | `agent`)
  - `status` (`active` | `suspended` | `pending_verification`)
  - `twoFactorVerified` (boolean)
  - `twoFactorSecret` (varchar 64, base32 TOTP key)
  - `failedLoginAttempts` (integer)
  - `lastLoginAt`, `createdAt`, `updatedAt`

- **`sessions`**
  - `id` (serial primary key)
  - `sessionTokenHash` (varchar 64 unique, SHA-256 digest of `sb_sess_*`)
  - `userUid` (varchar 64)
  - `role` (varchar 32)
  - `expiresAt` (timestamp)
  - `revokedAt` (timestamp, nullable for immediate session invalidation)

### 3.2. Merchant & Storefront Tables
- **`stores`**
  - `id` (serial primary key)
  - `uid` (foreign key to `users.uid`)
  - `name`, `slug` (unique, e.g., `velora`, `arastudio`)
  - `tagline`, `about`
  - `whatsappNumber` (e.g., `919820144910`)
  - `contactEmail`, `contactPhone`
  - `shippingPolicy`, `returnPolicy`, `returnWindowDays` (default 7 days)
  - `flatShippingRate`, `freeShippingThreshold`
  - `isPublished` (boolean)

- **`storeBrandings`**
  - `id` (serial primary key)
  - `storeId` (integer foreign key)
  - `primaryColor` (hex, e.g., `#2563EB`)
  - `secondaryColor` (hex, e.g., `#111827`)
  - `buttonStyle` (`pill` | `rounded` | `square`)
  - `cardStyle` (`minimal` | `bordered` | `elevated`)
  - `fontFamily` (`Inter` | `Playfair Display` | `Plus Jakarta Sans`)
  - `logoUrl`, `heroBannerUrl`
  - `logoCropJson`, `bannerCropJson` (object crop positioning coordinates)

- **`products`**
  - `id` (serial primary key)
  - `storeId`, `sellerUid`
  - `title`, `slug`, `sku`, `category`, `description`
  - `sellerPrice` (integer, e.g., 4500)
  - `platformFeePercent` (integer, default 10)
  - `customerPrice` (integer, e.g., 4950)
  - `stock` (integer)
  - `variantsJson` (serialized array, e.g., `["XS / Ivory", "S / Ivory", "M / Ivory"]`)
  - `weightGrams`, `shippingNotes`, `returnExchangePolicy`
  - `status` (`Draft` | `Published` | `Archived`)
  - `primaryImageUrl`, `imageCropPosition` (`center` | `top` | `bottom`)

### 3.3. Commerce, Orders & Payments
- **`customers`**
  - `id` (serial primary key)
  - `storeId`
  - `fullName`, `phone`, `email`, `addressLine`, `city`, `state`, `pincode`
  - `ordersCount`, `totalSpent`

- **`orders`**
  - `id` (serial primary key)
  - `orderRef` (varchar 32 unique, e.g., `ORD-84910`)
  - `storeId`, `sellerUid`, `customerId`
  - `customerName`, `customerPhone`, `customerEmail`, `shippingAddress`
  - `sellerSubtotal`, `platformFeeTotal`, `shippingAmount`, `customerTotalPayable`
  - `orderState` (`Payment Pending` | `Paid` | `Processing` | `Dispatched` | `Completed` | `Cancelled`)
  - `whatsappEnquiryRef` (e.g., `WA-ENQ-6227`)
  - `courierName`, `trackingNumber`, `trackingUrl`

- **`payments`**
  - `id` (serial primary key)
  - `orderId`, `storeId`, `gateway`
  - `gatewayOrderId`, `gatewayPaymentId`, `idempotencyKey`
  - `amountPaid`, `status` (`pending` | `authorized` | `captured` | `failed` | `refunded`)
  - `verifiedByWebhook` (boolean, server-authoritative)

### 3.4. Wallet, Ledger & Weekly Settlements
- **`wallets`**
  - `id`, `storeId`, `sellerUid`
  - `availableBalance` (cleared funds ready for payout)
  - `pendingBalance` (funds from orders within return window)
  - `heldBalance` (reserve funds held for open customer returns)
  - `paidOutBalance` (historical total disbursed)
  - `lifetimeEarnings`
  - `isOnHold`, `holdReason`

- **`ledger`**
  - `id`, `walletId`, `orderId`, `payoutId`
  - `entryType` (`credit_order` | `debit_fee` | `hold_return` | `release_hold` | `debit_payout`)
  - `amount`, `balanceAfter`, `description`, `referenceId`

- **`payouts`**
  - `id`, `payoutRef` (e.g., `PAY-48185`)
  - `storeId`, `sellerUid`
  - `amountGross`, `platformFeeDeducted`, `returnHoldDeducted`, `netDisbursed`
  - `destinationType` (`upi` | `bank_account`), `destinationDetails`
  - `cycleWeek` (e.g., `2026-W41`)
  - `status` (`scheduled` | `processing` | `settled` | `failed`)

- **`returnRequests`**
  - `id`, `returnRef` (e.g., `RET-2317`)
  - `orderId`, `orderRef`, `storeId`, `customerName`
  - `reason`, `resolutionType` (`refund` | `exchange`)
  - `policyValidated` (boolean, checked against `store.returnWindowDays`)
  - `status` (`Return Requested` | `Approved` | `Rejected` | `Resolved`)
  - `holdAmount` (funds held in wallet until resolution)
  - `sellerNotes`

### 3.5. Payment Rails, Co-Worker Agent & System
- **`paymentGateways`**
  - Multi-tenant support: platform-wide (`storeId: null`) and store-specific (`storeId: number`)
  - Supported gateways: `razorpay`, `cashfree`, `upi_direct`, `stripe`
  - Field credentials: `keyId`, `keySecret`, `webhookSecret`, `merchantId`
  - Feature flags: `autoCapture`, `enableUpi`, `enableCards`, `enableNetbanking`, `enableCod`
  - Testing suite: Built-in simulated HMAC signature validation and API connection verification

- **`agentActions`**
  - Bounded operations co-worker agent logs
  - Guardrail risk rating (`low` | `medium` | `high` | `critical`)
  - Approval state (`pending` | `approved` | `rejected` | `auto_executed`)
  - Target entity, proposed changes payload, and admin approval timestamps

- **`seoSettings` & `adIntegrations`**
  - Dynamic `robotsTxtDirectives`, canonical URLs, meta tags, verification codes
  - Google AdSense / Ad Manager slot configs & dynamic `ads.txt` content generation

---

## 4. Security & Cryptography Specification

### 4.1. Password Hashing (C-01)
Passwords are never stored in plaintext. They are hashed using Node.js native `crypto.scryptSync`:
- **Salt:** 16-byte cryptographically secure random bytes (`crypto.randomBytes(16).toString('hex')`).
- **Key Length:** 64 bytes.
- **Verification:** Timing-safe comparison using `crypto.timingSafeEqual`.

### 4.2. Cryptographic Session Architecture (C-02)
- Session tokens are generated as high-entropy 32-byte hex strings prefixed with `sb_sess_` (256 bits of entropy).
- Only the **SHA-256 hash** of the token is stored in the database (`sessions.sessionTokenHash`).
- On every incoming API request with an `Authorization: Bearer sb_sess_*` header, the server hashes the provided token with SHA-256 and queries the database for an unrevoked, unexpired session.
- Stolen database dumps cannot be used to forge session tokens.

### 4.3. Fail-Closed Role-Based Access Control (RBAC)
- **`authGuard`:** Requires a valid session token or verified Firebase ID token. Assigns user payload to `req.user`.
- **`adminGuard`:** Combines `authGuard` and strictly enforces `req.user.role === 'admin'`. Any non-admin token attempting to reach `/api/admin/*` is rejected with `403 Forbidden: Administrative governance privilege required`.

### 4.4. Webhook Integrity & Idempotency (C-03)
- Gateways post event payloads to `/api/webhooks/payment`.
- Handlers verify HMAC-SHA256 signatures using the configured `webhookSecret`.
- Idempotency guards ensure that duplicate webhook transmissions for the same order reference do not execute duplicate ledger credits or wallet increments.

---

## 5. API Reference Catalog

### 5.1. Public Storefront & Customer APIs
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/robots.txt` | Dynamically generated SEO crawler rules allowing public stores and disallowing private routes. |
| `GET` | `/sitemap.xml` | XML sitemap containing all published store URLs. |
| `GET` | `/ads.txt` | Google AdSense / publisher verification file. |
| `GET` | `/api/health` | Health check endpoint returning platform version and status. |
| `GET` | `/api/slug-check?slug={slug}` | Validates slug format, checks reserved platform keywords, and verifies database availability. |
| `GET` | `/api/pricing/calculate?sellerPrice={n}` | Computes 10% commercial fee breakdown and customer price. |
| `GET` | `/api/storefront/:slug` | Retrieves complete public storefront profile, catalog, and active payment methods. |
| `POST` | `/api/storefront/whatsapp-order` | Initiates WhatsApp order enquiry, creates order record, and generates payment checkout path. |
| `GET` | `/api/checkout/:orderRef` | Retrieves order details, store WhatsApp contact, and payment options for checkout. |
| `POST` | `/api/checkout/:orderRef/return` | Submits customer return/exchange request, validates against policy window, and locks wallet hold. |
| `POST` | `/api/webhooks/payment` | Ingests gateway payment webhooks, verifies signature, captures payment, and credits seller wallet. |
| `POST` | `/api/support/buyer-ticket` | Submits buyer support ticket to merchant desk. |

### 5.2. Authentication APIs
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/seller-login` | Authenticates seller username/email + scrypt password; issues session token. |
| `POST` | `/api/auth/admin-login` | Authenticates admin username/password + verifies 6-digit TOTP 2FA code. |
| `POST` | `/api/auth/reset-password` | Resets seller password using verified OTP and salted scrypt hashing. |
| `POST` | `/api/onboarding/register` | Registers new seller account, creates store slug reservation, and dispatches email OTP. |
| `POST` | `/api/onboarding/verify-otp` | Validates email OTP and activates seller account. |

### 5.3. Authenticated Seller Workspace APIs (`authGuard`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/seller/context` | Loads complete seller tenant context (store, products, orders, wallet, ledger, tickets). |
| `POST` | `/api/seller/products` | Creates or updates product catalog entry with image crop and variant configurations. |
| `PUT` | `/api/seller/branding` | Updates store visual theme, colors, typography, logos, and hero banner crops. |
| `POST` | `/api/seller/orders/:orderId/state` | Transitions order state (`Processing`, `Dispatched`, `Completed`) and attaches tracking details. |
| `POST` | `/api/seller/returns/:returnId/action` | Approves or rejects customer return; releases or refunds wallet hold funds. |
| `PUT` | `/api/seller/payout-profile` | Updates settlement payout bank account or UPI VPA credentials. |
| `POST` | `/api/seller/payouts/run-weekly` | Simulates or executes weekly settlement payout run for eligible balance. |
| `GET` | `/api/seller/payment-gateways` | Retrieves store-configured payment rails. |
| `PUT` | `/api/seller/payment-gateways` | Updates store-level API keys, webhooks, and enabled payment methods. |
| `POST` | `/api/seller/payment-gateways/test` | Tests gateway API connection and simulated webhook HMAC signature. |
| `POST` | `/api/seller/support/tickets` | Creates seller-to-admin support escalation ticket. |
| `POST` | `/api/support/tickets/:ticketId/reply` | Adds reply or internal note to support ticket. |

### 5.4. Admin Governance APIs (`adminGuard`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/overview` | Platform-wide analytics, GMV, fee revenue, seller audits, and pending approvals. |
| `POST` | `/api/admin/action` | Executes governance actions (suspend store, hold seller payouts, update verification). |
| `POST` | `/api/admin/agent/run` | Triggers scoped Co-Worker Agent operational task. |
| `POST` | `/api/admin/agent/actions/:id` | Human-in-the-loop approval or rejection of high-risk agent recommendations. |
| `POST` | `/api/admin/agent/kill-switch` | Emergency circuit breaker halting all automated background agent executions. |
| `GET` | `/api/admin/payment-gateways` | Manages platform-level fallback gateway integrations. |
| `PUT` | `/api/admin/payment-gateways` | Updates platform gateway credentials, test modes, and fee percentages. |
| `POST` | `/api/admin/payment-gateways/test` | Runs handshake and signature test for platform payment rails. |
| `PUT` | `/api/admin/seo` | Updates global SEO titles, meta descriptions, robots directives, and verification codes. |
| `PUT` | `/api/admin/ads` | Configures Google AdSense / Meta Pixel ad slots and verification tags. |

---

## 6. Frontend Architecture & Design Discipline

### 6.1. Anti-AI Slop & Visual Constitutional Guidelines
- **Palette & Contrast:** Premium slate, zinc, and warm charcoal surfaces with crisp typographic contrast.
- **Zero-Pill Discipline:** Form controls, category filters, and tags utilize architectural rounded corners (`rounded-lg`, `rounded-md`) rather than bulbous stadium pills.
- **Micro-Interactions:** Subtle hover states, animated tab indicators, and tactile feedback on critical financial actions.
- **Viewport Resilience:** Responsive layouts optimized for desktop widescreen, tablet, and mobile device viewports with responsive preview toggles in the workspace.

### 6.2. Navigation & Route Hierarchy
- **Public Routes:**
  - `/` — Platform Homepage, value proposition, pricing calculator, and showcase directory.
  - `/:slug` — Dynamic branded storefront (e.g., `/velora`, `/arastudio`).
  - `/store/:slug/product/:productSlug` — Detailed product showcase with variant selection and WhatsApp CTA.
  - `/checkout/:orderRef` — Customer checkout & payment gateway execution.
  - `/login` — Tabbed login portal for Sellers and Admin 2FA Portal.
  - `/onboarding` — Multi-step entrepreneur onboarding wizard.
- **Seller Workspace (`/app/*`):**
  - `/app/dashboard` — Commercial metrics, real-time sales overview, pending orders.
  - `/app/products` — Product catalog management, SKU tracking, variant editor.
  - `/app/orders` — Order fulfillment pipeline, dispatch tracking, courier assignment.
  - `/app/returns` — Return requests dispute desk, hold amount tracking, exchange approval.
  - `/app/wallet` — Live available balance, return reserves, payout histories, weekly payout trigger.
  - `/app/branding` — Live store visual customizer with logo/banner cropping and preview.
  - `/app/payment-gateways` — Multi-rail payment gateway configuration (Razorpay, Cashfree, UPI, Stripe).
  - `/app/settings` — Shipping policies, return window configurations, WhatsApp contact.
  - `/app/support` — Buyer support desk & Admin escalation tickets.
- **Admin Governance Console (`/admin/*`):**
  - Fail-closed TOTP 2FA gate if not authenticated with `role === 'admin'`.
  - 14 Dedicated Modules: Platform Overview, Merchants, GMV Analytics, Wallets & Holds, Settlements, Order Audits, Dispute Resolution, Support Management, Payment Rails, SEO Management, Ad Integrations, Co-Worker Operations Agent, Human-in-the-Loop Approvals, and Emergency Kill Switch.

---

## 7. Rate Limit, Token Utilization & Co-Worker Delegation Mechanics

### 7.1. Rate Limit & Token Conservation Strategy
- **In-Memory Write-Invalidated Read Cache:** Read operations (`/storefront/:slug`, `/seller/context`, `/admin/overview`) cache database queries in a high-speed memory map for 15 seconds. Any non-GET mutation (`POST`, `PUT`, `DELETE`) immediately clears the cache, ensuring zero stale reads while eliminating redundant database hits.
- **Pre-Warmed Database Seeds:** Database demo seeds are executed once on cold start in the background, preventing first-turn cold-start timeouts.
- **Bounded Co-Worker Agent Execution:** Automated agent operations enforce token boundaries, maximum iterations, and human approval for state mutations exceeding predefined risk thresholds.

### 7.2. Co-Worker Agent Operational Guardrails
- **Action Scopes:** The Co-Worker Agent has read-only access to catalog analytics, order velocity, and payout eligibility.
- **Approval Queue:** Any mutation involving wallet balance release, seller status change, or payout triggering generates a pending record in `agentActions`.
- **Emergency Kill Switch:** A hardware-style toggle instantly disables all autonomous agent routines in case of operational anomalies.

---

## 8. Verification & Test Evidence

All critical paths have been verified through automated integration tests and command executions:

1. **Express CommonJS Type Safety:** Clean compilation with zero module export errors using `import type express from 'express'`.
2. **TypeScript Compilation:** `tsc --noEmit` exits with status `0` and zero errors.
3. **Admin 2FA Authentication:** Verified with salted scrypt validation, returning cryptographic token `sb_sess_*`.
4. **RBAC Enforcement:** Non-admin tokens calling `/api/admin/*` are rejected with `403 Forbidden`.
5. **WhatsApp Order Initiation:** Order creation, customer registration, pricing fee calculation, and payment link generation verified via `/api/storefront/whatsapp-order`.
6. **Payment Webhook:** Simulated webhook verification captures payment and automatically credits seller wallet ledger.
7. **Customer Returns & Hold Lock:** Submitting return requests automatically locks the item amount in `heldBalance`.
8. **Multi-Rail Payment Gateways:** Platform and seller gateways tested for Razorpay, Cashfree, UPI Direct, and Stripe.
9. **Dynamic SEO & Search Rules:** Real-time generation of `/robots.txt`, `/sitemap.xml`, and `/ads.txt` verified.

---
*Velora Commerce — The Complete Autonomous D2C Infrastructure.*
