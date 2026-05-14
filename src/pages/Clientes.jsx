import { useState, useEffect } from 'react'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

const PLANES  = ['Esencial','Integral','Estratégico','Llave en mano']
const ESTADOS = ['activo','onboarding','inactivo']
const CONDICIONES = ['Monotributo','Responsable Inscripto','Sin inscripción','Otro']

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

const EMPTY = {
  nombre:'', empresa:'', cuit:'', email:'', whatsapp:'', localidad:'',
  condicion_fiscal:'Monotributo', plan:'Esencial', precio_usd:'',
  estado:'activo', actividad:'', notas_internas:'',
}

export default function Clientes() {
  const [clientes, setClientes]   = useState([])
  const [filtrado, setFiltrado]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [filtroEstado, setFiltro] = useState('todos')
  const [modal, setModal]         = useState(null) // null | 'nuevo' | 'editar' | 'ver'
  const [selected, setSelected]   = useState(null)
  const [form, setForm]           = useState(EMPTY)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  async function cargar() {
    setLoading(true)
    const snap = await getDocs(collection(db, 'clientes'))
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a,b) => (a.nombre||'').localeCompare(b.nombre||''))
    setClientes(data)
    setLoading(false)
  }

  useEffect(() => { cargar() }, [])

  useEffect(() => {
    let res = clientes
    if (filtroEstado !== 'todos') res = res.filter(c => c.estado === filtroEstado)
    if (search.trim()) {
      const q = search.toLowerCase()
      res = res.filter(c =>
        c.nombre?.toLowerCase().includes(q) ||
        c.cuit?.includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.actividad?.toLowerCase().includes(q)
      )
    }
    setFiltrado(res)
  }, [clientes, search, filtroEstado])

  function abrirNuevo() { setForm(EMPTY); setError(''); setModal('nuevo') }
  function abrirEditar(c) { setForm({ ...EMPTY, ...c, precio_usd: c.precio_usd?.toString()||'' }); setSelected(c); setError(''); setModal('editar') }
  function abrirVer(c) { setSelected(c); setModal('ver') }

  async function guardar() {
    if (!form.nombre.trim()) return setError('El nombre es obligatorio.')
    setSaving(true); setError('')
    try {
      const data = { ...form, precio_usd: parseFloat(form.precio_usd)||0 }
      if (modal === 'nuevo') {
        await addDoc(collection(db, 'clientes'), { ...data, created_at: Date.now() })
      } else {
        await updateDoc(doc(db, 'clientes', selected.id), data)
      }
      await cargar(); setModal(null)
    } catch(e) { setError('Error al guardar. Intentá de nuevo.') }
    finally { setSaving(false) }
  }

  async function eliminar(c) {
    if (!confirm(`¿Eliminar a ${c.nombre}? Esta acción no se puede deshacer.`)) return
    await deleteDoc(doc(db, 'clientes', c.id))
    await cargar()
  }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const FormBody = (
    <>
      <div className="modal-body">
        {error && <div className="alert alert-error">{error}</div>}
        <div className="form-grid">
          <div className="form-group">
            <label>Nombre completo *</label>
            <input value={form.nombre} onChange={set('nombre')} placeholder="Juan García" autoFocus />
          </div>
          <div className="form-group">
            <label>Empresa / negocio</label>
            <input value={form.empresa} onChange={set('empresa')} placeholder="Distribuidora García" />
          </div>
          <div className="form-group">
            <label>CUIT / CUIL</label>
            <input value={form.cuit} onChange={set('cuit')} placeholder="20-12345678-9" />
          </div>
          <div className="form-group">
            <label>Condición fiscal</label>
            <select value={form.condicion_fiscal} onChange={set('condicion_fiscal')}>
              {CONDICIONES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={form.email} onChange={set('email')} placeholder="juan@email.com" />
          </div>
          <div className="form-group">
            <label>WhatsApp</label>
            <input value={form.whatsapp} onChange={set('whatsapp')} placeholder="+54 9 370 ..." />
          </div>
          <div className="form-group">
            <label>Localidad</label>
            <input value={form.localidad} onChange={set('localidad')} placeholder="Clorinda, Formosa" />
          </div>
          <div className="form-group">
            <label>Actividad / rubro</label>
            <input value={form.actividad} onChange={set('actividad')} placeholder="Comercio minorista" />
          </div>
          <div className="form-group">
            <label>Plan contratado</label>
            <select value={form.plan} onChange={set('plan')}>
              {PLANES.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Precio mensual (USD)</label>
            <input type="number" value={form.precio_usd} onChange={set('precio_usd')} placeholder="130" />
          </div>
          <div className="form-group">
            <label>Estado</label>
            <select value={form.estado} onChange={set('estado')}>
              {ESTADOS.map(e => <option key={e}>{e}</option>)}
            </select>
          </div>
          <div className="form-group full">
            <label>Notas internas</label>
            <textarea value={form.notas_internas} onChange={set('notas_internas')} placeholder="Observaciones sobre el cliente, particularidades del servicio, etc." />
          </div>
        </div>
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancelar</button>
        <button className="btn btn-primary" onClick={guardar} disabled={saving}>
          {saving ? 'Guardando...' : modal === 'nuevo' ? 'Crear cliente' : 'Guardar cambios'}
        </button>
      </div>
    </>
  )

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Clientes</div>
          <div className="page-sub">{clientes.length} clientes registrados</div>
        </div>
        <button className="btn btn-primary" onClick={abrirNuevo}>+ Nuevo cliente</button>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre, CUIT, email..." />
        </div>
        {['todos','activo','onboarding','inactivo'].map(e => (
          <button key={e} className={`btn btn-sm ${filtroEstado===e?'btn-primary':'btn-secondary'}`} onClick={() => setFiltro(e)}>
            {e === 'todos' ? 'Todos' : e.charAt(0).toUpperCase()+e.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading"><div className="spinner"/></div>
      ) : filtrado.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <p>{search ? 'No hay clientes que coincidan con la búsqueda.' : 'Todavía no hay clientes cargados.'}</p>
          {!search && <button className="btn btn-primary" onClick={abrirNuevo}>+ Crear primer cliente</button>}
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>CUIT</th>
                <th>Condición</th>
                <th>Plan</th>
                <th>Precio USD</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrado.map(c => (
                <tr key={c.id}>
                  <td>
                    <div style={{ fontWeight:600 }}>{c.nombre}</div>
                    <div style={{ fontSize:'.75rem', color:'var(--texto-muted)' }}>{c.actividad}</div>
                  </td>
                  <td style={{ fontFamily:'monospace', fontSize:'.82rem' }}>{c.cuit || '—'}</td>
                  <td><span className="badge badge-esencial">{c.condicion_fiscal}</span></td>
                  <td><span className={`badge badge-${c.plan?.toLowerCase().split(' ')[0]}`}>{c.plan}</span></td>
                  <td style={{ fontWeight:600 }}>u$s {c.precio_usd || 0}</td>
                  <td><span className={`badge badge-${c.estado}`}>{c.estado}</span></td>
                  <td>
                    <div style={{ display:'flex', gap:'.4rem' }}>
                      <button className="btn btn-sm btn-ghost" onClick={() => abrirVer(c)} title="Ver detalle">👁️</button>
                      <button className="btn btn-sm btn-secondary" onClick={() => abrirEditar(c)}>✏️</button>
                      <button className="btn btn-sm btn-danger" onClick={() => eliminar(c)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal nuevo/editar */}
      {(modal === 'nuevo' || modal === 'editar') && (
        <Modal titulo={modal === 'nuevo' ? '+ Nuevo cliente' : `Editar — ${selected?.nombre}`} onClose={() => setModal(null)}>
          {FormBody}
        </Modal>
      )}

      {/* Modal ver detalle */}
      {modal === 'ver' && selected && (
        <Modal titulo={`Cliente — ${selected.nombre}`} onClose={() => setModal(null)}>
          <div className="modal-body">
            <div className="form-grid">
              {[
                ['Nombre', selected.nombre],
                ['Empresa', selected.empresa],
                ['CUIT', selected.cuit],
                ['Condición fiscal', selected.condicion_fiscal],
                ['Email', selected.email],
                ['WhatsApp', selected.whatsapp],
                ['Localidad', selected.localidad],
                ['Actividad', selected.actividad],
                ['Plan', selected.plan],
                ['Precio USD', `u$s ${selected.precio_usd || 0}/mes`],
              ].map(([k,v]) => v ? (
                <div key={k}>
                  <div style={{ fontSize:'.72rem', color:'var(--texto-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'.04em', marginBottom:'.2rem' }}>{k}</div>
                  <div style={{ fontSize:'.9rem', fontWeight:500 }}>{v}</div>
                </div>
              ) : null)}
              {selected.notas_internas && (
                <div style={{ gridColumn:'1/-1', background:'var(--gris-cl)', borderRadius:'var(--r-sm)', padding:'.85rem 1rem' }}>
                  <div style={{ fontSize:'.72rem', color:'var(--texto-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'.04em', marginBottom:'.4rem' }}>Notas internas</div>
                  <div style={{ fontSize:'.875rem', lineHeight:1.6 }}>{selected.notas_internas}</div>
                </div>
              )}
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setModal(null)}>Cerrar</button>
            <button className="btn btn-primary" onClick={() => abrirEditar(selected)}>✏️ Editar</button>
          </div>
        </Modal>
      )}
    </>
  )
}
