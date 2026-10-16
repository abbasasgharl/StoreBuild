import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

// Task 3: Environmental condition block: terminate immediately if in production
if (process.env.NODE_ENV === 'production') {
  console.error('FATAL: Demo data seeding is strictly prohibited in production environments (Rule N014). Execution terminated.');
  process.exit(1);
}

import { db } from '../index.ts';
import {
  users,
  sellerProfiles,
  stores,
  storeBranding,
  products,
  productImages,
  customers,
  orders,
  orderItems,
  payments,
  wallets,
  walletTransactions,
  payoutAccounts,
  payouts,
  returns,
  supportTickets,
  supportMessages,
  notifications,
  roles,
  permissions,
  agentActions,
  seoSettings,
  adIntegrations,
  paymentGateways,
  auditLogs,
} from '../schema.ts';
import { hashPassword, calculateCommercialPricing } from '../repository.ts';
import { GENERATED_ASSETS } from '../../constants/assets.ts';
import { isNull, eq } from 'drizzle-orm';

export async function runDemoSeed() {
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL: Demo data seeding is strictly prohibited in production environments (Rule N014). Execution terminated.');
    process.exit(1);
  }

  console.log('🌱 Starting isolated development demo data seeding...');

  // Task 4: Root admin targets strictly read from environment variables
  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD?.trim();

  if (!adminEmail || !adminPassword) {
    console.error('FATAL: System provisioning requires ADMIN_EMAIL and ADMIN_INITIAL_PASSWORD environment variables to be set (Rule N014).');
    process.exit(1);
  }

  const defaultAdminPw = hashPassword(adminPassword);
  const defaultSellerPw = hashPassword(process.env.SELLER_INITIAL_PASSWORD || 'DevSeller#2026');

  // 1. Provision Root Admin and Agent accounts
  await db
    .insert(users)
    .values([
      {
        uid: `admin-root-${crypto.createHash('sha256').update(adminEmail).digest('hex').slice(0, 12)}`,
        username: adminEmail.split('@')[0] || 'admin_root',
        email: adminEmail,
        passwordHash: defaultAdminPw.hash,
        passwordSalt: defaultAdminPw.salt,
        fullName: 'Platform Governance Administrator',
        mobile: '+91 98200 00001',
        role: 'admin',
        status: 'active',
        twoFactorVerified: true,
      },
      {
        uid: 'agent-ops-copilot',
        username: 'agent_ops_copilot',
        email: 'agent-copilot@platform.internal',
        passwordHash: defaultAdminPw.hash,
        passwordSalt: defaultAdminPw.salt,
        fullName: 'Co-Worker Operations Agent (Scoped)',
        mobile: '',
        role: 'agent',
        status: 'active',
        twoFactorVerified: true,
      },
      {
        uid: 'seller-velora-uid',
        username: 'velora_founder',
        email: 'founder@veloraboutique.in',
        passwordHash: defaultSellerPw.hash,
        passwordSalt: defaultSellerPw.salt,
        fullName: 'Ananya Verma',
        mobile: '+91 98201 44910',
        role: 'seller',
        status: 'active',
        twoFactorVerified: true,
      },
      {
        uid: 'seller-arastudio-uid',
        username: 'arastudio_kabir',
        email: 'kabir@arastudio.co',
        passwordHash: defaultSellerPw.hash,
        passwordSalt: defaultSellerPw.salt,
        fullName: 'Kabir Sen',
        mobile: '+91 98330 71200',
        role: 'seller',
        status: 'active',
        twoFactorVerified: true,
      },
    ])
    .onConflictDoNothing();

  // 2. Guarantee Platform-level payment gateways
  const existingPlatformGateways = await db
    .select()
    .from(paymentGateways);

  if (existingPlatformGateways.length === 0) {
    await db.insert(paymentGateways).values([
      {
        gatewayKey: 'razorpay',
        displayName: 'Razorpay (Cards, UPI, Netbanking, Wallets)',
        enabled: true,
        environment: 'sandbox',
        keyId: 'rzp_test_9k8aP2Q9xL40aB',
        keySecret: 'sec_test_99kLaP29xLoQ188A',
        webhookSecret: 'whsec_rzp_990142_prod_sec',
        merchantId: 'rzp_acc_velora_platform',
        autoCapture: true,
        enableUpi: true,
        enableCards: true,
        enableNetbanking: true,
        enableCod: true,
        platformFeePercent: 10,
        webhookUrl: 'https://platform.com/api/webhooks/payment-gateway',
        status: 'active',
      },
      {
        gatewayKey: 'cashfree',
        displayName: 'Cashfree Payments (Instant T+0 Payouts & Split)',
        enabled: true,
        environment: 'sandbox',
        keyId: 'cf_app_291048_test',
        keySecret: 'cf_sec_991024_live_8910',
        webhookSecret: 'whsec_cf_09214_sec_key',
        merchantId: 'cf_mch_platform_route',
        autoCapture: true,
        enableUpi: true,
        enableCards: true,
        enableNetbanking: true,
        enableCod: false,
        platformFeePercent: 10,
        webhookUrl: 'https://platform.com/api/webhooks/payment-gateway',
        status: 'active',
      },
      {
        gatewayKey: 'upi_direct',
        displayName: 'UPI Direct (BHIM, PhonePe, GPay Zero-Fee QR)',
        enabled: true,
        environment: 'live',
        keyId: 'UPI-VPA-MERCHANT-8491',
        keySecret: 'vpa_sec_hash_9941',
        webhookSecret: 'whsec_upi_88192',
        merchantId: 'platform.pay@okaxis',
        autoCapture: true,
        enableUpi: true,
        enableCards: false,
        enableNetbanking: false,
        enableCod: false,
        platformFeePercent: 0,
        webhookUrl: 'https://platform.com/api/webhooks/payment-gateway',
        status: 'active',
      },
      {
        gatewayKey: 'stripe',
        displayName: 'Stripe Payments (Global & Cross-Border Cards)',
        enabled: false,
        environment: 'sandbox',
        keyId: 'pk_test_51Mz98LQaX9801KlpQ',
        keySecret: 'sk_test_51Mz98LQaX9801KlpQ_sec',
        webhookSecret: 'whsec_stripe_881920_sec',
        merchantId: 'acct_1Mz98LQaX9801KlpQ',
        autoCapture: true,
        enableUpi: false,
        enableCards: true,
        enableNetbanking: false,
        enableCod: false,
        platformFeePercent: 10,
        webhookUrl: 'https://platform.com/api/webhooks/payment-gateway',
        status: 'test_mode',
      },
    ]);
  }

  // 3. Seed Demo Stores and Profiles
  const existingStores = await db.select().from(stores);
  if (existingStores.length === 0) {
    const [veloraUser] = await db
      .select()
      .from(users)
      .where(eq(users.uid, 'seller-velora-uid'));

    const veloraUid = 'seller-velora-uid';
    const veloraUserId = veloraUser?.id || 1;

    await db
      .insert(sellerProfiles)
      .values({
        userId: veloraUserId,
        uid: veloraUid,
        businessName: 'Velora Atelier Pvt Ltd',
        setupPlan: 'Growth Annual',
        setupFeeAmount: 1999,
        setupFeePaid: true,
        setupPaymentRef: 'PAY-SETUP-88412',
        otpVerified: true,
        onboardingStep: 8,
        kycStatus: 'Verified',
      })
      .onConflictDoNothing();

    const [veloraStore] = await db
      .insert(stores)
      .values({
        sellerId: veloraUserId,
        uid: veloraUid,
        slug: 'velora',
        name: 'Velora Atelier',
        tagline: 'Handcrafted Textiles, Sculptural Brass & Botanical Objects',
        about:
          'Founded in Jaipur and Mumbai, Velora Atelier collaborates with independent master weavers and metalworkers to craft small-batch wardrobe and living pieces.',
        whatsappNumber: '919820144910',
        contactEmail: 'care@veloraboutique.in',
        contactPhone: '+91 98201 44910',
        shippingPolicy:
          'Orders are packed in plastic-free archival boxes and dispatched within 24–48 hours via BlueDart Air or Delhivery.',
        returnPolicy:
          '7-day return or size exchange on unworn items with original woven tags intact. Return shipping is arranged upon approval.',
        returnWindowDays: 7,
        flatShippingRate: 0,
        freeShippingThreshold: 1500,
        instagramUrl: 'https://instagram.com/veloraatelier',
        websiteUrl: 'https://platform.com/velora',
        seoTitle: 'Velora Atelier — Handcrafted Mulberry Silk, Brass & Apothecary',
        seoDescription:
          'Shop small-batch handwoven silk apparel, sand-cast brass lamps, saddle leather totes, and botanical serums directly from Velora Atelier.',
        socialShareImageUrl: GENERATED_ASSETS.heroStudio,
        isPublished: true,
        status: 'active',
      })
      .onConflictDoNothing()
      .returning();

    if (veloraStore) {
      await db
        .insert(storeBranding)
        .values({
          storeId: veloraStore.id,
          preset: 'Luxury',
          logoUrl: GENERATED_ASSETS.silkDress,
          bannerUrl: GENERATED_ASSETS.heroStudio,
          logoCropJson: '{"position":"center","zoom":1}',
          bannerCropJson: '{"position":"center","zoom":1}',
          primaryColor: '#2563EB',
          secondaryColor: '#111827',
          buttonStyle: 'rounded',
          fontPreset: 'Manrope & Plus Jakarta Sans',
          cardStyle: 'editorial',
        })
        .onConflictDoNothing();

      const initialProducts = [
        {
          title: 'Handwoven Raw Mulberry Silk Wrap Dress',
          slug: 'raw-mulberry-silk-wrap-dress',
          sku: 'VLR-SLK-001',
          category: 'Apparel',
          description:
            'Cut from unbleached handloom mulberry silk with a relaxed kimono sleeve, adjustable waist tie, and French-seamed interior finish.',
          sellerPrice: 4500,
          stock: 14,
          variantsJson: JSON.stringify(['XS / Ivory', 'S / Ivory', 'M / Ivory', 'L / Ivory']),
          weightGrams: 380,
          shippingNotes: 'Dispatched within 24 hours in breathable cotton garment bag',
          returnExchangePolicy: '7-day size exchange or full refund if unworn',
          status: 'Published',
          primaryImageUrl: GENERATED_ASSETS.silkDress,
          seoTitle: 'Handwoven Raw Mulberry Silk Wrap Dress | Velora Atelier',
          seoDescription:
            'Unbleached handloom mulberry silk wrap dress with French seams. ₹4,950 inclusive of platform protection.',
          gallery: [
            GENERATED_ASSETS.silkDress,
            GENERATED_ASSETS.heroStudio,
            GENERATED_ASSETS.leatherTote,
            GENERATED_ASSETS.botanicalSerum,
          ],
        },
        {
          title: 'Alabaster & Brushed Brass Table Lamp',
          slug: 'alabaster-brushed-brass-lamp',
          sku: 'VLR-LMP-002',
          category: 'Lighting & Living',
          description:
            'Hand-turned Spanish alabaster shade mounted on a solid sand-cast brushed brass stem with braided linen cord and warm LED dimmer.',
          sellerPrice: 6800,
          stock: 8,
          variantsJson: JSON.stringify(['Warm Brass / 2700K', 'Antique Bronze / 2700K']),
          weightGrams: 2400,
          shippingNotes: 'Ships in custom foam-lined wooden crate within 48 hours',
          returnExchangePolicy: '7-day replacement or refund for transit damage or defects',
          status: 'Published',
          primaryImageUrl: GENERATED_ASSETS.brassLamp,
          seoTitle: 'Alabaster & Brushed Brass Table Lamp | Velora Atelier',
          seoDescription:
            'Sculptural Spanish alabaster and sand-cast brass table lamp with warm LED dimmer.',
          gallery: [
            GENERATED_ASSETS.brassLamp,
            GENERATED_ASSETS.heroStudio,
            GENERATED_ASSETS.silkDress,
            GENERATED_ASSETS.leatherTote,
          ],
        },
        {
          title: 'Architectural Saddle Leather Everyday Tote',
          slug: 'saddle-leather-everyday-tote',
          sku: 'VLR-BAG-003',
          category: 'Leather Goods',
          description:
            'Vegetable-tanned full-grain cognac leather tote with solid brass buckle closure, padded 14-inch laptop sleeve, and hand-burnished edges.',
          sellerPrice: 5200,
          stock: 19,
          variantsJson: JSON.stringify(['Cognac Tan', 'Espresso Brown']),
          weightGrams: 850,
          shippingNotes: 'Includes monogrammed dust bag and leather balm',
          returnExchangePolicy: '7-day return eligible with original dust bag',
          status: 'Published',
          primaryImageUrl: GENERATED_ASSETS.leatherTote,
          seoTitle: 'Architectural Saddle Leather Everyday Tote | Velora Atelier',
          seoDescription:
            'Full-grain vegetable-tanned saddle leather tote with solid brass hardware.',
          gallery: [
            GENERATED_ASSETS.leatherTote,
            GENERATED_ASSETS.heroStudio,
            GENERATED_ASSETS.silkDress,
            GENERATED_ASSETS.brassLamp,
          ],
        },
        {
          title: 'Cold-Pressed Jasmine & Rosehip Facial Serum',
          slug: 'jasmine-rosehip-facial-serum',
          sku: 'VLR-BOT-004',
          category: 'Apothecary',
          description:
            'Small-batch botanical oil cold-pressed from wild Himalayan rosehip, sambac jasmine absolute, and golden jojoba in UV-protective amber glass.',
          sellerPrice: 1800,
          stock: 32,
          variantsJson: JSON.stringify(['60ml / Amber Dropper', '30ml / Travel Size']),
          weightGrams: 210,
          shippingNotes: 'Ships next business day via temperature-controlled air express',
          returnExchangePolicy: 'Unopened bottles eligible for 7-day return',
          status: 'Published',
          primaryImageUrl: GENERATED_ASSETS.botanicalSerum,
          seoTitle: 'Cold-Pressed Jasmine & Rosehip Facial Serum | Velora Atelier',
          seoDescription:
            'Wild Himalayan rosehip and sambac jasmine botanical facial oil in UV amber glass.',
          gallery: [
            GENERATED_ASSETS.botanicalSerum,
            GENERATED_ASSETS.heroStudio,
            GENERATED_ASSETS.silkDress,
            GENERATED_ASSETS.brassLamp,
          ],
        },
      ];

      for (const prod of initialProducts) {
        const pricing = calculateCommercialPricing(prod.sellerPrice);
        const [inserted] = await db
          .insert(products)
          .values({
            storeId: veloraStore.id,
            sellerUid: veloraUid,
            title: prod.title,
            slug: prod.slug,
            sku: prod.sku,
            category: prod.category,
            description: prod.description,
            sellerPrice: pricing.sellerPrice,
            platformFeePercent: 10,
            customerPrice: pricing.customerPrice,
            stock: prod.stock,
            variantsJson: prod.variantsJson,
            weightGrams: prod.weightGrams,
            shippingNotes: prod.shippingNotes,
            returnExchangePolicy: prod.returnExchangePolicy,
            status: prod.status,
            primaryImageUrl: prod.primaryImageUrl,
            imageCropPosition: 'center',
            seoTitle: prod.seoTitle,
            seoDescription: prod.seoDescription,
          })
          .returning();

        if (inserted) {
          await db.insert(productImages).values(
            prod.gallery.map((imgUrl, idx) => ({
              productId: inserted.id,
              storeId: veloraStore.id,
              imageUrl: imgUrl,
              mimeType: 'image/jpeg',
              fileSizeBytes: 240000 + idx * 18000,
              cropPosition: 'center',
              altText: `${prod.title} — View ${idx + 1} (4:5 Portrait)`,
              sortOrder: idx,
            }))
          );
        }
      }

      await db
        .insert(wallets)
        .values({
          storeId: veloraStore.id,
          sellerUid: veloraUid,
          availableBalance: 9700,
          pendingBalance: 6800,
          heldBalance: 1800,
          paidOutBalance: 12000,
          lifetimeEarnings: 30300,
          isOnHold: false,
        })
        .onConflictDoNothing();

      await db
        .insert(payoutAccounts)
        .values({
          storeId: veloraStore.id,
          sellerUid: veloraUid,
          method: 'upi',
          upiId: 'velora.atelier@okaxis',
          accountHolderName: 'Velora Atelier Pvt Ltd',
          bankAccountNumber: '918020049182341',
          ifscCode: 'UTIB0000142',
          bankName: 'Axis Bank Ltd — Fort Mumbai',
          verificationStatus: 'Verified',
        })
        .onConflictDoNothing();
    }
  }

  // 4. Seed baseline roles and permissions
  const existingRoles = await db.select().from(roles);
  if (existingRoles.length === 0) {
    await db.insert(roles).values([
      {
        roleKey: 'buyer',
        displayName: 'Buyer / Customer',
        description: 'Guest browsing, WhatsApp enquiry/order flow, checkout verification.',
        requiresTwoFactor: false,
        idleTimeoutMinutes: 60,
      },
      {
        roleKey: 'seller',
        displayName: 'Store Entrepreneur (Seller)',
        description: 'Tenant-scoped access to store, products, orders, wallet, payouts, branding, and SEO.',
        requiresTwoFactor: false,
        idleTimeoutMinutes: 30,
      },
      {
        roleKey: 'admin',
        displayName: 'Platform Governance Admin',
        description: 'Admin portal with RBAC across sellers, payouts, support, SEO/Ads, and audit logs.',
        requiresTwoFactor: false,
        idleTimeoutMinutes: 15,
      },
      {
        roleKey: 'agent',
        displayName: 'Bounded Co-Worker Agent',
        description: 'Scoped named identity; read-only by default; human approval required for mutations.',
        requiresTwoFactor: false,
        idleTimeoutMinutes: 10,
      },
    ]);

    await db.insert(permissions).values([
      {
        roleKey: 'agent',
        moduleName: 'system_health',
        allowedActions: JSON.stringify(['read_health', 'check_rate_limits', 'verify_tenant_isolation']),
        requiresHumanApproval: false,
      },
      {
        roleKey: 'agent',
        moduleName: 'support_tickets',
        allowedActions: JSON.stringify(['read_tickets', 'draft_reply', 'propose_triage']),
        requiresHumanApproval: true,
      },
      {
        roleKey: 'agent',
        moduleName: 'catalog_audit',
        allowedActions: JSON.stringify(['verify_4_photos_rule', 'verify_4_5_ratio', 'propose_seo_copy']),
        requiresHumanApproval: true,
      },
      {
        roleKey: 'agent',
        moduleName: 'seo_audit',
        allowedActions: JSON.stringify(['check_canonical_urls', 'check_noindex_guards', 'propose_meta_update']),
        requiresHumanApproval: true,
      },
    ]);
  }

  console.log('✅ Isolated demo seeding script completed successfully.');
}

// Direct execution entrypoint
runDemoSeed()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Demo seeding script terminated with error:', err);
    process.exit(1);
  });
