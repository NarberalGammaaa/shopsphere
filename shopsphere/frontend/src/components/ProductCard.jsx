import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { addToCart } from '../features/cart/cartSlice.js';
import { money } from '../utils/format.js';
import ProductImage from './ProductImage.jsx';

export default function ProductCard({ product }) {
  const dispatch = useDispatch();
  const inCart = useSelector((s) => s.cart.items.find((i) => i.id === product.id)?.quantity || 0);
  const soldOut = product.stock === 0;
  const label = soldOut ? 'Sold out' : inCart ? `Add another (${inCart} in cart)` : 'Add to cart';

  return (
    <article className="card">
      <Link to={`/product/${product.id}`} className="card__media" aria-label={product.name}>
        <ProductImage src={product.imageUrl} alt={product.name} seed={product.id} />
        <span className="sticker">{money(product.price)}</span>
      </Link>
      <div className="card__body">
        <p className="card__meta">{product.categoryName}</p>
        <h3 className="card__title">
          <Link to={`/product/${product.id}`}>{product.name}</Link>
        </h3>
        <p className="card__rating" aria-label={`Rated ${product.rating} out of 5`}>★ {product.rating.toFixed(1)}</p>
        <button
          className="btn btn--block"
          disabled={soldOut || inCart >= product.stock}
          onClick={() => dispatch(addToCart(product))}
        >
          {label}
        </button>
      </div>
    </article>
  );
}
