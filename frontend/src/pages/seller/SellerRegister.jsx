import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { clearAuthError, sellerRegister } from '../../features/auth/authSlice.js';

export default function SellerRegister() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error } = useSelector((s) => s.auth);
  const [form, setForm] = useState({ name: '', email: '', password: '', storeName: '', warehousePincode: '' });

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    dispatch(sellerRegister(form))
      .unwrap()
      .then(() => navigate('/seller', { replace: true }))
      .catch(() => {});
  };

  return (
    <div className="auth-split">
      <section className="auth-split__pitch">
        <Link to="/" className="seller__brand"><span className="brand__dot" aria-hidden="true" />ShopSphere <small>Seller</small></Link>
        <h1>Open your store.</h1>
        <ul>
          <li>Your dispatch PIN code decides the delivery time customers see</li>
          <li>Each order you receive is yours to ship</li>
        </ul>
      </section>
      <section className="auth-split__form">
        <h2>Create a seller account</h2>
        <form className="form" onSubmit={submit}>
          <label>Your name<input required maxLength="100" value={form.name} onChange={set('name')} /></label>
          <label>Store name<input required maxLength="120" value={form.storeName} onChange={set('storeName')} /></label>
          <label>
            Dispatch PIN code
            <input required inputMode="numeric" pattern="[1-9][0-9]{5}" maxLength="6" title="6-digit PIN code" value={form.warehousePincode}
              onChange={(e) => setForm({ ...form, warehousePincode: e.target.value.replace(/\D/g, '') })} />
          </label>
          <label>Email<input type="email" required autoComplete="email" value={form.email} onChange={set('email')} /></label>
          <label>Password (at least 8 characters)<input type="password" required minLength="8" maxLength="72" autoComplete="new-password" value={form.password} onChange={set('password')} /></label>
          {error && <p className="alert" role="alert">{error}</p>}
          <button className="btn" disabled={status === 'loading'}>{status === 'loading' ? 'Creating…' : 'Create seller account'}</button>
        </form>
        <p className="muted">Already selling? <Link to="/seller/login">Sign in</Link></p>
      </section>
    </div>
  );
}
