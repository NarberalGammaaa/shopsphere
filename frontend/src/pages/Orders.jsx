import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import ProductImage from '../components/ProductImage.jsx';
import { fetchMyOrders, startPayment, verifyPayment } from '../features/orders/orderSlice.js';
import { dayLabel, errorText, money, shortDate } from '../utils/format.js';
import { payWithRazorpay } from '../utils/razorpay.js';

export default function Orders() {
  const dispatch = useDispatch();
  const location = useLocation();
  const user = useSelector((s) => s.auth.user);
  const { mine, status, error } = useSelector((s) => s.orders);
  const [message, setMessage] = useState({ notice: location.state?.notice, warning: location.state?.warning });
  const [paying, setPaying] = useState('');

  useEffect(() => {
    dispatch(fetchMyOrders());
  }, [dispatch]);

  const completePayment = async (checkoutId) => {
    setPaying(checkoutId);
    setMessage({});
    try {
      const init = await dispatch(startPayment(checkoutId)).unwrap();
      const paid = await payWithRazorpay({ init, user });
      await dispatch(
        verifyPayment({
          razorpayOrderId: paid.razorpay_order_id,
          razorpayPaymentId: paid.razorpay_payment_id,
          razorpaySignature: paid.razorpay_signature,
        })
      ).unwrap();
      setMessage({ notice: 'Payment received. Your order is confirmed.' });
    } catch (e) {
      setMessage({ warning: errorText(e) });
    } finally {
      setPaying('');
      dispatch(fetchMyOrders());
    }
  };

  return (
    <div className="container page">
      <h1>My orders</h1>
      {message.notice && <p className="notice" role="status">{message.notice}</p>}
      {message.warning && <p className="alert" role="alert">{message.warning}</p>}
      {status === 'failed' && <p className="alert">{error}</p>}
      {status === 'loading' && mine.length === 0 && <p className="state">Loading orders…</p>}
      {status !== 'loading' && status !== 'failed' && mine.length === 0 && (
        <div className="state">
          <p>You have not placed any orders yet.</p>
          <Link to="/" className="btn">Start shopping</Link>
        </div>
      )}
      <ul className="orders">
        {mine.map((o) => (
          <li key={o.id} className="order">
            <div className="order__head">
              <div>
                <strong>Order #{o.id}</strong>
                <span className="muted"> placed {shortDate(o.createdAt)}, sold by {o.sellerName}</span>
              </div>
              <span className={`pill pill--${o.status.toLowerCase()}`}>{o.status.replace('_', ' ')}</span>
            </div>
            <ul className="order__items">
              {o.items.map((i) => (
                <li key={i.productId}>
                  <span className="thumb"><ProductImage src={i.imageUrl} alt={i.name} seed={i.productId} /></span>
                  <span>{i.quantity} × {i.name}</span>
                  <span className="muted">{money(i.unitPrice)}</span>
                </li>
              ))}
            </ul>
            <div className="order__foot">
              <span className="muted">
                {o.status === 'DELIVERED' ? `Delivered ${shortDate(o.deliveredAt)}`
                  : o.status === 'CANCELLED' || !o.estimatedDelivery ? `Ships to PIN ${o.shippingPincode}`
                  : `Arrives by ${dayLabel(o.estimatedDelivery)}`}
              </span>
              <strong>{money(o.total)}</strong>
            </div>
            <div className="row">
              <Link to={`/orders/${o.id}`} className="btn btn--ghost">Track order</Link>
              {o.status === 'AWAITING_PAYMENT' && (
                <button className="btn" disabled={paying === o.checkoutId} onClick={() => completePayment(o.checkoutId)}>
                  {paying === o.checkoutId ? 'Opening payment…' : 'Complete payment'}
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
