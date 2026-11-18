import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchSellerOrders, fetchSellerStats, updateSellerOrder } from '../../features/seller/sellerSlice.js';
import { dayLabel, money, shortDate } from '../../utils/format.js';

export default function SellerDashboard() {
  const dispatch = useDispatch();
  const { stats, orders } = useSelector((s) => s.seller);

  useEffect(() => {
    dispatch(fetchSellerStats());
    dispatch(fetchSellerOrders());
  }, [dispatch]);

  const toShip = orders.filter((o) => o.status === 'PENDING' || o.status === 'PAID').slice(0, 6);
  const cards = stats && [
    ['Revenue', money(stats.revenue), 'paid and shipped orders'],
    ['Orders', stats.orderCount, 'excluding cancelled'],
    ['To ship', stats.toShip, 'waiting for you'],
    ['Products', stats.productCount, 'in your catalogue'],
    ['Low stock', stats.lowStock, '5 or fewer left'],
  ];

  const ship = (id) => {
    dispatch(updateSellerOrder({ id, status: 'SHIPPED' }))
      .unwrap()
      .then(() => dispatch(fetchSellerStats()))
      .catch(() => {});
  };

  return (
    <>
      <h1>Dashboard</h1>
      <div className="stats">
        {cards ? cards.map(([label, value, note]) => (
          <div key={label} className="stat">
            <span>{label}</span>
            <b>{value}</b>
            <small>{note}</small>
          </div>
        )) : <p className="muted">Loading…</p>}
      </div>

      <h2>Orders to ship</h2>
      {toShip.length === 0 ? (
        <p className="muted">Nothing waiting. New paid and cash-on-delivery orders appear here.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Order</th><th>Placed</th><th>Ship to</th><th>Deliver by</th><th>Total</th><th></th></tr></thead>
            <tbody>
              {toShip.map((o) => (
                <tr key={o.id}>
                  <td>#{o.id}</td>
                  <td>{shortDate(o.createdAt)}</td>
                  <td>{o.shippingName}, PIN {o.shippingPincode}</td>
                  <td>{o.estimatedDelivery ? dayLabel(o.estimatedDelivery) : ''}</td>
                  <td>{money(o.total)}</td>
                  <td className="actions"><button className="btn btn--small" onClick={() => ship(o.id)}>Mark shipped</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p><Link to="/seller/orders">See all orders</Link></p>
    </>
  );
}
