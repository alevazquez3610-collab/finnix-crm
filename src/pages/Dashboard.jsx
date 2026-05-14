import { useState, useEffect } from 'react'
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore'
import { db } from '../firebase'

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function StatCard({ label, value, icon, iconBg, delta }) {
  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <span className="stat-label">{label}</span>
        <div className="stat-icon" style={{ background: iconBg }}>{icon}</div>
      </div>
      <div className="stat-value">{value}</div>
      {delta && <div className="stat-delta">{delta}</div>}
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats]       = useState({ clientes: 0, activos: 0, mrr: 0, vencProx: 0 })
  const [proxVenc, setProxVenc] = useState([])
  const [ultimosC, setUltimosC] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    async function load() {
      try {
        // Clientes
        const cSnap = await getDocs(collection(db, 'clientes'))
        const clientes = cSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        const activos = clientes.filter(c => c.estado === 'activo')
        const mrr = activos.reduce((s, c) => s + (c.precio_usd || 0), 0)

        // Vencimientos proximos (7 dias)
        const hoy = new Date(); hoy.setHours(0,0,0,0)
        const en7 = new Date(hoy); en7.setDate(hoy.getDate() + 7)
        const vSnap = await getDocs(collection(db, 'vencimientos'))
        const vencTodos = vSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        const proximos = vencTodos
          .filter(v => v.estado === 'pendiente' && v.fecha_vencimiento)
          .map(v => ({ ...v, _fecha: new Date(v.fecha_vencimiento) }))
          .filter(v => v._fecha >= hoy && v._fecha <= en7)
          .sort((a, b) => a._fecha - b._fecha)
          .slice(0, 5)

        // Ultimos clientes
        const ult = [...clientes].sort((a,b) => (b.created_at||0) - (a.created_at||0)).slice(0,5)

        setStats({ clientes: clientes.length, activos: activos.length, mrr, vencProx: proximos.length })
        setProxVenc(proximos)
        setUltimosC(ult)
      } catch(e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const hoy = new Date()

  if (loading) return <div className="loading"><div className="spinner"/></div>

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-sub">
            {hoy.toLocaleDateString('es-AR', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard label="Total clientes"   value={stats.clientes} icon="👥" iconBg="#EFF4FF" delta="Registrados en el CRM" />
        <StatCard label="Clientes activos" value={stats.activos}  icon="✅" iconBg="#DCFCE7" delta="Con plan vigente" />
        <StatCard label="MRR (USD)"        value={`u$s ${stats.mrr.toLocaleString('es-AR')}`} icon="💰" iconBg="#FEF3C7" delta="Ingreso mensual recurrente" />
        <StatCard label="Vencen en 7 días" value={stats.vencProx} icon="⏰" iconBg="#FEE2E2" delta="Pendientes esta semana" />
      </div>

      <div className="dash-grid">
        {/* Próximos vencimientos */}
        <div className="card">
          <div className="section-title">📅 Próximos vencimientos</div>
          {proxVenc.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <p>Sin vencimientos en los próximos 7 días 🎉</p>
            </div>
          ) : (
            <div className="venc-list">
              {proxVenc.map(v => {
                const f = new Date(v.fecha_vencimiento)
                return (
                  <div key={v.id} className="venc-item">
                    <div className="venc-date">
                      <div className="day">{f.getDate()}</div>
                      <div className="month">{MESES[f.getMonth()]}</div>
                    </div>
                    <div className="venc-info">
                      <div className="venc-cliente">{v.cliente_nombre}</div>
                      <div className="venc-tipo">{v.tipo} — {v.descripcion}</div>
                    </div>
                    <span className={`badge badge-${v.estado}`}>{v.estado}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Últimos clientes */}
        <div className="card">
          <div className="section-title">👥 Clientes recientes</div>
          {ultimosC.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <p>Todavía no hay clientes cargados.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
              {ultimosC.map(c => (
                <div key={c.id} style={{ display:'flex', alignItems:'center', gap:'.85rem', padding:'.7rem .85rem', background:'var(--gris-cl)', borderRadius:'var(--r-sm)' }}>
                  <div style={{ width:36, height:36, background:'var(--azul)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:'.9rem', flexShrink:0 }}>
                    {(c.nombre||'?')[0].toUpperCase()}
                  </div>
                  <div style={{ flex:1, overflow:'hidden' }}>
                    <div style={{ fontWeight:600, fontSize:'.875rem', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.nombre}</div>
                    <div style={{ fontSize:'.75rem', color:'var(--texto-muted)' }}>{c.actividad || c.plan}</div>
                  </div>
                  <span className={`badge badge-${c.plan?.toLowerCase().replace(' ','')}`}>{c.plan}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Aviso */}
      <div style={{ marginTop:'1.25rem', padding:'.85rem 1.1rem', background:'var(--azul-pale)', borderRadius:'var(--r-md)', border:'1px solid var(--azul-borde)', fontSize:'.82rem', color:'var(--azul)' }}>
        <strong>💡 Tip Finnix:</strong> Cargá los vencimientos del mes al inicio de cada período para que el dashboard los muestre automáticamente.
      </div>
    </>
  )
}
