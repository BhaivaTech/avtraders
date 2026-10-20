import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../lib/api.js';
import useFocusTrap from '../hooks/useFocusTrap.js';
import './Catalogue.css';

const money = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(value));
const pack = product => `${Number(product.pack_quantity)} ${product.unit}`;
const emptyProduct = { category_id: '', name: '', details: '', brand: '', product_code: '', pack_quantity: '', unit: 'gm', price: '', gst_included: true, status: 'draft' };
const errorText = error => {
  const data = error.response?.data;
  return data?.details ? Object.entries(data.details).map(([field, errors]) => `${field.replaceAll('_', ' ')}: ${errors.join(', ')}`).join(' · ') : data?.message || error.message || 'Something went wrong';
};

function Modal({ title, onClose, busy, children }) {
  const ref = useRef(null);
  useFocusTrap(ref);
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handler = event => { if (event.key === 'Escape' && !busy) onClose(); };
    document.addEventListener('keydown', handler);
    return () => { document.body.style.overflow = previous; document.removeEventListener('keydown', handler); };
  }, [onClose, busy]);
  return createPortal(<div className="catalogue-overlay" onMouseDown={event => { if (event.target === event.currentTarget && !busy) onClose(); }}>
    <section ref={ref} className="catalogue-modal" role="dialog" aria-modal="true" aria-labelledby="catalogue-dialog-title">
      <header><h2 id="catalogue-dialog-title">{title}</h2><button type="button" aria-label="Close popup" disabled={busy} onClick={onClose}>×</button></header>{children}
    </section>
  </div>, document.body);
}

