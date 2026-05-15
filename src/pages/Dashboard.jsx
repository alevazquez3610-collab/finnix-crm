import { useState, useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase'

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

const S = {
  page: {
    background: '#040D1C',
    minHeight: '100vh',
    padding: '0',
    color: '#fff',
  },
  header: {
    padding: '2rem 2.5rem 1.5rem',
    borderBottom: '1px solid rgba(37,99,235,.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: '1.6rem',
    fontWeight: 700,
    color: '#fff',
    letterSpacing: '-.02em',
    marginBottom: '.2rem',
  },
  headerSub: {
    fontSize: '.82rem',
    color: 'rgba(255,255,255,.35)',
  },
  badge: {
    background: 'rgba(37,99,235,.15)',
    border: '1px solid rgba(37,99,235,.3)',
    borderRadius: '100px',
    padding: '.35rem 1rem',
    fontSize: '.75rem',
    color: '#3B82F6',
    fontWeight: 600,
    letterSpacing: '.04em',
  },
  body: {
    padding: '2rem 2.5rem',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '1.25rem',
    marginBottom: '2rem',
  },
  statCard: {
    background: 'linear-gradient(135deg, #0D1F3C 0%, #071428 100%)',
    border: '1px solid rgba(37,99,235,.2)',
    borderRadius: '18px',
    padding: '1.75rem',
    position: 'relative',
    overflow: 'hidden',
    transition: 'all .3s',
  },
  statGlow: {
    position: 'absolute',
    top: '-40px',
    right: '-40px',
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    filter: 'blur(40px)',
    opacity: .4,
    pointerEvents: 'none',
  },
  statIcon: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.3rem',
    marginBottom: '1.25rem',
  },
  statLabel: {
    fontSize: '.72rem',
    fontWeight: 700,
    color: 'rgba(255,255,255,.35)',
    textTransform: 'uppercase',
    letterSpacing: '.08em',
    marginBottom: '.5rem',
  },
  statValue: {
    fontSize: '2.4rem',
    fontWeight: 800,
    lineHeight: 1,
    marginBottom: '.4rem',
    fontVariantNumeric: 'tabular-nums',
  },
  statDelta: {
    fontSize: '.75rem',
    color: 'rgba(255,255,255,.3)',
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: '1.4fr 1fr',
    gap: '1.25rem',
    marginBottom: '1.25rem',
  },
  card: {
    background: '#071428',
    border: '1px solid rgba(37,99,235,.15)',
    borderRadius: '18px',
    padding: '1.5rem',
  },
  cardTitle: {
    fontSize: '.82rem',
    fontWeight: 700,
    color: 'rgba(255,255,255,.5)',
    textTransform: 'uppercase',
    letterSpacing: '.08em',
    marginBottom: '1.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: '.5rem',
  },
  // Vencimiento item
  vencItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '.85rem 1rem',
    background: 'rgba(255,255,255,.03)',
    borderRadius: '12px',
    marginBottom: '.6rem',
    border: '1px solid rgba(255,255,255,.06)',
    transition: 'all .2s',
  },
  vencDate: {
    minWidth: '52px',
    textAlign: 'center',
    background: 'rgba(37,99,235,.15)',
    border: '1px solid rgba(37,99,235,.25)',
    borderRadius: '10px',
    padding: '.4rem .3rem',
  },
  vencDay: {
    fontSize: '1.3rem',
    fontWeight: 800,
    color: '#3B82F6',
    lineHeight: 1,
  },
  vencMonth: {
    fontSize: '.62rem',
    color: '#3B82F6',
    textTransform: 'uppercase',
    fontWeight: 700,
  },
  vencNombre: {
    fontSize: '.875rem',
    fontWeight: 600,
    color: '#fff',
    marginBottom: '.15rem',
  },
  vencTipo: {
    fontSize: '.75rem',
    color: 'rgba(255,255,255,.35)',
  },
  // Cliente item
  clienteItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '.85rem',
    padding: '.7rem .85rem',
    background: 'rgba(255,255,255,.03)',
    borderRadius: '10px',
    marginBottom: '.5rem',
    border: '1px solid rgba(255,255,255,.05)',
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: 'rgba(37,99,235,.3)',
    border: '1px solid rgba(37,99,235,.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#3B82F6',
    fontWeight: 800,
    fontSize: '.9rem',
    flexShrink: 0,
  },
  // Gráfico barras
  chartWrap: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '.5rem',
    height: '120px',
    padding: '.5rem 0',
  },
  barCol: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '.3rem',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barLabel: {
    fontSize: '.62rem',
    color: 'rgba(255,255,255,.25)',
  },
  // Tips
  tip: {
    background: 'rgba(37,99,235,.08)',
    border: '1px solid rgba(37,99,235,.2)',
    borderRadius: '12px',
    padding: '1rem 1.25rem',
    fontSize: '.82rem',
    color: 'rgba(255,255,255,.5)',
    lineHeight: 1.6,
  },
  dot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#3B82F6',
    animation: 'pulse 2s infinite',
    display: 'inline-block',
    marginRight: '.5rem',
  },
}

