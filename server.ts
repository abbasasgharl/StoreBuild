import express from 'express';
import http from 'http';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import type { AuthRequest } from './src/middleware/auth.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception in server:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection in server:', reason);
});

process.on('SIGTERM', () => {
  process.exit(0);
});

process.on('SIGINT', () => {
  process.exit(0);
});

async function startServer() {
  const app = express();

  const modulesPromise = Promise.all([
    import('./src/middleware/auth.ts'),
    import('./src/db/repository.ts'),
  ]);

  // Hardened Payment Webhook Route (Rules N003, N005, N008 & Task 3)
  // Captures exact raw incoming bytes using express.raw before general JSON parsing
  app.post('/api/webhooks/payment', express.raw({ type: '*/*' }), async (req, res) => {
    try {
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
      if (!webhookSecret) {
        console.error('[Webhook Security] RAZORPAY_WEBHOOK_SECRET is not configured on platform.');
        return res.status(400).json({ error: 'Webhook secret configuration missing on platform.' });
      }

      const signature = (req.headers['x-razorpay-signature'] || req.headers['x-webhook-signature'] || '') as string;
      if (!signature) {
        return res.status(400).json({ error: 'Missing required webhook signature header.' });
      }

      const rawBuffer = Buffer.isBuffer(req.body)
        ? req.body
        : Buffer.from(typeof req.body === 'string' ? req.body : JSON.stringify(req.body || ''));

      if (rawBuffer.length === 0) {
        return res.status(400).json({ error: 'Empty webhook payload received.' });
      }

      const computedSig = crypto.createHmac('sha256', webhookSecret).update(rawBuffer).digest('hex');
      const cleanSig = signature.replace(/^sha256=/, '').trim();

      let sigValid = false;
      try {
        sigValid =
          cleanSig.length === computedSig.length &&
          crypto.timingSafeEqual(Buffer.from(cleanSig), Buffer.from(computedSig));
      } catch {
        sigValid = false;
      }

      if (!sigValid) {
        return res.status(400).json({ error: 'Unauthorized: Invalid webhook signature.' });
      }

      let parsedPayload: any;
      try {
        parsedPayload = JSON.parse(rawBuffer.toString('utf8'));
      } catch {
        return res.status(400).json({ error: 'Malformed JSON payload in webhook body.' });
      }

      const [, repo] = await modulesPromise;
      const result = await repo.processGatewayPaymentWebhook({
        rawBody: rawBuffer,
        signature: cleanSig,
        provider: (req.headers['x-payment-provider'] as string) || 'razorpay',
        eventPayload: parsedPayload,
      });

      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Webhook processing failed' });
    }
  });

  app.use(express.json({ limit: '6mb' }));

  const port = Number(process.env.PORT) || 3000;
  const server = http.createServer(app);

  let retries = 0;
  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE' && retries < 25) {
      retries += 1;
      setTimeout(() => {
        server.close();
        server.listen(port);
      }, 150);
    } else {
      console.error('Server listen error:', err);
    }
  });

  // Bind port 3000 immediately before loading heavy dependencies
  server.listen(port, () => {
    console.log(`Entrepreneur Store Platform server listening on http://localhost:${port}`);
  });

  // Enforce system initialization and root admin provisioning strictly from environment variables (Rule N014)
  modulesPromise
    .then(([, repo]) => repo.provisionInitialAdmin())
    .catch((err) => console.error('Root admin provisioning error:', err));

  // Write-invalidated read cache for sub-10ms storefront/workspace/admin loads
  const readCache = new Map<string, { data: unknown; expiresAt: number }>();
  const getCached = <T>(key: string): T | null => {
    const entry = readCache.get(key);
    if (entry && entry.expiresAt > Date.now()) {
      return entry.data as T;
    }
    return null;
  };
  const setCached = (key: string, data: unknown, ttlMs = 15000) => {
    readCache.set(key, { data, expiresAt: Date.now() + ttlMs });
  };
  const clearCache = () => {
    readCache.clear();
  };

  // Specification v2.0 Section 10 & 11: Dynamic /robots.txt, /sitemap.xml, and /ads.txt
  app.get('/robots.txt', async (_req, res) => {
    try {
      const [, repo] = await modulesPromise;
      const txt = await repo.getDynamicRobotsTxt();
      res.type('text/plain').send(txt);
    } catch {
      res.type('text/plain').send('User-agent: *\nAllow: /\nDisallow: /app/\nDisallow: /admin/\nDisallow: /checkout/\n');
    }
  });

  app.get('/sitemap.xml', async (req, res) => {
    try {
      const [, repo] = await modulesPromise;
      const origin = `${req.protocol}://${req.get('host') || 'platform.com'}`;
      const xml = await repo.getDynamicSitemapXml(origin);
      res.type('application/xml').send(xml);
    } catch {
      res.type('application/xml').send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
    }
  });

  app.get('/ads.txt', async (_req, res) => {
    try {
      const [, repo] = await modulesPromise;
      const txt = await repo.getDynamicAdsTxt();
      res.type('text/plain').send(txt);
    } catch {
      res.type('text/plain').send('# Google AdSense ads.txt\n');
    }
  });

  const api = express.Router();

  // Invalidate read cache automatically on any state-mutating request
  api.use((req, _res, next) => {
    if (req.method !== 'GET') {
      clearCache();
    }
    next();
  });

  const authGuard: express.RequestHandler = async (req, res, next) => {
    try {
      const [{ requireAuth }] = await modulesPromise;
      await requireAuth(req as AuthRequest, res, next);
    } catch (err) {
      next(err);
    }
  };

  const adminGuard: express.RequestHandler = async (req, res, next) => {
    try {
      const [{ requireAuth, requireAdmin }] = await modulesPromise;
      await requireAuth(req as AuthRequest, res, async () => {
        await requireAdmin(req as AuthRequest, res, next);
      });
    } catch (err) {
      next(err);
    }
  };

  api.get('/health', (_req, res) => {
    res.json({ status: 'ok', version: '2.0' });
  });

  // Commercial fee preview helper (server-authoritative 10% platform fee)
  api.get('/pricing/calculate', async (req, res) => {
    const [, repo] = await modulesPromise;
    const sellerPrice = Number(req.query.sellerPrice) || 1000;
    res.json(repo.calculateCommercialPricing(sellerPrice));
  });

  // Slug availability + reserved word check
  api.get('/slug-check', async (req, res) => {
    try {
      const [, repo] = await modulesPromise;
      const slug = String(req.query.slug || '');
      const result = await repo.checkSlugAvailability(slug);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Slug check failed' });
    }
  });

  // Specification v2.0 Section 1 & 2: Standard Username/Email + Password Login with Strict Lockout (P0)
  api.post('/auth/login', async (req, res) => {
    try {
      const [, repo] = await modulesPromise;
      const session = await repo.authenticateCredentials({
        identifier: req.body.identifier || req.body.usernameOrEmail || req.body.email || req.body.username,
        password: req.body.password,
        ipAddress: (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'Web Client',
      });
      res.json(session);
    } catch (error: any) {
      res.status(401).json({ error: error.message || "That email or password isn't right. Please try again." });
    }
  });

  api.post('/auth/seller-login', async (req, res) => {
    try {
      const [, repo] = await modulesPromise;
      const session = await repo.authenticateSellerCredentials({
        ...req.body,
        ipAddress: (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'Web Client',
      });
      res.json(session);
    } catch (error: any) {
      res.status(401).json({ error: error.message || "That email or password isn't right. Please try again." });
    }
  });

  api.post('/auth/admin-login', async (req, res) => {
    try {
      const [, repo] = await modulesPromise;
      const session = await repo.authenticateAdminCredentials({
        ...req.body,
        ipAddress: (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'Web Client',
      });
      res.json(session);
    } catch (error: any) {
      res.status(401).json({ error: error.message || "That email or password isn't right. Please try again." });
    }
  });

  api.post('/auth/reset-password', async (req, res) => {
    try {
      const [, repo] = await modulesPromise;
      const result = await repo.resetSellerPassword(req.body);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Password reset failed' });
    }
  });

  // Account -> Change Password (Sellers and Admins)
  api.post('/auth/change-password', authGuard, async (req: AuthRequest, res) => {
    try {
      if (!req.user?.uid) {
        return res.status(401).json({ error: 'Unauthorized: Missing authenticated session identity.' });
      }
      const [, repo] = await modulesPromise;
      const authHeader = req.headers.authorization || '';
      const currentSessionToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : undefined;
      const result = await repo.changeUserPassword({
        uid: req.user.uid,
        currentPassword: req.body.currentPassword,
        newPassword: req.body.newPassword,
        confirmPassword: req.body.confirmPassword,
        currentSessionToken,
        ipAddress: (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'Web Client',
      });
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Password update failed' });
    }
  });

  // Seller Onboarding Step 1-3: Register + Setup Fee Webhook + Dispatch Email OTP
  api.post('/onboarding/register', async (req, res) => {
    try {
      const [, repo] = await modulesPromise;
      const result = await repo.registerSellerAndSendOtp(req.body);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Registration failed' });
    }
  });

  // Seller Onboarding Step 4: Verify Email OTP -> Activate Account
  api.post('/onboarding/verify-otp', async (req, res) => {
    try {
      const [, repo] = await modulesPromise;
      const { email, code } = req.body;
      const result = await repo.verifySellerOtp(email, code);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'OTP verification failed' });
    }
  });

  // Public Branded Storefront by storeSlug
  api.get('/storefront/:slug', async (req, res) => {
    try {
      const slugKey = `storefront:${String(req.params.slug || '').toLowerCase()}`;
      const cached = getCached(slugKey);
      if (cached) {
        return res.json(cached);
      }
      const [, repo] = await modulesPromise;
      const data = await repo.getPublicStorefrontBySlug(req.params.slug);
      if (!data) {
        return res.status(404).json({ error: 'Storefront not found' });
      }
      setCached(slugKey, data);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to load storefront' });
    }
  });

  // Customer clicks "Order on WhatsApp" -> Creates contextual enquiry + unique orderRef + platform payment link
  api.post('/storefront/whatsapp-order', async (req, res) => {
    try {
      const [, repo] = await modulesPromise;
      const result = await repo.createWhatsAppOrderEnquiry(req.body);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Could not initiate WhatsApp order' });
    }
  });

  // Specification v2.0 Section 8: Buyer-to-Seller Support Ticket Submission
  api.post('/support/buyer-ticket', async (req, res) => {
    try {
      const [, repo] = await modulesPromise;
      const ticket = await repo.createBuyerSupportTicket(req.body);
      res.json(ticket);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to submit buyer support ticket' });
    }
  });

  // Public Checkout & Order Status by orderRef
  api.get('/checkout/:orderRef', async (req, res) => {
    try {
      const [, repo] = await modulesPromise;
      const data = await repo.getOrderByRefForCheckout(req.params.orderRef);
      if (!data) {
        return res.status(404).json({ error: 'Order reference not found' });
      }
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to load checkout order' });
    }
  });



  // Customer Return / Exchange Request
  api.post('/checkout/:orderRef/return', async (req, res) => {
    try {
      const [, repo] = await modulesPromise;
      const result = await repo.createCustomerReturnRequest({
        orderRef: req.params.orderRef,
        reason: req.body.reason,
        resolutionType: req.body.resolutionType || 'refund',
      });
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to submit return request' });
    }
  });

  // Authenticated Seller Tenant-Scoped APIs
  api.get('/seller/context', authGuard, async (req: AuthRequest, res) => {
    try {
      if (!req.user?.uid) {
        return res.status(401).json({ error: 'Unauthorized: Missing authenticated tenant identity.' });
      }
      const uid = req.user.uid;
      const cacheKey = `seller_ctx:${uid}`;
      const cached = getCached(cacheKey);
      if (cached) {
        return res.json(cached);
      }
      const [, repo] = await modulesPromise;
      const context = await repo.getSellerTenantContext(uid);
      setCached(cacheKey, context);
      res.json(context);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to load seller context' });
    }
  });

  api.post('/seller/products', authGuard, async (req: AuthRequest, res) => {
    try {
      if (!req.user?.uid) {
        return res.status(401).json({ error: 'Unauthorized: Missing authenticated tenant identity.' });
      }
      const [, repo] = await modulesPromise;
      const uid = req.user.uid;
      const product = await repo.createOrUpdateProduct(uid, req.body);
      res.json(product);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to save product' });
    }
  });

  api.put('/seller/branding', authGuard, async (req: AuthRequest, res) => {
    try {
      if (!req.user?.uid) {
        return res.status(401).json({ error: 'Unauthorized: Missing authenticated tenant identity.' });
      }
      const [, repo] = await modulesPromise;
      const uid = req.user.uid;
      const updated = await repo.updateStoreBrandingAndSettings(uid, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to save branding/settings' });
    }
  });

  api.post('/seller/orders/:orderId/state', authGuard, async (req: AuthRequest, res) => {
    try {
      if (!req.user?.uid) {
        return res.status(401).json({ error: 'Unauthorized: Missing authenticated tenant identity.' });
      }
      const [, repo] = await modulesPromise;
      const uid = req.user.uid;
      const updated = await repo.updateSellerOrderState(uid, Number(req.params.orderId), req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to update order status' });
    }
  });

  api.post('/seller/returns/:returnId/action', authGuard, async (req: AuthRequest, res) => {
    try {
      if (!req.user?.uid) {
        return res.status(401).json({ error: 'Unauthorized: Missing authenticated tenant identity.' });
      }
      const [, repo] = await modulesPromise;
      const uid = req.user.uid;
      const updated = await repo.handleSellerReturnAction(
        uid,
        Number(req.params.returnId),
        req.body.action,
        req.body.sellerNotes
      );
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to process return action' });
    }
  });

  api.put('/seller/payout-profile', authGuard, async (req: AuthRequest, res) => {
    try {
      if (!req.user?.uid) {
        return res.status(401).json({ error: 'Unauthorized: Missing authenticated tenant identity.' });
      }
      const [, repo] = await modulesPromise;
      const uid = req.user.uid;
      const updated = await repo.updateSellerPayoutProfile(uid, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to update payout profile' });
    }
  });

  api.post('/seller/payouts/run-weekly', authGuard, async (req: AuthRequest, res) => {
    try {
      if (!req.user?.uid) {
        return res.status(401).json({ error: 'Unauthorized: Missing authenticated tenant identity.' });
      }
      const [, repo] = await modulesPromise;
      const uid = req.user.uid;
      const updated = await repo.runSellerWeeklyPayoutSimulation(uid);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Weekly payout failed' });
    }
  });

  // Seller-to-Admin Support Ticket creation
  api.post('/seller/support/tickets', authGuard, async (req: AuthRequest, res) => {
    try {
      if (!req.user?.uid) {
        return res.status(401).json({ error: 'Unauthorized: Missing authenticated tenant identity.' });
      }
      const [, repo] = await modulesPromise;
      const uid = req.user.uid;
      const updated = await repo.createSellerSupportTicket(uid, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to create seller support ticket' });
    }
  });

  // Reply / Status / Internal Note on Support Ticket (Seller or Admin)
  // Non-negotiable N006: Support role must come from authenticated DB user, never req.body.actorRole or UID substring
  api.post('/support/tickets/:ticketId/reply', authGuard, async (req: AuthRequest, res) => {
    try {
      if (!req.user?.uid) {
        return res.status(401).json({ error: 'Unauthorized: Missing authenticated identity.' });
      }
      const [, repo] = await modulesPromise;
      const uid = req.user.uid;
      const actorRole = req.user.role === 'admin' ? 'admin' : 'seller';
      const updated = await repo.replyToSupportTicket({
        actorUid: uid,
        actorRole,
        ticketId: Number(req.params.ticketId),
        message: req.body.message,
        nextStatus: actorRole === 'admin' ? req.body.nextStatus : undefined,
        assignedTo: actorRole === 'admin' ? req.body.assignedTo : undefined,
        isInternalNote: actorRole === 'admin' ? Boolean(req.body.isInternalNote) : false,
      });
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to update support ticket' });
    }
  });



  // Admin Console APIs (Protected with fail-closed adminGuard)
  api.get('/admin/overview', adminGuard, async (_req: AuthRequest, res) => {
    try {
      const cached = getCached('admin_overview');
      if (cached) {
        return res.json(cached);
      }
      const [, repo] = await modulesPromise;
      const overview = await repo.getAdminConsoleOverview();
      setCached('admin_overview', overview);
      res.json(overview);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to load admin console' });
    }
  });

  api.post('/admin/action', adminGuard, async (req: AuthRequest, res) => {
    try {
      const [, repo] = await modulesPromise;
      const overview = await repo.executeAdminGovernanceAction({
        adminUid: req.user!.uid,
        ...req.body,
      });
      res.json(overview);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Admin action failed' });
    }
  });

  // Distinct administrative router path for merchant KYC review (Rules N006, N007 & G6 constraints)
  api.post('/admin/kyc/review', adminGuard, async (req: AuthRequest, res) => {
    try {
      const [, repo] = await modulesPromise;
      const { merchantId, storeId, merchantUid, uid, storeSlug, status, reason, reasoning } = req.body;
      const reviewReason = String(reason || reasoning || '').trim();

      if (!status || (status !== 'Approved' && status !== 'Rejected' && status !== 'Verified')) {
        return res.status(400).json({ error: 'Validation error: status must be "Approved" or "Rejected".' });
      }

      if (!reviewReason) {
        return res.status(400).json({
          error: 'Validation error: A mandatory review reasoning string is required for administrative compliance audit logging.',
        });
      }

      const result = await repo.reviewMerchantKyc({
        adminUid: req.user!.uid,
        merchantId: merchantId ? Number(merchantId) : undefined,
        storeId: storeId ? Number(storeId) : undefined,
        merchantUid: merchantUid || uid,
        storeSlug: storeSlug ? String(storeSlug).trim() : undefined,
        status,
        reason: reviewReason,
      });

      // Drop out with standardized JSON response
      return res.json(result);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Administrative KYC review failed' });
    }
  });

  // ============================================================================
  // Specification v2.0 Section 9 & Rule N009: Account Termination Routes
  // ============================================================================

  // Administrative Account Closure Request (7-day + final 2-day reminder schedule)
  api.post('/admin/sellers/:sellerUid/request-closure', adminGuard, async (req: AuthRequest, res) => {
    try {
      const [, repo] = await modulesPromise;
      const { sellerUid } = req.params;
      const { reason } = req.body;
      const result = await repo.requestSellerAccountClosure({
        adminUid: req.user!.uid,
        sellerUid,
        reason,
      });
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to request account closure' });
    }
  });

  // Scheduled Account Closure Worker Trigger (processes due terminations & sends reminders)
  api.post('/admin/sellers/closure/process-due', adminGuard, async (_req: AuthRequest, res) => {
    try {
      const [, repo] = await modulesPromise;
      const results = await repo.processScheduledAccountClosures();
      res.json(results);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to process scheduled closures' });
    }
  });

  // Seller / Link Confirmation for Account Closure (validates single-use token)
  api.post('/sellers/account/closure/confirm', async (req, res) => {
    try {
      const [, repo] = await modulesPromise;
      const { token } = req.body;
      const result = await repo.confirmSellerAccountClosure(token);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to confirm account closure' });
    }
  });

  // Cancel Account Closure (retains store & invalidates termination schedule)
  api.post('/sellers/account/closure/cancel', authGuard, async (req: AuthRequest, res) => {
    try {
      const [, repo] = await modulesPromise;
      const targetSellerUid = req.user?.role === 'admin' && req.body.sellerUid
        ? req.body.sellerUid
        : req.user!.uid;
      const result = await repo.cancelSellerAccountClosure({
        sellerUid: targetSellerUid,
        cancelledByUid: req.user!.uid,
        reason: req.body.reason,
      });
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to cancel account closure' });
    }
  });

  // Get Current Account Closure Status
  api.get('/sellers/account/closure/status', authGuard, async (req: AuthRequest, res) => {
    try {
      const [, repo] = await modulesPromise;
      const targetSellerUid = req.user?.role === 'admin' && req.query.sellerUid
        ? String(req.query.sellerUid)
        : req.user!.uid;
      const status = await repo.getSellerAccountClosureStatus(targetSellerUid);
      res.json(status);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch closure status' });
    }
  });

  // Specification v2.0 Section 9: Co-Worker Agent Bounded Execution, Approval Queue & Kill Switch
  api.post('/admin/agent/run', adminGuard, async (req: AuthRequest, res) => {
    try {
      const [, repo] = await modulesPromise;
      const overview = await repo.runCoworkerAgentTask(req.body);
      res.json(overview);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Co-worker agent task failed' });
    }
  });

  api.post('/admin/agent/actions/:actionId', adminGuard, async (req: AuthRequest, res) => {
    try {
      const [, repo] = await modulesPromise;
      const overview = await repo.handleAgentApprovalAction({
        adminUid: req.user!.uid,
        actionId: Number(req.params.actionId),
        decision: req.body.decision,
      });
      res.json(overview);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Agent approval action failed' });
    }
  });

  api.post('/admin/agent/kill-switch', adminGuard, async (req: AuthRequest, res) => {
    try {
      const [, repo] = await modulesPromise;
      const overview = await repo.toggleAgentEmergencyKillSwitch(
        req.user!.uid,
        Boolean(req.body.disable)
      );
      res.json(overview);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to toggle agent kill switch' });
    }
  });

  // Specification v2.0 Section 10 & 11: SEO Control Panel & Ads/Analytics Settings
  api.put('/admin/seo', adminGuard, async (req: AuthRequest, res) => {
    try {
      const [, repo] = await modulesPromise;
      const overview = await repo.updateGlobalSeoSettings(
        req.user!.uid,
        req.body
      );
      res.json(overview);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to update global SEO settings' });
    }
  });

  api.put('/admin/ads', adminGuard, async (req: AuthRequest, res) => {
    try {
      const [, repo] = await modulesPromise;
      const overview = await repo.updateAdIntegrationSettings(
        req.user!.uid,
        req.body
      );
      res.json(overview);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to update ad integration settings' });
    }
  });

  // Admin Payment Gateways Governance APIs
  api.get('/admin/payment-gateways', adminGuard, async (_req: AuthRequest, res) => {
    try {
      const [, repo] = await modulesPromise;
      const gateways = await repo.getAdminPaymentGateways();
      res.json(gateways);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to load platform payment gateways' });
    }
  });

  api.put('/admin/payment-gateways', adminGuard, async (req: AuthRequest, res) => {
    try {
      const adminUid = req.user?.uid;
      if (!adminUid) return res.status(401).json({ error: 'Unauthorized: Missing admin identity.' });
      const [, repo] = await modulesPromise;
      const overview = await repo.updateAdminPaymentGateway(adminUid, req.body);
      res.json(overview);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to update platform payment gateway' });
    }
  });

  api.post('/admin/payment-gateways/test', adminGuard, async (req: AuthRequest, res) => {
    try {
      const adminUid = req.user?.uid;
      if (!adminUid) return res.status(401).json({ error: 'Unauthorized: Missing admin identity.' });
      const [, repo] = await modulesPromise;
      const result = await repo.testAdminPaymentGateway(adminUid, req.body.gatewayKey);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to test platform payment gateway' });
    }
  });

  // ============================================================================
  // RBAC Roles & Permissions Governance APIs
  // ============================================================================
  api.get('/admin/roles', adminGuard, async (_req: AuthRequest, res) => {
    try {
      const [, repo] = await modulesPromise;
      const data = await repo.getRolesAndPermissions();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to load roles' });
    }
  });

  api.post('/admin/roles', adminGuard, async (req: AuthRequest, res) => {
    try {
      const [, repo] = await modulesPromise;
      const created = await repo.createRole(req.user!.uid, req.body);
      res.json(created);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to create role' });
    }
  });

  api.put('/admin/roles/:roleKey', adminGuard, async (req: AuthRequest, res) => {
    try {
      const [, repo] = await modulesPromise;
      const updated = await repo.updateRole(
        req.user!.uid,
        req.params.roleKey,
        req.body
      );
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to update role' });
    }
  });

  api.post('/admin/roles/:roleKey/toggle-status', adminGuard, async (req: AuthRequest, res) => {
    try {
      const [, repo] = await modulesPromise;
      const toggled = await repo.toggleRoleStatus(
        req.user!.uid,
        req.params.roleKey
      );
      res.json(toggled);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to toggle role status' });
    }
  });

  api.delete('/admin/roles/:roleKey', adminGuard, async (req: AuthRequest, res) => {
    try {
      const [, repo] = await modulesPromise;
      const deleted = await repo.deleteRole(
        req.user!.uid,
        req.params.roleKey
      );
      res.json(deleted);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to delete role' });
    }
  });

  api.get('/admin/users', adminGuard, async (_req: AuthRequest, res) => {
    try {
      const [, repo] = await modulesPromise;
      const usersList = await repo.getUsersWithRoles();
      res.json(usersList);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to load platform users' });
    }
  });

  api.post('/admin/users/:uid/assign-role', adminGuard, async (req: AuthRequest, res) => {
    try {
      const [, repo] = await modulesPromise;
      const result = await repo.assignUserRole(
        req.user!.uid,
        req.params.uid,
        req.body.roleKey
      );
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to assign user role' });
    }
  });

  api.get('/admin/rbac/audit', adminGuard, async (_req: AuthRequest, res) => {
    try {
      const [, repo] = await modulesPromise;
      const logs = await repo.getRbacAuditLogs();
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to load RBAC audit history' });
    }
  });

  api.post('/admin/rbac/test-permission', authGuard, async (req: AuthRequest, res) => {
    try {
      const [, repo] = await modulesPromise;
      const uid = req.user?.uid || '';
      const { moduleName, action } = req.body;
      const authorized = await repo.checkUserPermission(uid, moduleName, action);
      if (!authorized) {
        return res.status(403).json({
          authorized: false,
          userUid: uid,
          role: req.user?.role,
          error: `Forbidden: User role "${req.user?.role}" does not have permission "${moduleName}:${action}". Server authorization check strictly rejected this operation.`,
        });
      }
      res.json({
        authorized: true,
        userUid: uid,
        role: req.user?.role,
        moduleName,
        action,
        message: `Authorized: User role "${req.user?.role}" is permitted to execute "${moduleName}:${action}".`,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Permission test failed' });
    }
  });

  // ============================================================================
  // SEO Control Panel & Meta APIs
  // ============================================================================
  api.get('/seo/meta/:entityType/:entityId', async (req, res) => {
    try {
      const [, repo] = await modulesPromise;
      const meta = await repo.getSeoMetadata(req.params.entityType, req.params.entityId);
      res.json(meta || {});
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to load SEO metadata' });
    }
  });

  api.put('/seo/meta', authGuard, async (req: AuthRequest, res) => {
    try {
      const [, repo] = await modulesPromise;
      const actorUid = req.user?.uid || 'seller-tenant';
      const result = await repo.upsertSeoMetadata(actorUid, req.body);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to save SEO metadata' });
    }
  });

  api.get('/seo/health-check', async (req, res) => {
    try {
      const [, repo] = await modulesPromise;
      const storeSlug = String(req.query.storeSlug || 'velora');
      const health = await repo.calculateSeoHealth(storeSlug);
      res.json(health);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to calculate SEO health' });
    }
  });

  // ============================================================================
  // Ads Campaigns & Tracking APIs
  // ============================================================================
  api.get('/ads/campaigns', authGuard, async (req: AuthRequest, res) => {
    try {
      const [, repo] = await modulesPromise;
      const storeId = req.query.storeId ? Number(req.query.storeId) : undefined;
      const campaigns = await repo.getAdCampaigns({ storeId, sellerUid: req.user?.uid });
      res.json(campaigns);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to load ad campaigns' });
    }
  });

  api.post('/ads/campaigns', authGuard, async (req: AuthRequest, res) => {
    try {
      if (!req.user?.uid) {
        return res.status(401).json({ error: 'Unauthorized: Missing authenticated identity.' });
      }
      const [, repo] = await modulesPromise;
      const actorUid = req.user.uid;
      const created = await repo.createAdCampaign(actorUid, req.body);
      res.json(created);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to create ad campaign' });
    }
  });

  api.put('/ads/campaigns/:id', authGuard, async (req: AuthRequest, res) => {
    try {
      if (!req.user?.uid) {
        return res.status(401).json({ error: 'Unauthorized: Missing authenticated identity.' });
      }
      const [, repo] = await modulesPromise;
      const actorUid = req.user.uid;
      const updated = await repo.updateAdCampaign(actorUid, Number(req.params.id), req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to update ad campaign' });
    }
  });

  api.post('/ads/campaigns/:id/status', authGuard, async (req: AuthRequest, res) => {
    try {
      if (!req.user?.uid) {
        return res.status(401).json({ error: 'Unauthorized: Missing authenticated identity.' });
      }
      const [, repo] = await modulesPromise;
      const actorUid = req.user.uid;
      const updated = await repo.toggleAdCampaignStatus(
        actorUid,
        Number(req.params.id),
        req.body.status
      );
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to update campaign status' });
    }
  });

  api.delete('/ads/campaigns/:id', authGuard, async (req: AuthRequest, res) => {
    try {
      if (!req.user?.uid) {
        return res.status(401).json({ error: 'Unauthorized: Missing authenticated identity.' });
      }
      const [, repo] = await modulesPromise;
      const actorUid = req.user.uid;
      const result = await repo.deleteAdCampaign(actorUid, Number(req.params.id));
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to delete ad campaign' });
    }
  });

  api.post('/ads/track', async (req, res) => {
    try {
      const [, repo] = await modulesPromise;
      const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'browser';
      const visitorHash = crypto
        .createHash('sha256')
        .update(`${clientIp}:${userAgent}`)
        .digest('hex')
        .slice(0, 16);

      const result = await repo.trackAdEvent({
        campaignId: Number(req.body.campaignId),
        storeId: req.body.storeId ? Number(req.body.storeId) : undefined,
        eventType: req.body.eventType,
        visitorHash,
        referrer: req.body.referrer,
        placement: req.body.placement,
      });
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to track ad event' });
    }
  });

  api.get('/ads/storefront-active', async (req, res) => {
    try {
      const [, repo] = await modulesPromise;
      const storeId = req.query.storeId ? Number(req.query.storeId) : undefined;
      const placement = req.query.placement ? String(req.query.placement) : undefined;
      const ads = await repo.getActiveStorefrontAds(storeId, placement);
      res.json(ads);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to load storefront ads' });
    }
  });

  api.get('/admin/ads/integrations', adminGuard, async (_req: AuthRequest, res) => {
    try {
      const [, repo] = await modulesPromise;
      const integrations = await repo.getAdIntegrations();
      res.json(integrations);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to load ad integrations' });
    }
  });

  api.post('/admin/ads/integrations/:providerKey/verify', adminGuard, async (req: AuthRequest, res) => {
    try {
      const [, repo] = await modulesPromise;
      const verified = await repo.verifyAdIntegration(
        req.user!.uid,
        req.params.providerKey
      );
      res.json(verified);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to verify ad integration' });
    }
  });

  // ============================================================================
  // Real Analytics & Data Ingestion APIs
  // ============================================================================
  api.post('/analytics/event', async (req, res) => {
    try {
      const [, repo] = await modulesPromise;
      const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'browser';
      const visitorId =
        req.body.visitorId ||
        crypto
          .createHash('sha256')
          .update(`${clientIp}:${userAgent}`)
          .digest('hex')
          .slice(0, 16);

      const result = await repo.recordAnalyticsEvent({
        ...req.body,
        visitorId,
      });
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to record analytics event' });
    }
  });

  api.get('/analytics/dashboard', authGuard, async (req: AuthRequest, res) => {
    try {
      const [, repo] = await modulesPromise;
      let storeId = req.query.storeId ? Number(req.query.storeId) : undefined;

      // Tenant isolation: if requester is a seller, lock storeId to seller's own store
      if (req.user?.role === 'seller') {
        const ctx = await repo.getSellerTenantContext(req.user.uid);
        storeId = ctx.store.id;
      }

      const timeRange = (req.query.timeRange as any) || '30d';
      const dashboard = await repo.getAnalyticsDashboard({
        storeId,
        sellerUid: req.user?.uid,
        timeRange,
      });
      res.json(dashboard);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to load analytics dashboard' });
    }
  });

  api.get('/analytics/export', authGuard, async (req: AuthRequest, res) => {
    try {
      const [, repo] = await modulesPromise;
      let storeId = req.query.storeId ? Number(req.query.storeId) : undefined;

      if (req.user?.role === 'seller') {
        const ctx = await repo.getSellerTenantContext(req.user.uid);
        storeId = ctx.store.id;
      }

      const rawRange = String(req.query.timeRange || '30d');
      const validRanges = ['today', '7d', '30d', '90d', 'all'] as const;
      const timeRange = validRanges.includes(rawRange as any) ? (rawRange as typeof validRanges[number]) : '30d';
      const csv = await repo.exportAnalyticsCsv({ storeId, timeRange });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="analytics_export_${timeRange}.csv"`);
      res.send(csv);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to export analytics' });
    }
  });

  app.use('/api', api);

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vitePromise = import('vite').then(({ createServer }) =>
      createServer({
        server: {
          middlewareMode: true,
          hmr: false,
          ws: false,
          watch: null,
        },
        appType: 'spa',
      })
    );
    app.use(async (req, res, next) => {
      try {
        const vite = await vitePromise;
        const cleanUrl = (req.url || '').split('?')[0];
        if (cleanUrl === '/@vite/client') {
          const transformed = await vite.transformRequest(req.url);
          if (transformed) {
            let code = transformed.code;
            code = code.replaceAll(
              'reject(/* @__PURE__ */ new Error("WebSocket closed without opened."));',
              'resolve();'
            );
            code = code.replaceAll(
              'transport.connect(createHMRHandler(handleMessage));',
              'try { transport.connect(createHMRHandler(handleMessage))?.catch?.(() => {}); } catch(e) {}'
            );
            res.setHeader('Content-Type', 'application/javascript');
            res.setHeader('Cache-Control', 'no-cache');
            return res.send(code);
          }
        }
        vite.middlewares(req, res, next);
      } catch (err) {
        next(err);
      }
    });
  }
}

startServer();
