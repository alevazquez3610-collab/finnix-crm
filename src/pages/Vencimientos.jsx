import { useState, useEffect } from 'react'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../firebase'

const TIPOS   = ['Monotributo','IVA','Ingresos Brutos','Ganancias','Habilitación','Otro']
const ESTADOS = ['pendiente','completado','vencido']
const MESES   = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function Modal({ titulo, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{titulo}</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

const EMPTY = { cliente_id:'', cliente_nombre:'', tipo:'Monotributo', descripcion:'', fecha_vencimiento:'', estado:'pendiente', monto:'', notas:'' }

export default function Vencimientos() {
  const [items, setItems]       = useState([])
  const [clientes, setClientes] = useState([])
  const [filtro, setFiltro]     = useState('pendiente')
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState(false)
  const [form, setForm]         = useState(EMPTY)
  const [selected, setSelected] = useState(null)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

  async function cargar() {
    setLoading(true)
    const [vSnap, cSnap] = await Promise.all([
      getDocs(collection(db, 'vencimientos')),
      getDocs(collection(db, 'clientes')),
    ])
    const data = vSnap.docs.map(d => ({ id:d.id, ...d.data() }))
      .sort((a,b) => (a.fecha_vencimiento||'') < (b.fecha_vencimiento||'') ? -1 : 1)
    setItems(data)
    setClientes(cSnap.docs.map(d => ({ id:d.id, ...d.data() })).sort((a,b) => a.nombre?.localeCompare(b.nombre||'')))
    setLoading(false)
  }
  useEffect(() => { cargar() }, [])

  const filtrado = filtro === 'todos' ? items : items.filter(i => i.estado === filtro)

  function abrirNuevo() { setForm(EMPTY); setSelected(null); setError(''); setModal(true) }
  function abrirEditar(v) { setForm({ ...EMPTY, ...v, monto: v.monto?.toString()||'' }); setSelected(v); setError(''); setModal(true) }

  const set = k => e => {
    const val = e.target.value
    if (k === 'cliente_id') {
      const c = clientes.find(c => c.id === val)
      setForm(f => ({ ...f, cliente_id: val, cliente_nombre: c?.nombre||'' }))
    } else {
      setForm(f => ({ ...f, [k]: val }))
    }
  }

  async function guardar() {
    if (!form.fecha_vencimiento) return setError('La fecha de vencimiento es obligatoria.')
    setSaving(true); setError('')
    try {
      const data = { ...form, monto: parseFloat(form.monto)||0, created_at: Date.now() }
      if (!selected) await addDoc(collection(db, 'vencimientos'), data)
      else await updateDoc(doc(db, 'vencimientos', selected.id), data)
      await cargar(); setModal(false)
    } catch(e) { setError('Error al guardar.') }
    finally { setSaving(false) }
  }

  async function cambiarEstado(v, estado) {
    await updateDoc(doc(db, 'vencimientos', v.id), { estado })
    setItems(prev => prev.map(i => i.id === v.id ? { ...i, estado } : i))
  }

  async function eliminar(v) {
    if (!confirm('¿Eliminar este vencimiento?')) return
    await deleteDoc(doc(db, 'vencimientos', v.id))
    await cargar()
  }

  function colorFecha(fecha) {
    if (!fecha) return ''
    const hoy = new Date(); hoy.setHours(0,0,0,0)
    const f = new Date(fecha)
    const diff = Math.ceil((f - hoy) / 86400000)
    if (diff < 0) return 'var(--rojo)'
    if (diff <= 3) return 'var(--amber)'
    return 'var(--verde)'
  }

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Vencimientos</div>
          <div className="page-sub">Control de obligaciones fiscales y administrativas</div>
        </div>
        <button className="btn btn-primary" onClick={abrirNuevo}>+ Nuevo vencimiento</button>
      </div>

      <div className="toolbar">
        {['todos','pendiente','completado','vencido'].map(e => (
          <button key={e} className={`btn btn-sm ${filtro===e?'btn-primary':'btn-secondary'}`} onClick={() => setFiltro(e)}>
            {e.charAt(0).toUpperCase()+e.slice(1)}
          </button>
        ))}
        <span style={{ marginLeft:'auto', fontSize:'.82rem', color:'var(--texto-muted)' }}>
          {filtrado.length} vencimiento{filtrado.length !== 1 ? 's' : ''}
        </span>
      </div>

      {loading ? <div className="loading"><div className="spinner"/></div> :
       filtrado.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <p>No hay vencimientos en esta categoría.</p>
          <button className="btn btn-primary" onClick={abrirNuevo}>+ Agregar vencimiento</button>
        </div>
       ) : (
        <div className="venc-list">
          {filtrado.map(v => {
            const f = v.fecha_vencimiento ? new Date(v.fecha_vencimiento) : null
            return (
              <div key={v.id} className="venc-item">
                {f ? (
                  <div className="venc-date" style={{ background: v.estado==='vencido' ? 'var(--rojo-cl)' : 'var(--azul-pale)' }}>
                    <div className="day" style={{ color: v.estado==='vencido' ? 'var(--rojo)' : 'var(--azul)' }}>{f.getDate()}</div>
                    <div className="month" style={{ color: v.estado==='vencido' ? 'var(--rojo)' : 'var(--azul-cl)' }}>{MESES[f.getMonth()]}</div>
                  </div>
                ) : <div className="venc-date"><div className="day">?</div></div>}

                <div className="venc-info" style={{ flex:1 }}>
                  <div className="venc-cliente">{v.cliente_nombre || 'Sin cliente asignado'}</div>
                  <div className="venc-tipo">{v.tipo} — {v.descripcion}</div>
                  {v.monto > 0 && <div style={{ fontSize:'.75rem', color:'var(--texto-muted)', marginTop:'.15rem' }}>Monto: $ {v.monto.toLocaleString('es-AR')}</div>}
                </div>

                <div className="venc-actions">
                  <span className={`badge badge-${v.estado}`}>{v.estado}</span>
                  {v.estado === 'pendiente' && (
                    <button className="btn btn-sm" style={{ background:'var(--verde-cl)', color:'var(--verde)' }} onClick={() => cambiarEstado(v,'completado')}>✓</button>
                  )}
                  <button className="btn btn-sm btn-ghost" onClick={() => abrirEditar(v)}>✏️</button>
                  <button className="btn btn-sm btn-danger" onClick={() => eliminar(v)}>🗑️</button>
                </div>
              </div>
            )
          })}
        </div>
       )}

      {modal && (
        <Modal titulo={selected ? 'Editar vencimiento' : '+ Nuevo vencimiento'} onClose={() => setModal(false)}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-grid">
              <div className="form-group full">
                <label>Cliente</label>
                <select value={form.cliente_id} onChange={set('cliente_id')}>
                  <option value="">— Sin cliente asignado —</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Tipo de obligación</label>
                <select value={form.tipo} onChange={set('tipo')}>
                  {TIPOS.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Fecha de vencimiento *</label>
                <input type="date" value={form.fecha_vencimiento} onChange={set('fecha_vencimiento')} />
              </div>
              <div className="form-group full">
                <label>Descripción</label>
                <input value={form.descripcion} onChange={set('descripcion')} placeholder="Ej: Vencimiento Monotributo categoría D" />
              </div>
              <div className="form-group">
                <label>Monto estimado ($)</label>
                <input type="number" value={form.monto} onChange={set('monto')} placeholder="0" />
              </div>
              <div className="form-group">
                <label>Estado</label>
                <select value={form.estado} onChange={set('estado')}>
                  {ESTADOS.map(e => <option key={e}>{e}</option>)}
                </select>
              </div>
              <div className="form-group full">
                <label>Notas</label>
                <textarea value={form.notas} onChange={set('notas')} placeholder="Observaciones adicionales..." />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={guardar} disabled={saving}>
              {saving ? 'Guardando...' : selected ? 'Guardar cambios' : 'Crear vencimiento'}
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}
