import { useState, useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase'

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DIAS  = ['LUN','MAR','MIÉ','JUE','VIE','SÁB','DOM']

const S = {
  page:      { background:'#060E1A', minHeight:'100vh', color:'#fff', fontFamily:'inherit' },
  topbar:    { display:'flex', alignItems:'center', gap:'.75rem', padding:'.9rem 1.5rem', borderBottom:'1px solid rgba(255,255,255,.06)', flexWrap:'wrap' },
  statPill:  { background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:'10px', padding:'.5rem .9rem', minWidth:'110px' },
  pillLabel: { fontSize:'.6rem', color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:'.15rem', fontWeight:600 },
  pillVal:   { fontSize:'1.2rem', fontWeight:800, lineHeight:1 },
  pillSub:   { fontSize:'.58rem', color:'rgba(255,255,255,.22)', marginTop:'.12rem' },
  body:      { display:'grid', gridTemplateColumns:'1fr 300px', gap:'0', minHeight:'calc(100vh - 58px)' },
  left:      { padding:'1.1rem 1.25rem', borderRight:'1px solid rgba(255,255,255,.06)', overflowX:'hidden' },
  right:     { padding:'1.1rem', background:'rgba(0,0,0,.12)' },
  secHead:   { fontSize:'.65rem', fontWeight:700, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:'.7rem', display:'flex', alignItems:'center', justifyContent:'space-between' },
  card:      { background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', borderRadius:'12px', padding:'.9rem 1rem', marginBottom:'.75rem' },
}

function getHeatColor(n){ return n===0?'rgba(255,255,255,.04)':n===1?'rgba(37,99,235,.2)':n===2?'rgba(37,99,235,.4)':n===3?'rgba(37,99,235,.6)':'rgba(37,99,235,.85)' }
function getHeatBorder(n){ return n===0?'rgba(255,255,255,.06)':`rgba(37,99,235,${Math.min(.25+n*.15,.9)})` }

function HeatmapCalendar({ vencimientos, mes, anio }) {
  const diasEnMes = new Date(anio, mes+1, 0).getDate()
  const primerDia = new Date(anio, mes, 1).getDay()
  const offset    = primerDia===0 ? 6 : primerDia-1

  const conteo = {}
  vencimientos.forEach(v => {
    if (!v.fecha_vencimiento) return
    const f = new Date(v.fecha_vencimiento)
    if (f.getMonth()===mes && f.getFullYear()===anio) {
      const d = f.getDate()
      if (!conteo[d]) conteo[d] = []
      conteo[d].push(v)
    }
  })

  const hoy = new Date()
  const esHoy = d => d===hoy.getDate() && mes===hoy.getMonth() && anio===hoy.getFullYear()

  const celdas = []
  for (let i=0; i<offset; i++) celdas.push(null)
  for (let d=1; d<=diasEnMes; d++) celdas.push(d)

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'3px', marginBottom:'3px' }}>
        {DIAS.map(d=><div key={d} style={{ textAlign:'center', fontSize:'.56rem', color:'rgba(255,255,255,.22)', fontWeight:700, letterSpacing:'.04em' }}>{d}</div>)}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'3px' }}>
        {celdas.map((d,i) => {
          if (!d) return <div key={`e${i}`} />
          const items = conteo[d]||[]
          const cnt   = items.length
          const hoy_  = esHoy(d)
          return (
            <div key={d} title={cnt>0?items.map(v=>`${v.cliente_nombre}: ${v.tipo}`).join('\n'):''}
              style={{ background:hoy_?'rgba(37,99,235,.5)':getHeatColor(cnt), border:`1px solid ${hoy_?'#3B82F6':getHeatBorder(cnt)}`, borderRadius:'6px', minHeight:'34px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor:cnt>0?'pointer':'default', boxShadow:hoy_?'0 0 8px rgba(37,99,235,.4)':cnt>=3?'0 0 5px rgba(37,99,235,.25)':'none' }}>
              <div style={{ fontSize:'.68rem', fontWeight:hoy_?800:500, color:hoy_?'#fff':cnt>0?'#93C5FD':'rgba(255,255,255,.3)' }}>{d}</div>
              {cnt>0 && <div style={{ fontSize:'.52rem', fontWeight:700, color:cnt>=3?'#FCD34D':'#3B82F6', lineHeight:1 }}>{cnt}</div>}
            </div>
          )
        })}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:'.4rem', marginTop:'.6rem', justifyContent:'flex-end' }}>
        <span style={{ fontSize:'.57rem', color:'rgba(255,255,255,.2)' }}>Menos</span>
        {[0,1,2,3,4].map(n=><div key={n} style={{ width:'12px', height:'12px', borderRadius:'3px', background:getHeatColor(n), border:`1px solid ${getHeatBorder(n)}` }}/>)}
        <span style={{ fontSize:'.57rem', color:'rgba(255,255,255,.2)' }}>Más</span>
      </div>
    </div>
  )
}

