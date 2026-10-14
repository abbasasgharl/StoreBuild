import { relations } from 'drizzle-orm';
import { boolean, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  username: text('username').default('').notNull(),
  email: text('email').notNull(),
  passwordHash: text('password_hash').default('').notNull(),
  passwordSalt: text('password_salt').default('').notNull(),
  fullName: text('full_name').default(''),
  mobile: text('mobile').default(''),
  role: text('role').default('seller').notNull(), // 'buyer' | 'seller' | 'admin' | 'agent'
  status: text('status').default('active').notNull(), // 'pending_payment' | 'pending_otp' | 'active' | 'suspended'
  twoFactorVerified: boolean('two_factor_verified').default(true).notNull(),
  twoFactorSecret: text('two_factor_secret').default('JBSWY3DPEHPK3PXP'),
  failedLoginAttempts: integer('failed_login_attempts').default(0).notNull(),
  lastLoginAt: timestamp('last_login_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const sessions = pgTable('sessions', {
  id: serial('id').primaryKey(),
  sessionTokenHash: text('session_token_hash').notNull().unique(),
  userUid: text('user_uid').notNull(),
  role: text('role').notNull(),
  ipAddress: text('ip_address').default('127.0.0.1'),
  userAgent: text('user_agent').default('Browser'),
  expiresAt: timestamp('expires_at').notNull(),
  revokedAt: timestamp('revoked_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const sellerProfiles = pgTable('seller_profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  uid: text('uid').notNull().unique(),
  businessName: text('business_name').notNull(),
  setupPlan: text('setup_plan').default('Growth').notNull(),
  setupFeeAmount: integer('setup_fee_amount').default(1999).notNull(),
  setupFeePaid: boolean('setup_fee_paid').default(false).notNull(),
  setupPaymentRef: text('setup_payment_ref').default(''),
  otpVerified: boolean('otp_verified').default(false).notNull(),
  onboardingStep: integer('onboarding_step').default(1).notNull(), // 1..8
  kycStatus: text('kyc_status').default('Verified').notNull(),
  suspendedReason: text('suspended_reason').default(''),
  createdAt: timestamp('created_at').defaultNow(),
});

export const stores = pgTable('stores', {
  id: serial('id').primaryKey(),
  sellerId: integer('seller_id').references(() => users.id).notNull(),
  uid: text('uid').notNull(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  tagline: text('tagline').default(''),
  about: text('about').default(''),
  whatsappNumber: text('whatsapp_number').notNull(),
  contactEmail: text('contact_email').default(''),
  contactPhone: text('contact_phone').default(''),
  shippingPolicy: text('shipping_policy').default('Dispatched within 24–48 hours via insured surface/air courier.'),
  returnPolicy: text('return_policy').default('7-day return or exchange on unused items with original tags intact.'),
  returnWindowDays: integer('return_window_days').default(7).notNull(),
  flatShippingRate: integer('flat_shipping_rate').default(0).notNull(),
  freeShippingThreshold: integer('free_shipping_threshold').default(1500).notNull(),
  instagramUrl: text('instagram_url').default(''),
  websiteUrl: text('website_url').default(''),
  seoTitle: text('seo_title').default(''),
  seoDescription: text('seo_description').default(''),
  socialShareImageUrl: text('social_share_image_url').default(''),
  isPublished: boolean('is_published').default(false).notNull(),
  status: text('status').default('active').notNull(), // 'active' | 'suspended'
  createdAt: timestamp('created_at').defaultNow(),
});

export const storeBranding = pgTable('store_branding', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').references(() => stores.id).notNull().unique(),
  preset: text('preset').default('Minimal').notNull(), // 'Classic' | 'Modern' | 'Minimal' | 'Luxury' | 'Fashion' | 'Boutique'
  logoUrl: text('logo_url').default(''),
  bannerUrl: text('banner_url').default(''),
  logoCropJson: text('logo_crop_json').default('{"position":"center","zoom":1}'),
  bannerCropJson: text('banner_crop_json').default('{"position":"center","zoom":1}'),
  primaryColor: text('primary_color').default('#2563EB').notNull(),
  secondaryColor: text('secondary_color').default('#111827').notNull(),
  buttonStyle: text('button_style').default('rounded').notNull(), // 'sharp' | 'rounded' | 'pill'
  fontPreset: text('font_preset').default('Manrope & Plus Jakarta Sans').notNull(),
  cardStyle: text('card_style').default('editorial').notNull(), // 'editorial' | 'bordered' | 'minimal'
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').references(() => stores.id).notNull(),
  sellerUid: text('seller_uid').notNull(),
  title: text('title').notNull(),
  slug: text('slug').notNull(),
  sku: text('sku').notNull(),
  category: text('category').notNull(),
  description: text('description').notNull(),
  sellerPrice: integer('seller_price').notNull(), // Seller entitlement in INR
  platformFeePercent: integer('platform_fee_percent').default(10).notNull(),
  customerPrice: integer('customer_price').notNull(), // Calculated server-side: sellerPrice + 10%
  stock: integer('stock').default(10).notNull(),
  variantsJson: text('variants_json').default('["Standard"]').notNull(),
  weightGrams: integer('weight_grams').default(450).notNull(),
  shippingNotes: text('shipping_notes').default('Ships in 2 business days'),
  returnExchangePolicy: text('return_exchange_policy').default('7-day easy return & exchange eligible'),
  status: text('status').default('Published').notNull(), // 'Draft' | 'Published' | 'Out of Stock' | 'Archived'
  primaryImageUrl: text('primary_image_url').default(''),
  imageCropPosition: text('image_crop_position').default('center').notNull(), // 'center' | 'top' | 'bottom'
  seoTitle: text('seo_title').default(''),
  seoDescription: text('seo_description').default(''),
  createdAt: timestamp('created_at').defaultNow(),
});

export const productImages = pgTable('product_images', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').references(() => products.id).notNull(),
  storeId: integer('store_id').references(() => stores.id).notNull(),
  imageUrl: text('image_url').notNull(),
  mimeType: text('mime_type').default('image/jpeg').notNull(),
  fileSizeBytes: integer('file_size_bytes').default(245000).notNull(),
  cropPosition: text('crop_position').default('center').notNull(),
  altText: text('alt_text').default(''),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').references(() => stores.id).notNull(),
  fullName: text('full_name').notNull(),
  phone: text('phone').notNull(),
  email: text('email').default(''),
  addressLine: text('address_line').notNull(),
  city: text('city').notNull(),
  state: text('state').notNull(),
  pincode: text('pincode').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  orderRef: text('order_ref').notNull().unique(),
  storeId: integer('store_id').references(() => stores.id).notNull(),
  sellerUid: text('seller_uid').notNull(),
  customerId: integer('customer_id').references(() => customers.id),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone').notNull(),
  customerEmail: text('customer_email').default(''),
  shippingAddress: text('shipping_address').notNull(),
  sellerSubtotal: integer('seller_subtotal').notNull(),
  platformFeeTotal: integer('platform_fee_total').notNull(),
  shippingAmount: integer('shipping_amount').default(0).notNull(),
  customerTotalPayable: integer('customer_total_payable').notNull(),
  orderState: text('order_state').default('Payment Pending').notNull(),
  whatsappEnquiryRef: text('whatsapp_enquiry_ref').default(''),
  paymentLinkGenerated: boolean('payment_link_generated').default(true).notNull(),
  courierName: text('courier_name').default(''),
  trackingNumber: text('tracking_number').default(''),
  trackingUrl: text('tracking_url').default(''),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id).notNull(),
  storeId: integer('store_id').references(() => stores.id).notNull(),
  productId: integer('product_id').references(() => products.id).notNull(),
  productTitleSnapshot: text('product_title_snapshot').notNull(),
  skuSnapshot: text('sku_snapshot').notNull(),
  selectedVariant: text('selected_variant').default('Standard').notNull(),
  quantity: integer('quantity').default(1).notNull(),
  sellerPriceSnapshot: integer('seller_price_snapshot').notNull(),
  platformFeeSnapshot: integer('platform_fee_snapshot').notNull(),
  customerPriceSnapshot: integer('customer_price_snapshot').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id).notNull(),
  storeId: integer('store_id').references(() => stores.id).notNull(),
  gateway: text('gateway').default('Razorpay').notNull(),
  gatewayOrderId: text('gateway_order_id').notNull(),
  gatewayPaymentId: text('gateway_payment_id').default(''),
  webhookSignature: text('webhook_signature').default(''),
  idempotencyKey: text('idempotency_key').notNull().unique(),
  amountPaid: integer('amount_paid').notNull(),
  status: text('status').default('pending').notNull(), // 'pending' | 'captured' | 'failed' | 'refunded'
  verifiedByWebhook: boolean('verified_by_webhook').default(false).notNull(),
  verifiedAt: timestamp('verified_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const wallets = pgTable('wallets', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').references(() => stores.id).notNull().unique(),
  sellerUid: text('seller_uid').notNull(),
  availableBalance: integer('available_balance').default(0).notNull(),
  pendingBalance: integer('pending_balance').default(0).notNull(),
  heldBalance: integer('held_balance').default(0).notNull(),
  paidOutBalance: integer('paid_out_balance').default(0).notNull(),
  lifetimeEarnings: integer('lifetime_earnings').default(0).notNull(),
  isOnHold: boolean('is_on_hold').default(false).notNull(),
  holdReason: text('hold_reason').default(''),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const walletTransactions = pgTable('wallet_transactions', {
  id: serial('id').primaryKey(),
  transactionRef: text('transaction_ref').notNull().unique(),
  walletId: integer('wallet_id').references(() => wallets.id).notNull(),
  storeId: integer('store_id').references(() => stores.id).notNull(),
  orderId: integer('order_id'),
  orderRef: text('order_ref').default(''),
  type: text('type').notNull(),
  direction: text('direction').notNull(), // 'credit' | 'debit'
  amount: integer('amount').notNull(),
  balanceAfter: integer('balance_after').notNull(),
  bucketAffected: text('bucket_affected').default('available').notNull(), // 'available' | 'pending' | 'held' | 'paid_out'
  description: text('description').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const payoutAccounts = pgTable('payout_accounts', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').references(() => stores.id).notNull().unique(),
  sellerUid: text('seller_uid').notNull(),
  method: text('method').default('upi').notNull(), // 'upi' | 'bank'
  upiId: text('upi_id').default(''),
  accountHolderName: text('account_holder_name').notNull(),
  bankAccountNumber: text('bank_account_number').default(''),
  ifscCode: text('ifsc_code').default(''),
  bankName: text('bank_name').default(''),
  verificationStatus: text('verification_status').default('Verified').notNull(), // 'Verified' | 'Temporary Hold - Security Review'
  securityHoldUntil: timestamp('security_hold_until'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const payouts = pgTable('payouts', {
  id: serial('id').primaryKey(),
  payoutRef: text('payout_ref').notNull().unique(),
  storeId: integer('store_id').references(() => stores.id).notNull(),
  sellerUid: text('seller_uid').notNull(),
  amount: integer('amount').notNull(),
  destinationSummary: text('destination_summary').notNull(),
  status: text('status').default('Completed').notNull(), // 'Pending Review' | 'Initiated' | 'Completed' | 'Failed' | 'Reversed'
  cycleLabel: text('cycle_label').notNull(),
  processedByAdmin: text('processed_by_admin').default('System Weekly Batch'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const returns = pgTable('returns', {
  id: serial('id').primaryKey(),
  returnRef: text('return_ref').notNull().unique(),
  orderId: integer('order_id').references(() => orders.id).notNull(),
  orderRef: text('order_ref').notNull(),
  storeId: integer('store_id').references(() => stores.id).notNull(),
  customerName: text('customer_name').notNull(),
  reason: text('reason').notNull(),
  resolutionType: text('resolution_type').default('refund').notNull(), // 'refund' | 'exchange'
  policyValidated: boolean('policy_validated').default(true).notNull(),
  status: text('status').default('Return Requested').notNull(),
  holdAmount: integer('hold_amount').notNull(),
  sellerNotes: text('seller_notes').default(''),
  createdAt: timestamp('created_at').defaultNow(),
});

export const supportTickets = pgTable('support_tickets', {
  id: serial('id').primaryKey(),
  ticketRef: text('ticket_ref').notNull().unique(),
  ticketScope: text('ticket_scope').default('buyer_to_seller').notNull(), // 'buyer_to_seller' | 'seller_to_admin'
  storeId: integer('store_id').references(() => stores.id).notNull(),
  sellerUid: text('seller_uid').notNull(),
  requesterName: text('requester_name').notNull(),
  requesterContact: text('requester_contact').notNull(),
  relatedRef: text('related_ref').default(''), // orderRef, payoutRef, or product SKU
  category: text('category').notNull(),
  priority: text('priority').default('Medium').notNull(), // 'Low' | 'Medium' | 'High' | 'Urgent'
  subject: text('subject').notNull(),
  status: text('status').default('Open').notNull(), // 'Open' | 'In Progress' | 'Waiting for Customer' | 'Resolved' | 'Closed'
  assignedTo: text('assigned_to').default('Unassigned'),
  attachmentName: text('attachment_name').default(''),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const supportMessages = pgTable('support_messages', {
  id: serial('id').primaryKey(),
  ticketId: integer('ticket_id').references(() => supportTickets.id).notNull(),
  senderRole: text('sender_role').notNull(), // 'buyer' | 'seller' | 'admin' | 'agent'
  senderName: text('sender_name').notNull(),
  message: text('message').notNull(),
  isInternalNote: boolean('is_internal_note').default(false).notNull(),
  attachmentName: text('attachment_name').default(''),
  createdAt: timestamp('created_at').defaultNow(),
});

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id'),
  recipientRole: text('recipient_role').default('seller').notNull(), // 'seller' | 'customer' | 'admin'
  channel: text('channel').default('in_app').notNull(), // 'in_app' | 'email' | 'whatsapp'
  category: text('category').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const otpVerifications = pgTable('otp_verifications', {
  id: serial('id').primaryKey(),
  email: text('email').notNull(),
  otpHash: text('otp_hash').notNull(),
  demoPlainCode: text('demo_plain_code').notNull(),
  purpose: text('purpose').default('seller_activation').notNull(),
  attempts: integer('attempts').default(0).notNull(),
  maxAttempts: integer('max_attempts').default(5).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  verifiedAt: timestamp('verified_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  roleKey: text('role_key').notNull().unique(), // 'buyer' | 'seller' | 'admin' | 'agent' | custom keys
  displayName: text('display_name').notNull(),
  description: text('description').notNull(),
  isSystemRole: boolean('is_system_role').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  requiresTwoFactor: boolean('requires_two_factor').default(false).notNull(),
  idleTimeoutMinutes: integer('idle_timeout_minutes').default(30).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const permissions = pgTable('permissions', {
  id: serial('id').primaryKey(),
  roleKey: text('role_key').notNull(),
  moduleName: text('module_name').notNull(),
  allowedActions: text('allowed_actions').notNull(), // JSON array of actions: ['read', 'create', 'update', 'delete', 'publish', 'export', 'approve']
  requiresHumanApproval: boolean('requires_human_approval').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const userRoles = pgTable('user_roles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  userUid: text('user_uid').notNull(),
  roleKey: text('role_key').notNull(),
  assignedBy: text('assigned_by').default('admin-console-root'),
  assignedAt: timestamp('assigned_at').defaultNow(),
});

export const seoMetadata = pgTable('seo_metadata', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id'), // null for global platform
  entityType: text('entity_type').notNull(), // 'global' | 'store' | 'product' | 'category' | 'page'
  entityId: text('entity_id').notNull(), // store slug, product id/slug, category name, or page path
  title: text('title').default('').notNull(),
  description: text('description').default('').notNull(),
  canonicalUrl: text('canonical_url').default(''),
  keywords: text('keywords').default(''),
  ogTitle: text('og_title').default(''),
  ogDescription: text('og_description').default(''),
  ogImageUrl: text('og_image_url').default(''),
  twitterCard: text('twitter_card').default('summary_large_image'),
  noIndex: boolean('no_index').default(false).notNull(),
  noFollow: boolean('no_follow').default(false).notNull(),
  structuredDataJson: text('structured_data_json').default(''),
  sitemapPriority: text('sitemap_priority').default('0.8'),
  sitemapChangeFreq: text('sitemap_change_freq').default('weekly'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const adCampaigns = pgTable('ad_campaigns', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id'), // null for platform-wide ads
  sellerUid: text('seller_uid').default(''),
  campaignName: text('campaign_name').notNull(),
  objective: text('objective').default('traffic').notNull(), // 'traffic' | 'sales' | 'brand_awareness'
  status: text('status').default('active').notNull(), // 'active' | 'paused' | 'scheduled' | 'draft' | 'completed'
  budgetDaily: integer('budget_daily').default(1000).notNull(),
  budgetTotal: integer('budget_total').default(10000).notNull(),
  spentTotal: integer('spent_total').default(0).notNull(),
  startDate: timestamp('start_date').defaultNow(),
  endDate: timestamp('end_date'),
  isContinuous: boolean('is_continuous').default(true).notNull(),
  headline: text('headline').default('').notNull(),
  bodyText: text('body_text').default(''),
  creativeImageUrl: text('creative_image_url').default(''),
  ctaText: text('cta_text').default('Shop Now').notNull(),
  destinationUrl: text('destination_url').default('').notNull(),
  placement: text('placement').default('storefront_top_banner').notNull(), // 'storefront_top_banner' | 'product_sidebar' | 'category_banner'
  targetAudience: text('target_audience').default('All Shoppers'),
  impressionsCount: integer('impressions_count').default(0).notNull(),
  clicksCount: integer('clicks_count').default(0).notNull(),
  conversionsCount: integer('conversions_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const adEvents = pgTable('ad_events', {
  id: serial('id').primaryKey(),
  campaignId: integer('campaign_id').notNull(),
  storeId: integer('store_id'),
  eventType: text('event_type').notNull(), // 'impression' | 'click' | 'conversion'
  visitorHash: text('visitor_hash').notNull(),
  dedupKey: text('dedup_key').notNull(),
  referrer: text('referrer').default(''),
  placement: text('placement').default(''),
  metadataJson: text('metadata_json').default('{}'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const analyticsEvents = pgTable('analytics_events', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id'),
  eventType: text('event_type').notNull(), // 'page_view' | 'product_view' | 'add_to_cart' | 'whatsapp_click' | 'checkout_view' | 'order_paid'
  entityType: text('entity_type').default(''), // 'store' | 'product' | 'order' | 'cart'
  entityId: text('entity_id').default(''),
  orderRef: text('order_ref').default(''),
  orderAmount: integer('order_amount').default(0),
  visitorId: text('visitor_id').default(''),
  sessionId: text('session_id').default(''),
  referrer: text('referrer').default(''),
  deviceType: text('device_type').default('desktop'),
  pagePath: text('page_path').default(''),
  metadataJson: text('metadata_json').default('{}'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const agentActions = pgTable('agent_actions', {
  id: serial('id').primaryKey(),
  actionRef: text('action_ref').notNull().unique(),
  agentIdentity: text('agent_identity').default('agent-ops-copilot').notNull(),
  moduleName: text('module_name').notNull(), // 'system_health' | 'support_tickets' | 'catalog_audit' | 'seo_audit'
  actionType: text('action_type').notNull(), // 'read_diagnostic' | 'propose_ticket_reply' | 'propose_seo_fix' | 'propose_catalog_fix'
  targetEntity: text('target_entity').notNull(),
  targetRef: text('target_ref').notNull(),
  summary: text('summary').notNull(),
  reason: text('reason').notNull(),
  beforeDiff: text('before_diff').default('').notNull(),
  afterDiff: text('after_diff').default('').notNull(),
  confidenceScore: integer('confidence_score').default(92).notNull(),
  status: text('status').default('Pending Approval').notNull(), // 'Read-Only Completed' | 'Pending Approval' | 'Approved & Applied' | 'Rejected' | 'Rolled Back'
  approvedBy: text('approved_by').default(''),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const seoSettings = pgTable('seo_settings', {
  id: serial('id').primaryKey(),
  scopeKey: text('scope_key').default('global').notNull().unique(),
  siteTitle: text('site_title').default('Velora Commerce — Entrepreneur Store Platform').notNull(),
  siteDescription: text('site_description').default('Your Products. Your Brand. Your Online Store. Launch your branded storefront with WhatsApp ordering and weekly payouts.').notNull(),
  canonicalBaseUrl: text('canonical_base_url').default('https://platform.com').notNull(),
  robotsTxtDirectives: text('robots_txt_directives').default('User-agent: *\nAllow: /\nDisallow: /app/\nDisallow: /admin/\nDisallow: /checkout/\nDisallow: /api/').notNull(),
  sitemapEnabled: boolean('sitemap_enabled').default(true).notNull(),
  noindexPrivatePages: boolean('noindex_private_pages').default(true).notNull(),
  googleVerificationCode: text('google_verification_code').default('google-site-verification=v2_platform_verified_8841'),
  bingVerificationCode: text('bing_verification_code').default('msvalidate.01=9920184BC910'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const adIntegrations = pgTable('ad_integrations', {
  id: serial('id').primaryKey(),
  providerKey: text('provider_key').notNull().unique(), // 'google_ads' | 'google_adsense' | 'google_ad_manager' | 'meta_ads'
  displayName: text('display_name').notNull(),
  enabled: boolean('enabled').default(false).notNull(),
  testMode: boolean('test_mode').default(true).notNull(),
  consentRequired: boolean('consent_required').default(true).notNull(),
  publicAccountId: text('public_account_id').default(''), // e.g., AW-10948120 / G-VL99210 / pub-4819201928 / Pixel ID
  conversionLabel: text('conversion_label').default(''),
  adsTxtContent: text('ads_txt_content').default(''),
  adSlotConfigJson: text('ad_slot_config_json').default('[]'),
  serverSecretConfigured: boolean('server_secret_configured').default(true).notNull(),
  verificationStatus: text('verification_status').default('Configured (Test Mode)').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const paymentGateways = pgTable('payment_gateways', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id'), // null for platform-wide gateway
  sellerUid: text('seller_uid').default(''),
  gatewayKey: text('gateway_key').notNull(), // 'razorpay' | 'cashfree' | 'stripe' | 'upi_direct' | 'paytm'
  displayName: text('display_name').notNull(),
  enabled: boolean('enabled').default(true).notNull(),
  environment: text('environment').default('sandbox').notNull(), // 'sandbox' | 'live'
  keyId: text('key_id').default(''),
  keySecret: text('key_secret').default(''),
  webhookSecret: text('webhook_secret').default(''),
  merchantId: text('merchant_id').default(''),
  autoCapture: boolean('auto_capture').default(true).notNull(),
  enableUpi: boolean('enable_upi').default(true).notNull(),
  enableCards: boolean('enable_cards').default(true).notNull(),
  enableNetbanking: boolean('enable_netbanking').default(true).notNull(),
  enableCod: boolean('enable_cod').default(false).notNull(),
  platformFeePercent: integer('platform_fee_percent').default(10).notNull(),
  webhookUrl: text('webhook_url').default('https://platform.com/api/webhooks/payment-gateway').notNull(),
  status: text('status').default('active').notNull(), // 'active' | 'test_mode' | 'disabled'
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  actorUid: text('actor_uid').notNull(),
  actorRole: text('actor_role').notNull(), // 'seller' | 'admin' | 'system' | 'agent'
  storeId: integer('store_id'),
  actionType: text('action_type').notNull(),
  targetEntity: text('target_entity').notNull(),
  targetRef: text('target_ref').notNull(),
  details: text('details').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  stores: many(stores),
}));

export const storesRelations = relations(stores, ({ one, many }) => ({
  owner: one(users, {
    fields: [stores.sellerId],
    references: [users.id],
  }),
  branding: one(storeBranding, {
    fields: [stores.id],
    references: [storeBranding.storeId],
  }),
  products: many(products),
  orders: many(orders),
}));
