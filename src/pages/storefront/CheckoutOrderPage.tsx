import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, Check, AlertCircle, Truck, RotateCcw, Lock } from 'lucide-react';

export default function CheckoutOrderPage() {
  const { orderRef } = useParams<{ orderRef: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processingWebhook, setProcessingWebhook] = useState(false);

  // Return request form state
  const [returnReason, setReturnReason] = useState('');
  const [resolutionType, setResolutionType] = useState<'refund' | 'exchange'>('exchange');
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [feedback, setFeedback] = useState('');

  const loadOrder = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/checkout/${orderRef}`);
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [orderRef]);

  const handleRefreshOrderStatus = async () => {
    setProcessingWebhook(true);
    setFeedback('');
    try {
      await loadOrder();
      setFeedback('Order status refreshed from server.');
    } finally {
      setProcessingWebhook(false);
    }
  };

  const handleRequestReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnReason.trim()) return;
    setSubmittingReturn(true);
    try {
      const res = await fetch(`/api/checkout/${orderRef}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: returnReason,
          resolutionType,
        }),
      });
      if (res.ok) {
        setReturnReason('');
        setFeedback(
          'Return request submitted and validated against store policy. Funds have been placed in Wallet Return Hold pending seller approval.'
        );
        await loadOrder();
      }
    } finally {
      setSubmittingReturn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-8 text-sm text-[#6B7280]">
        Loading verified platform payment link...
      </div>
    );
  }

  if (!data || data.error || !data.order) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-8 text-center space-y-4">
        <h1 className="font-display text-2xl font-bold">Order Reference Not Found</h1>
        <Link
          to={data?.store?.slug ? `/${data.store.slug}` : '/'}
          className="px-4 py-2 bg-[#2563EB] text-white text-xs font-semibold rounded-[10px]"
        >
          Return to Storefront
        </Link>
      </div>
    );
  }

  const { order, store, items = [], payment, returns: orderReturns = [] } = data;
  const isPaid = payment?.verifiedByWebhook && payment?.status === 'captured';

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#111827] pb-20">
      <header className="bg-white border-b border-[#E5E7EB] px-6 lg:px-12 h-16 flex items-center justify-between">
        <Link
          to={store?.slug ? `/${store.slug}` : '/'}
          className="font-display text-lg font-bold text-[#111827]"
        >
          {store?.name || 'Branded Storefront'} · Platform Checkout
        </Link>
        <div className="font-mono text-xs text-[#6B7280]">
          Order Ref: <strong className="text-[#111827]">{order.orderRef}</strong>
        </div>
      </header>

      <main className="max-w-[960px] mx-auto px-6 pt-10 space-y-8">
        {feedback && (
          <div className="p-4 rounded-[12px] bg-emerald-50 border border-emerald-200 text-xs font-medium text-[#111827] flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#16A34A] shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Customer, Order Items & Commercial Breakdown */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white border border-[#E5E7EB] rounded-[18px] p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
                <div>
                  <div className="text-xs text-[#6B7280]">
                    WhatsApp Ref: {order.whatsappEnquiryRef || 'Direct'}
                  </div>
                  <h1 className="font-display text-xl font-bold text-[#111827]">
                    Order {order.orderRef} — {order.orderState}
                  </h1>
                </div>
                <span className="font-mono text-xs font-semibold text-[#2563EB]">
                  {isPaid ? 'Webhook Verified' : 'Awaiting Webhook'}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[#6B7280] block">Customer</span>
                  <strong className="text-[#111827]">
                    {order.customerName} · {order.customerPhone}
                  </strong>
                </div>
                <div>
                  <span className="text-[#6B7280] block">Delivery Address</span>
                  <strong className="text-[#111827]">{order.shippingAddress}</strong>
                </div>
                {order.trackingNumber && (
                  <div className="p-3 rounded-[10px] bg-[#F8FAFC] border border-[#E5E7EB] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-[#2563EB]" />
                      <span>
                        Courier: <strong>{order.courierName}</strong> · Tracking:{' '}
                        <span className="font-mono">{order.trackingNumber}</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Order Items Snapshot Table */}
              <div className="border-t border-[#E5E7EB] pt-4 space-y-3">
                <div className="text-xs font-semibold text-[#111827]">
                  Snapshotted Order Items
                </div>
                {items.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between text-xs py-2 border-b border-[#E5E7EB] last:border-b-0"
                  >
                    <div>
                      <div className="font-semibold text-[#111827]">
                        {item.productTitleSnapshot} × {item.quantity}
                      </div>
                      <div className="text-[#6B7280] font-mono">
                        SKU: {item.skuSnapshot} · Variant: {item.selectedVariant}
                      </div>
                    </div>
                    <div className="font-mono font-bold text-[#111827]">
                      ₹{(item.customerPriceSnapshot * item.quantity).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>

              {/* Commercial Split Summary */}
              <div className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-[12px] p-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Seller Product Amount</span>
                  <span className="font-mono font-semibold text-[#111827]">
                    ₹{Number(order.sellerSubtotal).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Platform Fee (10%)</span>
                  <span className="font-mono font-semibold text-[#2563EB]">
                    ₹{Number(order.platformFeeTotal).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Shipping</span>
                  <span className="font-mono font-semibold text-[#111827]">
                    {order.shippingAmount === 0
                      ? 'Free'
                      : `₹${Number(order.shippingAmount).toLocaleString('en-IN')}`}
                  </span>
                </div>
                <div className="border-t border-[#E5E7EB] pt-2.5 flex justify-between text-sm font-bold">
                  <span>Customer Total Payable</span>
                  <span className="font-mono text-[#111827]">
                    ₹{Number(order.customerTotalPayable).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Post-Payment Return / Exchange Request Section */}
            {isPaid && (
              <div className="bg-white border border-[#E5E7EB] rounded-[18px] p-6 space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-[#111827]">
                  <RotateCcw className="w-4 h-4 text-[#2563EB]" />
                  <span>Return & Exchange Request ({store?.returnWindowDays || 7}-Day Policy)</span>
                </div>

                {orderReturns.length > 0 ? (
                  <div className="space-y-2">
                    {orderReturns.map((ret: any) => (
                      <div
                        key={ret.id}
                        className="p-3.5 rounded-[10px] bg-[#F8FAFC] border border-[#E5E7EB] text-xs space-y-1"
                      >
                        <div className="flex justify-between font-semibold">
                          <span>
                            {ret.returnRef} · {ret.resolutionType.toUpperCase()}
                          </span>
                          <span className="text-[#D97706]">{ret.status}</span>
                        </div>
                        <p className="text-[#6B7280]">{ret.reason}</p>
                        <div className="font-mono text-[11px] text-[#16A34A]">
                          Wallet Hold Protected: ₹{Number(ret.holdAmount).toLocaleString('en-IN')}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <form onSubmit={handleRequestReturn} className="space-y-3">
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setResolutionType('exchange')}
                        className={`px-3 py-1.5 rounded-[8px] text-xs font-semibold border ${
                          resolutionType === 'exchange'
                            ? 'bg-[#111827] text-white border-[#111827]'
                            : 'bg-[#F8FAFC] text-[#6B7280] border-[#E5E7EB]'
                        }`}
                      >
                        Request Size/Item Exchange
                      </button>
                      <button
                        type="button"
                        onClick={() => setResolutionType('refund')}
                        className={`px-3 py-1.5 rounded-[8px] text-xs font-semibold border ${
                          resolutionType === 'refund'
                            ? 'bg-[#111827] text-white border-[#111827]'
                            : 'bg-[#F8FAFC] text-[#6B7280] border-[#E5E7EB]'
                        }`}
                      >
                        Request Refund
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      required
                      value={returnReason}
                      onChange={(e) => setReturnReason(e.target.value)}
                      placeholder="Describe reason for return or exchange (validated against store policy)..."
                      className="w-full px-3.5 py-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] text-xs"
                    />
                    <button
                      type="submit"
                      disabled={submittingReturn}
                      className="px-4 py-2 bg-[#111827] text-white text-xs font-semibold rounded-[8px]"
                    >
                      {submittingReturn ? 'Submitting...' : 'Submit Return Request'}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Server-Side Gateway Webhook Payment Box */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-[#E5E7EB] rounded-[18px] p-6 space-y-5">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#2563EB]">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Gateway Payment & Webhook Verification</span>
                </div>
                <h2 className="font-display text-lg font-bold text-[#111827]">
                  {isPaid ? 'Payment Confirmed via Webhook' : 'Complete Platform Payment'}
                </h2>
                <p className="text-xs text-[#6B7280]">
                  Browser-side payment status is never authoritative. Your payment is verified
                  server-side via HMAC-signed gateway webhook.
                </p>
              </div>

              {isPaid ? (
                <div className="p-4 rounded-[12px] bg-emerald-50 border border-emerald-200 space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-[#16A34A]">
                    <Check className="w-4 h-4" />
                    <span>Captured & Reconciled in Wallet Ledger</span>
                  </div>
                  <div className="font-mono text-[11px] text-[#111827] space-y-1">
                    <div>Gateway ID: {payment.gatewayPaymentId}</div>
                    <div>Signature: {payment.webhookSignature}</div>
                    <div>Idempotency Key: {payment.idempotencyKey}</div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-[12px] bg-[#F8FAFC] border border-[#E5E7EB] space-y-2 text-xs">
                    <div className="font-semibold text-[#111827] flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-[#2563EB]" />
                      <span>Awaiting Payment Confirmation</span>
                    </div>
                    <p className="text-[#6B7280] leading-relaxed">
                      Please complete your payment of <strong className="text-[#111827]">₹{Number(order.customerTotalPayable).toLocaleString('en-IN')}</strong> via your payment link or UPI.
                    </p>
                    <div className="text-[11px] text-[#4B5563] pt-1 border-t border-[#E5E7EB]">
                      Payment status is verified server-side through cryptographic webhook signature upon confirmation from the payment provider.
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={processingWebhook || loading}
                    onClick={handleRefreshOrderStatus}
                    className="w-full py-3 px-4 bg-[#111827] hover:bg-black text-white text-xs font-semibold rounded-[10px] transition-colors flex items-center justify-center gap-2"
                  >
                    {processingWebhook ? 'Checking Status...' : 'Check Payment Status'}
                  </button>
                </div>
              )}

              <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-between text-xs">
                <Link
                  to="/app/orders"
                  className="font-semibold text-[#2563EB] hover:underline"
                >
                  Inspect Order in Seller Dashboard →
                </Link>
                <Link
                  to="/app/wallet"
                  className="font-mono text-[#6B7280] hover:text-[#111827]"
                >
                  View Wallet Ledger
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
