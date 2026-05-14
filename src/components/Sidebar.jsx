import { signOut } from 'firebase/auth'
import { auth } from '../firebase'

const NAV = [
  { path: '/',             icon: '📊', label: 'Dashboard'    },
  { path: '/clientes',     icon: '👥', label: 'Clientes'     },
  { path: '/vencimientos', icon: '📅', label: 'Vencimientos' },
  { path: '/facturacion',  icon: '💰', label: 'Facturación'  },
  { path: '/notas',        icon: '📝', label: 'Notas'        },
]

export default function Sidebar({ user, currentPath, onNavigate }) {
  const initials = user?.email?.[0]?.toUpperCase() || 'F'

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span>Finn<em>ix</em></span>
        <small>CRM · Consultoría Integral</small>
      </div>

      <nav className="sidebar-nav">
        {NAV.map(({ path, icon, label }) => (
          <button
            key={path}
            className={`nav-item ${currentPath === path ? 'active' : ''}`}
            onClick={() => onNavigate(path)}
          >
            <span className="nav-icon">{icon}</span>
            {label}
          </button>
        ))}
      </nav>

      <div className="sidebar-user">
        <div className="user-avatar">{initials}</div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div className="user-email" style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.55)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.email}
          </div>
        </div>
        <button className="btn-logout" onClick={() => signOut(auth)} title="Cerrar sesión">⏻</button>
      </div>
    </aside>
  )
}
