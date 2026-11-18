import { useSelector } from 'react-redux';
import { Link, Outlet, Route, Routes } from 'react-router-dom';
import ChatWidget from './components/ChatWidget.jsx';
import Navbar from './components/Navbar.jsx';
import OfferBanner from './components/OfferBanner.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import SellerLayout from './components/SellerLayout.jsx';
import Admin from './pages/Admin.jsx';
import Cart from './pages/Cart.jsx';
import Checkout from './pages/Checkout.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import OrderTracking from './pages/OrderTracking.jsx';
import Orders from './pages/Orders.jsx';
import ProductDetails from './pages/ProductDetails.jsx';
import Register from './pages/Register.jsx';
import SellerDashboard from './pages/seller/SellerDashboard.jsx';
import SellerLogin from './pages/seller/SellerLogin.jsx';
import SellerOrders from './pages/seller/SellerOrders.jsx';
import SellerProducts from './pages/seller/SellerProducts.jsx';
import SellerRegister from './pages/seller/SellerRegister.jsx';

// The customer storefront shell (banner, navbar, footer and the order-help chat).
function StoreLayout() {
  const role = useSelector((s) => s.auth.user?.role);
  return (
    <>
      <OfferBanner />
      <Navbar />
      <main>
        <Outlet />
      </main>
      <footer className="footer">
        <div className="container">ShopSphere is a demo store built with React, Spring Boot and MySQL.</div>
      </footer>
      {role === 'CUSTOMER' && <ChatWidget />}
    </>
  );
}

function NotFound() {
  return (
    <div className="container state">
      <h1>Page not found</h1>
      <p>The page you asked for does not exist.</p>
      <Link to="/" className="btn">Back to the shop</Link>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* ---------- customer storefront ---------- */}
      <Route element={<StoreLayout />}>
        <Route index element={<Home />} />
        <Route path="product/:id" element={<ProductDetails />} />
        <Route path="cart" element={<Cart />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route element={<ProtectedRoute roles={['CUSTOMER']} />}>
          <Route path="checkout" element={<Checkout />} />
          <Route path="orders" element={<Orders />} />
          <Route path="orders/:id" element={<OrderTracking />} />
        </Route>
        <Route element={<ProtectedRoute roles={['ADMIN']} />}>
          <Route path="admin" element={<Admin />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* ---------- seller portal: own sign-in and own layout ---------- */}
      <Route path="seller/login" element={<SellerLogin />} />
      <Route path="seller/register" element={<SellerRegister />} />
      <Route element={<ProtectedRoute roles={['SELLER']} loginPath="/seller/login" />}>
        <Route element={<SellerLayout />}>
          <Route path="seller" element={<SellerDashboard />} />
          <Route path="seller/products" element={<SellerProducts />} />
          <Route path="seller/orders" element={<SellerOrders />} />
        </Route>
      </Route>
    </Routes>
  );
}
