import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import ProductImage from '../components/ProductImage.jsx';
import { fetchMyOrders } from '../features/orders/orderSlice.js';
import { money, shortDate } from '../utils/format.js';

export default function Orders() {
  const dispatch = useDispatch();
  const location = useLocation();
  const { mine, status, error } = useSelector((s) => s.orders);

  useEffect(() => {
    dispatch(fetchMyOrders());
  }, [dispatch]);

  return (
    <div className="container page">
      <h1>My orders</h1>
      {location.state?.placedId && (
        <p className="notice" role="status">Order #{location.state.placedId} is placed. We will confirm it shortly.</p>
      )}
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
                <span className="muted"> placed {shortDate(o.createdAt)}</span>
              </div>
              <span className={`pill pill--${o.status.toLowerCase()}`}>{o.status}</span>
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
            <p className="order__foot"><span className="muted">Ships to: {o.shippingAddress}</span><strong>{money(o.total)}</strong></p>
          </li>
        ))}
      </ul>
    </div>
  );
}
