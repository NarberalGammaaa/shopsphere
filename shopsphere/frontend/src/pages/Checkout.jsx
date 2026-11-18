import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { clearCart, selectCartTotal } from '../features/cart/cartSlice.js';
import { placeOrder } from '../features/orders/orderSlice.js';
import { money } from '../utils/format.js';

export default function Checkout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const items = useSelector((s) => s.cart.items);
  const total = useSelector(selectCartTotal);
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (items.length === 0) {
    return (
      <div className="container state">
        <h1>Nothing to check out</h1>
        <Link to="/" className="btn">Browse products</Link>
      </div>
    );
  }

  const submit = (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    const body = {
      shippingAddress: address,
      items: items.map((i) => ({ productId: i.id, quantity: i.quantity })),
    };
    dispatch(placeOrder(body))
      .unwrap()
      .then((order) => {
        dispatch(clearCart());
        navigate('/orders', { state: { placedId: order.id } });
      })
      .catch((message) => {
        setError(message);
        setBusy(false);
      });
  };

  return (
    <div className="container page">
      <h1>Checkout</h1>
      <div className="cart">
        <form className="form" onSubmit={submit}>
          <label>
            Delivery address
            <textarea
              required
              rows="4"
              maxLength="500"
              placeholder="Name, street, city, postal code"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </label>
          <p className="muted">Payment: cash on delivery. No card details are needed.</p>
          {error && <p className="alert" role="alert">{error}</p>}
          <button className="btn" disabled={busy}>{busy ? 'Placing order…' : `Place order (${money(total)})`}</button>
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
        </aside>
      </div>
    </div>
  );
}
