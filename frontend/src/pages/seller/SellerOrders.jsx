import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSellerOrders, updateSellerOrder } from '../../features/seller/sellerSlice.js';
import { dayLabel, errorText, money, shortDate } from '../../utils/format.js';

export default function SellerOrders() {
  const dispatch = useDispatch();
  const orders = useSelector((s) => s.seller.orders);
  const [error, setError] = useState('');

  useEffect(() => {
    dispatch(fetchSellerOrders());
  }, [dispatch]);

  const change = (order, status) => {
    if (status === 'CANCELLED') {
      const paidOnline = order.paymentMethod === 'ONLINE' && order.status === 'PAID';
      const text = paidOnline
        ? 'This order was paid online. Cancelling returns the stock, but you must refund the customer yourself in the Razorpay dashboard. Cancel anyway?'
        : 'Cancel this order and return the items to stock?';
      if (!window.confirm(text)) return;
    }
    setError('');
    dispatch(updateSellerOrder({ id: order.id, status })).unwrap().catch((m) => setError(errorText(m)));
  };

  return (
    <>
      <h1>Orders</h1>
      {error && <p className="alert" role="alert">{error}</p>}
      {orders.length === 0 ? (
        <p className="muted">No orders yet.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Order</th><th>Placed</th><th>Customer and address</th><th>Items</th><th>Payment</th><th>Total</th><th>Deliver by</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>#{o.id}</td>
                  <td>{shortDate(o.createdAt)}</td>
                  <td className="wrap">{o.shippingName}, {o.shippingPhone}<br /><small>{o.shippingAddress}, PIN {o.shippingPincode}</small></td>
                  <td className="wrap">{o.items.map((i) => `${i.quantity} × ${i.name}`).join(', ')}</td>
                  <td>{o.paymentMethod === 'COD' ? 'Cash on delivery' : 'Online'}</td>
                  <td>{money(o.total)}</td>
                  <td>{o.estimatedDelivery && o.status !== 'DELIVERED' && o.status !== 'CANCELLED' ? dayLabel(o.estimatedDelivery) : ''}</td>
                  <td><span className={`pill pill--${o.status.toLowerCase()}`}>{o.status.replace('_', ' ')}</span></td>
                  <td className="actions">
                    {(o.status === 'PENDING' || o.status === 'PAID') && (
                      <>
                        <button className="btn btn--small" onClick={() => change(o, 'SHIPPED')}>Mark shipped</button>
                        <button className="link link--danger" onClick={() => change(o, 'CANCELLED')}>Cancel</button>
                      </>
                    )}
                    {o.status === 'SHIPPED' && <button className="btn btn--small" onClick={() => change(o, 'DELIVERED')}>Mark delivered</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