function Badge({ estado, plan }) {
  const map = {
    activo:     {bg:'rgba(22,163,74,.15)',   color:'#4ADE80'},
    onboarding: {bg:'rgba(217,119,6,.15)',   color:'#FCD34D'},
    inactivo:   {bg:'rgba(255,255,255,.07)', color:'rgba(255,255,255,.3)'},
    Esencial:   {bg:'rgba(37,99,235,.15)',   color:'#3B82F6'},
    Integral:   {bg:'rgba(124,58,237,.15)',  color:'#A78BFA'},
    'Estratégico':{bg:'rgba(217,119,6,.15)',color:'#FCD34D'},
    'Llave en mano':{bg:'rgba(22,163,74,.15)',color:'#4ADE80'},
  }
  const key = estado||plan
  const c   = map[key]||{bg:'rgba(255,255,255,.07)',color:'rgba(255,255,255,.35)'}
  const label = key==='Estratégico'?'Estrat.':key==='Llave en mano'?'Llave':key
  return <span style={{ background:c.bg, color:c.color, borderRadius:'100px', padding:'.12rem .5rem', fontSize:'.62rem', fontWeight:700, whiteSpace:'nowrap' }}>{label}</span>
}

function SemanaEnCurso({ vencimientos }) {
  const hoy = new Date(); hoy.setHours(0,0,0,0)
  const fin = new Date(hoy); fin.setDate(hoy.getDate()+6)
  const proximos = vencimientos
    .filter(v=>{ if(!v.fecha_vencimiento||v.estado==='completado') return false; const f=new Date(v.fecha_vencimiento); return f>=hoy&&f<=fin })
    .sort((a,b)=>new Date(a.fecha_vencimiento)-new Date(b.fecha_vencimiento)).slice(0,8)

  function diff(fecha) {
    const f=new Date(fecha);f.setHours(0,0,0,0)
    const d=Math.ceil((f-hoy)/86400000)
    if(d===0) return {label:'Hoy',color:'#F87171'}
    if(d===1) return {label:'Mañana',color:'#FCD34D'}
    return {label:`${f.getDate()}/${f.getMonth()+1}`,color:'rgba(255,255,255,.35)'}
  }

  if(proximos.length===0) return <div style={{ textAlign:'center', padding:'1.25rem', color:'rgba(255,255,255,.2)', fontSize:'.78rem' }}>Sin vencimientos esta semana 🎉</div>
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'.45rem' }}>
      {proximos.map(v=>{ const d=diff(v.fecha_vencimiento); return (
        <div key={v.id} style={{ display:'flex', alignItems:'center', gap:'.6rem', padding:'.55rem .7rem', background:'rgba(255,255,255,.03)', borderRadius:'8px', border:'1px solid rgba(255,255,255,.05)' }}>
          <div style={{ minWidth:'44px', textAlign:'center' }}>
            <div style={{ fontSize:'.63rem', fontWeight:800, color:d.color }}>{d.label}</div>
          </div>
          <div style={{ flex:1, overflow:'hidden' }}>
            <div style={{ fontSize:'.75rem', fontWeight:600, color:'#fff', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{v.cliente_nombre||'Sin cliente'}</div>
            <div style={{ fontSize:'.62rem', color:'rgba(255,255,255,.28)' }}>{v.tipo}</div>
          </div>
          <div style={{ width:'5px', height:'5px', borderRadius:'50%', background:d.color, flexShrink:0 }}/>
        </div>
      )})}
    </div>
  )
}

