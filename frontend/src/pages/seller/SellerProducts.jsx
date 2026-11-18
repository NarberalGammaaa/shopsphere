import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Pagination from '../../components/Pagination.jsx';
import { fetchCategories } from '../../features/products/productSlice.js';
import { deleteSellerProduct, fetchSellerProducts, saveSellerProduct } from '../../features/seller/sellerSlice.js';
import { errorText, money } from '../../utils/format.js';

const EMPTY = { name: '', description: '', price: '', stock: '', imageUrl: '', categoryId: '', rating: '' };

export default function SellerProducts() {
  const dispatch = useDispatch();
  const categories = useSelector((s) => s.products.categories);
  const { products, totalPages } = useSelector((s) => s.seller);
  const [pageNo, setPageNo] = useState(0);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchSellerProducts({ page: pageNo, size: 12 }));
  }, [dispatch, pageNo]);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    setError('');
    dispatch(
      saveSellerProduct({
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
      .catch((m) => setError(errorText(m)));
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
    dispatch(deleteSellerProduct(p.id)).unwrap().catch((m) => setError(errorText(m)));
  };

  return (
    <>
      <h1>Products</h1>
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
          <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th></th></tr></thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.categoryName}</td>
                <td>{money(p.price)}</td>
                <td className={p.stock <= 5 ? 'low' : ''}>{p.stock}</td>
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
