import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Pagination from '../components/Pagination.jsx';
import { fetchAllOrders, updateOrderStatus } from '../features/orders/orderSlice.js';
import { deleteProduct, fetchCategories, fetchProducts, saveProduct } from '../features/products/productSlice.js';
import { money, shortDate } from '../utils/format.js';

const STATUSES = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
const EMPTY = { name: '', description: '', price: '', stock: '', imageUrl: '', categoryId: '', rating: '' };

export default function Admin() {
  const [tab, setTab] = useState('products');
  return (
    <div className="container page">
      <h1>Admin</h1>
      <div className="chips" role="tablist">
        <button role="tab" aria-selected={tab === 'products'} className={`chip ${tab === 'products' ? 'is-active' : ''}`} onClick={() => setTab('products')}>Products</button>
        <button role="tab" aria-selected={tab === 'orders'} className={`chip ${tab === 'orders' ? 'is-active' : ''}`} onClick={() => setTab('orders')}>Orders</button>
      </div>
      {tab === 'products' ? <ProductsAdmin /> : <OrdersAdmin />}
    </div>
  );
}

function ProductsAdmin() {
  const dispatch = useDispatch();
  const { items, categories, totalPages } = useSelector((s) => s.products);
  const [pageNo, setPageNo] = useState(0);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchProducts({ page: pageNo, size: 12, sort: 'newest' }));
  }, [dispatch, pageNo]);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    setError('');
    dispatch(
      saveProduct({
        id: editingId,
        name: form.name,
        description: form.description,
        price: Number(form.price),
        stock: Number(form.stock),
        imageUrl: form.imageUrl,
        categoryId: Number(form.categoryId),
        rating: form.rating === '' ? null : Number(form.rating),
      })
    )
      .unwrap()
      .then(() => {
        setForm(EMPTY);
        setEditingId(null);
      })
      .catch(setError);
  };

  const edit = (p) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      description: p.description || '',
      price: String(p.price),
      stock: String(p.stock),
      imageUrl: p.imageUrl,
      categoryId: String(p.categoryId),
      rating: String(p.rating),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = (p) => {
    if (!window.confirm(`Delete “${p.name}”?`)) return;
    setError('');
    dispatch(deleteProduct(p.id)).unwrap().catch(setError);
  };

  return (
    <>
      <form className="form form--grid" onSubmit={submit}>
        <h2>{editingId ? `Edit product #${editingId}` : 'Add a product'}</h2>
        <label>Name<input required value={form.name} onChange={set('name')} /></label>
        <label>Category
          <select required value={form.categoryId} onChange={set('categoryId')}>
            <option value="">Choose…</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label>Price<input type="number" step="0.01" min="0.01" required value={form.price} onChange={set('price')} /></label>
        <label>Stock<input type="number" min="0" required value={form.stock} onChange={set('stock')} /></label>
        <label>Rating (0 to 5)<input type="number" step="0.1" min="0" max="5" value={form.rating} onChange={set('rating')} /></label>
        <label>Image URL<input type="url" required value={form.imageUrl} onChange={set('imageUrl')} /></label>
        <label className="span">Description<textarea rows="3" value={form.description} onChange={set('description')} /></label>
        {error && <p className="alert span" role="alert">{error}</p>}
        <div className="row span">
          <button className="btn">{editingId ? 'Save changes' : 'Add product'}</button>
          {editingId && <button type="button" className="btn btn--ghost" onClick={() => { setEditingId(null); setForm(EMPTY); }}>Cancel</button>}
        </div>
      </form>

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th></th></tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.categoryName}</td>
                <td>{money(p.price)}</td>
                <td>{p.stock}</td>
                <td className="actions">
                  <button className="link" onClick={() => edit(p)}>Edit</button>
                  <button className="link link--danger" onClick={() => remove(p)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={pageNo} totalPages={totalPages} onChange={setPageNo} />
    </>
  );
}

function OrdersAdmin() {
  const dispatch = useDispatch();
  const orders = useSelector((s) => s.orders.all);
  const [error, setError] = useState('');

  useEffect(() => {
    dispatch(fetchAllOrders());
  }, [dispatch]);

  const change = (id, status) => {
    setError('');
    dispatch(updateOrderStatus({ id, status })).unwrap().catch(setError);
  };

  return (
    <>
      {error && <p className="alert" role="alert">{error}</p>}
      {orders.length === 0 ? (
        <p className="state">No orders yet.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Order</th><th>Customer</th><th>Placed</th><th>Items</th><th>Total</th><th>Status</th></tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>#{o.id}</td>
                  <td>{o.customerEmail}</td>
                  <td>{shortDate(o.createdAt)}</td>
                  <td>{o.items.reduce((n, i) => n + i.quantity, 0)}</td>
                  <td>{money(o.total)}</td>
                  <td>
                    <select
                      aria-label={`Status of order ${o.id}`}
                      value={o.status}
                      disabled={o.status === 'CANCELLED'}
                      onChange={(e) => change(o.id, e.target.value)}
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
