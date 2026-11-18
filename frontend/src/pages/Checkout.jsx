import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios.js';
import DeliveryEstimate, { isPincode } from '../components/DeliveryEstimate.jsx';
import { clearCart, selectCartTotal } from '../features/cart/cartSlice.js';
import { checkout, verifyPayment } from '../features/orders/orderSlice.js';
import { errorText, money } from '../utils/format.js';
import { payWithRazorpay } from '../utils/razorpay.js';

export default function Checkout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const items = useSelector((s) => s.cart.items);
  const total = useSelector(selectCartTotal);
  const [form, setForm] = useState({
    shippingName: user?.name || '',
    shippingPhone: '',
    shippingAddress: '',
    shippingPincode: localStorage.getItem('pincode') || '',
  });
  const [online, setOnline] = useState(false); // is Razorpay configured on the server?
  const [method, setMethod] = useState('COD');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .get('/payments/config')
      .then((r) => {
        setOnline(r.data.enabled);
        if (r.data.enabled) setMethod('ONLINE');
      })
      .catch(() => setOnline(false));
  }, []);

  if (items.length === 0) {
    return (
      <div className="container state">
        <h1>Nothing to check out</h1>
        <Link to="/" className="btn">Browse products</Link>
      </div>
    );
  }

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    localStorage.setItem('pincode', form.shippingPincode);
    let result;
    try {
      result = await dispatch(
        checkout({ ...form, paymentMethod: method, items: items.map((i) => ({ productId: i.id, quantity: i.quantity })) })
      ).unwrap();
    } catch (message) {
      setError(errorText(message));
      setBusy(false);
      return;
    }

    dispatch(clearCart()); // the orders exist now (stock is reserved), so the cart is done
    if (!result.payment) {
      navigate('/orders', { state: { notice: 'Order placed. You will pay cash on delivery.' } });
      return;
    }
    try {
      const paid = await payWithRazorpay({ init: result.payment, user });
      await dispatch(
        verifyPayment({
          razorpayOrderId: paid.razorpay_order_id,
          razorpayPaymentId: paid.razorpay_payment_id,
          razorpaySignature: paid.razorpay_signature,
        })
      ).unwrap();
      navigate('/orders', { state: { notice: 'Payment received. Your order is confirmed.' } });
    } catch (problem) {
      navigate('/orders', {
        state: { warning: `${errorText(problem)} Your order is saved: press "Complete payment" within 30 minutes or it will be cancelled.` },
      });
    }
  };

  return (
    <div className="container page">
      <h1>Checkout</h1>
      <div className="cart">
        <form className="form" onSubmit={submit}>
          <h2>Delivery address</h2>
          <label>Full name<input required maxLength="100" value={form.shippingName} onChange={set('shippingName')} /></label>
          <label>
            Mobile number
            <input required inputMode="numeric" pattern="[6-9][0-9]{9}" maxLength="10" title="10-digit mobile number" value={form.shippingPhone}
              onChange={(e) => setForm({ ...form, shippingPhone: e.target.value.replace(/\D/g, '') })} />
          </label>
          <label>
            Address
            <textarea required rows="3" maxLength="400" placeholder="House no, street, area, city, state" value={form.shippingAddress} onChange={set('shippingAddress')} />
          </label>
          <label>
            PIN code
            <input required inputMode="numeric" pattern="[1-9][0-9]{5}" maxLength="6" title="6-digit PIN code" value={form.shippingPincode}
              onChange={(e) => setForm({ ...form, shippingPincode: e.target.value.replace(/\D/g, '') })} />
          </label>
          <DeliveryEstimate pincode={form.shippingPincode} productIds={items.map((i) => i.id)} />

          <h2>Payment</h2>
          <fieldset className="choices">
            <label className={`choice ${method === 'ONLINE' ? 'is-active' : ''} ${!online ? 'is-disabled' : ''}`}>
              <input type="radio" name="method" disabled={!online} checked={method === 'ONLINE'} onChange={() => setMethod('ONLINE')} />
              <span>
                <strong>Pay online</strong>
                <small>{online ? 'UPI, cards and netbanking through Razorpay' : 'Not set up on this server yet'}</small>
              </span>
            </label>
            <label className={`choice ${method === 'COD' ? 'is-active' : ''}`}>
              <input type="radio" name="method" checked={method === 'COD'} onChange={() => setMethod('COD')} />
              <span>
                <strong>Cash on delivery</strong>
                <small>Pay the delivery person when the parcel arrives</small>
              </span>
            </label>
          </fieldset>

          {error && <p className="alert" role="alert">{error}</p>}
          <button className="btn" disabled={busy || !isPincode(form.shippingPincode)}>
            {busy ? 'Placing order…' : method === 'ONLINE' ? `Pay ${money(total)}` : `Place order (${money(total)})`}
          </button>
        </form>

        <aside className="summary">
          <h2>In your order</h2>
          <ul className="mini">
            {items.map((i) => (
              <li key={i.id}>
                <span>{i.quantity} × {i.name}</span>
                <span>{money(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <p className="summary__row"><span>Total</span><strong>{money(total)}</strong></p>
          <p className="muted">Items from different sellers ship as separate orders, each with its own delivery date.</p>
        </aside>
      </div>
    </div>
  );
}
