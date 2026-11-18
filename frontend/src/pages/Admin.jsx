import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createOffer, deleteOffer, fetchAdminOrders, fetchOffers, updateAdminOrder } from '../features/admin/adminSlice.js';
import { errorText, money, shortDate } from '../utils/format.js';

const STATUSES = ['AWAITING_PAYMENT', 'PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export default function Admin() {
  const [tab, setTab] = useState('offers');
  return (
    <div className="container page">
      <h1>Admin</h1>
      <div className="chips" role="tablist">
        <button role="tab" aria-selected={tab === 'offers'} className={`chip ${tab === 'offers' ? 'is-active' : ''}`} onClick={() => setTab('offers')}>Sales and offers</button>
        <button role="tab" aria-selected={tab === 'orders'} className={`chip ${tab === 'orders' ? 'is-active' : ''}`} onClick={() => setTab('orders')}>All orders</button>
      </div>
      {tab === 'offers' ? <OffersAdmin /> : <OrdersAdmin />}
    </div>
  );
}

const EMPTY = { title: '', discountPercent: '20', startsAt: '', endsAt: '' };

function offerState(o) {
  const now = Date.now();
  if (new Date(o.endsAt).getTime() <= now) return 'Ended';
  if (new Date(o.startsAt).getTime() > now) return 'Upcoming';
  return 'Running';
}

function OffersAdmin() {
  const dispatch = useDispatch();
  const offers = useSelector((s) => s.admin.offers);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');

  useEffect(() => {
    dispatch(fetchOffers());
  }, [dispatch]);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    setError('');
    dispatch(
      createOffer({
        title: form.title,
        discountPercent: Number(form.discountPercent),
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: new Date(form.endsAt).toISOString(),
      })
    )
      .unwrap()
      .then(() => setForm(EMPTY))
      .catch((m) => setError(errorText(m)));
  };

  return (
    <>
      <form className="form form--grid" onSubmit={submit}>
        <h2>Schedule a sale</h2>
        <label>Name<input required maxLength="120" placeholder="Festive Season Sale" value={form.title} onChange={set('title')} /></label>
        <label>Discount (%)<input type="number" min="1" max="90" required value={form.discountPercent} onChange={set('discountPercent')} /></label>
        <label>Starts<input type="datetime-local" required value={form.startsAt} onChange={set('startsAt')} /></label>
        <label>Ends<input type="datetime-local" required value={form.endsAt} onChange={set('endsAt')} /></label>
        {error && <p className="alert span" role="alert">{error}</p>}
        <div className="row span"><button className="btn">Create sale</button></div>
        <p className="muted span">While a sale is running every product price drops by the discount and the countdown banner shows on the store. Before it starts, the banner counts down to the start.</p>
      </form>

      <div className="table-wrap">
        <table>
          <thead><tr><th>Sale</th><th>Discount</th><th>Starts</th><th>Ends</th><th>State</th><th></th></tr></thead>
          <tbody>
            {offers.map((o) => (
              <tr key={o.id}>
                <td>{o.title}</td>
                <td>{o.discountPercent}%</td>
                <td>{new Date(o.startsAt).toLocaleString()}</td>
                <td>{new Date(o.endsAt).toLocaleString()}</td>
                <td>{offerState(o)}</td>
                <td className="actions"><button className="link link--danger" onClick={() => dispatch(deleteOffer(o.id))}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function OrdersAdmin() {
  const dispatch = useDispatch();
  const orders = useSelector((s) => s.admin.orders);
  const [error, setError] = useState('');

  useEffect(() => {
    dispatch(fetchAdminOrders());
  }, [dispatch]);

  const change = (id, status) => {
    setError('');
    dispatch(updateAdminOrder({ id, status })).unwrap().catch((m) => setError(errorText(m)));
  };

  return (
    <>
      {error && <p className="alert" role="alert">{error}</p>}
      {orders.length === 0 ? (
        <p className="state">No orders yet.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Order</th><th>Customer</th><th>Seller</th><th>Placed</th><th>Payment</th><th>Total</th><th>Status</th></tr></thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>#{o.id}</td>
                  <td>{o.customerEmail}</td>
                  <td>{o.sellerName}</td>
                  <td>{shortDate(o.createdAt)}</td>
                  <td>{o.paymentMethod}</td>
                  <td>{money(o.total)}</td>
                  <td>
                    <select aria-label={`Status of order ${o.id}`} value={o.status} disabled={o.status === 'CANCELLED'} onChange={(e) => change(o.id, e.target.value)}>
                      {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                    </select>
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
