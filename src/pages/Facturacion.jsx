import { useState, useEffect } from 'react'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../firebase'

const ESTADOS = ['pendiente','cobrado','vencido']
const MEDIOS  = ['Transferencia','MercadoPago','Efectivo','Otro']

function Modal({ titulo, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <span className="modal-title">{titulo}</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

const hoy = new Date()
const periodoActual = `${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,'0')}`
const EMPTY = { cliente_id:'', cliente_nombre:'', periodo:periodoActual, monto_usd:'', tc:'1200', monto_ars:'', fecha_emision: new Date().toISOString().split('T')[0], fecha_venc_cobro:'', estado:'pendiente', medio_cobro:'Transferencia', notas:'' }

export default function Facturacion() {
  const [facturas, setFacturas] = useState([])
  const [clientes, setClientes] = useState([])
  const [filtro, setFiltro]     = useState('todos')
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState(false)
  const [form, setForm]         = useState(EMPTY)
  const [selected, setSelected] = useState(null)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

  async function cargar() {
    setLoading(true)
    const [fSnap, cSnap] = await Promise.all([
      getDocs(collection(db, 'facturas')),
      getDocs(collection(db, 'clientes')),
    ])
    const data = fSnap.docs.map(d => ({ id:d.id, ...d.data() }))
      .sort((a,b) => (b.fecha_emision||'') < (a.fecha_emision||'') ? -1 : 1)
    setFacturas(data)
    setClientes(cSnap.docs.map(d => ({ id:d.id, ...d.data() })).sort((a,b) => a.nombre?.localeCompare(b.nombre||'')))
    setLoading(false)
  }
  useEffect(() => { cargar() }, [])

  const filtrado = filtro === 'todos' ? facturas : facturas.filter(f => f.estado === filtro)
  const totalMrr = facturas.filter(f => f.estado !== 'vencido').reduce((s,f) => s + (f.monto_usd||0), 0)
  const totalCobrado = facturas.filter(f => f.estado === 'cobrado').reduce((s,f) => s + (f.monto_usd||0), 0)
  const totalPendiente = facturas.filter(f => f.estado === 'pendiente').reduce((s,f) => s + (f.monto_usd||0), 0)

  function abrirNuevo() { setForm(EMPTY); setSelected(null); setError(''); setModal(true) }
  function abrirEditar(f) {
    setForm({ ...EMPTY, ...f, monto_usd: f.monto_usd?.toString()||'', tc: f.tc?.toString()||'1200', monto_ars: f.monto_ars?.toString()||'' })
    setSelected(f); setError(''); setModal(true)
  }

  const set = k => e => {
    const val = e.target.value
    if (k === 'cliente_id') {
      const c = clientes.find(c => c.id === val)
      setForm(f => ({ ...f, cliente_id: val, cliente_nombre: c?.nombre||'', monto_usd: c?.precio_usd?.toString()||f.monto_usd }))
    } else if (k === 'monto_usd' || k === 'tc') {
      setForm(f => {
        const usd = k==='monto_usd' ? parseFloat(val)||0 : parseFloat(f.monto_usd)||0
        const tc  = k==='tc' ? parseFloat(val)||0 : parseFloat(f.tc)||0
        return { ...f, [k]: val, monto_ars: usd && tc ? (usd*tc).toFixed(0) : f.monto_ars }
      })
    } else {
      setForm(f => ({ ...f, [k]: val }))
    }
  }

  async function guardar() {
    if (!form.cliente_id) return setError('Seleccioná un cliente.')
    setSaving(true); setError('')
    try {
      const data = { ...form, monto_usd: parseFloat(form.monto_usd)||0, tc: parseFloat(form.tc)||0, monto_ars: parseFloat(form.monto_ars)||0, created_at: Date.now() }
      if (!selected) await addDoc(collection(db, 'facturas'), data)
      else await updateDoc(doc(db, 'facturas', selected.id), data)
      await cargar(); setModal(false)
    } catch(e) { setError('Error al guardar.') }
    finally { setSaving(false) }
  }

  async function cambiarEstado(f, estado) {
    await updateDoc(doc(db, 'facturas', f.id), { estado })
    setFacturas(prev => prev.map(i => i.id === f.id ? { ...i, estado } : i))
  }

  async function eliminar(f) {
    if (!confirm(`¿Eliminar factura de ${f.cliente_nombre}?`)) return
    await deleteDoc(doc(db, 'facturas', f.id)); await cargar()
  }

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Facturación</div>
          <div className="page-sub">Control de cobros mensuales</div>
        </div>
        <button className="btn btn-primary" onClick={abrirNuevo}>+ Nueva factura</button>
      </div>

      {/* Resumen */}
      <div className="stats-grid" style={{ gridTemplateColumns:'repeat(3,1fr)' }}>
        <div className="stat-card">
          <div className="stat-card-top"><span className="stat-label">Total facturado</span><div className="stat-icon" style={{background:'var(--azul-pale)'}}>📊</div></div>
          <div className="stat-value" style={{fontSize:'1.5rem'}}>u$s {totalMrr.toLocaleString('es-AR')}</div>
          <div className="stat-delta">Período activo</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-top"><span className="stat-label">Cobrado</span><div className="stat-icon" style={{background:'var(--verde-cl)'}}>✅</div></div>
          <div className="stat-value" style={{fontSize:'1.5rem', color:'var(--verde)'}}>u$s {totalCobrado.toLocaleString('es-AR')}</div>
          <div className="stat-delta">{facturas.filter(f=>f.estado==='cobrado').length} facturas cobradas</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-top"><span className="stat-label">Pendiente de cobro</span><div className="stat-icon" style={{background:'var(--amber-cl)'}}>⏳</div></div>
          <div className="stat-value" style={{fontSize:'1.5rem', color:'var(--amber)'}}>u$s {totalPendiente.toLocaleString('es-AR')}</div>
          <div className="stat-delta">{facturas.filter(f=>f.estado==='pendiente').length} facturas pendientes</div>
        </div>
      </div>

      <div className="toolbar">
        {['todos','pendiente','cobrado','vencido'].map(e => (
          <button key={e} className={`btn btn-sm ${filtro===e?'btn-primary':'btn-secondary'}`} onClick={() => setFiltro(e)}>
            {e.charAt(0).toUpperCase()+e.slice(1)}
          </button>
        ))}
      </div>

      {loading ? <div className="loading"><div className="spinner"/></div> :
       filtrado.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💰</div>
          <p>No hay facturas en esta categoría.</p>
          <button className="btn btn-primary" onClick={abrirNuevo}>+ Crear primera factura</button>
        </div>
       ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Período</th>
                <th>Monto USD</th>
                <th>TC</th>
                <th>Monto ARS</th>
                <th>Vencimiento cobro</th>
                <th>Medio</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrado.map(f => (
                <tr key={f.id}>
                  <td style={{fontWeight:600}}>{f.cliente_nombre}</td>
                  <td style={{fontFamily:'monospace'}}>{f.periodo}</td>
                  <td style={{fontWeight:600}}>u$s {f.monto_usd}</td>
                  <td style={{fontSize:'.8rem', color:'var(--texto-muted)'}}>$ {f.tc}</td>
                  <td>$ {(f.monto_ars||0).toLocaleString('es-AR')}</td>
                  <td style={{fontSize:'.82rem'}}>{f.fecha_venc_cobro || '—'}</td>
                  <td><span className="chip">{f.medio_cobro}</span></td>
                  <td><span className={`badge badge-${f.estado}`}>{f.estado}</span></td>
                  <td>
                    <div style={{display:'flex',gap:'.4rem'}}>
                      {f.estado === 'pendiente' && <button className="btn btn-sm" style={{background:'var(--verde-cl)',color:'var(--verde)'}} onClick={() => cambiarEstado(f,'cobrado')}>✓</button>}
                      <button className="btn btn-sm btn-secondary" onClick={() => abrirEditar(f)}>✏️</button>
                      <button className="btn btn-sm btn-danger" onClick={() => eliminar(f)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
       )}

      {modal && (
        <Modal titulo={selected ? 'Editar factura' : '+ Nueva factura'} onClose={() => setModal(false)}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-grid">
              <div className="form-group full">
                <label>Cliente *</label>
                <select value={form.cliente_id} onChange={set('cliente_id')}>
                  <option value="">— Seleccioná un cliente —</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre} — {c.plan}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Período (AAAA-MM)</label>
                <input value={form.periodo} onChange={set('periodo')} placeholder="2025-01" />
              </div>
              <div className="form-group">
                <label>Fecha de emisión</label>
                <input type="date" value={form.fecha_emision} onChange={set('fecha_emision')} />
              </div>
              <div className="form-group">
                <label>Monto (USD)</label>
                <input type="number" value={form.monto_usd} onChange={set('monto_usd')} placeholder="130" />
              </div>
              <div className="form-group">
                <label>Tipo de cambio ($)</label>
                <input type="number" value={form.tc} onChange={set('tc')} placeholder="1200" />
              </div>
              <div className="form-group full">
                <label>Monto en pesos (calculado)</label>
                <input value={form.monto_ars ? `$ ${parseFloat(form.monto_ars).toLocaleString('es-AR')}` : ''} readOnly style={{background:'var(--gris-cl)', color:'var(--texto-muted)'}} placeholder="Se calcula automáticamente" />
              </div>
              <div className="form-group">
                <label>Vencimiento de cobro</label>
                <input type="date" value={form.fecha_venc_cobro} onChange={set('fecha_venc_cobro')} />
              </div>
              <div className="form-group">
                <label>Medio de cobro</label>
                <select value={form.medio_cobro} onChange={set('medio_cobro')}>
                  {MEDIOS.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Estado</label>
                <select value={form.estado} onChange={set('estado')}>
                  {ESTADOS.map(e => <option key={e}>{e}</option>)}
                </select>
              </div>
              <div className="form-group full">
                <label>Notas</label>
                <textarea value={form.notas} onChange={set('notas')} placeholder="Observaciones sobre este cobro..." />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={guardar} disabled={saving}>
              {saving ? 'Guardando...' : selected ? 'Guardar cambios' : 'Crear factura'}
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}
