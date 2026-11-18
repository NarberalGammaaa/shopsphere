import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import Pagination from '../components/Pagination.jsx';
import ProductCard from '../components/ProductCard.jsx';
import { fetchCategories, fetchProducts } from '../features/products/productSlice.js';

export default function Home() {
  const dispatch = useDispatch();
  const [params, setParams] = useSearchParams();
  const { items, categories, totalPages, listStatus, error } = useSelector((s) => s.products);

  // Filters live in the URL so a filtered view can be bookmarked or shared.
  const q = params.get('q') || '';
  const category = params.get('category') || '';
  const sort = params.get('sort') || 'newest';
  const page = Number(params.get('page') || 0);
  const [search, setSearch] = useState(q);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    setSearch(q);
  }, [q]);

  useEffect(() => {
    dispatch(fetchProducts({ q: q || undefined, categoryId: category || undefined, sort, page, size: 12 }));
  }, [dispatch, q, category, sort, page]);

  const update = (changes) => {
    const next = Object.fromEntries(params);
    Object.entries({ page: '', ...changes }).forEach(([key, value]) => {
      if (value) next[key] = value;
      else delete next[key];
    });
    setParams(next);
  };

  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>Good gear, shipped fast.</h1>
          <p>Headphones, cameras, shoes and everyday carry. Add what you need and check out in a minute.</p>
          <form
            className="search"
            onSubmit={(e) => {
              e.preventDefault();
              update({ q: search.trim() });
            }}
          >
            <input
              type="search"
              placeholder="Search products"
              aria-label="Search products"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="btn">Search</button>
          </form>
        </div>
      </section>

      <section className="container">
        <div className="toolbar">
          <div className="chips" role="group" aria-label="Categories">
            <button className={`chip ${!category ? 'is-active' : ''}`} onClick={() => update({ category: '' })}>
              All
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                className={`chip ${String(c.id) === category ? 'is-active' : ''}`}
                onClick={() => update({ category: String(c.id) })}
              >
                {c.name}
              </button>
            ))}
          </div>
          <label className="select">
            Sort by
            <select value={sort} onChange={(e) => update({ sort: e.target.value === 'newest' ? '' : e.target.value })}>
              <option value="newest">Newest</option>
              <option value="priceAsc">Price, low to high</option>
              <option value="priceDesc">Price, high to low</option>
              <option value="rating">Top rated</option>
            </select>
          </label>
        </div>

        {listStatus === 'failed' ? (
          <div className="state">
            <p>We could not load products: {error}</p>
            <button className="btn" onClick={() => dispatch(fetchProducts({ sort, page, size: 12 }))}>Try again</button>
          </div>
        ) : items.length === 0 && listStatus === 'loading' ? (
          <p className="state">Loading products…</p>
        ) : items.length === 0 ? (
          <div className="state">
            <p>No products match{q ? ` “${q}”` : ' these filters'}. Clear the search or pick another category.</p>
            <button className="btn" onClick={() => setParams({})}>Show all products</button>
          </div>
        ) : (
          <div className={`grid ${listStatus === 'loading' ? 'is-loading' : ''}`}>
            {items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} onChange={(n) => update({ page: n ? String(n) : '' })} />
      </section>
    </>
  );
}
