import { useSelector } from 'react-redux';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

// roles: which roles may enter. Anyone else is sent to the right home for their role.
export default function ProtectedRoute({ roles, loginPath = '/login' }) {
  const user = useSelector((s) => s.auth.user);
  const location = useLocation();

  if (!user) return <Navigate to={loginPath} state={{ from: location.pathname }} replace />;
  if (roles && !roles.includes(user.role)) {
    const home = user.role === 'SELLER' ? '/seller' : user.role === 'ADMIN' ? '/admin' : '/';
    return <Navigate to={home} replace />;
  }
  return <Outlet />;
}
