import { useDispatch, useSelector } from 'react-redux';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { logout } from '../features/auth/authSlice.js';

// A different shell from the customer store: dark sidebar, dashboard-style pages.
export default function SellerLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);

  const signOut = () => {
    dispatch(logout());
    navigate('/seller/login');
  };

  return (
    <div className="seller">
      <aside className="seller__side">
        <Link to="/seller" className="seller__brand">
          <span className="brand__dot" aria-hidden="true" />
          ShopSphere <small>Seller</small>
        </Link>
        <p className="seller__store">
          {user.storeName}
          <span>Dispatches from PIN {user.warehousePincode}</span>
        </p>
        <nav className="seller__nav" aria-label="Seller">
          <NavLink to="/seller" end>Dashboard</NavLink>
          <NavLink to="/seller/products">Products</NavLink>
          <NavLink to="/seller/orders">Orders</NavLink>
        </nav>
        <div className="seller__foot">
          <Link to="/">View storefront</Link>
          <button onClick={signOut}>Sign out</button>
        </div>
      </aside>
      <main className="seller__main">
        <Outlet />
      </main>
    </div>
  );
}
