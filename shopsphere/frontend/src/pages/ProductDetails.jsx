import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import ProductImage from '../components/ProductImage.jsx';
import { addToCart } from '../features/cart/cartSlice.js';
import { fetchProduct } from '../features/products/productSlice.js';
import { money } from '../utils/format.js';

export default function ProductDetails() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { current: product, detailStatus, error } = useSelector((s) => s.products);
  const inCart = useSelector((s) => s.cart.items.find((i) => i.id === Number(id))?.quantity || 0);

  useEffect(() => {
    dispatch(fetchProduct(id));
  }, [dispatch, id]);

  if (detailStatus === 'failed') {
    return (
      <div className="container state">
        <p>{error || 'Product not found.'}</p>
        <Link to="/" className="btn">Back to the shop</Link>
      </div>
    );
  }
  if (!product || String(product.id) !== id) return <p className="container state">Loading…</p>;

  const soldOut = product.stock === 0;

  return (
    <div className="container detail">
      <div className="detail__media">
        <ProductImage src={product.imageUrl} alt={product.name} seed={product.id} />
      </div>
      <div className="detail__info">
        <Link to="/" className="back">Back to all products</Link>
        <p className="card__meta">{product.categoryName}</p>
        <h1>{product.name}</h1>
        <p className="card__rating">★ {product.rating.toFixed(1)}</p>
        <p className="detail__price">{money(product.price)}</p>
        <p className="detail__desc">{product.description}</p>
        <p className={soldOut ? 'stock stock--out' : 'stock'}>
          {soldOut ? 'Sold out' : product.stock <= 10 ? `Only ${product.stock} left` : 'In stock'}
        </p>
        <div className="row">
          <button className="btn" disabled={soldOut || inCart >= product.stock} onClick={() => dispatch(addToCart(product))}>
            {inCart ? `Add another (${inCart} in cart)` : 'Add to cart'}
          </button>
          {inCart > 0 && <Link to="/cart" className="btn btn--ghost">View cart</Link>}
        </div>
      </div>
    </div>
  );
}