function StatCard({ label, value, icon, glowColor, iconBg, delta, prefix='' }) {
  return (
    <div style={S.statCard}>
      <div style={{ ...S.statGlow, background: glowColor }} />
      <div style={{ ...S.statIcon, background: iconBg }}>{icon}</div>
      <div style={S.statLabel}>{label}</div>
      <div style={{ ...S.statValue, color: glowColor }}>
        {prefix}{typeof value === 'number' ? value.toLocaleString('es-AR') : value}
      </div>
      <div style={S.statDelta}>{delta}</div>
    </div>
  )
}

function BadgePlan({ plan }) {
  const colors = {
    Esencial:    { bg: 'rgba(37,99,235,.15)',  color: '#3B82F6' },
    Integral:    { bg: 'rgba(124,58,237,.15)', color: '#A78BFA' },
    Estratégico: { bg: 'rgba(217,119,6,.15)',  color: '#FCD34D' },
    'Llave en mano': { bg: 'rgba(22,163,74,.15)', color: '#4ADE80' },
  }
  const c = colors[plan] || colors.Esencial
  return (
    <span style={{ background: c.bg, color: c.color, borderRadius: '100px', padding: '.18rem .65rem', fontSize: '.7rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
      {plan}
    </span>
  )
}

export default function Dashboard() {
  const [stats, setStats]     = useState({ clientes: 0, activos: 0, mrr: 0, vencProx: 0 })
  const [proxVenc, setProxVenc] = useState([])
  const [ultimosC, setUltimosC] = useState([])
  const [planes, setPlanes]   = useState({ Esencial: 0, Integral: 0, 'Estratégico': 0, 'Llave en mano': 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [cSnap, vSnap] = await Promise.all([
          getDocs(collection(db, 'clientes')),
          getDocs(collection(db, 'vencimientos')),
        ])
        const clientes = cSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        const activos  = clientes.filter(c => c.estado === 'activo')
        const mrr      = activos.reduce((s, c) => s + (c.precio_usd || 0), 0)

        const planCount = { Esencial: 0, Integral: 0, 'Estratégico': 0, 'Llave en mano': 0 }
        activos.forEach(c => { if (planCount[c.plan] !== undefined) planCount[c.plan]++ })

        const hoy = new Date(); hoy.setHours(0,0,0,0)
        const en7 = new Date(hoy); en7.setDate(hoy.getDate() + 7)
        const vencTodos = vSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        const proximos  = vencTodos
          .filter(v => v.estado === 'pendiente' && v.fecha_vencimiento)
          .map(v => ({ ...v, _f: new Date(v.fecha_vencimiento) }))
          .filter(v => v._f >= hoy && v._f <= en7)
          .sort((a, b) => a._f - b._f)
          .slice(0, 4)

        const ult = [...clientes]
          .sort((a, b) => (b.created_at || 0) - (a.created_at || 0))
          .slice(0, 5)

        setStats({ clientes: clientes.length, activos: activos.length, mrr, vencProx: proximos.length })
        setProxVenc(proximos)
        setUltimosC(ult)
        setPlanes(planCount)
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const hoy = new Date()
  const maxPlan = Math.max(...Object.values(planes), 1)
  const planColors = {
    Esencial: '#2563EB', Integral: '#7C3AED',
    'Estratégico': '#D97706', 'Llave en mano': '#16A34A'
  }

  if (loading) return (
    <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" style={{ borderColor: 'rgba(37,99,235,.2)', borderTopColor: '#2563EB' }} />
    </div>
  )

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <div>
          <div style={S.headerTitle}>Dashboard</div>
          <div style={S.headerSub}>
            {hoy.toLocaleDateString('es-AR', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
          </div>
        </div>
        <div style={S.badge}>
          <span style={S.dot} />
          Finnix CRM · En línea
        </div>
      </div>

      <div style={S.body}>

        {/* Stats */}
        <div style={S.statsGrid}>
          <StatCard
            label="Total clientes"
            value={stats.clientes}
            icon="👥"
            glowColor="#2563EB"
            iconBg="rgba(37,99,235,.2)"
            delta="Registrados en el CRM"
          />
          <StatCard
            label="Clientes activos"
            value={stats.activos}
            icon="✅"
            glowColor="#16A34A"
            iconBg="rgba(22,163,74,.2)"
            delta="Con plan vigente"
          />
          <StatCard
            label="MRR"
            value={stats.mrr}
            prefix="u$s "
            icon="💰"
            glowColor="#D97706"
            iconBg="rgba(217,119,6,.2)"
            delta="Ingreso mensual recurrente"
          />
          <StatCard
            label="Vencen esta semana"
            value={stats.vencProx}
            icon="⏰"
            glowColor={stats.vencProx > 0 ? "#DC2626" : "#16A34A"}
            iconBg={stats.vencProx > 0 ? "rgba(220,38,38,.2)" : "rgba(22,163,74,.2)"}
            delta="Próximos 7 días"
          />
        </div>

        {/* Fila 2: Vencimientos + Distribución de planes */}
        <div style={S.grid2}>

          {/* Vencimientos */}
          <div style={S.card}>
            <div style={S.cardTitle}>
              📅 Próximos vencimientos
            </div>
            {proxVenc.length === 0 ? (
              <div style={{ textAlign:'center', padding:'2rem', color:'rgba(255,255,255,.2)' }}>
                <div style={{ fontSize:'2rem', marginBottom:'.5rem' }}>🎉</div>
                <div style={{ fontSize:'.85rem' }}>Sin vencimientos esta semana</div>
              </div>
            ) : proxVenc.map(v => {
              const f = new Date(v.fecha_vencimiento)
              return (
                <div key={v.id} style={S.vencItem}>
                  <div style={S.vencDate}>
                    <div style={S.vencDay}>{f.getDate()}</div>
                    <div style={S.vencMonth}>{MESES[f.getMonth()]}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={S.vencNombre}>{v.cliente_nombre || 'Sin cliente'}</div>
                    <div style={S.vencTipo}>{v.tipo} — {v.descripcion}</div>
                  </div>
                  <span style={{ background:'rgba(220,38,38,.15)', color:'#F87171', borderRadius:'100px', padding:'.18rem .65rem', fontSize:'.7rem', fontWeight:700 }}>
                    pendiente
                  </span>
                </div>
              )
            })}
          </div>

          {/* Distribución de planes */}
          <div style={S.card}>
            <div style={S.cardTitle}>📊 Clientes por plan</div>
            <div style={S.chartWrap}>
              {Object.entries(planes).map(([plan, cant]) => (
                <div key={plan} style={S.barCol}>
                  <div style={{
                    fontSize: '.75rem', fontWeight: 700,
                    color: planColors[plan], marginBottom: '.25rem'
                  }}>
                    {cant}
                  </div>
                  <div style={{
                    width: '100%',
                    height: `${Math.max((cant / maxPlan) * 90, cant > 0 ? 8 : 3)}px`,
                    background: cant > 0
                      ? `linear-gradient(180deg, ${planColors[plan]} 0%, ${planColors[plan]}88 100%)`
                      : 'rgba(255,255,255,.06)',
                    borderRadius: '6px 6px 0 0',
                    transition: 'height .4s ease',
                    boxShadow: cant > 0 ? `0 0 12px ${planColors[plan]}44` : 'none',
                  }} />
                  <div style={{ ...S.barLabel, textAlign: 'center', lineHeight: 1.2 }}>
                    {plan === 'Llave en mano' ? 'Llave' : plan.split(' ')[0]}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,.06)', paddingTop: '1rem', marginTop: '.5rem' }}>
              {Object.entries(planes).map(([plan, cant]) => (
                <div key={plan} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'.4rem' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'.5rem' }}>
                    <div style={{ width:'8px', height:'8px', borderRadius:'50%', background: planColors[plan], flexShrink:0 }} />
                    <span style={{ fontSize:'.78rem', color:'rgba(255,255,255,.5)' }}>{plan}</span>
                  </div>
                  <span style={{ fontSize:'.78rem', fontWeight:700, color:'rgba(255,255,255,.7)' }}>{cant}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fila 3: Últimos clientes + Tip */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem' }}>

          <div style={S.card}>
            <div style={S.cardTitle}>👥 Clientes recientes</div>
            {ultimosC.length === 0 ? (
              <div style={{ textAlign:'center', padding:'1.5rem', color:'rgba(255,255,255,.2)', fontSize:'.85rem' }}>
                Todavía no hay clientes cargados.
              </div>
            ) : ultimosC.map(c => (
              <div key={c.id} style={S.clienteItem}>
                <div style={S.avatar}>{(c.nombre || '?')[0].toUpperCase()}</div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontWeight:600, fontSize:'.875rem', color:'#fff', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                    {c.nombre}
                  </div>
                  <div style={{ fontSize:'.73rem', color:'rgba(255,255,255,.3)' }}>{c.actividad || '—'}</div>
                </div>
                <BadgePlan plan={c.plan} />
              </div>
            ))}
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            {/* Capacidad */}
            <div style={S.card}>
              <div style={S.cardTitle}>⚡ Capacidad</div>
              <div style={{ marginBottom:'.75rem' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'.4rem' }}>
                  <span style={{ fontSize:'.78rem', color:'rgba(255,255,255,.4)' }}>Clientes activos</span>
                  <span style={{ fontSize:'.78rem', fontWeight:700, color:'#3B82F6' }}>{stats.activos} / 20</span>
                </div>
                <div style={{ background:'rgba(255,255,255,.07)', borderRadius:'100px', height:'8px', overflow:'hidden' }}>
                  <div style={{
                    width: `${(stats.activos / 20) * 100}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #2563EB, #3B82F6)',
                    borderRadius: '100px',
                    boxShadow: '0 0 8px rgba(37,99,235,.5)',
                    transition: 'width .4s ease',
                  }} />
                </div>
              </div>
              <div style={{ fontSize:'.75rem', color:'rgba(255,255,255,.25)' }}>
                {20 - stats.activos} lugares disponibles para nuevos clientes
              </div>
            </div>

            {/* Tip */}
            <div style={S.tip}>
              <strong style={{ color:'#3B82F6' }}>💡 Tip Finnix:</strong> Cargá los vencimientos del mes al inicio de cada período para que el dashboard los muestre automáticamente y no te agarren de sorpresa.
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
