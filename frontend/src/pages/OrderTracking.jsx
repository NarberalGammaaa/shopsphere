import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import ProductImage from '../components/ProductImage.jsx';
import { fetchOrder } from '../features/orders/orderSlice.js';
import { dateTime, dayLabel, daysFromToday, money } from '../utils/format.js';

// "How long until it reaches me?" screen: arrival date, countdown in days and a progress timeline.
export default function OrderTracking() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { current: o, detailStatus, error } = useSelector((s) => s.orders);

  useEffect(() => {
    dispatch(fetchOrder(id));
  }, [dispatch, id]);

  if (detailStatus === 'failed') {
    return (
      <div className="container state">
        <p>{error || 'Order not found.'}</p>
        <Link to="/orders" className="btn">Back to my orders</Link>
      </div>
    );
  }
  if (!o || String(o.id) !== id) return <p className="container state">Loading…</p>;

  const cod = o.paymentMethod === 'COD';
  const steps = [
    { label: 'Order placed', at: o.createdAt, done: true },
    { label: cod ? 'Pay on delivery' : 'Payment confirmed', at: cod ? null : o.paidAt, done: cod || !!o.paidAt },
    { label: 'Shipped by seller', at: o.shippedAt, done: !!o.shippedAt },
    { label: 'Delivered', at: o.deliveredAt, done: !!o.deliveredAt },
  ];
  const currentStep = steps.findIndex((s) => !s.done);
  const left = o.estimatedDelivery ? daysFromToday(o.estimatedDelivery) : null;

  let headline;
  let sub;
  if (o.status === 'CANCELLED') {
    headline = 'This order was cancelled';
    sub = 'Items went back to stock. If you paid online, ask the seller about your refund.';
  } else if (o.status === 'DELIVERED') {
    headline = `Delivered on ${dayLabel(o.deliveredAt.slice(0, 10))}`;
    sub = 'We hope you like it.';
  } else if (o.status === 'AWAITING_PAYMENT') {
    headline = 'Waiting for your payment';
    sub = 'Complete the payment from My orders to start processing. Unpaid orders are cancelled after 30 minutes.';
  } else {
    headline = o.estimatedDelivery ? `Arriving ${dayLabel(o.estimatedDelivery)}` : 'Delivery date will be shared soon';
    sub = left === null ? '' : left > 1 ? `About ${left} days from today` : left === 1 ? 'Tomorrow' : left === 0 ? 'Today' : 'Running a little late';
  }

  return (
    <div className="container page">
      <Link to="/orders" className="back">Back to my orders</Link>
      <h1>Order #{o.id}</h1>

      <section className="eta">
        <div>
          <p className="eta__label">Estimated delivery</p>
          <p className="eta__headline">{headline}</p>
          <p className="muted">{sub}</p>
        </div>
        {left !== null && o.status !== 'CANCELLED' && o.status !== 'DELIVERED' && o.status !== 'AWAITING_PAYMENT' && (
          <div className="eta__days" aria-label={`${Math.max(left, 0)} days left`}>
            <b>{Math.max(left, 0)}</b>
            <small>{left === 1 ? 'day' : 'days'}</small>
          </div>
        )}
      </section>

      {o.status !== 'CANCELLED' && (
        <ol className="timeline">
          {steps.map((s, i) => (
            <li key={s.label} className={`timeline__step ${s.done ? 'is-done' : ''} ${i === currentStep ? 'is-current' : ''}`}>
              <span className="timeline__dot" aria-hidden="true" />
              <div>
                <strong>{s.label}</strong>
                <span className="muted">{s.at ? dateTime(s.at) : s.done ? '' : 'Pending'}</span>
              </div>
            </li>
          ))}
        </ol>
      )}
      <p className="muted">
        The date is estimated from the seller's PIN ({o.sellerName}) to yours and is updated when the order ships. It is not live courier tracking.
      </p>

      <div className="cart">
        <ul className="lines">
          {o.items.map((i) => (
            <li key={i.productId} className="line line--simple">
              <span className="line__img"><ProductImage src={i.imageUrl} alt={i.name} seed={i.productId} /></span>
              <div className="line__main">
                <Link to={`/product/${i.productId}`} className="line__name">{i.name}</Link>
                <span className="muted">{i.quantity} × {money(i.unitPrice)}</span>
              </div>
              <strong className="line__total">{money(i.quantity * i.unitPrice)}</strong>
            </li>
          ))}
        </ul>
        <aside className="summary">
          <h2>Delivery details</h2>
          <p>{o.shippingName}<br />{o.shippingAddress}<br />PIN {o.shippingPincode}<br />Mobile {o.shippingPhone}</p>
          <p className="summary__row"><span>Total</span><strong>{money(o.total)}</strong></p>
          <p className="muted">{cod ? 'Cash on delivery' : o.paidAt ? 'Paid online' : 'Online payment pending'}</p>
        </aside>
      </div>
    </div>
  );
}