function TablaClientes({ clientes, vencimientos, facturas }) {
  const [search, setSearch] = useState('')
  const [filtro, setFiltro] = useState('todos')

  const hoy=new Date();hoy.setHours(0,0,0,0)
  const en7=new Date(hoy);en7.setDate(hoy.getDate()+7)

  const tieneVenc = id => vencimientos.some(v=>v.cliente_id===id&&v.estado==='pendiente'&&new Date(v.fecha_vencimiento)>=hoy&&new Date(v.fecha_vencimiento)<=en7)
  const tieneFact = id => facturas.some(f=>f.cliente_id===id&&f.estado==='pendiente')

  const filtrado = clientes.filter(c=>{
    if(filtro!=='todos'&&c.estado!==filtro) return false
    if(search.trim()){ const q=search.toLowerCase(); return c.nombre?.toLowerCase().includes(q)||c.cuit?.includes(q)||c.actividad?.toLowerCase().includes(q) }
    return true
  })

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:'.5rem', marginBottom:'.85rem', flexWrap:'wrap' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'.35rem', background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:'7px', padding:'.35rem .7rem', flex:1, maxWidth:'260px' }}>
          <span style={{ color:'rgba(255,255,255,.2)', fontSize:'.9rem' }}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar..." style={{ background:'none', border:'none', outline:'none', color:'#fff', fontSize:'.78rem', width:'100%' }}/>
        </div>
        {['todos','activo','onboarding','inactivo'].map(f=>(
          <button key={f} onClick={()=>setFiltro(f)} style={{ background:filtro===f?'rgba(37,99,235,.2)':'rgba(255,255,255,.03)', border:`1px solid ${filtro===f?'rgba(37,99,235,.4)':'rgba(255,255,255,.07)'}`, borderRadius:'7px', padding:'.3rem .65rem', color:filtro===f?'#3B82F6':'rgba(255,255,255,.35)', fontSize:'.68rem', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
            {f.charAt(0).toUpperCase()+f.slice(1)}
          </button>
        ))}
        <span style={{ marginLeft:'auto', fontSize:'.65rem', color:'rgba(255,255,255,.22)' }}>{filtrado.length} cliente{filtrado.length!==1?'s':''}</span>
      </div>

      <div style={{ overflowX:'auto', borderRadius:'10px', border:'1px solid rgba(255,255,255,.07)' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'.76rem' }}>
          <thead>
            <tr style={{ background:'rgba(255,255,255,.04)' }}>
              {['Cliente','CUIT','Condición','Plan','USD/mes','Alertas','Estado'].map(h=>(
                <th key={h} style={{ padding:'.6rem .8rem', textAlign:'left', color:'rgba(255,255,255,.28)', fontWeight:700, fontSize:'.6rem', textTransform:'uppercase', letterSpacing:'.06em', borderBottom:'1px solid rgba(255,255,255,.07)', whiteSpace:'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtrado.length===0 ? (
              <tr><td colSpan={7} style={{ textAlign:'center', padding:'2.5rem', color:'rgba(255,255,255,.2)', fontSize:'.82rem' }}>No hay clientes que coincidan.</td></tr>
            ) : filtrado.map((c,i)=>(
              <tr key={c.id} style={{ borderBottom:'1px solid rgba(255,255,255,.045)', background:i%2===0?'transparent':'rgba(255,255,255,.012)', cursor:'default' }}
                onMouseEnter={e=>e.currentTarget.style.background='rgba(37,99,235,.05)'}
                onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'transparent':'rgba(255,255,255,.012)'}
              >
                <td style={{ padding:'.65rem .8rem' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'.55rem' }}>
                    <div style={{ width:'26px', height:'26px', borderRadius:'50%', background:'rgba(37,99,235,.18)', border:'1px solid rgba(37,99,235,.28)', display:'flex', alignItems:'center', justifyContent:'center', color:'#3B82F6', fontWeight:800, fontSize:'.72rem', flexShrink:0 }}>
                      {(c.nombre||'?')[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight:600, color:'#fff' }}>{c.nombre}</div>
                      <div style={{ fontSize:'.6rem', color:'rgba(255,255,255,.22)' }}>{c.actividad||'—'}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding:'.65rem .8rem', fontFamily:'monospace', fontSize:'.68rem', color:'rgba(255,255,255,.35)' }}>{c.cuit||'—'}</td>
                <td style={{ padding:'.65rem .8rem', fontSize:'.68rem', color:'rgba(255,255,255,.4)' }}>{c.condicion_fiscal||'—'}</td>
                <td style={{ padding:'.65rem .8rem' }}><Badge plan={c.plan}/></td>
                <td style={{ padding:'.65rem .8rem', fontWeight:700, color:'#3B82F6' }}>u$s {c.precio_usd||0}</td>
                <td style={{ padding:'.65rem .8rem' }}>
                  <div style={{ display:'flex', gap:'.25rem', flexWrap:'wrap' }}>
                    {tieneVenc(c.id) && <span style={{ background:'rgba(220,38,38,.15)', color:'#F87171', borderRadius:'100px', padding:'.1rem .45rem', fontSize:'.58rem', fontWeight:700 }}>⏰ Vence</span>}
                    {tieneFact(c.id) && <span style={{ background:'rgba(217,119,6,.15)', color:'#FCD34D', borderRadius:'100px', padding:'.1rem .45rem', fontSize:'.58rem', fontWeight:700 }}>💰 Cobro</span>}
                    {!tieneVenc(c.id)&&!tieneFact(c.id) && <span style={{ color:'rgba(22,163,74,.5)', fontSize:'.62rem' }}>✓ Al día</span>}
                  </div>
                </td>
                <td style={{ padding:'.65rem .8rem' }}><Badge estado={c.estado}/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [clientes,     setClientes]     = useState([])
  const [vencimientos, setVencimientos] = useState([])
  const [facturas,     setFacturas]     = useState([])
  const [loading,      setLoading]      = useState(true)
  const [mesCal,       setMesCal]       = useState(new Date().getMonth())
  const [anioCal,      setAnioCal]      = useState(new Date().getFullYear())

  useEffect(()=>{
    async function load(){
      try{
        const [cS,vS,fS]=await Promise.all([getDocs(collection(db,'clientes')),getDocs(collection(db,'vencimientos')),getDocs(collection(db,'facturas'))])
        setClientes(cS.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(a.nombre||'').localeCompare(b.nombre||'')))
        setVencimientos(vS.docs.map(d=>({id:d.id,...d.data()})))
        setFacturas(fS.docs.map(d=>({id:d.id,...d.data()})))
      }catch(e){console.error(e)}
      finally{setLoading(false)}
    }
    load()
  },[])

  if(loading) return <div style={{...S.page,display:'flex',alignItems:'center',justifyContent:'center'}}><div className="spinner" style={{borderColor:'rgba(37,99,235,.2)',borderTopColor:'#2563EB'}}/></div>

  const activos      = clientes.filter(c=>c.estado==='activo')
  const mrr          = activos.reduce((s,c)=>s+(c.precio_usd||0),0)
  const hoy          = new Date();hoy.setHours(0,0,0,0)
  const vencHoy      = vencimientos.filter(v=>{if(!v.fecha_vencimiento||v.estado!=='pendiente')return false;const f=new Date(v.fecha_vencimiento);f.setHours(0,0,0,0);return f.getTime()===hoy.getTime()})
  const vencPend     = vencimientos.filter(v=>v.estado==='pendiente')
  const factPend     = facturas.filter(f=>f.estado==='pendiente')
  const totalCobro   = factPend.reduce((s,f)=>s+(f.monto_usd||0),0)

  const planCount = {'Esencial':0,'Integral':0,'Estratégico':0,'Llave en mano':0}
  activos.forEach(c=>{if(planCount[c.plan]!==undefined)planCount[c.plan]++})

  const prevMes=()=>{if(mesCal===0){setMesCal(11);setAnioCal(a=>a-1)}else setMesCal(m=>m-1)}
  const nextMes=()=>{if(mesCal===11){setMesCal(0);setAnioCal(a=>a+1)}else setMesCal(m=>m+1)}

  return (
    <div style={S.page}>
      {/* TOP STATS */}
      <div style={S.topbar}>
        {[
          {label:'Clientes activos', val:activos.length, sub:`de ${clientes.length} totales`, color:'#3B82F6'},
          {label:'Vencen hoy',       val:vencHoy.length, sub:'requieren atención inmediata', color:vencHoy.length>0?'#F87171':'#4ADE80'},
          {label:'Venc. pendientes', val:vencPend.length, sub:'en total sin completar', color:'#FCD34D'},
          {label:'MRR (USD)',         val:`u$s ${mrr.toLocaleString('es-AR')}`, sub:'ingreso mensual recurrente', color:'#4ADE80'},
          {label:'Cobro pendiente',  val:`u$s ${totalCobro.toLocaleString('es-AR')}`, sub:`${factPend.length} factura${factPend.length!==1?'s':''}`, color:'#FCD34D'},
        ].map(s=>(
          <div key={s.label} style={S.statPill}>
            <div style={S.pillLabel}>{s.label}</div>
            <div style={{...S.pillVal,color:s.color}}>{s.val}</div>
            <div style={S.pillSub}>{s.sub}</div>
          </div>
        ))}
        <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:'.4rem'}}>
          <button onClick={prevMes} style={{background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.1)',borderRadius:'6px',color:'rgba(255,255,255,.4)',padding:'.25rem .55rem',cursor:'pointer',fontSize:'.9rem'}}>‹</button>
          <span style={{fontSize:'.75rem',fontWeight:700,color:'rgba(255,255,255,.55)',minWidth:'120px',textAlign:'center'}}>{MESES[mesCal]} {anioCal}</span>
          <button onClick={nextMes} style={{background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.1)',borderRadius:'6px',color:'rgba(255,255,255,.4)',padding:'.25rem .55rem',cursor:'pointer',fontSize:'.9rem'}}>›</button>
        </div>
      </div>

      {/* BODY */}
      <div style={S.body}>
        {/* IZQUIERDA */}
        <div style={S.left}>
          {/* Heatmap */}
          <div style={{...S.card,marginBottom:'1.1rem'}}>
            <div style={S.secHead}>
              <span>📅 Mapa de vencimientos — {MESES[mesCal]} {anioCal}</span>
              <span style={{color:'rgba(37,99,235,.6)',fontSize:'.6rem'}}>
                {vencimientos.filter(v=>{if(!v.fecha_vencimiento)return false;const f=new Date(v.fecha_vencimiento);return f.getMonth()===mesCal&&f.getFullYear()===anioCal}).length} en el mes
              </span>
            </div>
            <HeatmapCalendar vencimientos={vencimientos} mes={mesCal} anio={anioCal}/>
          </div>

          {/* Tabla */}
          <div style={{...S.card,marginBottom:0}}>
            <div style={{...S.secHead,marginBottom:'.8rem'}}>
              <span>👥 Estado de clientes</span>
              <span style={{color:'rgba(255,255,255,.22)',fontSize:'.6rem'}}>{clientes.length} registrados</span>
            </div>
            <TablaClientes clientes={clientes} vencimientos={vencimientos} facturas={facturas}/>
          </div>
        </div>

        {/* DERECHA */}
        <div style={S.right}>
          {/* Semana */}
          <div style={{marginBottom:'1.1rem'}}>
            <div style={S.secHead}><span>⚡ Semana en curso</span></div>
            <SemanaEnCurso vencimientos={vencimientos}/>
          </div>

          {/* Planes */}
          <div style={{marginBottom:'1.1rem'}}>
            <div style={S.secHead}><span>📊 Planes</span></div>
            {[{plan:'Esencial',color:'#2563EB'},{plan:'Integral',color:'#7C3AED'},{plan:'Estratégico',color:'#D97706'},{plan:'Llave en mano',color:'#16A34A'}].map(({plan,color})=>{
              const cnt=activos.filter(c=>c.plan===plan).length
              const pct=activos.length>0?(cnt/activos.length)*100:0
              return (
                <div key={plan} style={{marginBottom:'.6rem'}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:'.2rem'}}>
                    <span style={{fontSize:'.68rem',color:'rgba(255,255,255,.4)'}}>{plan}</span>
                    <span style={{fontSize:'.68rem',fontWeight:700,color}}>{cnt}</span>
                  </div>
                  <div style={{background:'rgba(255,255,255,.05)',borderRadius:'100px',height:'4px',overflow:'hidden'}}>
                    <div style={{width:`${pct}%`,height:'100%',background:color,borderRadius:'100px',boxShadow:`0 0 5px ${color}55`,transition:'width .4s'}}/>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Capacidad */}
          <div>
            <div style={S.secHead}><span>🎯 Capacidad</span></div>
            <div style={{...S.card,padding:'.8rem .9rem'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:'.35rem'}}>
                <span style={{fontSize:'.68rem',color:'rgba(255,255,255,.35)'}}>Clientes activos</span>
                <span style={{fontSize:'.68rem',fontWeight:800,color:'#3B82F6'}}>{activos.length} / 20</span>
              </div>
              <div style={{background:'rgba(255,255,255,.06)',borderRadius:'100px',height:'6px',overflow:'hidden',marginBottom:'.4rem'}}>
                <div style={{width:`${(activos.length/20)*100}%`,height:'100%',background:'linear-gradient(90deg,#1D4ED8,#3B82F6)',borderRadius:'100px',boxShadow:'0 0 7px rgba(37,99,235,.45)',transition:'width .4s'}}/>
              </div>
              <div style={{fontSize:'.62rem',color:'rgba(255,255,255,.18)'}}>{20-activos.length} lugar{20-activos.length!==1?'es':''} disponible{20-activos.length!==1?'s':''}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
