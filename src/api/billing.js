import { api } from "./client";

export async function fetchListingFeeStatus() {
  return api("/api/owner/billing/status", { auth: true });
}

export async function createListingFeeOrder() {
  return api("/api/owner/billing/listing-fee/order", { method: "POST", auth: true });
}

export async function verifyListingFee({ orderId, paymentId, signature }) {
  return api("/api/owner/billing/listing-fee/verify", {
    method: "POST",
    auth: true,
    body: { orderId, paymentId, signature },
  });
}

function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(window.Razorpay);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(window.Razorpay);
    script.onerror = () => reject(new Error("Could not load Razorpay Checkout"));
    document.body.appendChild(script);
  });
}

/**
 * Opens Razorpay Checkout when RAZORPAY keys are configured on the server.
 * Without keys, backend returns mock=true and unlocks immediately (dev / pre-keys).
 * @returns {{ paid: true, mock?: boolean }}
 */
export async function unlockListingFee({ name, email } = {}) {
  const order = await createListingFeeOrder();
  if (order.alreadyPaid || order.listingFeePaid) return { paid: true, mock: false };

  if (order.mock) {
    await verifyListingFee({
      orderId: order.orderId,
      paymentId: `mock_${Date.now()}`,
      signature: "mock",
    });
    return { paid: true, mock: true };
  }

  if (!order.keyId) {
    throw new Error("Payment is not configured yet. Add Razorpay keys on the server, then try again.");
  }

  const Razorpay = await loadRazorpayScript();
  return new Promise((resolve, reject) => {
    const rzp = new Razorpay({
      key: order.keyId,
      amount: order.amountPaise,
      currency: order.currency || "INR",
      name: "Wandr",
      description: "Business Hub — one-time listing unlock",
      order_id: order.orderId,
      prefill: { name: name || "", email: email || "" },
      theme: { color: "#2B211D" },
      handler: async (response) => {
        try {
          await verifyListingFee({
            orderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
          });
          resolve({ paid: true, mock: false });
        } catch (err) {
          reject(err);
        }
      },
      modal: {
        ondismiss: () => reject(new Error("Payment cancelled")),
      },
    });
    rzp.on("payment.failed", (resp) => {
      reject(new Error(resp?.error?.description || "Payment failed"));
    });
    rzp.open();
  });
}
