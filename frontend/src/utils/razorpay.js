// Loads Razorpay's checkout script on demand and opens the payment window.
let loading;

export function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve();
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = resolve;
      script.onerror = () => {
        loading = null;
        reject(new Error('Could not load the payment window. Check your internet connection.'));
      };
      document.body.appendChild(script);
    });
  }
  return loading;
}

/**
 * Opens the Razorpay window. Resolves with {razorpay_payment_id, razorpay_order_id, razorpay_signature}
 * after a successful payment, rejects if the customer closes the window without paying.
 */
export async function payWithRazorpay({ init, user }) {
  await loadRazorpay();
  return new Promise((resolve, reject) => {
    let lastFailure = '';
    const rzp = new window.Razorpay({
      key: init.keyId,
      amount: init.amountPaise,
      currency: init.currency,
      order_id: init.razorpayOrderId,
      name: 'ShopSphere',
      description: 'Order payment',
      prefill: { name: user?.name, email: user?.email },
      theme: { color: '#2b3ff0' },
      handler: (response) => resolve(response),
      modal: {
        ondismiss: () => reject(new Error(lastFailure || 'The payment window was closed before paying.')),
      },
    });
    // A failed attempt keeps the window open so the customer can retry, so only remember the reason.
    rzp.on('payment.failed', (r) => {
      lastFailure = r?.error?.description || 'The payment failed.';
    });
    rzp.open();
  });
}
