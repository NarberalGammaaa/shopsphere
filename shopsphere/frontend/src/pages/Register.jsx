import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { clearAuthError, register } from '../features/auth/authSlice.js';

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { status, error } = useSelector((s) => s.auth);
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  const submit = (e) => {
    e.preventDefault();
    dispatch(register(form))
      .unwrap()
      .then(() => navigate(location.state?.from || '/', { replace: true }))
      .catch(() => {});
  };

  return (
    <div className="container narrow page">
      <h1>Create your account</h1>
      <form className="form" onSubmit={submit}>
        <label>
          Full name
          <input required maxLength="100" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </label>
        <label>
          Email
          <input type="email" required autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </label>
        <label>
          Password (at least 8 characters)
          <input type="password" required minLength="8" maxLength="72" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </label>
        {error && <p className="alert" role="alert">{error}</p>}
        <button className="btn" disabled={status === 'loading'}>{status === 'loading' ? 'Creating account…' : 'Create account'}</button>
      </form>
      <p className="muted">Already have an account? <Link to="/login" state={location.state}>Sign in</Link></p>
    </div>
  );
}
