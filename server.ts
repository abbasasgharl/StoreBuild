import express from 'express';
import http from 'http';
import path from 'path';
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

  const modulesPromise = Promise.all([
    import('./src/middleware/auth.ts'),
    import('./src/db/repository.ts'),
  ]);

  // Pre-warm database seed in background so first API call is fast
  modulesPromise
    .then(([, repo]) => repo.ensureDemoDataSeeded())
    .catch((err) => console.error('Background seed prewarm error:', err));

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

  // Specification v2.0 Section 1 & 2: Seller Username/Email + Password Login, Admin 2FA Portal Login & Password Reset
  api.post('/auth/seller-login', async (req, res) => {
    try {
      const [, repo] = await modulesPromise;
      const session = await repo.authenticateSellerCredentials(req.body);
      res.json(session);
    } catch (error: any) {
      res.status(401).json({ error: error.message || 'Seller authentication failed' });
    }
  });

  api.post('/auth/admin-login', async (req, res) => {
    try {
      const [, repo] = await modulesPromise;
      const session = await repo.authenticateAdminWith2FA(req.body);
      res.json(session);
    } catch (error: any) {
      res.status(401).json({ error: error.message || 'Admin 2FA authentication failed' });
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

  // Server-Side Gateway Payment Webhook Verification (Never trust browser-side status)
  api.post('/webhooks/payment', async (req, res) => {
    try {
      const [, repo] = await modulesPromise;
      const result = await repo.processGatewayPaymentWebhook(req.body);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Webhook verification failed' });
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

  // Authenticated Seller Tenant-Scoped APIs
  api.get('/seller/context', authGuard, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid || 'seller-velora-uid';
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
      const [, repo] = await modulesPromise;
      const uid = req.user?.uid || 'seller-velora-uid';
      const product = await repo.createOrUpdateProduct(uid, req.body);
      res.json(product);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to save product' });
    }
  });

  api.put('/seller/branding', authGuard, async (req: AuthRequest, res) => {
    try {
      const [, repo] = await modulesPromise;
      const uid = req.user?.uid || 'seller-velora-uid';
      const updated = await repo.updateStoreBrandingAndSettings(uid, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to save branding/settings' });
    }
  });

  api.post('/seller/orders/:orderId/state', authGuard, async (req: AuthRequest, res) => {
    try {
      const [, repo] = await modulesPromise;
      const uid = req.user?.uid || 'seller-velora-uid';
      const updated = await repo.updateSellerOrderState(uid, Number(req.params.orderId), req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to update order status' });
    }
  });

  api.post('/seller/returns/:returnId/action', authGuard, async (req: AuthRequest, res) => {
    try {
      const [, repo] = await modulesPromise;
      const uid = req.user?.uid || 'seller-velora-uid';
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
      const [, repo] = await modulesPromise;
      const uid = req.user?.uid || 'seller-velora-uid';
      const updated = await repo.updateSellerPayoutProfile(uid, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to update payout profile' });
    }
  });

  api.post('/seller/payouts/run-weekly', authGuard, async (req: AuthRequest, res) => {
    try {
      const [, repo] = await modulesPromise;
      const uid = req.user?.uid || 'seller-velora-uid';
      const updated = await repo.runSellerWeeklyPayoutSimulation(uid);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Weekly payout failed' });
    }
  });

  // Seller-to-Admin Support Ticket creation
  api.post('/seller/support/tickets', authGuard, async (req: AuthRequest, res) => {
    try {
      const [, repo] = await modulesPromise;
      const uid = req.user?.uid || 'seller-velora-uid';
      const updated = await repo.createSellerSupportTicket(uid, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to create seller support ticket' });
    }
  });

  // Reply / Status / Internal Note on Support Ticket (Seller or Admin)
  api.post('/support/tickets/:ticketId/reply', authGuard, async (req: AuthRequest, res) => {
    try {
      const [, repo] = await modulesPromise;
      const uid = req.user?.uid || 'seller-velora-uid';
      const actorRole =
        req.body.actorRole === 'admin' || uid.includes('admin') ? 'admin' : 'seller';
      const updated = await repo.replyToSupportTicket({
        actorUid: uid,
        actorRole,
        ticketId: Number(req.params.ticketId),
        message: req.body.message,
        nextStatus: req.body.nextStatus,
        assignedTo: req.body.assignedTo,
        isInternalNote: req.body.isInternalNote,
      });
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to update support ticket' });
    }
  });

  // Seller Payment Gateway Setup & Testing APIs
  api.get('/seller/payment-gateways', authGuard, async (req: AuthRequest, res) => {
    try {
      const [, repo] = await modulesPromise;
      const uid = req.user?.uid || 'seller-velora-uid';
      const gateways = await repo.getStorePaymentGateways(uid);
      res.json(gateways);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to load store payment gateways' });
    }
  });

  api.put('/seller/payment-gateways', authGuard, async (req: AuthRequest, res) => {
    try {
      const [, repo] = await modulesPromise;
      const uid = req.user?.uid || 'seller-velora-uid';
      const updated = await repo.updateStorePaymentGatewaySettings(uid, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to update payment gateway' });
    }
  });

  api.post('/seller/payment-gateways/test', authGuard, async (req: AuthRequest, res) => {
    try {
      const [, repo] = await modulesPromise;
      const uid = req.user?.uid || 'seller-velora-uid';
      const result = await repo.testStorePaymentGatewayConnection(uid, req.body.gatewayKey);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Payment gateway connection test failed' });
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
        adminUid: req.user?.uid || 'admin-console-root',
        ...req.body,
      });
      res.json(overview);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Admin action failed' });
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
        adminUid: req.user?.uid || 'admin-console-root',
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
        req.user?.uid || 'admin-console-root',
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
        req.user?.uid || 'admin-console-root',
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
        req.user?.uid || 'admin-console-root',
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
      const [, repo] = await modulesPromise;
      const overview = await repo.updateAdminPaymentGateway(
        req.user?.uid || 'admin-console-root',
        req.body
      );
      res.json(overview);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to update platform payment gateway' });
    }
  });

  api.post('/admin/payment-gateways/test', adminGuard, async (req: AuthRequest, res) => {
    try {
      const [, repo] = await modulesPromise;
      const result = await repo.testAdminPaymentGateway(
        req.user?.uid || 'admin-console-root',
        req.body.gatewayKey
      );
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to test platform payment gateway' });
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
