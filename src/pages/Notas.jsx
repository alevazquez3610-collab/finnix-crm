import { useState, useEffect } from 'react'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../firebase'

const TIPOS = ['General','Fiscal','Financiero','Estratégico','Digital','Urgente']

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

const EMPTY = { cliente_id:'', cliente_nombre:'', tipo:'General', texto:'', fecha: new Date().toISOString().split('T')[0] }

const TIPO_COLORS = {
  General:     { bg:'var(--azul-pale)', color:'var(--azul)' },
  Fiscal:      { bg:'var(--verde-cl)', color:'var(--verde)' },
  Financiero:  { bg:'var(--purp-cl)', color:'var(--purp)' },
  Estratégico: { bg:'var(--amber-cl)', color:'var(--amber)' },
  Digital:     { bg:'#E0F2FE', color:'#0369A1' },
  Urgente:     { bg:'var(--rojo-cl)', color:'var(--rojo)' },
}

export default function Notas() {
  const [notas, setNotas]       = useState([])
  const [clientes, setClientes] = useState([])
  const [filtroC, setFiltroC]   = useState('')
  const [filtroT, setFiltroT]   = useState('todos')
  const [search, setSearch]     = useState('')
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState(false)
  const [form, setForm]         = useState(EMPTY)
  const [selected, setSelected] = useState(null)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

  async function cargar() {
    setLoading(true)
    const [nSnap, cSnap] = await Promise.all([
      getDocs(collection(db, 'notas')),
      getDocs(collection(db, 'clientes')),
    ])
    const data = nSnap.docs.map(d => ({ id:d.id, ...d.data() }))
      .sort((a,b) => (b.created_at||0) - (a.created_at||0))
    setNotas(data)
    setClientes(cSnap.docs.map(d => ({ id:d.id, ...d.data() })).sort((a,b) => a.nombre?.localeCompare(b.nombre||'')))
    setLoading(false)
  }
  useEffect(() => { cargar() }, [])

  const filtrado = notas.filter(n => {
    if (filtroC && n.cliente_id !== filtroC) return false
    if (filtroT !== 'todos' && n.tipo !== filtroT) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return n.texto?.toLowerCase().includes(q) || n.cliente_nombre?.toLowerCase().includes(q)
    }
    return true
  })

  function abrirNuevo() { setForm(EMPTY); setSelected(null); setError(''); setModal(true) }
  function abrirEditar(n) { setForm({ ...EMPTY, ...n }); setSelected(n); setError(''); setModal(true) }

  const set = k => e => {
    const val = e.target.value
    if (k === 'cliente_id') {
      const c = clientes.find(c => c.id === val)
      setForm(f => ({ ...f, cliente_id: val, cliente_nombre: c?.nombre||'' }))
    } else { setForm(f => ({ ...f, [k]: val })) }
  }

  async function guardar() {
    if (!form.texto.trim()) return setError('El texto de la nota es obligatorio.')
    setSaving(true); setError('')
    try {
      const data = { ...form, created_at: Date.now() }
      if (!selected) await addDoc(collection(db, 'notas'), data)
      else await updateDoc(doc(db, 'notas', selected.id), data)
      await cargar(); setModal(false)
    } catch(e) { setError('Error al guardar.') }
    finally { setSaving(false) }
  }

  async function eliminar(n) {
    if (!confirm('¿Eliminar esta nota?')) return
    await deleteDoc(doc(db, 'notas', n.id)); await cargar()
  }

  function formatFecha(ts) {
    if (!ts) return ''
    const d = new Date(ts)
    return d.toLocaleDateString('es-AR', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })
  }

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Notas</div>
          <div className="page-sub">{notas.length} notas registradas</div>
        </div>
        <button className="btn btn-primary" onClick={abrirNuevo}>+ Nueva nota</button>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar en notas..." />
        </div>
        <select value={filtroC} onChange={e => setFiltroC(e.target.value)} style={{ padding:'.48rem .85rem', borderRadius:'var(--r-sm)', border:'1.5px solid var(--gris-md)', fontSize:'.875rem', background:'var(--blanco)' }}>
          <option value="">Todos los clientes</option>
          {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
        <select value={filtroT} onChange={e => setFiltroT(e.target.value)} style={{ padding:'.48rem .85rem', borderRadius:'var(--r-sm)', border:'1.5px solid var(--gris-md)', fontSize:'.875rem', background:'var(--blanco)' }}>
          <option value="todos">Todos los tipos</option>
          {TIPOS.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      {loading ? <div className="loading"><div className="spinner"/></div> :
       filtrado.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <p>{search || filtroC || filtroT !== 'todos' ? 'No hay notas que coincidan.' : 'Todavía no hay notas registradas.'}</p>
          {!search && <button className="btn btn-primary" onClick={abrirNuevo}>+ Crear primera nota</button>}
        </div>
       ) : (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
          {filtrado.map(n => {
            const tc = TIPO_COLORS[n.tipo] || TIPO_COLORS.General
            return (
              <div key={n.id} className="nota-card">
                <div className="nota-header">
                  <div style={{ display:'flex', alignItems:'center', gap:'.6rem' }}>
                    {n.cliente_nombre && (
                      <span style={{ fontWeight:600, fontSize:'.875rem' }}>{n.cliente_nombre}</span>
                    )}
                    <span className="badge" style={{ background:tc.bg, color:tc.color }}>{n.tipo}</span>
                  </div>
                  <div style={{ display:'flex', gap:'.4rem' }}>
                    <button className="btn btn-sm btn-ghost" onClick={() => abrirEditar(n)}>✏️</button>
                    <button className="btn btn-sm btn-danger" onClick={() => eliminar(n)}>🗑️</button>
                  </div>
                </div>
                <div className="nota-texto">{n.texto}</div>
                <div className="nota-meta" style={{ marginTop:'.6rem', fontSize:'.72rem', color:'var(--texto-muted)' }}>
                  {n.fecha && `Fecha: ${n.fecha}  ·  `}Registrado: {formatFecha(n.created_at)}
                </div>
              </div>
            )
          })}
        </div>
       )}

      {modal && (
        <Modal titulo={selected ? 'Editar nota' : '+ Nueva nota'} onClose={() => setModal(false)}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-grid">
              <div className="form-group full">
                <label>Cliente (opcional)</label>
                <select value={form.cliente_id} onChange={set('cliente_id')}>
                  <option value="">— Nota general sin cliente —</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Tipo de nota</label>
                <select value={form.tipo} onChange={set('tipo')}>
                  {TIPOS.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Fecha</label>
                <input type="date" value={form.fecha} onChange={set('fecha')} />
              </div>
              <div className="form-group full">
                <label>Contenido de la nota *</label>
                <textarea
                  value={form.texto} onChange={set('texto')}
                  placeholder="Escribí la nota aquí. Puede ser una observación, acuerdo, recordatorio o cualquier información relevante del cliente..."
                  style={{ minHeight:'140px' }} autoFocus
                />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={guardar} disabled={saving}>
              {saving ? 'Guardando...' : selected ? 'Guardar cambios' : 'Crear nota'}
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}
