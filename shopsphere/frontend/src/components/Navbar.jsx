import { useDispatch, useSelector } from 'react-redux';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { logout } from '../features/auth/authSlice.js';
import { selectCartCount } from '../features/cart/cartSlice.js';

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const count = useSelector(selectCartCount);

  const signOut = () => {
    dispatch(logout());
    navigate('/');
  };

  return (
    <header className="nav">
      <div className="container nav__inner">
        <Link to="/" className="brand">
          <span className="brand__dot" aria-hidden="true" />
          ShopSphere
        </Link>

        <nav className="nav__links" aria-label="Main">
          <NavLink to="/" end>Shop</NavLink>
          {user && <NavLink to="/orders">My orders</NavLink>}
          {user?.role === 'ADMIN' && <NavLink to="/admin">Admin</NavLink>}
        </nav>

        <div className="nav__actions">
          <Link to="/cart" className="btn btn--ghost">
            Cart <span className="count">{count}</span>
          </Link>
          {user ? (
            <>
              <span className="nav__user">Hi, {user.name.split(' ')[0]}</span>
              <button className="btn btn--ghost" onClick={signOut}>Sign out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn--ghost">Sign in</Link>
              <Link to="/register" className="btn">Create account</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
