import { Link, Outlet, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Home from './pages/Home.jsx';
import ProductDetails from './pages/ProductDetails.jsx';
import Cart from './pages/Cart.jsx';
import Checkout from './pages/Checkout.jsx';
import Orders from './pages/Orders.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Admin from './pages/Admin.jsx';

function Layout() {
  return (
    <>
      <Navbar />
      <main>
        <Outlet />
      </main>
      <footer className="footer">
        <div className="container">ShopSphere is a demo store built with React, Spring Boot and MySQL.</div>
      </footer>
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
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="product/:id" element={<ProductDetails />} />
        <Route path="cart" element={<Cart />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route element={<ProtectedRoute />}>
          <Route path="checkout" element={<Checkout />} />
          <Route path="orders" element={<Orders />} />
        </Route>
        <Route element={<ProtectedRoute adminOnly />}>
          <Route path="admin" element={<Admin />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
