import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const NAV = [
  { to:'/',              icon:'📊', label:'Dashboard',       end:true  },
  { to:'/upload',        icon:'📤', label:'File Upload',     roles:['ADMIN','ANALYST'] },
  { to:'/reconciliation',icon:'🔍', label:'Reconciliation',  roles:['ADMIN','ANALYST','VIEWER'] },
  { to:'/audit',         icon:'📋', label:'Audit Trail',     roles:['ADMIN','ANALYST','VIEWER'] },
];

const ROLE_COLOR = { ADMIN:'#e53e3e', ANALYST:'#3182ce', VIEWER:'#38a169' };

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate          = useNavigate();
  const [mini, setMini]   = useState(false);

  const handleLogout = () => { logout(); toast.success('Logged out'); navigate('/login'); };
  const navItems = NAV.filter(n => !n.roles || n.roles.includes(user?.role));

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f0f4f8' }}>

      {/* ── Sidebar ── */}
      <aside style={{ width: mini ? 64 : 240, background:'linear-gradient(180deg,#1a1a2e,#16213e)',
        display:'flex', flexDirection:'column', transition:'width .25s', flexShrink:0, overflow:'hidden' }}>

        {/* Logo */}
        <div onClick={() => setMini(!mini)} style={{ padding:'18px 14px', cursor:'pointer',
          display:'flex', alignItems:'center', gap:12, borderBottom:'1px solid rgba(255,255,255,.08)' }}>
          <span style={{ fontSize:26, flexShrink:0 }}>⚖️</span>
          {!mini && <div>
            <div style={{ color:'#fff', fontWeight:700, fontSize:14 }}>SmartRecon</div>
            <div style={{ color:'#718096', fontSize:11 }}>v1.0</div>
          </div>}
        </div>

        {/* Nav links */}
        <nav style={{ flex:1, padding:'12px 8px' }}>
          {navItems.map(n => (
            <NavLink key={n.to} to={n.to} end={n.end}
              style={({ isActive }) => ({
                display:'flex', alignItems:'center', gap:12, padding:'10px 12px',
                borderRadius:10, marginBottom:4, textDecoration:'none',
                background: isActive ? 'rgba(102,126,234,.35)' : 'transparent',
                color: isActive ? '#fff' : '#94a3b8',
                fontWeight: isActive ? 600 : 400, fontSize:14, transition:'all .2s'
              })}>
              <span style={{ fontSize:18, flexShrink:0 }}>{n.icon}</span>
              {!mini && <span>{n.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User strip */}
        <div style={{ padding:'12px 8px', borderTop:'1px solid rgba(255,255,255,.08)' }}>
          {!mini && (
            <div style={{ padding:'10px 12px', background:'rgba(255,255,255,.06)', borderRadius:10, marginBottom:8 }}>
              <div style={{ color:'#fff', fontWeight:600, fontSize:13 }}>{user?.fullName || user?.username}</div>
              <span style={{ background:ROLE_COLOR[user?.role], color:'#fff', fontSize:10,
                padding:'2px 8px', borderRadius:20, fontWeight:700 }}>{user?.role}</span>
            </div>
          )}
          <button onClick={handleLogout} style={{ width:'100%', padding:'8px 12px',
            background:'rgba(252,129,129,.15)', color:'#fc8181', border:'none', borderRadius:8,
            cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', gap:8,
            justifyContent: mini ? 'center' : 'flex-start' }}>
            <span>🚪</span>{!mini && 'Logout'}
          </button>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <header style={{ background:'#fff', padding:'14px 24px', borderBottom:'1px solid #e2e8f0',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          boxShadow:'0 1px 3px rgba(0,0,0,.05)' }}>
          <div style={{ fontSize:17, fontWeight:800, color:'#1a202c' }}>
            Smart Reconciliation & Audit System
          </div>
          <div style={{ fontSize:13, color:'#718096' }}>
            👤 {user?.username} &nbsp;|&nbsp; {new Date().toLocaleDateString()}
          </div>
        </header>
        <main style={{ flex:1, overflow:'auto', padding:24 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
