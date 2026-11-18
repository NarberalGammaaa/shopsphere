import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import ProductImage from '../components/ProductImage.jsx';
import { removeFromCart, selectCartTotal, setQuantity } from '../features/cart/cartSlice.js';
import { money } from '../utils/format.js';

export default function Cart() {
  const dispatch = useDispatch();
  const items = useSelector((s) => s.cart.items);
  const total = useSelector(selectCartTotal);

  if (items.length === 0) {
    return (
      <div className="container state">
        <h1>Your cart is empty</h1>
        <p>Find something you like and add it to your cart.</p>
        <Link to="/" className="btn">Browse products</Link>
      </div>
    );
  }

  return (
    <div className="container page">
      <h1>Your cart</h1>
      <div className="cart">
        <ul className="lines">
          {items.map((i) => (
            <li key={i.id} className="line">
              <Link to={`/product/${i.id}`} className="line__img">
                <ProductImage src={i.imageUrl} alt={i.name} seed={i.id} />
              </Link>
              <div className="line__main">
                <Link to={`/product/${i.id}`} className="line__name">{i.name}</Link>
                <span className="muted">{money(i.price)} each</span>
                <button className="link" onClick={() => dispatch(removeFromCart(i.id))}>Remove</button>
              </div>
              <div className="qty">
                <button aria-label={`Decrease quantity of ${i.name}`} onClick={() => dispatch(setQuantity({ id: i.id, quantity: i.quantity - 1 }))}>−</button>
                <span aria-live="polite">{i.quantity}</span>
                <button aria-label={`Increase quantity of ${i.name}`} onClick={() => dispatch(setQuantity({ id: i.id, quantity: i.quantity + 1 }))}>+</button>
              </div>
              <strong className="line__total">{money(i.price * i.quantity)}</strong>
            </li>
          ))}
        </ul>
        <aside className="summary">
          <h2>Order summary</h2>
          <p className="summary__row"><span>Subtotal</span><strong>{money(total)}</strong></p>
          <p className="muted">Shipping is free. Payment is collected on delivery.</p>
          <Link to="/checkout" className="btn btn--block">Go to checkout</Link>
        </aside>
      </div>
    </div>
  );
}
