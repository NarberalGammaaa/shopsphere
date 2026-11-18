import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { clearAuthError, login } from '../features/auth/authSlice.js';

export default function Login() {
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
    dispatch(login(form))
      .unwrap()
      .then((auth) => navigate(location.state?.from || (auth.user.role === 'ADMIN' ? '/admin' : '/'), { replace: true }))
      .catch(() => {}); // the message is already in the auth slice
  };

  return (
    <div className="container narrow page">
      <h1>Sign in</h1>
      <form className="form" onSubmit={submit}>
        <label>
          Email
          <input type="email" required autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </label>
        <label>
          Password
          <input type="password" required autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </label>
        {error && <p className="alert" role="alert">{error}</p>}
        <button className="btn" disabled={status === 'loading'}>{status === 'loading' ? 'Signing in…' : 'Sign in'}</button>
      </form>
      <p className="muted">New here? <Link to="/register" state={location.state}>Create an account</Link></p>
      <p className="muted">Selling on ShopSphere? <Link to="/seller/login">Go to the seller portal</Link></p>
      <p className="hint">
        Demo shopper: user@shopsphere.com / User@1234<br />
        Demo admin: admin@shopsphere.com / Admin@123
      </p>
    </div>
  );
}