export default function Catalogue({ admin = false, token }) {
  const base = admin ? '/admin/catalogue' : '/dealer/catalogue';
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('name');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [modal, setModal] = useState(null);
  const [modalError, setModalError] = useState('');
  const [form, setForm] = useState(emptyProduct);
  const [categoryName, setCategoryName] = useState('');
  const [editCategory, setEditCategory] = useState(null);
  const [revision, setRevision] = useState(0);
  const requestNumber = useRef(0);
  const close = useCallback(() => { setModal(null); setModalError(''); setCategoryName(''); setEditCategory(null); }, []);
  useEffect(() => { const timer = setTimeout(() => { setQuery(search); setPage(1); }, 250); return () => clearTimeout(timer); }, [search]);
  useEffect(() => {
    const current = ++requestNumber.current;
    const controller = new AbortController();
    setLoading(true); setError('');
    Promise.all([
      api.get(`${base}/products`, { headers, signal: controller.signal, params: { search: query, category, status, sort, page } }),
      api.get(`${base}/categories`, { headers, signal: controller.signal }),
    ]).then(([items, groups]) => {
      if (current !== requestNumber.current) return;
      setProducts(items.data.products); setTotal(Number(items.data.total)); setCategories(groups.data.categories);
      if (page > 1 && (page - 1) * 20 >= Number(items.data.total)) setPage(Math.max(1, Math.ceil(Number(items.data.total) / 20)));
    }).catch(ex => { if (!controller.signal.aborted && current === requestNumber.current) { setProducts([]); setError(errorText(ex)); } })
      .finally(() => { if (current === requestNumber.current) setLoading(false); });
    return () => controller.abort();
  }, [admin, token, query, category, status, sort, page, revision]);

  function openProduct(product) {
    setModalError(''); setCategoryName('');
    setForm(product ? { ...product, gst_included: !!Number(product.gst_included) } : { ...emptyProduct, category_id: category });
    setModal({ type: 'edit', id: product?.id });
  }
  async function viewProduct(product) {
    setError('');
    try { const response = await api.get(`${base}/products/${product.id}`, { headers }); setModal({ type: 'view', ...response.data }); }
    catch (ex) { setError(errorText(ex)); }
  }
  async function saveProduct(event) {
    event.preventDefault(); setBusy(true); setModalError('');
    try {
      await api.request({ url: `${base}/products${modal.id ? `/${modal.id}` : ''}`, method: modal.id ? 'PUT' : 'POST', data: form });
      setNotice(modal.id ? 'Product updated.' : 'Product added.'); close(); setRevision(n => n + 1);
    } catch (ex) { setModalError(errorText(ex)); }
    finally { setBusy(false); }
  }
  async function changeStatus() {
    setBusy(true); setModalError('');
    try {
      await api.patch(`${base}/products/${modal.product.id}/status`, { status: modal.status });
      setNotice(modal.status === 'archived' ? 'Product archived. You can restore it from the Archived filter.' : 'Product visibility updated.');
      close(); setRevision(n => n + 1);
    } catch (ex) { setModalError(errorText(ex)); }
    finally { setBusy(false); }
  }
  async function saveCategory(event) {
    event.preventDefault(); setBusy(true); setModalError('');
    try {
      const response = await api.request({ url: `${base}/categories${editCategory ? `/${editCategory.id}` : ''}`, method: editCategory ? 'PUT' : 'POST', data: { name: categoryName } });
      const fresh = await api.get(`${base}/categories`); setCategories(fresh.data.categories);
      if (modal.type === 'edit' && !editCategory) setForm(previous => ({ ...previous, category_id: response.data.id }));
      setCategoryName(''); setEditCategory(null); setRevision(n => n + 1);
    } catch (ex) { setModalError(errorText(ex)); }
    finally { setBusy(false); }
  }
  async function deleteCategory(item) {
    setBusy(true); setModalError('');
    try { await api.delete(`${base}/categories/${item.id}`); setCategories(previous => previous.filter(c => c.id !== item.id)); if (String(category) === String(item.id)) setCategory(''); setRevision(n => n + 1); }
    catch (ex) { setModalError(errorText(ex)); }
    finally { setBusy(false); }
  }
  const categoryForm = <form className="catalogue-category-form" onSubmit={saveCategory}><label>{editCategory ? 'Rename category' : 'New category'}<input required maxLength={120} value={categoryName} onChange={event => setCategoryName(event.target.value)} placeholder="e.g. Crop Care" /></label><button className="catalogue-primary" disabled={busy || !categoryName.trim()}>{editCategory ? 'Save category' : 'Create category'}</button>{editCategory && <button type="button" onClick={() => { setEditCategory(null); setCategoryName(''); }}>Cancel rename</button>}</form>;

  return <section className={`catalogue ${admin ? 'catalogue-admin' : ''}`}>
    <header className="catalogue-heading"><div><p className="catalogue-eyebrow">AV Agro Distribution</p><h1>{admin ? 'Products' : 'Product catalogue'}</h1><p>{admin ? 'Manage categories, pack sizes and dealer prices.' : 'Explore current dealer prices and product details.'}</p></div>
      <div className="catalogue-actions">{admin && <><button onClick={() => { close(); setModal({ type: 'categories' }); }}>Manage categories</button><button className="catalogue-primary" onClick={() => openProduct()}>+ Add product</button></>}<button aria-label="Refresh catalogue" onClick={() => setRevision(n => n + 1)}>Refresh</button></div>
    </header>
    {error && <p role="alert" className="catalogue-error">{error}</p>}{notice && <p role="status" className="catalogue-notice">{notice}</p>}
    <div className="catalogue-filters"><label className="catalogue-search">Search products<input type="search" placeholder="Name, brand, code or details…" value={search} onChange={event => setSearch(event.target.value)} /></label>
      <label>Category<select aria-label="Category" value={category} onChange={event => { setCategory(event.target.value); setPage(1); }}><option value="">All categories</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      {admin && <label>Status<select aria-label="Status" value={status} onChange={event => { setStatus(event.target.value); setPage(1); }}><option value="">All current products</option>{['published','draft','hidden','archived','all'].map(value => <option key={value} value={value}>{value === 'all' ? 'All including archived' : value}</option>)}</select></label>}
      <label>Sort by<select aria-label="Sort by" value={sort} onChange={event => { setSort(event.target.value); setPage(1); }}>{[['name','Name: A–Z'],['name_desc','Name: Z–A'],['price','Price: low to high'],['price_desc','Price: high to low'],['newest','Recently added'],['updated','Recently updated']].map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    </div>
    <div className="catalogue-table-wrap" aria-busy={loading}><table><thead><tr><th>Product name</th><th>Category</th><th>Pack size</th><th>Price</th>{admin && <th>Status</th>}<th>{admin ? 'Actions' : 'Details'}</th></tr></thead><tbody>
      {!loading && products.map(product => <tr key={product.id}><td data-label="Product"><strong>{product.name}</strong>{(product.brand || product.product_code) && <small>{[product.brand, product.product_code].filter(Boolean).join(' · ')}</small>}</td><td data-label="Category">{product.category_name}</td><td data-label="Pack size" className="catalogue-nowrap">{pack(product)}</td><td data-label="Price" className="catalogue-nowrap"><strong>{money(product.price)}</strong><small>GST {Number(product.gst_included) ? 'included' : 'extra'}</small></td>{admin && <td><span className={`catalogue-status catalogue-status-${product.status}`}>{product.status}</span></td>}<td><div className="catalogue-row-actions"><button onClick={() => viewProduct(product)}>View details</button>{admin && <><button onClick={() => openProduct(product)}>Edit</button><button onClick={() => { setModalError(''); setModal({ type: 'confirm', product, status: product.status === 'published' ? 'hidden' : 'published' }); }}>{product.status === 'published' ? 'Hide' : product.status === 'archived' ? 'Restore & publish' : 'Publish'}</button>{product.status !== 'archived' && <button className="catalogue-danger" onClick={() => { setModalError(''); setModal({ type: 'confirm', product, status: 'archived' }); }}>Archive</button>}</>}</div></td></tr>)}
    </tbody></table>{loading ? <p className="catalogue-empty" role="status">Loading products…</p> : !products.length && <div className="catalogue-empty"><h3>No products found</h3><p>{query || category || status ? 'Try another search or filter.' : admin ? 'Create a category, then add your first product.' : 'Products will appear here once published.'}</p></div>}</div>
    <footer className="catalogue-pagination"><span>{total} product{total === 1 ? '' : 's'} · Page {page} of {Math.max(1, Math.ceil(total / 20))}</span><div><button disabled={page === 1 || loading} onClick={() => setPage(n => n - 1)}>Previous</button><button disabled={page * 20 >= total || loading} onClick={() => setPage(n => n + 1)}>Next</button></div></footer>

    {modal && <Modal title={modal.type === 'edit' ? modal.id ? 'Edit product' : 'Add product' : modal.type === 'categories' ? 'Manage categories' : modal.type === 'view' ? modal.product.name : modal.status === 'archived' ? 'Archive product?' : modal.status === 'hidden' ? 'Hide product?' : 'Publish product?'} onClose={close} busy={busy}>
      {modalError && <p role="alert" className="catalogue-error">{modalError}</p>}
      {modal.type === 'edit' && <><form onSubmit={saveProduct} id="catalogue-product-form"><fieldset disabled={busy} className="catalogue-form-grid">
        <label>Category *<select aria-label="Category *" required value={form.category_id} onChange={event => setForm({ ...form, category_id: event.target.value })}><option value="">Select category</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Product name *<input required maxLength={180} value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} /></label>
        <label>Brand<input maxLength={120} value={form.brand} onChange={event => setForm({ ...form, brand: event.target.value })} /></label><label>Product code<input maxLength={80} value={form.product_code} onChange={event => setForm({ ...form, product_code: event.target.value })} /></label>
        <label className="catalogue-full">Details *<textarea required rows={4} maxLength={10000} value={form.details} onChange={event => setForm({ ...form, details: event.target.value })} /></label>
        <label>Pack quantity *<input type="number" required min="0.001" max="999999999" step="0.001" value={form.pack_quantity} onChange={event => setForm({ ...form, pack_quantity: event.target.value })} /></label><label>Unit *<select aria-label="Unit *" value={form.unit} onChange={event => setForm({ ...form, unit: event.target.value })}>{['mg','gm','kg','ml','litre','pcs'].map(unit => <option key={unit}>{unit}</option>)}</select></label>
        <label>Price per pack (₹) *<input type="number" required min="0" max="9999999999.99" step="0.01" value={form.price} onChange={event => setForm({ ...form, price: event.target.value })} /></label><label>GST<select aria-label="GST" value={String(form.gst_included)} onChange={event => setForm({ ...form, gst_included: event.target.value === 'true' })}><option value="true">Included in price</option><option value="false">Extra</option></select></label>
        <label>Status<select aria-label="Status" value={form.status} onChange={event => setForm({ ...form, status: event.target.value })}>{['draft','published','hidden','archived'].map(value => <option key={value}>{value}</option>)}</select></label>
      </fieldset><div className="catalogue-modal-actions"><button type="button" disabled={busy} onClick={close}>Cancel</button><button className="catalogue-primary" disabled={busy}>{busy ? 'Saving…' : form.status === 'published' ? 'Publish product' : form.status === 'draft' ? 'Save draft' : 'Save product'}</button></div></form><details className="catalogue-inline-category"><summary>Create a new category</summary>{categoryForm}</details></>}
      {modal.type === 'categories' && <>{categoryForm}<ul className="catalogue-categories">{categories.map(item => <li key={item.id}><span><strong>{item.name}</strong><small>{item.product_count} products</small></span><button disabled={busy} onClick={() => { setEditCategory(item); setCategoryName(item.name); }}>Rename</button><button disabled={busy || Number(item.product_count) > 0} title={Number(item.product_count) > 0 ? 'Move products before deleting this category' : 'Delete empty category'} onClick={() => deleteCategory(item)}>Delete</button></li>)}</ul>{!categories.length && <p>No categories yet. Create your first category above.</p>}</>}
      {modal.type === 'view' && <><dl className="catalogue-details">{[['Category',modal.product.category_name],['Pack size',pack(modal.product)],['Brand',modal.product.brand || '—'],['Product code',modal.product.product_code || '—'],['Price per pack',money(modal.product.price)],['GST',Number(modal.product.gst_included) ? 'Included' : 'Extra']].map(([label,value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><h3>Product details</h3><p className="catalogue-description">{modal.product.details}</p>{admin && <><h3>Price and activity history</h3><ul className="catalogue-history">{modal.history?.map(item => <li key={item.id}><strong>{item.action}</strong> · {item.old_price === null ? 'Initial price' : money(item.old_price)} → {money(item.new_price)}<small>{item.actor} · {new Date(item.created_at).toLocaleString()}</small></li>)}</ul></>}<div className="catalogue-modal-actions"><button onClick={close}>Close</button></div></>}
      {modal.type === 'confirm' && <><p><strong>{modal.product.name}</strong></p><p>{modal.status === 'archived' ? 'This product will disappear from the distributor catalogue. Its history is preserved and it can be restored later.' : modal.status === 'hidden' ? 'Distributors will no longer see this product.' : 'This product and its current price will be visible to all approved distributors.'}</p><div className="catalogue-modal-actions"><button disabled={busy} onClick={close}>Cancel</button><button className="catalogue-primary" disabled={busy} onClick={changeStatus}>{busy ? 'Saving…' : 'Confirm'}</button></div></>}
    </Modal>}
  </section>;
}
