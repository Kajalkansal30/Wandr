import { api } from "./client";

export async function fetchListingFeeStatus() {
  return api("/api/owner/billing/status", { auth: true });
}

export async function createListingFeeOrder() {
  return api("/api/owner/billing/listing-fee/order", { method: "POST", auth: true });
}

export async function verifyListingFee(body: {
  orderId?: string | null;
  paymentId?: string | null;
  signature?: string | null;
}) {
  return api("/api/owner/billing/listing-fee/verify", {
    method: "POST",
    auth: true,
    body,
  });
}

/** Mock unlock when Razorpay keys are not configured; otherwise opens web checkout path. */
export async function unlockListingFeeMobile() {
  const order = await createListingFeeOrder();
  if (order.alreadyPaid || order.listingFeePaid) return true;
  if (order.mock) {
    await verifyListingFee({
      orderId: order.orderId,
      paymentId: `mock_${Date.now()}`,
      signature: "mock",
    });
    return true;
  }
  // Real Razorpay on native needs the Razorpay RN SDK; for now verify via mock only when configured
  // Instruct user to complete payment on web Business Hub if keys are present.
  throw new Error("Complete ₹100 unlock on web Business Hub (Razorpay Checkout), then return here.");
}
