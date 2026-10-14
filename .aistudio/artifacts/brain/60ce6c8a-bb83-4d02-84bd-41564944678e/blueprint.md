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

---

## 3. Security & Cryptography Specification

### 3.1. Password Hashing (C-01)
Passwords are never stored in plaintext. They are hashed using Node.js native `crypto.scryptSync`:
- **Salt:** 16-byte cryptographically secure random bytes (`crypto.randomBytes(16).toString('hex')`).
- **Key Length:** 64 bytes.
- **Verification:** Timing-safe comparison using `crypto.timingSafeEqual`.

### 3.2. Cryptographic Session Architecture (C-02)
- Session tokens are generated as high-entropy 32-byte hex strings prefixed with `sb_sess_` (256 bits of entropy).
- Only the **SHA-256 hash** of the token is stored in the database (`sessions.sessionTokenHash`).
- On every incoming API request with an `Authorization: Bearer sb_sess_*` header, the server hashes the provided token with SHA-256 and queries the database for an unrevoked, unexpired session.
- Stolen database dumps cannot be used to forge session tokens.

### 3.3. Fail-Closed Role-Based Access Control (RBAC)
- **`authGuard`:** Requires a valid session token or verified Firebase ID token. Assigns user payload to `req.user`.
- **`adminGuard`:** Combines `authGuard` and strictly enforces `req.user.role === 'admin'`. Any non-admin token attempting to reach `/api/admin/*` is rejected with `403 Forbidden: Administrative governance privilege required`.

### 3.4. Webhook Integrity & Idempotency (C-03)
- Gateways post event payloads to `/api/webhooks/payment`.
- Handlers verify HMAC-SHA256 signatures using the configured `webhookSecret`.
- Idempotency guards ensure that duplicate webhook transmissions for the same order reference do not execute duplicate ledger credits or wallet increments.

---

## 4. API Reference Catalog

### 4.1. Public Storefront & Customer APIs
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

### 4.2. Authenticated Seller Workspace APIs (`authGuard`)
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

### 4.3. Admin Governance APIs (`adminGuard`)
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

## 5. Rate Limit, Token Utilization & Co-Worker Delegation Mechanics

- **In-Memory Write-Invalidated Read Cache:** Read operations (`/storefront/:slug`, `/seller/context`, `/admin/overview`) cache database queries in a high-speed memory map for 15 seconds. Any non-GET mutation (`POST`, `PUT`, `DELETE`) immediately clears the cache, ensuring zero stale reads while eliminating redundant database hits.
- **Pre-Warmed Database Seeds:** Database demo seeds are executed once on cold start in the background, preventing first-turn cold-start timeouts.
- **Bounded Co-Worker Agent Execution:** Automated agent operations enforce token boundaries, maximum iterations, and human approval for state mutations exceeding predefined risk thresholds.
- **Emergency Kill Switch:** A hardware-style toggle instantly disables all autonomous agent routines in case of operational anomalies.

---
*Velora Commerce — The Complete Autonomous D2C Infrastructure.*
