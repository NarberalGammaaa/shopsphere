import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { clearAuthError, sellerLogin } from '../../features/auth/authSlice.js';

export default function SellerLogin() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { status, error } = useSelector((s) => s.auth);
  const [form, setForm] = useState({ email: '', password: '' });

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  const submit = (e) => {
    e.preventDefault();
    dispatch(sellerLogin(form))
      .unwrap()
      .then(() => navigate(location.state?.from || '/seller', { replace: true }))
      .catch(() => {});
  };

  return (
    <div className="auth-split">
      <section className="auth-split__pitch">
        <Link to="/" className="seller__brand"><span className="brand__dot" aria-hidden="true" />ShopSphere <small>Seller</small></Link>
        <h1>Run your store from one dashboard.</h1>
        <ul>
          <li>List products and manage stock</li>
          <li>See and ship the orders that are yours</li>
          <li>Customers get a delivery date from your PIN code</li>
        </ul>
      </section>
      <section className="auth-split__form">
        <h2>Seller sign in</h2>
        <form className="form" onSubmit={submit}>
          <label>Email<input type="email" required autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          <label>Password<input type="password" required autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
          {error && <p className="alert" role="alert">{error}</p>}
          <button className="btn" disabled={status === 'loading'}>{status === 'loading' ? 'Signing in…' : 'Sign in'}</button>
        </form>
        <p className="muted">New seller? <Link to="/seller/register">Open your store</Link></p>
        <p className="muted">Shopping instead? <Link to="/login">Customer sign in</Link></p>
        <p className="hint">Demo sellers: tech@shopsphere.com or style@shopsphere.com / Seller@123</p>
      </section>
    </div>
  );
}
