'use client'
import { useEffect, useState } from 'react'
import { getItems, createItem, updateItem, deleteItem, Item, ItemType } from '@/lib/api'

const lbl: React.CSSProperties = { color: '#374151', fontSize: 12, fontWeight: 500 }
const UNITS = ['pcs', 'kg', 'meter', 'box', 'dozen', 'liter', 'roll', 'pack']
const ITEM_TYPES: { value: ItemType; label: string }[] = [
  { value: 'selling', label: 'Selling Item' },
  { value: 'production', label: 'Production Item' },
]

const emptyForm = {
  item_type: '' as ItemType | '',
  name: '', code: '', category: '', roll_no: '', model_no: '', size: '', color: '', base_unit: 'pcs',
  purchase_price: '', selling_price: '', price_includes_tax: false, tax_percent: '', discount_percent: '',
  store: '', track_inventory: false, opening_stock: '', warehouse: '', description: '',
}

const finalPrice = (item: Pick<Item, 'selling_price' | 'discount_percent' | 'tax_percent' | 'price_includes_tax'>) => {
  const discounted = Number(item.selling_price) * (1 - Number(item.discount_percent) / 100)
  return item.price_includes_tax ? discounted : discounted * (1 + Number(item.tax_percent) / 100)
}

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState<ItemType | ''>('')
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [modalError, setModalError] = useState('')
  const [newCategoryMode, setNewCategoryMode] = useState(false)

  const notify = (msg: string) => { setSuccess(msg); setError(''); setTimeout(() => setSuccess(''), 3000) }
  const fail = (msg: string) => { setError(msg); setSuccess('') }

  const load = async () => {
    setLoading(true)
    try { const res = await getItems(); setItems(res.data) } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setModalError(''); setNewCategoryMode(false); setModalOpen(true) }
  const openEdit = (i: Item) => {
    setForm({
      item_type: i.item_type,
      name: i.name, code: i.code, category: i.category || '', roll_no: i.roll_no || '', model_no: i.model_no || '',
      size: i.size || '', color: i.color || '',
      base_unit: i.base_unit || 'pcs',
      purchase_price: String(i.purchase_price), selling_price: String(i.selling_price),
      price_includes_tax: i.price_includes_tax, tax_percent: String(i.tax_percent),
      discount_percent: String(i.discount_percent), store: i.store || '', track_inventory: i.track_inventory,
      opening_stock: i.opening_stock !== null ? String(i.opening_stock) : '',
      warehouse: i.warehouse || '', description: i.description || '',
    })
    setEditingId(i.id); setModalError(''); setNewCategoryMode(false); setModalOpen(true)
  }
  const closeModal = () => setModalOpen(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.item_type) { setModalError('Please select an Item Type'); return }
    setSaving(true)
    try {
      const payload = {
        item_type: form.item_type,
        name: form.name, code: form.code.toUpperCase(), category: form.category,
        roll_no: form.roll_no, model_no: form.model_no,
        size: form.size, color: form.color, base_unit: form.base_unit,
        purchase_price: parseFloat(form.purchase_price) || 0, selling_price: parseFloat(form.selling_price) || 0,
        price_includes_tax: form.price_includes_tax, tax_percent: parseFloat(form.tax_percent) || 0,
        discount_percent: parseFloat(form.discount_percent) || 0, store: form.store, track_inventory: form.track_inventory,
        opening_stock: form.track_inventory && form.opening_stock ? parseInt(form.opening_stock) : null,
        warehouse: form.track_inventory ? form.warehouse : '', description: form.description,
      }
      if (editingId) { await updateItem(editingId, payload); notify('Item updated') }
      else { await createItem(payload); notify(`"${form.name}" added`) }
      setModalOpen(false)
      await load()
    } catch (err: unknown) {
      const data = (err as { response?: { data?: Record<string, string[]> } })?.response?.data
      if (data?.code) setModalError('Code / SKU already exists — use a different one')
      else setModalError(data ? Object.values(data).flat().join(' | ') : 'Failed to save item')
    } finally { setSaving(false) }
  }

  const handleDelete = async (i: Item) => {
    if (!confirm(`Delete "${i.name}"? This cannot be undone.`)) return
    try { await deleteItem(i.id); notify(`"${i.name}" deleted`); await load() } catch { fail('Failed to delete') }
  }

  const categories = Array.from(new Set(items.map(i => i.category).filter(Boolean))).sort()

  const filtered = items.filter(i => {
    if (typeFilter && i.item_type !== typeFilter) return false
    if (categoryFilter && i.category !== categoryFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return i.name.toLowerCase().includes(q) || i.code.toLowerCase().includes(q) ||
             (i.category || '').toLowerCase().includes(q) ||
             (i.roll_no || '').toLowerCase().includes(q) || (i.model_no || '').toLowerCase().includes(q)
    }
    return true
  })

  return (
    <main style={{ padding: 24, minHeight: '100vh' }}>
      <div style={{ maxWidth: 1440, margin: '0 auto' }}>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between" style={{ marginBottom: 20, gap: 12 }}>
          <div>
            <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 4px' }}>Home · Items</p>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', margin: 0 }}>Items</h1>
          </div>
          <button onClick={openCreate} className="btn-gold w-full sm:w-auto" style={{ background: '#0d9488' }}>
            + Add Item
          </button>
        </div>

        {success && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', borderRadius: 6, padding: '10px 14px', fontSize: 13, fontWeight: 500, marginBottom: 16 }}>
            {success}
          </div>
        )}
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 6, padding: '10px 14px', fontSize: 13, fontWeight: 500, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {/* Filter bar */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', paddingBottom: 16 }}>
          <span style={{ background: '#f0fdfa', color: '#0d9488', border: '1px solid #99f6e4', borderRadius: 999, padding: '2px 10px', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
            {filtered.length}
          </span>
          <input className="field" style={{ flex: '1 1 200px', minWidth: 0 }} placeholder="Search item, code, category, roll no, model no…"
            value={search} onChange={e => setSearch(e.target.value)} />
          <select className="field" style={{ width: 'auto' }} value={typeFilter} onChange={e => setTypeFilter(e.target.value as ItemType | '')}>
            <option value="">All Types</option>
            {ITEM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select className="field" style={{ width: 'auto' }} value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Card grid */}
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '64px', color: '#94a3b8' }}>
            <span className="spinner" /><span style={{ fontSize: 13 }}>Loading…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px', fontSize: 13, color: '#9ca3af', border: '1px solid #e2e8f0', borderRadius: 8 }}>
            {items.length === 0 ? 'No items yet. Click + Add Item to create one.' : 'No items match your search.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" style={{ gap: 16 }}>
            {filtered.map(item => (
              <div key={item.id} className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ minWidth: 0 }}>
                    <span style={{
                      display: 'inline-block', marginBottom: 4, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px',
                      color: item.item_type === 'selling' ? '#2563eb' : '#7c3aed',
                      background: item.item_type === 'selling' ? '#eff6ff' : '#f5f3ff',
                      border: `1px solid ${item.item_type === 'selling' ? '#bfdbfe' : '#ddd6fe'}`,
                      borderRadius: 4, padding: '1px 6px',
                    }}>
                      {item.item_type === 'selling' ? 'Selling' : 'Production'}
                    </span>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.name}
                    </p>
                    <span style={{ display: 'inline-block', marginTop: 4, fontSize: 11, fontWeight: 600, color: '#0d9488', background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: 4, padding: '1px 6px' }}>
                      {item.code}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <button onClick={() => openEdit(item)} className="btn-ghost" style={{ padding: '3px 8px', fontSize: 11 }}>Edit</button>
                    <button onClick={() => handleDelete(item)} className="btn-danger" style={{ padding: '3px 8px', fontSize: 11 }}>Del</button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {item.category && <span className="badge badge-blue">{item.category}</span>}
                  {item.size && <span style={{ fontSize: 11, fontWeight: 600, color: '#7c3aed', background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 4, padding: '1px 6px' }}>{item.size}</span>}
                  {item.color && <span style={{ fontSize: 11, fontWeight: 600, color: '#be185d', background: '#fdf2f8', border: '1px solid #fbcfe8', borderRadius: 4, padding: '1px 6px' }}>{item.color}</span>}
                  <span style={{ color: '#64748b', fontSize: 12 }}>per {item.base_unit}</span>
                </div>

                {(item.roll_no || item.model_no) && (
                  <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#64748b' }}>
                    {item.roll_no && <span>Roll: <strong style={{ color: '#1e293b' }}>{item.roll_no}</strong></span>}
                    {item.model_no && <span>Model: <strong style={{ color: '#1e293b' }}>{item.model_no}</strong></span>}
                  </div>
                )}

                <div style={{ background: '#f0fdfa', border: '1px solid #ccfbf1', borderRadius: 8, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: '#64748b' }}>Purchase Price</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>AED {Number(item.purchase_price).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: '#64748b' }}>Selling Price</span>
                    {Number(item.discount_percent) > 0 ? (
                      <span style={{ fontSize: 12, color: '#94a3b8', textDecoration: 'line-through' }}>AED {Number(item.selling_price).toFixed(2)}</span>
                    ) : (
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>AED {Number(item.selling_price).toFixed(2)}</span>
                    )}
                  </div>
                  {Number(item.discount_percent) > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, color: '#64748b' }}>Discount</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#dc2626' }}>− {item.discount_percent}%</span>
                    </div>
                  )}
                  {Number(item.tax_percent) > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, color: '#64748b' }}>Tax {item.price_includes_tax ? '(incl.)' : '(+)'}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#d97706' }}>{item.tax_percent}%</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #ccfbf1', paddingTop: 4, marginTop: 2 }}>
                    <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Final Price</span>
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#0d9488' }}>AED {finalPrice(item).toFixed(2)}</span>
                  </div>
                </div>

                {item.track_inventory ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}>
                    <span style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 4, padding: '2px 8px', fontWeight: 600 }}>
                      Stock: {item.opening_stock ?? 0}
                    </span>
                    {item.warehouse && <span style={{ color: '#94a3b8' }}>{item.warehouse}</span>}
                  </div>
                ) : (
                  <span style={{ fontSize: 11, color: '#9ca3af' }}>Inventory not tracked</span>
                )}

                {item.store && (
                  <span style={{ fontSize: 11, color: '#64748b' }}>Store: <strong style={{ color: '#1e293b' }}>{item.store}</strong></span>
                )}

                {item.description && (
                  <p style={{ fontSize: 11, color: '#94a3b8', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {item.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit modal */}
      {modalOpen && (
        <div onClick={closeModal}
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}>
          <div onClick={e => e.stopPropagation()} className="card" style={{ width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #e8ecf0', background: '#f8f9fb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{editingId ? 'Edit Item' : 'Add Item'}</span>
              <button onClick={closeModal} className="btn-ghost" style={{ padding: '4px 10px', fontSize: 14 }}>×</button>
            </div>

            {modalError && (
              <div style={{ margin: '14px 20px 0', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 6, padding: '8px 12px', fontSize: 12, fontWeight: 500 }}>
                {modalError}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ ...lbl, display: 'block', marginBottom: 5 }}>Item Type *</label>
                <div className="grid grid-cols-2 gap-3">
                  {ITEM_TYPES.map(t => (
                    <button key={t.value} type="button" onClick={() => setForm(p => ({ ...p, item_type: t.value }))}
                      style={{
                        padding: '10px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        border: form.item_type === t.value ? '2px solid #0d9488' : '1px solid #d1d5db',
                        background: form.item_type === t.value ? '#f0fdfa' : '#ffffff',
                        color: form.item_type === t.value ? '#0d9488' : '#374151',
                      }}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={{ ...lbl, display: 'block', marginBottom: 5 }}>Item Name *</label>
                  <input className="field" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Cotton Fabric" required />
                </div>
                <div>
                  <label style={{ ...lbl, display: 'block', marginBottom: 5 }}>Item Code / SKU *</label>
                  <input className="field" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                    placeholder="e.g. CF-001" maxLength={30} required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={{ ...lbl, display: 'block', marginBottom: 5 }}>Category</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {newCategoryMode ? (
                      <input className="field" style={{ flex: 1 }} value={form.category} autoFocus
                        onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                        placeholder="New category name" />
                    ) : (
                      <select className="field" style={{ flex: 1 }} value={form.category}
                        onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                        <option value="">Select category</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    )}
                    <button type="button"
                      onClick={() => { setNewCategoryMode(v => !v); setForm(p => ({ ...p, category: '' })) }}
                      className="btn-ghost" style={{ padding: '6px 12px', fontSize: 16, fontWeight: 700, flexShrink: 0 }}>
                      {newCategoryMode ? '×' : '+'}
                    </button>
                  </div>
                </div>
                <div>
                  <label style={{ ...lbl, display: 'block', marginBottom: 5 }}>Base Unit</label>
                  <select className="field" value={form.base_unit} onChange={e => setForm(p => ({ ...p, base_unit: e.target.value }))}>
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={{ ...lbl, display: 'block', marginBottom: 5 }}>Roll No</label>
                  <input className="field" value={form.roll_no} onChange={e => setForm(p => ({ ...p, roll_no: e.target.value }))}
                    placeholder="e.g. RL-045" />
                </div>
                <div>
                  <label style={{ ...lbl, display: 'block', marginBottom: 5 }}>Manufacture (Model No.)</label>
                  <input className="field" value={form.model_no} onChange={e => setForm(p => ({ ...p, model_no: e.target.value }))}
                    placeholder="e.g. MD-2201" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={{ ...lbl, display: 'block', marginBottom: 5 }}>Size</label>
                  <input className="field" value={form.size} onChange={e => setForm(p => ({ ...p, size: e.target.value }))}
                    placeholder="e.g. M, 42, Free Size" />
                </div>
                <div>
                  <label style={{ ...lbl, display: 'block', marginBottom: 5 }}>Color</label>
                  <input className="field" value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))}
                    placeholder="e.g. Red" />
                </div>
              </div>

              <div>
                <label style={{ ...lbl, display: 'block', marginBottom: 5 }}>Store</label>
                <input className="field" value={form.store} onChange={e => setForm(p => ({ ...p, store: e.target.value }))}
                  placeholder="e.g. Deira Main Store" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={{ ...lbl, display: 'block', marginBottom: 5 }}>Purchase Price (AED)</label>
                  <input type="number" min="0" step="0.01" className="field" value={form.purchase_price}
                    onChange={e => setForm(p => ({ ...p, purchase_price: e.target.value }))} placeholder="0.00" />
                </div>
                <div>
                  <label style={{ ...lbl, display: 'block', marginBottom: 5 }}>Selling Price (AED)</label>
                  <input type="number" min="0" step="0.01" className="field" value={form.selling_price}
                    onChange={e => setForm(p => ({ ...p, selling_price: e.target.value }))} placeholder="0.00" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={{ ...lbl, display: 'block', marginBottom: 5 }}>Tax (%)</label>
                  <input type="number" min="0" step="0.01" className="field" value={form.tax_percent}
                    onChange={e => setForm(p => ({ ...p, tax_percent: e.target.value }))} placeholder="e.g. 5" />
                </div>
                <div>
                  <label style={{ ...lbl, display: 'block', marginBottom: 5 }}>Discount (%)</label>
                  <input type="number" min="0" max="100" step="0.01" className="field" value={form.discount_percent}
                    onChange={e => setForm(p => ({ ...p, discount_percent: e.target.value }))} placeholder="0" />
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.price_includes_tax}
                  onChange={e => setForm(p => ({ ...p, price_includes_tax: e.target.checked }))}
                  style={{ width: 16, height: 16, accentColor: '#0d9488' }} />
                <span style={{ ...lbl }}>Selling price includes tax</span>
              </label>

              {form.selling_price && !isNaN(+form.selling_price) && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: 6 }}>
                  <span style={{ fontSize: 12, color: '#6b7280' }}>Final Price</span>
                  <span style={{ fontWeight: 700, fontSize: 14, color: '#0d9488' }}>
                    AED {finalPrice({
                      selling_price: +form.selling_price || 0,
                      discount_percent: +form.discount_percent || 0,
                      tax_percent: +form.tax_percent || 0,
                      price_includes_tax: form.price_includes_tax,
                    }).toFixed(2)}
                  </span>
                </div>
              )}

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.track_inventory}
                  onChange={e => setForm(p => ({ ...p, track_inventory: e.target.checked }))}
                  style={{ width: 16, height: 16, accentColor: '#0d9488' }} />
                <span style={{ ...lbl }}>Track Inventory</span>
              </label>

              {form.track_inventory && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label style={{ ...lbl, display: 'block', marginBottom: 5 }}>Opening Stock</label>
                    <input type="number" min="0" className="field" value={form.opening_stock}
                      onChange={e => setForm(p => ({ ...p, opening_stock: e.target.value }))} placeholder="0" />
                  </div>
                  <div>
                    <label style={{ ...lbl, display: 'block', marginBottom: 5 }}>Warehouse</label>
                    <input className="field" value={form.warehouse} onChange={e => setForm(p => ({ ...p, warehouse: e.target.value }))}
                      placeholder="e.g. Main Store" />
                  </div>
                </div>
              )}

              <div>
                <label style={{ ...lbl, display: 'block', marginBottom: 5 }}>
                  Description <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span>
                </label>
                <input className="field" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Notes…" />
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" disabled={saving} className="btn-gold" style={{ flex: 1, background: '#0d9488' }}>
                  {saving ? 'Saving…' : editingId ? 'Update Item' : 'Save Item'}
                </button>
                <button type="button" onClick={closeModal} className="btn-ghost" style={{ padding: '8px 18px' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
